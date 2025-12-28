# Video Linter Usage Guide

## Architecture

```
Format Classification → Load Rules → Lint Video → Return Violations
     (Step 1)           (Step 2a)     (Step 2b)      (Result)
```

## Basic Usage

```typescript
import { createDefaultLLMClient } from '@/lib/llm';
import { VideoLinter } from '@/lib/linter';

// Step 1: Create cache and classify
const client = createDefaultLLMClient(env);
const cache = await client.createVideoCache(videoUrl);
const classification = await client.classifyVideo(videoUrl, undefined, cache.name);

// Step 2: Lint based on format
const linter = new VideoLinter(client, cache.name);
const result = await linter.lint(videoUrl, classification.format);

console.log(result);
// {
//   format: 'talking_head',
//   totalRules: 15,
//   violations: [...],
//   passed: 10,
//   warnings: 3,
//   errors: 2,
//   score: 75,
//   summary: 'Video has strong hook but needs better pacing...'
// }
```

## API Integration Example

```typescript
// app/api/lint-video/route.ts
import { createDefaultLLMClient } from '@/lib/llm';
import { VideoLinter } from '@/lib/linter';

export async function POST(request: Request) {
  const { url, format } = await request.json();

  const client = createDefaultLLMClient({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });

  const linter = new VideoLinter(client);
  const result = await linter.lint(url, format);

  return Response.json(result);
}
```

## With Full Pipeline

```typescript
// Complete flow: classify → lint → return results
export async function POST(request: Request) {
  const { url } = await request.json();
  const client = createDefaultLLMClient(env);

  // Create cache once
  const cache = await client.createVideoCache(url);

  // Step 1: Classify
  const classification = await client.classifyVideo(url, undefined, cache.name);

  // Step 2: Lint based on classification
  const linter = new VideoLinter(client, cache.name);
  const lintResult = await linter.lint(url, classification.format);

  return Response.json({
    classification,
    lintResult,
  });
}
```

## Accessing Rules

```typescript
const linter = new VideoLinter(client);

// Get all rules for a format
const rules = linter.getRules('talking_head');

// Get specific rule
const rule = linter.getRule('talking_head', 'th_hook_timing');

// Get full ruleset
const ruleSet = linter.getRuleSet('talking_head');
```

## Response Structure

```typescript
interface LintResult {
  format: 'talking_head' | 'gameplay' | 'other';
  totalRules: 15;
  violations: [
    {
      ruleId: 'th_hook_timing',
      ruleName: 'Hook Within 3 Seconds',
      severity: 'error',
      category: 'hook',
      message: 'Hook appears at 0:05, which is too late',
      timestamp: '0:05',
      suggestion: 'Move the core question to 0:00',
      confidence: 0.95
    }
  ],
  passed: 10,    // Rules with no violations
  warnings: 3,   // Warning-level violations
  errors: 2,     // Error-level violations
  score: 75,     // 0-100 score
  summary: '...' // Overall summary
}
```

## Customizing Rules

Edit rule files directly:
- `lib/linter/rules/talking_head.ts`
- `lib/linter/rules/gameplay.ts`
- `lib/linter/rules/other.ts`

Each rule has:
```typescript
{
  id: 'unique_id',
  name: 'Human Readable Name',
  description: 'What this rule checks',
  severity: 'error' | 'warning' | 'info',
  category: 'hook' | 'retention' | 'audio' | 'visual' | 'pacing' | 'structure' | 'cta',
  check: 'Specific instruction for Gemini'
}
```

## Scoring System

- Start: 100 points
- Error: -10 points each
- Warning: -5 points each
- Info: -2 points each
- Minimum: 0
- Maximum: 100

## Benefits

1. **Consistent Analysis** - Same rules applied every time
2. **Actionable Feedback** - Specific violations with timestamps
3. **Extensible** - Easy to add new rules or formats
4. **Format-Specific** - Different rules for different content types
5. **Structured Output** - Easy to display in UI
6. **Cost-Efficient** - Uses context caching to save tokens
