# Customizable Watch List — Implementation Plan

## Overview
Replace the predefined seed-channel trends on the home dashboard with a user-curated watch list of up to 10 YouTube channels. When a paid user has configured a watch list, the dashboard shows trending shorts from **their** channels instead of the predefined set. Free/beta users continue to see predefined trends only.

---

## 1. Database: New `watch_list_channels` Table

**New migration file:** `supabase/migrations/XXX_add_watch_list_channels.sql`

```sql
CREATE TABLE public.watch_list_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,          -- YouTube channel ID
  channel_title TEXT NOT NULL,       -- display name (cached)
  channel_thumbnail TEXT,            -- avatar URL (cached)
  position SMALLINT NOT NULL DEFAULT 0,  -- ordering within the list
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, channel_id)
);

-- RLS: users can only see/manage their own rows
ALTER TABLE public.watch_list_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_watch_list" ON public.watch_list_channels
  FOR ALL USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX idx_watch_list_user ON public.watch_list_channels (user_id);
```

**Max 10 enforcement:** Application-level check on insert (count existing rows before adding). A DB trigger/check could be added as a safety net.

---

## 2. API Routes

### 2a. `GET /api/watch-list` — List user's watch list channels
- Auth required (paid tier only)
- Returns the user's channels ordered by `position`
- Response: `{ channels: WatchListChannel[], isPaid: boolean }`

### 2b. `POST /api/watch-list` — Add a channel
- Auth + CSRF required
- Body: `{ channelId: string }` (or YouTube channel URL — we resolve it)
- Validates:
  - User is paid tier (`hobby | pro | producer | founder | lifetime`)
  - User has < 10 channels already
  - Channel ID is valid (YouTube API `channels.list` lookup)
- Resolves channel title + thumbnail from YouTube API and stores them
- Response: the new `WatchListChannel` row

### 2c. `DELETE /api/watch-list/[channelId]` — Remove a channel
- Auth + CSRF required
- Deletes row matching `user_id + channel_id`

### 2d. `PATCH /api/watch-list/reorder` — Reorder channels *(stretch / optional)*
- Auth + CSRF required
- Body: `{ channelIds: string[] }` — ordered list
- Updates `position` column for each

### 2e. `GET /api/watch-list/search` — Search YouTube channels
- Auth required (paid tier only)
- Query param: `q` (search term)
- Uses YouTube `search.list` with `type=channel` to find matching channels
- Returns top 5 results with `channelId`, `title`, `thumbnail`

---

## 3. Modify Trends API (`/api/trends/shorts`)

Add a new query parameter: `source=predefined|watchlist` (default: `predefined`).

When `source=watchlist`:
1. Fetch the user's watch list channel IDs from `watch_list_channels`
2. Use those channel IDs as the seed set (replacing US/KR seeds)
3. Run the same `buildTrends()` pipeline with the custom seed set
4. Cache key includes user ID to avoid cross-user cache collisions
5. If watch list is empty, return empty array (frontend shows empty state)

When `source=predefined`:
- Behavior stays exactly as-is today (no changes)

---

## 4. Frontend Components

### 4a. Watch List Management Panel
**New component:** `WatchListManager`
- Located in the dashboard or a settings panel/modal accessible from dashboard
- Shows current channels (up to 10) with thumbnails and names
- "Add Channel" input — search-as-you-type using `/api/watch-list/search`
- Remove button per channel
- Counter: "3 / 10 channels"
- Gated behind paid tier — free users see an upsell prompt

### 4b. Dashboard Content Changes (`dashboard-content.tsx`)
- Detect if user is paid AND has watch list channels
- If yes: fetch trends with `source=watchlist`, hide region toggle (US/KR)
- If no: fetch trends with `source=predefined` (current behavior)
- Add a toggle/link to switch between "My Watch List" and "Predefined Trends" so paid users can still view predefined if they want
- Add a "Manage Watch List" link/button that opens the management panel

### 4c. Empty State
- When paid user has watch list enabled but 0 channels: show a prompt to add channels
- When watch list trends return 0 results (channels had no recent shorts): show a "No recent shorts from your watch list" message

---

## 5. Paid Tier Gating

**Helper function:** `isPaidTier(tier: string): boolean`
```typescript
const PAID_TIERS = ['hobby', 'pro', 'producer', 'founder', 'lifetime'];
export const isPaidTier = (tier: string) => PAID_TIERS.includes(tier);
```

Used in:
- All watch list API routes (return 403 for non-paid)
- Frontend to show/hide watch list UI and show upsell for free users

---

## 6. Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | DB migration | `supabase/migrations/XXX_add_watch_list_channels.sql` |
| 2 | `isPaidTier` helper | `apps/web/lib/tier-helpers.ts` (or add to existing) |
| 3 | Watch list CRUD API routes | `apps/web/app/api/watch-list/route.ts`, `[channelId]/route.ts` |
| 4 | Channel search API route | `apps/web/app/api/watch-list/search/route.ts` |
| 5 | Extend trends API with `source` param | `apps/web/app/api/trends/shorts/route.ts` |
| 6 | `WatchListManager` component | `apps/web/components/watch-list-manager.tsx` |
| 7 | Update `dashboard-content.tsx` | Conditional trends source, toggle, manage link |
| 8 | Empty states & upsell UI | Within dashboard + watch list components |

---

## 7. Key Decisions & Constraints

- **Max 10 channels** — enforced at application layer with a pre-insert count check
- **Paid only** — `free` and `beta` tiers are excluded
- **Cache strategy** — watch list trends use a per-user cache key with shorter TTL (e.g., 6 hours vs. 24 hours for predefined) since the channel set varies per user
- **Channel metadata caching** — title and thumbnail stored at add-time to avoid repeated YouTube API calls; can be refreshed lazily
- **No breaking changes** — predefined trends remain the default; watch list is opt-in
