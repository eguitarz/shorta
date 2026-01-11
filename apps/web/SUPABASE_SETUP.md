# Supabase Waitlist Configuration

## Environment Variables

**Local (`.env.local`):**
```env
VITE_SUPABASE_URL=https://dylimplqplexlbyqvhhk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_1Q0JmK2vk09_azKYuV6Xvg_Bl10k3u_
```

**Cloudflare Pages:**
- `VITE_SUPABASE_URL` = `https://dylimplqplexlbyqvhhk.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_1Q0JmK2vk09_azKYuV6Xvg_Bl10k3u_`

## Database

Migration file: `supabase/migrations/001_create_waitlist_table.sql`

View entries: Supabase Dashboard → Table Editor → `waitlist` table

## Security Features

- **Email validation**: Client-side + database-level constraints
- **Disposable email blocking**: Blocks temporary email providers
- **Domain validation**: Verifies email domains exist (DNS MX/A record check)
- **Unique constraint**: Prevents duplicate emails (main protection)
- **Row Level Security (RLS)**: Only allows inserts, prevents public reads
- **Client-side rate limiting**: 3 submissions/hour per email (localStorage, UX improvement)
- **Supabase API rate limiting**: Configure in Supabase dashboard → Settings → API
- **IP tracking**: Stores IP address for abuse detection

## Database Migration

Run `001_create_waitlist_table.sql` in Supabase SQL Editor to create the waitlist table and RLS policies.
