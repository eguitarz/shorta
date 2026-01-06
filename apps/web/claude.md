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
- **Using wrong build command** (see below)

### ⚠️ CRITICAL: Wrong Build Command Issue

**Problem:** Using `npm run build` instead of `npm run cf:build` causes deployments to use stale code!

**What happens:**
- `npm run build` only runs `next build` → Creates `.next` directory
- Does NOT create `.open-next/worker.js` needed by Cloudflare Workers
- `wrangler deploy` uses old `.open-next` directory if it exists
- Result: Deployments appear successful but use OLD code

**Solution:**
1. Always use `npm run cf:build` before deploying
2. If stuck on old version, delete `.open-next` and rebuild:
   ```bash
   rm -rf .open-next && npm run cf:build && npx wrangler deploy
   ```

**How to verify you're using correct build:**
- Check `.open-next/worker.js` timestamp: `ls -la .open-next/worker.js`
- Should be recent (within last few minutes)
- If old timestamp, you used wrong build command

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

**Analyzer (Video Analysis):**
- `/app/(dashboard)/analyzer/[id]/page.tsx` - Main analyzer UI with approved changes panel
- `/app/(dashboard)/analyzer/generate/[id]/page.tsx` - Generated storyboard results page (from analysis)
- `/app/api/analyze-storyboard/route.ts` - Analysis API endpoint
- `/app/api/generate-storyboard/route.ts` - Generate director storyboard API endpoint

**Storyboard Creator (From Scratch):**
- `/app/(dashboard)/storyboard/create/page.tsx` - Conversational chat UI for creating storyboards
- `/app/(dashboard)/storyboard/generate/[id]/page.tsx` - Generated storyboard results page (from scratch)
- `/app/api/storyboard-chat/route.ts` - Conversational AI endpoint
- `/app/api/create-storyboard/route.ts` - Generate storyboard from text input

**Shared:**
- `/app/api/youtube-stats/route.ts` - YouTube stats API endpoint (fetched on every page load)
- `/lib/linter/engine.ts` - Linter scoring logic
- `/lib/linter/rules/talking_head.ts` - Linter rules
- `wrangler.toml` - Cloudflare Workers configuration
- `/stories/` - Feature documentation (numbered stories)

## Features

### Video Stats
- Views, likes, and publish time displayed under embedded video
- **Fetched fresh on every page load** via `/api/youtube-stats` endpoint
- Data stored in component state: `videoStats.{views,likes,publishedAt}`
- Shows loading skeleton while fetching (separate from analysis loading)
- Shows "—" if data unavailable or API key not set
- **Always up-to-date** - reflects current YouTube metrics, not cached from analysis time
- Publish time displayed as relative time (e.g., "30 days ago", "2 months ago")

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

### Generate Feature (Director's Storyboard)
- **Generate button** creates a new storyboard applying approved changes
- **Navigates to**: `/analyzer/generate/[id]` route
- **API Endpoint**: `/api/generate-storyboard` - Applies changes and generates director notes
- **Director Notes**: AI writes each beat as shooting instructions (not analysis)
  - Focus on HOW to shoot the beat for maximum engagement
  - Specific guidance on camera angles, pacing, energy, delivery
  - Incorporates approved fixes naturally into instructions
  - No issues/problems listed - purely prescriptive
- **Preserves original**: Script, visual, audio unchanged unless fix specifically modifies them
- **Re-hook variants**: Applied to Beat 1 if approved
- **Storage**: Results stored in sessionStorage (no database yet)
- **Processing time**: ~45 seconds (uses Gemini text generation)

### Collapsible Panel
- Approved changes panel collapses to the right
- Fast animation (100ms) for better performance
- Auto-expands when changes are approved (via useEffect watching `approvedChangesCount`)

### Score Transparency
- Info icon with hover tooltip explaining calculation
- Severity colors: red-500 (critical), orange-500 (moderate), blue-500 (minor)
- Bonus points displayed with green card

### Conversational Storyboard Creator (NEW)
- **Route**: `/storyboard/create` - Create storyboards from scratch
- **No video required**: Plan before shooting
- **Conversational UI**: Chat interface instead of forms
- **AI-guided**: Asks follow-up questions to gather:
  - Topic/title
  - Format (talking head, b-roll, vlog, tutorial)
  - Target length (15s, 30s, 60s, 90s)
  - Key points (3-5 main ideas)
  - Target audience (optional)
  - Content type (educational, entertaining, inspirational)
- **Generate button**: Appears when AI has enough info
- **Processing time**: ~30-45 seconds (including conversation)
- **Output**: Same director notes format as analysis-based generation
- **Storage**: Results in sessionStorage (`created_{id}`)
- **See**: `/stories/002-conversational-storyboard-creation.md` for full documentation

## Environment Variables

Set via `wrangler.toml` or Cloudflare dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `LLM_MODEL` (default: "gemini-2.5-flash")

Secrets (use `wrangler secret put`):
- `GEMINI_API_KEY` - For Gemini video analysis
- `YOUTUBE_API_KEY` - For fetching video views/likes stats

### Setting Up YouTube API Key

To show video views and likes:

1. **Get YouTube Data API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable "YouTube Data API v3"
   - Create credentials → API Key
   - Copy the API key

2. **Set the secret:**
   ```bash
   npx wrangler secret put YOUTUBE_API_KEY
   # Paste your API key when prompted
   ```

3. **Verify:**
   - After deploying, video stats (views/likes) will appear below the embedded video
   - If no API key is set, stats will show "—"

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

## Async Video Analysis

**Status:** ✅ Implemented

The video analyzer now runs asynchronously to avoid Cloudflare 524 timeout errors on long videos.

**How it works:**
- Analysis is broken into 3 sequential steps, each completing in <100 seconds
- Frontend polls every 3 seconds to check progress and trigger next step
- Progress bar shows real-time status (Classification → Linting → Storyboard)
- Analysis history is stored in Supabase for persistence
- Users can navigate away and return later - progress is maintained

**Architecture:**
```
Frontend → Create Job → Returns job_id
         ↓
         Poll every 3s
         ↓
         Step 1: Classification (5-10s) → DB update
         ↓
         Step 2: Linting (30-45s) → DB update
         ↓
         Step 3: Storyboard (60-90s) → DB update (completed)
```

**Files:**
- Database: `/supabase/migrations/001_create_analysis_jobs.sql`
- API: `/app/api/jobs/analysis/create/route.ts` and `/app/api/jobs/analysis/[job_id]/route.ts`
- Processing: `/lib/analysis/process-*.ts` (classification, linting, storyboard)
- Frontend: `/app/(dashboard)/analyzer/[id]/page.tsx` (polling UI)

**Setup Required:**
1. Run migration in Supabase dashboard to create `analysis_jobs` table
2. Set `SUPABASE_SERVICE_ROLE_KEY` secret: `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`
3. Deploy with `npm run cf:build && npx wrangler deploy`

**Benefits:**
- ✅ No more 524 timeouts
- ✅ Works on Cloudflare Free tier
- ✅ Real-time progress tracking
- ✅ Analysis history in database
- ✅ Can navigate away and return
