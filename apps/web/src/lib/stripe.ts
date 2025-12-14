const stripePaymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;

if (!stripePaymentLink) {
  console.error('Stripe payment link is not set in environment variables');
}

export function redirectToCheckout() {
  if (!stripePaymentLink) {
    console.error('Stripe payment link is not configured');
    return;
  }

  // Redirect to Stripe Payment Link
  window.location.href = stripePaymentLink;
}
