// apps/web/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase-service';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // It's a good practice to pin the API version
});

// Get the webhook secret from environment variables for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * A mapping from Stripe Price IDs to our application's plan details.
 * You must fill in the Price IDs from your Stripe dashboard in your environment variables.
 */
const priceIdToPlanMap = {
  // Hobby Plan (Monthly & Yearly)
  [process.env.STRIPE_HOBBY_MONTHLY_PRICE_ID!]: {
    tier: 'hobby',
    credits: 1000,
    cap: 1500, // 1.5x of 1000
  },
  [process.env.STRIPE_HOBBY_YEARLY_PRICE_ID!]: {
    tier: 'hobby',
    credits: 1000,
    cap: 1500,
  },
  // Pro Plan (Monthly & Yearly)
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: {
    tier: 'pro',
    credits: 3500,
    cap: 5250, // 1.5x of 3500
  },
  [process.env.STRIPE_PRO_YEARLY_PRICE_ID!]: {
    tier: 'pro',
    credits: 3500,
    cap: 5250,
  },
  // Producer Plan (Monthly & Yearly)
  [process.env.STRIPE_PRODUCER_MONTHLY_PRICE_ID!]: {
    tier: 'producer',
    credits: 12000,
    cap: 24000, // 2x of 12000
  },
  [process.env.STRIPE_PRODUCER_YEARLY_PRICE_ID!]: {
    tier: 'producer',
    credits: 12000,
    cap: 24000,
  },
};

/**
 * The main handler for processing incoming Stripe webhooks.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createServiceClient();

  // Handle the specific event type
  switch (event.type) {
    // This event fires when a checkout session is successfully completed,
    // creating a new subscription. It also fires for recurring payments.
    case 'checkout.session.completed':
    case 'invoice.paid': {
      const session = event.data.object as Stripe.Checkout.Session | Stripe.Invoice;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!subscriptionId) {
        console.warn(`Webhook received ${event.type} without a subscription ID.`);
        return new NextResponse('Subscription ID missing', { status: 200 });
      }

      // Retrieve the subscription to get the price ID
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;

      if (!priceId) {
        console.error(`Webhook Error: Could not find price ID on subscription ${subscriptionId}`);
        return new NextResponse('Webhook Error: Price ID missing', { status: 400 });
      }

      const plan = priceIdToPlanMap[priceId];
      if (!plan) {
        console.error(`Webhook Error: No plan configured for price ID ${priceId}`);
        return new NextResponse('Webhook Error: Plan not configured', { status: 400 });
      }

      // Identify the user.
      // This is complex due to Payment Links not always providing client_reference_id.
      let userId: string | null = null;
      let userEmail: string | null = null;

      // Try to get userId from client_reference_id (if passed)
      if ('client_reference_id' in session && session.client_reference_id) {
        userId = session.client_reference_id;
        console.log(`User identified by client_reference_id: ${userId}`);
      }

      // If userId is still null, try to find user by existing stripe_customer_id
      if (!userId) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle(); // Use maybeSingle as it might not exist for new customers

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error(`Error querying profile by customer ID ${customerId}:`, profileError);
          return new NextResponse('Internal Server Error', { status: 500 });
        }
        
        if (profile) {
          userId = profile.user_id;
          console.log(`User identified by existing stripe_customer_id: ${userId}`);
        }
      }

      // If userId is still null, it's likely a new user from a Payment Link. Try by email.
      if (!userId) {
        // Extract email from session (for checkout.session.completed) or customer (for invoice.paid)
        if ('customer_details' in session && session.customer_details?.email) {
          userEmail = session.customer_details.email;
        } else if ('customer_email' in session && session.customer_email) {
          userEmail = session.customer_email;
        } else if (customerId) {
          // As a last resort, try to get email from Stripe Customer object
          const stripeCustomer = await stripe.customers.retrieve(customerId);
          if (stripeCustomer && !stripeCustomer.deleted && stripeCustomer.email) {
            userEmail = stripeCustomer.email;
          }
        }

        if (!userEmail) {
            console.error(`Webhook Error: No email found for new customer checkout ${customerId}`);
            return new NextResponse('Webhook Error: User email missing', { status: 400 });
        }
        
        // Find user by email in auth.users
        const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserByEmail(userEmail);

        if (authUserError || !authUser?.user) {
            console.error(`Webhook Error: Supabase auth user not found for email ${userEmail}:`, authUserError);
            return new NextResponse('Webhook Error: Supabase user not found', { status: 404 });
        }
        userId = authUser.user.id;
        console.log(`User identified by email: ${userId}`);
      }

      if (!userId) {
        console.error(`Webhook Error: Could not identify user for customer ID ${customerId}. Cannot provision subscription.`);
        return new NextResponse('Webhook Error: User identification failed', { status: 400 });
      }
      
      // Get the user's current credit balance to calculate the rollover
      // Need to fetch again if user was identified by email
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Webhook Error: Could not retrieve user profile for rollover calc.', profileError);
        return new NextResponse('Webhook Error: User profile not found', { status: 500 });
      }

      let newCreditBalance: number;

      // If this is from a new checkout, it's a new subscription. Just set the credits.
      // Otherwise, it's a recurring invoice, so we calculate the rollover.
      if (event.type === 'checkout.session.completed') {
        newCreditBalance = plan.credits;
        console.log(`New subscription for user ${userId}. Setting credits to ${newCreditBalance}.`);
      } else {
        const rolledOverCredits = Math.min(profile.credits || 0, plan.cap);
        newCreditBalance = rolledOverCredits + plan.credits;
        console.log(
          `Recurring payment for user ${userId}. Rolled over ${rolledOverCredits} + ` +
          `new ${plan.credits} for a total of ${newCreditBalance}.`
        );
      }

      // Update the user's profile in the database with the new plan details and credit balance.
      // Ensure stripe_customer_id is set if it was null before (for new users via Payment Links)
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          tier: plan.tier,
          subscription_status: 'active',
          credits: newCreditBalance,
          credits_cap: plan.cap,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        return new NextResponse(`Webhook Error: ${updateError.message}`, { status: 500 });
      }

      console.log(`✅ Provisioned subscription for user ${userId}, plan ${plan.tier}`);
      break;
    }

    // This event fires when a subscription is canceled by the user or by billing failures.
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Downgrade the user to the 'free' tier and reset their credits.
      const { error } = await supabase
        .from('user_profiles')
        .update({
          subscription_status: 'canceled',
          tier: 'free',
          credits: 0,
          credits_cap: 0,
          stripe_subscription_id: null, // Clear the old subscription ID
        })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error('Supabase update error on cancellation:', error);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
      }
      
      console.log(`✅ Canceled subscription for customer ${customerId}`);
      break;
    }

    default:
      // We don't handle other event types right now, but it's good to log them.
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Acknowledge receipt of the event
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
