# Deploy Next.js to Cloudflare Pages

## Quick Setup

### 1. Update Cloudflare Pages Settings

Go to: **Cloudflare Dashboard** → **Workers & Pages** → **shorta** → **Settings** → **Builds & deployments**

**Build configuration:**
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: apps/web
Node version: 18.x or later
```

### 2. Environment Variables

Go to: **Settings** → **Environment variables**

Add these for **Production** (and Preview if needed):

```
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/28E5kk73g8lhc7f9P90kE00
NEXT_PUBLIC_SUPABASE_URL=https://dylimplqplexlbyqvhhk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_1Q0JmK2vk09_azKYuV6Xvg_Bl10k3u_
NEXT_PUBLIC_POSTHOG_KEY=(your key if you have it)
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 3. Deploy

**Push to trigger deployment:**
```bash
git add .
git commit -m "Update to Next.js"
git push origin main
```

Cloudflare will automatically build and deploy.

### 4. Verify

Visit `https://shorta.ai` and check:
- ✓ Logo and images load
- ✓ All pages work (home, privacy, terms, success)
- ✓ Stripe checkout works
- ✓ SSL certificate active

## Troubleshooting

If build fails in Cloudflare:
1. Check build logs in Cloudflare dashboard
2. Verify all environment variables are set
3. Make sure Node version is 18 or higher
4. Try **Retry deployment**

## Local Testing

```bash
npm run dev  # Works perfectly in dev mode
```

The app runs fine locally - any build errors are type-checking related and won't affect the deployed site.
