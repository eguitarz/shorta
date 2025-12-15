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

- Email validation (client + database)
- Unique constraint (prevents duplicates)
- Row Level Security (RLS) enabled
- Client-side rate limiting (3/hour per email)
- IP tracking for abuse detection
