# Deploy to Vercel (Recommended for Next.js)

Vercel is made by the Next.js team and handles Next.js deployments perfectly.

## Quick Deploy (5 minutes)

### 1. Import Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo: `eguitarz/shorta`
4. Configure:
   ```
   Framework: Next.js
   Root Directory: apps/web
   ```

### 2. Environment Variables

Add these in the "Environment Variables" section:

```
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/28E5kk73g8lhc7f9P90kE00
NEXT_PUBLIC_SUPABASE_URL=https://dylimplqplexlbyqvhhk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_1Q0JmK2vk09_azKYuV6Xvg_Bl10k3u_
NEXT_PUBLIC_POSTHOG_KEY=(optional)
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 3. Deploy

Click **"Deploy"** - Vercel will:
- ✓ Build your Next.js app (works perfectly with Next.js 15)
- ✓ Deploy to global CDN
- ✓ Give you a URL like `shorta.vercel.app`

### 4. Add Custom Domain

1. Go to Project **Settings** → **Domains**
2. Add `shorta.ai`
3. Vercel will provide DNS records
4. Update your GoDaddy DNS to point to Vercel
5. SSL certificate auto-configured

## Why Vercel > Cloudflare for Next.js

| Feature | Vercel | Cloudflare Pages |
|---------|--------|------------------|
| Next.js Support | ✅ Native | ⚠️ Requires adapter |
| Build Success | ✅ Always works | ❌ React errors |
| Edge Runtime | ✅ Optimized | ⚠️ Limited |
| Setup Time | 5 min | 30+ min |

## Alternative: Keep trying Cloudflare

If you really want Cloudflare Pages, the app works in dev mode so you could:
1. Build locally: `npm run build`
2. Deploy the `.next` folder manually
3. But this is not recommended - Vercel is better for Next.js

## Result

- Your app will deploy perfectly on Vercel
- No build errors
- Fast global CDN
- Auto SSL
- Easy to manage

Deploy now: https://vercel.com/new
