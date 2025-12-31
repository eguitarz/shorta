# Story 003: Viral Pattern Analysis

## Overview

Before generating a storyboard, the AI analyzes recent viral videos in the user's niche to identify working patterns and incorporate them into the generated storyboard. This ensures storyboards are based on current, proven patterns rather than general best practices.

## Problem Statement

Current storyboard generation uses general best practices and AI knowledge, but:
- Viral patterns evolve constantly (what worked 6 months ago may not work today)
- Platform algorithms change (YouTube Shorts, TikTok, Reels reward different patterns)
- Niche-specific trends vary significantly (finance shorts ≠ fitness shorts)
- Users need storyboards optimized for what's working RIGHT NOW

## Value Proposition

**For Users:**
- Higher likelihood of virality (based on proven recent patterns)
- Niche-specific recommendations (not generic advice)
- Stay current with platform algorithm changes
- Learn what's working in their space

**For Shorta:**
- Unique competitive advantage (analysis + generation + patterns)
- Premium feature potential
- Data-driven insights into trends
- Network effects (more users = more pattern data)

## Implementation Phases

### Phase 1: On-Demand with Caching (MVP)

**User Flow:**
```
1. User creates storyboard via chat
2. AI extracts niche/category from conversation
3. Before generation, AI asks:
   "Analyze recent viral videos in [niche]? (+10 seconds)"
   [Yes, analyze trends] [No, skip]
4. If yes:
   - Check Cloudflare KV cache for patterns (key: niche + date)
   - If cache hit: Use cached patterns (instant)
   - If cache miss: Analyze now + cache for 48 hours
5. Show findings to user:
   "Found 3 patterns from top 10 videos (last 30 days):
    • Hook: Start with bold claim + number
    • Structure: Problem → Demo → Result (60% use this)
    • Pacing: Average 4.2 seconds per beat"
6. Generate storyboard incorporating patterns
```

**Technical Implementation:**

```typescript
// app/api/analyze-viral-patterns/route.ts
export async function POST(request: NextRequest) {
  const { niche } = await request.json();

  // Check cache first
  const cacheKey = `viral_patterns_${slugify(niche)}_${getDateKey()}`;
  const cached = await env.KV.get(cacheKey, { type: 'json' });

  if (cached) {
    return NextResponse.json({
      patterns: cached,
      source: 'cache',
      analyzedAt: cached.timestamp
    });
  }

  // Cache miss - analyze now
  const patterns = await analyzeViralVideos(niche);

  // Cache for 48 hours
  await env.KV.put(cacheKey, JSON.stringify(patterns), {
    expirationTtl: 48 * 60 * 60
  });

  return NextResponse.json({
    patterns,
    source: 'fresh',
    analyzedAt: new Date().toISOString()
  });
}

async function analyzeViralVideos(niche: string) {
  // 1. Search YouTube for recent viral videos
  const videos = await searchYouTubeVideos({
    query: niche,
    publishedAfter: getLast30Days(),
    order: 'viewCount',
    maxResults: 20,
    videoDuration: 'short' // YouTube Shorts only
  });

  // 2. Analyze metadata patterns with LLM
  const metadataAnalysis = await analyzeTitlesAndDescriptions(videos);

  // 3. (Optional) Deep video analysis with Gemini
  // Only analyze top 3 to save costs
  const topVideos = videos.slice(0, 3);
  const videoAnalysis = await analyzeVideoContent(topVideos);

  // 4. Synthesize patterns
  return {
    hookPatterns: metadataAnalysis.hooks,
    structurePatterns: videoAnalysis.structures,
    pacing: videoAnalysis.averageBeatLength,
    commonElements: metadataAnalysis.elements,
    videosAnalyzed: videos.length,
    timestamp: new Date().toISOString()
  };
}

async function searchYouTubeVideos(params) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&` +
    `q=${encodeURIComponent(params.query)}&` +
    `publishedAfter=${params.publishedAfter}&` +
    `order=${params.order}&` +
    `maxResults=${params.maxResults}&` +
    `videoDuration=${params.videoDuration}&` +
    `type=video&` +
    `key=${process.env.YOUTUBE_API_KEY}`
  );

  const data = await response.json();

  // Get video statistics (views, likes, etc.)
  const videoIds = data.items.map(item => item.id.videoId).join(',');
  const statsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?` +
    `part=statistics,contentDetails&` +
    `id=${videoIds}&` +
    `key=${process.env.YOUTUBE_API_KEY}`
  );

  const statsData = await statsResponse.json();

  // Combine results
  return data.items.map((item, i) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    views: parseInt(statsData.items[i].statistics.viewCount),
    likes: parseInt(statsData.items[i].statistics.likeCount),
    duration: statsData.items[i].contentDetails.duration
  }));
}

async function analyzeTitlesAndDescriptions(videos) {
  const prompt = `Analyze these ${videos.length} viral YouTube Shorts titles and descriptions.

