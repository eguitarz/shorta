# Shorta Web - Development Notes

## Deployment

**Important: We use Cloudflare Workers, NOT Pages**

### Build and Deploy Process

**IMPORTANT:** Use `cf:build` not `build` for Cloudflare Workers!

1. **Build for Cloudflare:**
   ```bash
   npm run cf:build
   ```
   This runs `opennextjs-cloudflare build` which creates the `.open-next` directory.

   ⚠️ **Do NOT use** `npm run build` - it only runs `next build` without OpenNext bundling.

2. **Deploy to Cloudflare Workers:**
   ```bash
   npx wrangler deploy
   ```

3. **One-liner (recommended):**
   ```bash
   npm run cf:build && npx wrangler deploy
   ```

### Troubleshooting - Seeing Old Version

If Cloudflare shows old code but local is updated:

1. **Hard refresh browser:**
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + F5`

2. **Clear browser cache completely**

3. **Test in incognito/private window** to bypass cache

4. **Rebuild and redeploy:**
   ```bash
   npm run cf:build && npx wrangler deploy
   ```

5. **Check deployment version:**
   ```bash
   npx wrangler deployments list --name shorta-web
   ```

**Common causes:**
- Browser aggressively caching JavaScript bundles
- Service worker caching (if enabled)
- Cloudflare edge cache not updated
- Need to wait 1-2 minutes for global edge propagation

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

### Approved Changes & Generation
- **Right sidebar panel** for collecting approved changes before generation
- **Auto-expands** when first change is approved
- **Two types of changes**:
  1. **Fix**: Approved from beat issue suggestions
     - Shows beat number, issue message, and suggestion
     - Click "Apply Fix" button on any beat issue
  2. **Re-hook Variant**: Approved hook rewrite suggestions
     - Shows variant label (A, B, etc.) and full text
     - Click "Approve Variant" button on re-hook suggestions
- **Remove changes**: Click X button on any approved item
- **Dynamic count badge**: Updates automatically with number of approved changes
- **Generate button**: Disabled until at least one change is approved
- **State management**: Uses `ApprovedChange[]` interface with unique IDs

### Collapsible Panel
- Approved changes panel collapses to the right
- Fast animation (100ms) for better performance
- Auto-expands when changes are approved (via useEffect watching `approvedChangesCount`)

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

# Build for Cloudflare Workers (NOT npm run build!)
npm run cf:build

# Deploy to Cloudflare Workers
npx wrangler deploy

# One-liner: Build and deploy
npm run cf:build && npx wrangler deploy
```
