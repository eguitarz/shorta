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

  // Build success URL - redirect to success page after checkout
  // Stripe Payment Links support success_url as a query parameter
  const successUrl = `${window.location.origin}/success`;
  
  // Append success_url parameter to Stripe Payment Link
  // Note: This works with Payment Links. Alternatively, you can configure
  // the success URL directly in Stripe Dashboard → Payment Links → Settings
  const separator = stripePaymentLink.includes('?') ? '&' : '?';
  const checkoutUrl = `${stripePaymentLink}${separator}success_url=${encodeURIComponent(successUrl)}`;

  // Redirect to Stripe Payment Link with success URL
  window.location.href = checkoutUrl;
}
