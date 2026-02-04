'use server';

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { createClient as createSupabaseServerClient } from '@/lib/supabase-server';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * Creates a Stripe Checkout session for a given price ID and redirects the user to it.
 * @param {string} priceId - The ID of the Stripe Price the user is subscribing to.
 */
export async function createCheckoutSession(priceId: string) {
  const supabase = await createSupabaseServerClient();

  // 1. Get user session and profile data
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('User is not authenticated.');
    return redirect('/login'); // Redirect to login if not authenticated
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    throw new Error('Could not retrieve user profile.');
  }

  let customerId = profile.stripe_customer_id;

  // 2. If the user is not yet a Stripe customer, create one
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    customerId = customer.id;

    // Update the user's profile with their new Stripe customer ID
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error saving new Stripe customer ID to profile:', updateError);
      throw new Error('Could not update user profile with Stripe customer ID.');
    }
  }

  // 3. Create the Stripe Checkout session
  const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/success`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`;

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'required',
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // This is crucial for the webhook to link the session to the Supabase user
      client_reference_id: user.id,
    });
  } catch (err: any) {
    console.error('Error creating Stripe checkout session:', err);
    throw new Error('Could not create checkout session.');
  }

  // 4. Redirect the user to the Stripe Checkout page
  if (session.url) {
    redirect(session.url);
  } else {
    throw new Error('Could not create checkout session.');
  }
}
