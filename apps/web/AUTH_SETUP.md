# Google Authentication Setup

## Supabase Configuration

1. **Go to Supabase Dashboard** → Your Project → Authentication → Providers

2. **Enable Google Provider:**
   - Toggle "Google" to enabled
   - Configure the OAuth consent screen in Google Cloud Console
   - Get your Google OAuth credentials (Client ID and Client Secret)
   - Add them to Supabase

3. **Add Redirect URLs in Supabase:**
   - Go to Authentication → URL Configuration
   - Add these to "Redirect URLs":
     ```
     http://localhost:3000/auth/callback
     https://shorta.ai/auth/callback
     ```

4. **Add Site URL:**
   - Set "Site URL" to: `https://shorta.ai`

## Google Cloud Console Setup

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/)

2. **Create/Select Project**

3. **Enable Google+ API:**
   - APIs & Services → Library
   - Search for "Google+ API"
   - Enable it

4. **Create OAuth Credentials:**
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: Shorta App

5. **Configure OAuth Consent Screen:**
   - User Type: External
   - Add required info (app name, user support email, developer email)
   - Scopes: email, profile, openid

6. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://shorta.ai
   ```

7. **Authorized redirect URIs:**
   ```
   https://dylimplqplexlbyqvhhk.supabase.co/auth/v1/callback
   ```

8. **Copy Client ID and Client Secret** → Paste in Supabase Google Provider settings

## Environment Variables

Already configured in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://dylimplqplexlbyqvhhk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_1Q0JmK2vk09_azKYuV6Xvg_Bl10k3u_
```

## Testing Locally

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000/login`

3. Click "Continue with Google"

4. After authentication, you'll be redirected to `/home`

## Routes

- `/login` - Login page with Google sign-in
- `/home` - Protected page (requires authentication)
- `/auth/callback` - OAuth callback handler (automatic)

## How It Works

1. User clicks "Continue with Google" on `/login`
2. Redirected to Google OAuth consent screen
3. After approval, Google redirects to `/auth/callback`
4. Callback handler exchanges code for session
5. User is redirected to `/home`
6. Middleware protects `/home` and redirects unauthenticated users to `/login`
