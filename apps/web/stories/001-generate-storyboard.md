# Generate Storyboard Features

## Overview

Shorta offers two ways to generate director-style storyboards for video content creators.

---

## Feature 1: Generate from Analysis

**Flow:** Video Analysis → Issues & Suggestions → Approve Changes → Generate Enhanced Storyboard

### User Journey

1. **Analyze Video**
   - User provides YouTube URL
   - AI analyzes video structure, beats, and performance
   - Identifies issues and suggests improvements

2. **Review & Approve Changes**
   - User reviews beat-by-beat issues
   - Clicks "Apply Fix" to approve specific suggestions
   - Can approve re-hook variants
   - Changes collect in right sidebar panel

3. **Generate Storyboard**
   - Click "Generate" button (requires ≥1 approved change)
   - API applies approved changes to original storyboard
   - LLM generates director notes for each beat
   - Navigates to `/analyzer/generate/[id]`

### Output Format

Each beat includes:
- **Beat number & timing** (e.g., Beat 1: 0:00-0:03)
- **Beat type** (hook, setup, main content, payoff, CTA)
- **Title** (descriptive name)
- **Director Notes** (3-5 bullet points with shooting instructions)
- **Script** (what to say)
- **Visual** (what to show)
- **Audio** (music, sound effects)

### Technical Implementation

**Routes:**
- `/analyzer/[id]` - Main analyzer with approved changes panel
- `/analyzer/generate/[id]` - Generated storyboard results

**API:**
- `POST /api/generate-storyboard`
  - Input: `{ storyboard, approvedChanges, url }`
  - Applies fixes to beats
  - Generates director notes via LLM
  - Returns: `{ original, generated, appliedChanges }`

**Storage:**
- SessionStorage: `generated_{id}` stores results
- No database persistence (yet)

**Prompt:**
- Template: `/lib/linter/rules/talking_head.ts` (generation prompt)
- Focus: Actionable shooting instructions, not analysis
- Format: Bullet points for director notes

---

## Feature 2: Generate from Scratch ⚡ NEW

**Flow:** Text Input → Generate Storyboard → Director's Shot List

### User Journey

1. **Provide Input**
   - Topic/title (e.g., "3 Sales Mistakes to Avoid")
   - Format (talking head, b-roll, vlog, tutorial)
   - Target length (15s, 30s, 60s, 90s)
   - Key points (3-5 main ideas to cover)

2. **Generate Storyboard**
   - Click "Generate"
   - AI creates complete storyboard structure
   - Breaks content into beats with timing
   - Writes director notes for each beat

3. **View & Use**
   - Same format as analysis-based generation
   - Can download or share
   - Use as shooting guide

### Output Format

**Same structure as Feature 1:**
- Beats with timing, type, title
- Director notes (bullet points)
- Script, visual, audio descriptions

### Technical Implementation (Proposed)

**Routes:**
- `/storyboard/create` - Input form
- `/storyboard/generate/[id]` - Generated results

**API:**
- `POST /api/create-storyboard`
  - Input: `{ topic, format, length, keyPoints }`
  - Generates full storyboard from scratch
  - Returns: `{ overview, beats, generatedAt }`

**Form Fields:**
```typescript
interface CreateStoryboardInput {
  topic: string;              // "3 Sales Mistakes to Avoid"
  format: string;             // "talking_head" | "b_roll" | "vlog" | "tutorial"
  targetLength: number;       // 15 | 30 | 60 | 90 (seconds)
  keyPoints: string[];        // ["Mistake 1", "Mistake 2", "Mistake 3"]
  targetAudience?: string;    // "entrepreneurs" | "students" | etc.
  contentType?: string;       // "educational" | "entertaining" | "inspirational"
}
```

**Prompt Strategy:**
```
You are a video storyboard creator for short-form content.

Given the following input, create a complete storyboard for a {format} video:
- Topic: {topic}
- Target Length: {length} seconds
- Format: {format}
- Key Points: {keyPoints}

Generate a storyboard with:
1. Beat structure (hook, setup, main points, payoff, CTA)
2. Timing for each beat
3. Director notes (3-5 actionable bullet points per beat)
4. Script (what to say)
5. Visual (what to show)
6. Audio (music, sound effects)

Focus on {contentType} content for {targetAudience}.

Return JSON format: { overview: {...}, beats: [...] }
```

**Storage:**
- SessionStorage: `created_{id}` stores results
- Can migrate to database later

---

## Comparison

| Feature | Generate from Analysis | Generate from Scratch |
|---------|----------------------|---------------------|
| **Input** | YouTube video URL | Text description |
| **Pre-req** | Existing video | Nothing (planning mode) |
| **Use Case** | Improve existing content | Plan before shooting |
| **Process Time** | ~2 min (analysis) + ~45s (generation) | ~30s (generation only) |
| **Customization** | Based on approved fixes | Based on user input |
| **Output** | Enhanced storyboard | New storyboard |

---

## Shared Components

Both features share:
- Same output format (beats with director notes)
- Same UI for displaying results
- Same bullet point formatting
- Same director notes style (actionable, concise)

## Future Enhancements

- **Database storage** - Save generated storyboards
- **Export options** - PDF, Notion, Google Docs
- **Collaboration** - Share with team
- **Templates** - Pre-built formats (unboxing, tutorial, vlog)
- **Video generation** - Connect to video editing tools
