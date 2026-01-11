import { trackEvent } from './posthog';

// Stripe Payment Links
export const STRIPE_PRO_LINK = 'https://buy.stripe.com/6oU7ss4V8bxtfjr6CX0kE01';
export const STRIPE_LIFETIME_LINK = 'https://buy.stripe.com/dRm3cc0ES595c7f7H10kE02';

type CheckoutPlan = 'pro' | 'lifetime';

interface CheckoutOptions {
  plan: CheckoutPlan;
  successUrl?: string;
}

export function redirectToCheckout(options: CheckoutOptions | CheckoutPlan = 'pro') {
  // Support both new and old API
  const { plan, successUrl } = typeof options === 'string'
    ? { plan: options, successUrl: undefined }
    : options;

  const paymentLink = plan === 'lifetime' ? STRIPE_LIFETIME_LINK : STRIPE_PRO_LINK;
  const price = plan === 'lifetime' ? 199 : 99;
  const productName = plan === 'lifetime' ? 'lifetime' : 'pro_yearly';

  // Track checkout initiated
  trackEvent('checkout_initiated', {
    product: productName,
    price,
    currency: 'USD',
  });

  // Build success URL
  const defaultSuccessUrl = `${window.location.origin}/success`;
  const finalSuccessUrl = successUrl || defaultSuccessUrl;

  // Append success_url parameter to Stripe Payment Link
  const separator = paymentLink.includes('?') ? '&' : '?';
  const checkoutUrl = `${paymentLink}${separator}success_url=${encodeURIComponent(finalSuccessUrl)}`;

  // Redirect to Stripe Payment Link
  window.location.href = checkoutUrl;
}

// Legacy function for backward compatibility - defaults to pro plan
export function redirectToProCheckout() {
  redirectToCheckout('pro');
}

export function redirectToLifetimeCheckout() {
  redirectToCheckout('lifetime');
}