Videos:
${videos.map((v, i) => `
${i + 1}. "${v.title}"
   Views: ${v.views.toLocaleString()}
   Published: ${v.publishedAt}
   Description: ${v.description.substring(0, 200)}...
`).join('\n')}

Identify common patterns:
1. Hook patterns (how do titles grab attention?)
2. Content themes (what topics/angles work?)
3. Call-to-action patterns
4. Common elements across high performers

Return JSON:
{
  "hooks": ["pattern 1", "pattern 2", ...],
  "themes": ["theme 1", "theme 2", ...],
  "elements": ["element 1", "element 2", ...]
}`;

  const response = await llmClient.chat([
    { role: 'user', content: prompt }
  ], {
    temperature: 0.3,
    maxTokens: 1024
  });

  // Parse JSON response
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

async function analyzeVideoContent(videos) {
  // Use Gemini to analyze actual video content
  // Note: This is expensive - only do for top 3 videos
  const analyses = await Promise.all(
    videos.map(async (video) => {
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      const analysis = await analyzeVideoWithGemini(videoUrl);
      return analysis;
    })
  );

  // Aggregate findings
  const structures = analyses.map(a => a.structure);
  const beatLengths = analyses.flatMap(a => a.beats.map(b => b.duration));
  const avgBeatLength = beatLengths.reduce((a, b) => a + b) / beatLengths.length;

  return {
    structures: findCommonStructures(structures),
    averageBeatLength: Math.round(avgBeatLength * 10) / 10,
    videoAnalyses: analyses
  };
}
```

**UI Changes:**

Update `/app/(dashboard)/storyboard/create/page.tsx`:
```typescript
// Add checkbox in chat interface
const [useViralPatterns, setUseViralPatterns] = useState(true);

// Before generation
if (useViralPatterns) {
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: 'Analyzing recent viral videos in your niche...'
  }]);

  const patternsResponse = await fetch('/api/analyze-viral-patterns', {
    method: 'POST',
    body: JSON.stringify({ niche: extractedData.topic })
  });

  const { patterns, source } = await patternsResponse.json();

  setMessages(prev => [...prev, {
    role: 'assistant',
    content: `Found ${patterns.hookPatterns.length} patterns from top 20 videos:
• ${patterns.hookPatterns.join('\n• ')}

Incorporating these into your storyboard...`
  }]);

  // Pass patterns to generation
  await generateStoryboard(extractedData, patterns);
}
```

**Generation Prompt Enhancement:**

```typescript
// app/api/create-storyboard/route.ts
function createPromptWithPatterns(data, patterns) {
  return `Generate a video storyboard for: ${data.topic}

${patterns ? `
VIRAL PATTERNS (from recent top performers in this niche):
Hook Patterns: ${patterns.hookPatterns.join(', ')}
Common Structure: ${patterns.structures.join(' → ')}
Optimal Pacing: ${patterns.averageBeatLength}s per beat
Common Elements: ${patterns.elements.join(', ')}

IMPORTANT: Incorporate these proven patterns into the storyboard.
` : ''}

Format: ${data.format}
Length: ${data.targetLength}s
Key Points: ${data.keyPoints.join(', ')}

Generate storyboard with beats that follow the viral patterns identified above...`;
}
```

**Caching Strategy:**

```javascript
// wrangler.toml - Add KV namespace
[[kv_namespaces]]
binding = "VIRAL_PATTERNS_KV"
id = "your_kv_namespace_id"

// Cache key format
const cacheKey = `viral_${niche}_${YYYY-MM-DD}`;
// Example: "viral_productivity_2025-01-15"

// Cache duration: 48 hours
// Rationale: Patterns don't change daily, but stay fresh
```

**API Quota Management:**

