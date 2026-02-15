# Beta Tier

The `beta` tier is for a small group of early users. It grants the same features and credit amount as the Pro tier, but credits are **one-time** — they never reset. Once used up, the user must upgrade to a paid plan.

## How it works

- **Credits**: 3,500 (same as Pro)
- **Credit reset**: None. Credits do not refresh monthly.
- **Credit rollover cap**: 0 (no rollover logic applies)
- **Features**: Same access as Pro tier (storyboards, channel analytics, etc.)
- **Stripe subscription**: None. Beta users are provisioned manually via SQL.
- **Pricing page**: Beta tier is **not shown** on the website.

## Provisioning a beta user

The user must already have an account (signed up via the app). Find their `user_id` from the `auth.users` table, then run:

```sql
UPDATE public.user_profiles
SET tier = 'beta', credits = 3500, credits_cap = 0
WHERE user_id = '<user-uuid>';
```

To find a user by email:

```sql
SELECT up.user_id, au.email, up.tier, up.credits
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email = 'user@example.com';
```

## Upgrading a beta user

When a beta user subscribes to a paid plan via Stripe, the webhook automatically updates their tier, credits, and subscription fields. No manual intervention needed.

## Differences from other tiers

| Behavior | Free | Beta | Pro |
|---|---|---|---|
| Initial credits | 300 | 3,500 | 3,500 |
| Monthly reset | No | No | Yes (via Stripe) |
| Rollover cap | 0 | 0 | 5,250 |
| Stripe required | No | No | Yes |
| Shown on pricing page | Yes | No | Yes |
