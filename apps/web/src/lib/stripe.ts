import { trackEvent } from './posthog';

const stripePaymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;

if (!stripePaymentLink) {
  console.error('Stripe payment link is not set in environment variables');
}

export function redirectToCheckout() {
  if (!stripePaymentLink) {
    console.error('Stripe payment link is not configured');
    return;
  }

  // Track checkout initiated
  trackEvent('checkout_initiated', {
    product: 'founding_member',
    price: 199,
    currency: 'USD',
  });

  // Redirect to Stripe Payment Link
  window.location.href = stripePaymentLink;
}