```
YouTube API Free Tier: 10,000 units/day

Cost per analysis:
- Search (20 results): 100 units
- Video stats (20 videos): 1 unit
- Total: ~101 units per niche

Daily capacity: ~99 unique niches (without caching)
With 48h cache: ~200 niches/day (assuming 50% cache hit rate)
```

### Phase 2: Auto-Refresh Popular Niches

After collecting usage data, identify top 20 niches and refresh daily.

**Cloudflare Cron Trigger:**
```javascript
// wrangler.toml
[triggers]
crons = ["0 2 * * *"]  // 2am UTC daily

// worker.ts
export default {
  async scheduled(event, env, ctx) {
    const topNiches = await getTopNiches(env); // From analytics

    for (const niche of topNiches.slice(0, 20)) {
      ctx.waitUntil(refreshViralPatterns(niche, env));
    }
  }
}

async function getTopNiches(env) {
  // Query analytics to find most-requested niches
  // For now, hardcode top 20
  return [
    'productivity',
    'fitness',
    'cooking',
    'tech reviews',
    'personal finance',
    // ... etc
  ];
}
```

### Phase 3: Pattern Database & Analytics

**Database Schema:**
```sql
CREATE TABLE viral_patterns (
  id UUID PRIMARY KEY,
  niche VARCHAR(255),
  analyzed_at TIMESTAMP,
  videos_analyzed INTEGER,
  hook_patterns JSONB,
  structure_patterns JSONB,
  avg_beat_length DECIMAL,
  common_elements JSONB,
  youtube_videos JSONB, -- Store video IDs for reference
  cache_hits INTEGER DEFAULT 0,
  last_used_at TIMESTAMP
);

CREATE INDEX idx_niche_date ON viral_patterns(niche, analyzed_at DESC);
```

**Analytics Dashboard:**
- Most requested niches
- Cache hit rates
- API quota usage
- Pattern evolution over time
- A/B test: Storyboards with patterns vs without

## User Experience

### Happy Path (Cache Hit)
```
User: "I want to make a productivity video"
AI: "What specific aspect? (morning routines, tools, mindset, etc.)"
User: "Best productivity apps for developers"
AI: "Perfect! I'll analyze recent viral videos in this niche."
    [2 seconds]
    "✓ Analyzed 20 viral videos from last 30 days

     Top patterns I found:
     • Hook: Start with bold time-saving claim (e.g., '3x faster')
     • Structure: 80% follow Problem → Demo → Result
     • Pacing: Best performers average 4.5s per scene
     • Common: Side-by-side comparisons, screen recordings

     Ready to generate! This will incorporate these proven patterns."

User clicks: [Generate Storyboard]
```

### Cache Miss (First Time)
```
AI: "Analyzing recent viral videos... (this takes ~15 seconds)"
    [Shows progress]
    "✓ Found 20 videos
     ✓ Analyzing titles and descriptions
     ✓ Identifying patterns
     ✓ Analyzing top 3 videos with AI

     Found 4 key patterns:..."
```

### User Controls
```
Settings/Options:
☑ Use viral pattern analysis (recommended)
☐ Skip analysis (faster, uses general best practices)

Niche: [Auto-detected: "developer productivity"] [Edit]

Pattern freshness:
○ Last 7 days (trending)
● Last 30 days (proven) ← default
○ Last 90 days (established)
```

## API Considerations

### YouTube Data API v3

**Endpoints Used:**
1. `search.list` - Find videos by niche
2. `videos.list` - Get statistics (views, likes)

**Quota Costs:**
- Search: 100 units
- Videos.list: 1 unit
- Total per analysis: ~101 units

**Daily Limits:**
- Free tier: 10,000 units/day (~99 analyses)
- With caching: Effectively unlimited for realistic usage

**Rate Limiting:**
- Implement exponential backoff
- Respect quota limits in worker
- Show user-friendly error if quota exceeded

### Gemini Video Analysis (Optional Phase 1, Standard Phase 2)

**Cost:**
- $0.05 per video analyzed (Gemini 1.5 Flash)
- Analyzing 3 videos per niche = $0.15 per analysis
- 100 niches/day = $15/day = $450/month

**Optimization:**
- Only analyze top 3 videos (not all 20)
- Cache aggressively (48-72 hours)
- Make video analysis opt-in or premium feature
- Use metadata analysis primarily (free)

## Success Metrics

