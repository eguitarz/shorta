# Analysis Search API Documentation

## Overview

The Analysis Search API (`/api/analyses/search`) provides powerful filtering, sorting, and searching capabilities for your analysis jobs using the generated score columns.

**Benefits:**
- ⚡ **Fast queries** - Direct column access instead of JSONB extraction
- 🔍 **Flexible filtering** - Filter by any score metric, video format, hook type, etc.
- 📊 **Advanced analytics** - Query submetrics like words per second, filler word count, etc.
- 📖 **Pagination** - Efficient pagination for large result sets
- 🎯 **Type-safe** - Full TypeScript support with type definitions

---

## Endpoint

```
GET /api/analyses/search
```

**Authentication:** Required (user must be logged in)

---

## Query Parameters

### Score Filters (0-100 scale)

| Parameter | Type | Description |
|-----------|------|-------------|
| `minScore` | integer | Minimum overall deterministic score |
| `maxScore` | integer | Maximum overall deterministic score |
| `minHook` | integer | Minimum hook strength score |
| `maxHook` | integer | Maximum hook strength score |
| `minStructure` | integer | Minimum structure pacing score |
| `minDelivery` | integer | Minimum delivery performance score |
| `minClarity` | integer | Minimum value clarity score |

### Metadata Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | Video format: `talking_head`, `gameplay`, or `other` |
| `hookCategory` | string | Hook category (e.g., `premise`, `visual`, `conflict`) |
| `niche` | string | Niche category |
| `contentType` | string | Content type |

### Submetric Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `minWPS` | integer | Minimum words per second score (0-100) |
| `maxFillerWords` | integer | Maximum filler word count |
| `maxHookTime` | number | Maximum time to claim in seconds (e.g., `3.0` for 3 seconds) |
| `hasPayoff` | boolean | Filter by payoff presence (`true` or `false`) |
| `hasLoopCue` | boolean | Filter by loop cue presence (`true` or `false`) |

### Pagination & Sorting

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | `created_at` | Column to sort by (see options below) |
| `sortOrder` | string | `desc` | Sort order: `asc` or `desc` |
| `limit` | integer | `50` | Number of results (max: 100) |
| `offset` | integer | `0` | Pagination offset |

**Valid `sortBy` options:**
- `deterministic_score` - Overall score
- `hook_strength` - Hook category score
- `structure_pacing` - Structure category score
- `delivery_performance` - Delivery category score
- `value_clarity` - Clarity category score
- `created_at` - Creation date
- `completed_at` - Completion date
- `hook_tt_claim` - Time to claim (seconds)
- `delivery_filler_count` - Filler word count
- `clarity_score_wps` - Words per second score

---

## Response Format

```typescript
{
  "results": FormattedAnalysisResult[],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  }
}
```

### FormattedAnalysisResult Object

```typescript
{
  "id": string,
  "title": string,
  "videoUrl": string | null,
  "fileUri": string | null,
  "createdAt": string,        // ISO timestamp
  "completedAt": string | null,

  "scores": {
    "overall": number | null,   // 0-100
    "hook": number | null,      // 0-100
    "structure": number | null, // 0-100
    "delivery": number | null,  // 0-100
    "clarity": number | null,   // 0-100
    "lint": number | null       // 0-100
  },

  "metadata": {
    "format": string | null,
    "hookCategory": string | null,
    "hookPattern": string | null,
    "niche": string | null,
    "contentType": string | null,
    "targetAudience": string | null
  },

  "submetrics": {
    "hookTimeToClaim": number | null,      // Seconds
    "hookPatternBreak": number | null,     // 1-5
    "hookSpecificity": number | null,      // Count
    "wordsPerSecond": string | null,       // e.g., "3.2"
    "wordsPerSecondScore": number | null,  // 0-100
    "wordCount": number | null,
    "duration": number | null,             // Seconds
    "beatCount": number | null,
    "hasPayoff": boolean | null,
    "hasLoopCue": boolean | null,
    "fillerWordCount": number | null,
    "pauseCount": number | null
  }
}
```

---

## Example Requests

### 1. Find High-Performing Videos

Find videos with overall score > 80:

```bash
GET /api/analyses/search?minScore=80&sortBy=deterministic_score&sortOrder=desc
```

### 2. Find Fast Hooks

Find videos with hooks that claim value within 3 seconds:

```bash
GET /api/analyses/search?maxHookTime=3.0&sortBy=hook_tt_claim&sortOrder=asc
```

### 3. Find Talking Head Videos with Strong Hooks

```bash
GET /api/analyses/search?format=talking_head&minHook=75&sortBy=hook_strength&sortOrder=desc
```

### 4. Find Videos with Specific Hook Category

