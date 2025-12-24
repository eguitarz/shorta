# Shorta Deployment Guide

## Deploy to Cloudflare Pages

### Step 1: Create Cloudflare Pages Project

1. Go to https://dash.cloudflare.com
2. Sign up or login
3. Click **"Workers & Pages"** in the left sidebar
4. Click **"Create application"**
5. Select **"Pages"** tab
6. Click **"Connect to Git"**

### Step 2: Connect GitHub Repository

1. Click **"Connect GitHub"**
2. Select **"eguitarz/shorta"** repository
3. Click **"Begin setup"**

### Step 3: Configure Build Settings

```
Project name: shorta
Production branch: main
Framework preset: Next.js (App Router)
Build command: npm run build
Build output directory: apps/web/.next
Root directory: apps/web
Node version: 18
```

**Environment Variables:**
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` = `https://buy.stripe.com/28E5kk73g8lhc7f9P90kE00`
- `NEXT_PUBLIC_SUPABASE_URL` = `https://dylimplqplexlbyqvhhk.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_1Q0JmK2vk09_azKYuV6Xvg_Bl10k3u_`
- `NEXT_PUBLIC_POSTHOG_KEY` = (optional - add if you have PostHog)
- `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com`

> **Note**: You can also add these later in **Settings** → **Environment variables** if you forget during initial setup.

Click **"Save and Deploy"**

### Step 4: Wait for Build (2-3 minutes)

Cloudflare will:
- Clone your repo
- Install dependencies
- Run build command
- Deploy to CDN

You'll get a URL like: `shorta-xxx.pages.dev`

---

## Configure DNS on GoDaddy

### Step 1: Add Site to Cloudflare

1. In Cloudflare dashboard, click **"Websites"**
2. Click **"Add a site"**
3. Enter: `shorta.ai`
4. Select **Free** plan
5. Click **"Continue"**

### Step 2: Update Nameservers on GoDaddy

Cloudflare will show you 2 nameservers like:
```
aldo.ns.cloudflare.com
lydia.ns.cloudflare.com
```

**On GoDaddy:**
1. Go to https://dcc.godaddy.com/domains
2. Click **shorta.ai** → **Manage DNS**
3. Scroll to **"Nameservers"**
4. Click **"Change"**
5. Select **"I'll use my own nameservers"**
6. Enter the 2 Cloudflare nameservers
7. Click **"Save"**

**Wait 5-30 minutes** for propagation.

### Step 3: Configure Custom Domain in Cloudflare Pages

1. Go back to **Cloudflare Pages** → **shorta** project
2. Click **"Custom domains"** tab
3. Click **"Set up a custom domain"**
4. Enter: `shorta.ai`
5. Click **"Continue"**
6. Cloudflare will auto-configure DNS
7. Also add: `www.shorta.ai` (repeat steps)

### Step 4: Verify SSL Certificate

1. Go to **SSL/TLS** → **Overview**
2. Set to **"Full"** mode (recommended)
3. Wait 10-15 minutes for SSL certificate

---

## Verify Deployment

1. Visit https://shorta.ai
2. Check:
   - ✓ Site loads correctly
   - ✓ SSL (🔒 in browser)
   - ✓ All images load
   - ✓ Stripe checkout works
   - ✓ Waitlist form works (test email submission)
   - ✓ Privacy/Terms pages work

---

## Continuous Deployment

Every time you push to `main` branch:
- Cloudflare automatically builds and deploys
- New version live in ~2 minutes
- Zero downtime deployments

**Deployment URL:** https://dash.cloudflare.com

---

## Troubleshooting

### Build fails?
Check build logs in Cloudflare Pages dashboard.

### DNS not working?
- Wait 30 minutes for propagation
- Check nameservers: `dig shorta.ai NS`
- Verify in Cloudflare DNS settings

### SSL not working?
- Wait 15 minutes
- Check SSL mode is "Full"
- Clear browser cache

### Environment variables not working?
- Go to Pages project → **Settings** → **Environment variables**
- Add all required variables:
  - `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_POSTHOG_KEY` (optional)
  - `NEXT_PUBLIC_POSTHOG_HOST` (optional)
- Make sure to add them for **Production** environment (or both Production and Preview)
- Click **"Save"** and **redeploy** the site

---

## Quick Commands

**Build locally:**
```bash
npm run build
```

**Preview build:**
```bash
npm run preview
```

**Check build size:**
```bash
ls -lh apps/web/dist/assets/
```

**Deploy from CLI (alternative):**
```bash
npx wrangler pages deploy apps/web/dist --project-name=shorta
```
