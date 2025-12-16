# Stripe Payment Link Setup

## Success URL Configuration

The success URL is automatically appended to your Stripe Payment Link when users click checkout. This redirects customers to `/success` after completing payment.

### How It Works

1. User clicks "Join as a Founding Member"
2. They're redirected to Stripe Payment Link with `success_url` parameter
3. After payment, Stripe redirects to `https://shorta.ai/success`
4. Success page displays thank you message

### Alternative: Configure in Stripe Dashboard

You can also set the success URL directly in Stripe Dashboard:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Payment Links**
3. Click on your Payment Link
4. Go to **Settings** → **After payment**
5. Set **Success page URL** to: `https://shorta.ai/success`
6. Save changes

**Note:** The code approach (appending `success_url` parameter) takes precedence and will override dashboard settings if both are configured.

## Accessing Customer Emails

### Option 1: Stripe Dashboard (Recommended)

All customer emails are automatically collected and stored in Stripe:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Customers** section
3. View all customers who completed checkout
4. Each customer entry includes:
   - Email address
   - Payment date
   - Amount paid
   - Payment status
   - Customer ID

**You do NOT need to store customer emails in your own database** - Stripe handles this automatically.

### Option 2: Export Customer Data

1. In Stripe Dashboard → **Customers**
2. Click **Export** to download CSV/Excel
3. Includes all customer information including emails

### Option 3: Stripe API (If Needed Later)

If you need programmatic access to customer emails:

1. Set up Stripe webhooks to listen for `checkout.session.completed` events
2. Webhook payload includes `customer_email` field
3. You can then store in your database if needed

**Current Recommendation:** Use Stripe Dashboard only. No database storage needed unless you have specific requirements (e.g., custom CRM integration, email marketing automation).

## Testing

To test the redirect flow:

1. Use Stripe's test mode
2. Create a test payment link
3. Complete a test payment
4. Verify redirect to `/success` page

## Environment Variables

Make sure `VITE_STRIPE_PAYMENT_LINK` is set in:
- Local `.env.local` file
- Cloudflare Pages → Settings → Environment Variables