Find videos using "premise" hooks:

```bash
GET /api/analyses/search?hookCategory=premise&minScore=70
```

### 5. Find Videos with Minimal Filler Words

Find videos with fewer than 5 filler words and good delivery:

```bash
GET /api/analyses/search?maxFillerWords=5&minDelivery=70&sortBy=delivery_filler_count&sortOrder=asc
```

### 6. Find Videos with Ideal Words Per Second

Find videos with high WPS score (indicating optimal pacing):

```bash
GET /api/analyses/search?minWPS=80&sortBy=clarity_score_wps&sortOrder=desc
```

### 7. Find Well-Structured Videos

Find videos with payoff and loop cue:

```bash
GET /api/analyses/search?hasPayoff=true&hasLoopCue=true&minStructure=75
```

### 8. Multi-Criteria Search

Find top-performing talking head videos with fast hooks and clear delivery:

```bash
GET /api/analyses/search?format=talking_head&minScore=80&maxHookTime=3.0&minDelivery=75&maxFillerWords=10&sortBy=deterministic_score
```

### 9. Pagination

Get second page of results (50 per page):

```bash
GET /api/analyses/search?minScore=70&limit=50&offset=50
```

---

## TypeScript Usage

```typescript
import type { AnalysisSearchParams, AnalysisSearchResponse } from '@/lib/types/database';

// Build search parameters
const params: AnalysisSearchParams = {
  minScore: 80,
  format: 'talking_head',
  maxHookTime: 3.0,
  sortBy: 'deterministic_score',
  sortOrder: 'desc',
  limit: 20
};

// Make API request
const queryString = new URLSearchParams(
  Object.entries(params)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)])
);

const response = await fetch(`/api/analyses/search?${queryString}`);
const data: AnalysisSearchResponse = await response.json();

// Use the results
data.results.forEach(result => {
  console.log(`${result.title}: ${result.scores.overall}/100`);
  console.log(`Hook time: ${result.submetrics.hookTimeToClaim}s`);
  console.log(`Format: ${result.metadata.format}`);
});

// Check pagination
if (data.pagination.hasMore) {
  console.log(`More results available (total: ${data.pagination.total})`);
}
```

---

## React Hook Example

```typescript
import { useState, useEffect } from 'react';
import type { AnalysisSearchResponse } from '@/lib/types/database';

function useAnalysisSearch(params: AnalysisSearchParams) {
  const [data, setData] = useState<AnalysisSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const queryString = new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        );

        const response = await fetch(`/api/analyses/search?${queryString}`);
        if (!response.ok) throw new Error('Failed to fetch analyses');

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [JSON.stringify(params)]);

  return { data, loading, error };
}

// Usage in component
function AnalysisSearchPage() {
  const { data, loading, error } = useAnalysisSearch({
    minScore: 80,
    format: 'talking_head',
    sortBy: 'deterministic_score',
    limit: 20
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Found {data?.pagination.total} analyses</h1>
      {data?.results.map(result => (
        <div key={result.id}>
          <h2>{result.title}</h2>
          <p>Score: {result.scores.overall}/100</p>
          <p>Format: {result.metadata.format}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Performance Notes

### Query Speed

The search API uses generated columns instead of JSONB extraction, resulting in:

- **10-100x faster queries** compared to JSONB extraction
- **Efficient indexing** on all filterable columns
- **Optimal pagination** with proper offset/limit

### Example Performance

```sql
-- OLD (slow): JSONB extraction
SELECT * FROM analysis_jobs
WHERE (storyboard_result->'storyboard'->'performance'->>'hookStrength')::INTEGER > 80
-- Query time: ~500ms on 10k rows

-- NEW (fast): Generated columns
SELECT * FROM analysis_jobs
WHERE hook_strength > 80
-- Query time: ~5ms on 10k rows (100x faster!)
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

User is not authenticated.

### 500 Internal Server Error

```json
{
  "error": "Failed to search analyses"
}
```

Database query failed. Check server logs for details.

---

## Limitations

- Maximum `limit`: 100 results per request
- Only returns completed analyses (status = 'completed')
- Only returns user's own analyses
- Null values are excluded from range filters (e.g., `minScore` only matches non-null scores)

---

## Related Documentation

- [Score Columns Migration Guide](../supabase/migrations/014_SCORE_COLUMNS_GUIDE.md)
- [Database Types](../apps/web/lib/types/database.ts)
- [Scoring System](../apps/web/lib/scoring/README.md)

---

## Support

For questions or issues with the search API:
1. Check the migration guide for column definitions
2. Verify your query parameters match the schema
3. Check browser network tab for request/response details
4. Review server logs for error messages