**Product Metrics:**
- Pattern analysis adoption rate (% who use it)
- Cache hit rate (target: >60%)
- Generation quality improvement (user ratings)
- Viral success rate (videos above 10k views)

**Technical Metrics:**
- API quota usage vs limits
- Cache hit rate by niche
- Average analysis latency
- Error rate

**Business Metrics:**
- Premium conversion (if gated feature)
- User retention improvement
- Viral success stories (testimonials)

## Cost Analysis

### Phase 1 (On-Demand + Cache)
**Fixed Costs:**
- YouTube API: Free (up to 10k units/day)
- Cloudflare KV: ~$0.50/month (1M reads)
- Gemini (if used): $0-15/day depending on usage

**Variable Costs:**
- Scales with actual usage
- 90% reduction from caching

### Phase 2 (Auto-Refresh Top 20)
**Fixed Costs:**
- YouTube API: Still free (20 niches = 2,020 units/day)
- Cloudflare Cron: Free
- Gemini: $3/day for daily refresh of top 20

### Phase 3 (Full Platform)
**Infrastructure:**
- Database: ~$25/month (Supabase)
- API quota: Potentially need paid tier if >100 niches/day

## Future Enhancements

1. **Multi-platform Analysis**
   - Analyze TikTok, Instagram Reels, not just YouTube
   - Cross-platform pattern comparison

2. **Trend Alerts**
   - Notify users when new patterns emerge in their niche
   - "New hook pattern detected in productivity niche"

3. **Pattern Library**
   - Browse all patterns by niche
   - See example videos for each pattern
   - Filter by performance (views, engagement)

4. **A/B Testing**
   - Generate 2 versions (with/without patterns)
   - User picks, we learn which patterns work

5. **Predictive Patterns**
   - ML model to predict which patterns will work
   - Based on historical performance data

6. **Custom Pattern Analysis**
   - User uploads competitor URLs
   - Analyze specific channels or creators

## Open Questions

1. **Niche Granularity**
   - How specific should niches be?
   - "Productivity" vs "Productivity for developers" vs "Productivity apps for Python developers"
   - Solution: Use fuzzy matching, combine similar niches

2. **Pattern Staleness**
   - How long are patterns valid?
   - Current assumption: 48 hours
   - May need A/B testing to optimize

3. **Pattern Conflicts**
   - What if user's request conflicts with patterns?
   - Example: User wants 60s video, but viral pattern is 30s
   - Solution: Show conflict, let user decide

4. **Geographic Differences**
   - Do patterns vary by country/language?
   - Should we filter YouTube results by region?
   - Phase 1: No filtering, Phase 2: Consider

## Technical Risks & Mitigations

**Risk 1: API Quota Exhaustion**
- Mitigation: Aggressive caching, quota monitoring, graceful degradation

**Risk 2: Pattern Analysis Latency**
- Mitigation: Show progress, make optional, pre-cache popular niches

**Risk 3: Gemini Video Analysis Timeout**
- Mitigation: Use metadata only in Phase 1, async processing in Phase 2

**Risk 4: Cache Stampede**
- Mitigation: Implement cache locking, stagger refreshes

## Development Checklist

### Phase 1 MVP
- [ ] YouTube API integration
- [ ] Viral pattern analysis endpoint
- [ ] Cloudflare KV caching setup
- [ ] Chat UI for pattern opt-in
- [ ] Metadata analysis (titles/descriptions)
- [ ] Pattern display in chat
- [ ] Integration with storyboard generation
- [ ] Error handling & quota monitoring
- [ ] Analytics tracking (usage, cache hits)

### Phase 2 Auto-Refresh
- [ ] Usage analytics to identify top niches
- [ ] Cloudflare Cron setup
- [ ] Auto-refresh logic
- [ ] Gemini video analysis integration
- [ ] Performance optimization

### Phase 3 Database
- [ ] Database schema design
- [ ] Migration from KV to DB
- [ ] Analytics dashboard
- [ ] Pattern evolution tracking
- [ ] A/B testing framework

## Related Stories

- **001-generate-storyboard.md** - Base storyboard generation
- **002-conversational-storyboard-creation.md** - Chat interface where patterns are integrated

## References

- YouTube Data API: https://developers.google.com/youtube/v3
- Cloudflare KV: https://developers.cloudflare.com/kv/
- Cloudflare Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
