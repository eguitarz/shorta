# Shorta Web - Development Notes

## Deployment

**Important: We use Cloudflare Workers, NOT Pages**

### Build and Deploy Process

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Workers:**
   ```bash
   npx wrangler deploy
   ```

### Configuration

- Project configuration is in `wrangler.toml`
- Uses OpenNext for Next.js on Cloudflare Workers
- Worker name: `shorta-web`
- Compatibility date: `2024-09-23`

## Architecture

### Video Analysis Flow

1. **Loading Experience:**
   - Video player loads immediately from sessionStorage
   - Analysis data fetches in background
   - Loading states shown for:
     - Overall Score card (~1 minute message)
     - 4 Performance cards (Hook, Structure, Content, Delivery)
     - Beat-by-beat breakdown
     - Re-hook variants

2. **Scoring System:**
   - Base score: 100 points
   - Deductions:
     - Critical violations: -10 points each
     - Moderate violations: -5 points each
     - Minor violations: -2 points each
   - Bonuses (can exceed 100):
     - Perfect beat (no issues): +2 points
     - Strong hook (≥80%): +5 points
   - Deduplication: Each rule type only counts once for scoring

3. **Two-Tier Analysis:**
   - **Linter**: Rule-based checking (predefined rules)
   - **Beat-by-beat AI**: Contextual analysis (includes linter + AI-discovered issues)
   - Score calculated from beat-by-beat issues (most comprehensive)

4. **Issue Badges:**
   - Blue badge: Linter rule violations (has `ruleId` and `ruleName`)
   - Purple badge: AI-discovered issues (no `ruleId`)

## Key Files

- `/app/(dashboard)/analyzer/[id]/page.tsx` - Main analyzer UI
- `/app/api/analyze-storyboard/route.ts` - Analysis API endpoint
- `/lib/linter/engine.ts` - Linter scoring logic
- `/lib/linter/rules/talking_head.ts` - Linter rules
- `wrangler.toml` - Cloudflare Workers configuration

## Features

### Video Stats
- Views and likes displayed under embedded video
- Data expected in: `analysisData.storyboard.performance.videoStats.{views,likes}`
- Shows loading skeleton while analyzing
- Shows "—" if data unavailable

### Collapsible Panel
- Approved changes panel collapses to the right
- Fast animation (100ms) for better performance
- Auto-expands when changes are approved

### Score Transparency
- Info icon with hover tooltip explaining calculation
- Severity colors: red-500 (critical), orange-500 (moderate), blue-500 (minor)
- Bonus points displayed with green card

## Environment Variables

Set via `wrangler.toml` or Cloudflare dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `LLM_MODEL` (default: "gemini-2.5-flash")

Secrets (use `wrangler secret put`):
- `GEMINI_API_KEY`

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy
```
