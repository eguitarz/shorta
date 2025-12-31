# 002 - Conversational Storyboard Creation

**Status:** In Development
**Priority:** High
**Category:** Core Feature

---

## Overview

Allow users to create video storyboards from scratch using a conversational AI interface. Instead of filling out forms, users describe what they want in natural language, and the AI asks follow-up questions to gather necessary details.

---

## User Journey

### Happy Path

1. **Navigate to Create**
   - User clicks "Create Storyboard" from dashboard
   - Opens `/storyboard/create` route

2. **Start Conversation**
   - User types natural language input in text box
   - Example: "I want to make a video about 3 sales mistakes"
   - AI responds with follow-up questions

3. **Conversational Q&A**
   - AI asks: "What format? How long? What are the mistakes?"
   - User provides details naturally
   - AI confirms understanding and shows summary

4. **Generate Storyboard**
   - "Generate Storyboard" button appears when AI has enough info
   - User clicks generate
   - API creates full storyboard with beats and director notes
   - Navigates to results page

5. **View Results**
   - Same format as analysis-based generation
   - Beats with director notes, script, visual, audio
   - Can download or share

### Edge Cases

- **Vague input**: AI asks clarifying questions
- **Missing info**: AI prompts for required details
- **User changes mind**: AI adapts to new direction
- **Too much info**: AI extracts key points and confirms

---

## Example Conversation

```
User:
"I want to make a video about 3 sales mistakes"

AI:
"Great topic! To create the perfect storyboard, I need a few details:
• What format works best? (talking head, b-roll, demo)
• How long should it be? (15s, 30s, 60s, 90s)
• What are the 3 mistakes you want to cover?"

User:
"Talking head, 60 seconds. The mistakes are: not listening to customers,
being too pushy, and not following up"

AI:
"Perfect! I have everything I need:

✓ Topic: 3 Sales Mistakes to Avoid
✓ Format: Talking head
✓ Length: 60 seconds
✓ Key Points:
  1. Not listening to customers
  2. Being too pushy
  3. Not following up

Ready to generate your storyboard?"

[Generate Storyboard button appears]
```

---

## Technical Implementation

### Routes

**Main Route:**
- `/storyboard/create` - Chat interface

**Results Route:**
- `/storyboard/generate/[id]` - Reuse existing generate UI

### APIs

**Conversation Endpoint:**
```typescript
POST /api/storyboard-chat

Request:
{
  "messages": [
    { "role": "user", "content": "I want to make a video about..." },
    { "role": "assistant", "content": "Great! A few questions..." },
    { "role": "user", "content": "Talking head, 60 seconds..." }
  ]
}

Response:
{
  "message": "Perfect! I have everything...",
  "isReady": true,
  "extractedData": {
    "topic": "3 Sales Mistakes to Avoid",
    "format": "talking_head",
    "targetLength": 60,
    "keyPoints": ["Not listening", "Being pushy", "No follow-up"],
    "targetAudience": "sales professionals",
    "contentType": "educational"
  }
}
```

**Generation Endpoint:**
```typescript
POST /api/create-storyboard

Request:
{
  "topic": "3 Sales Mistakes to Avoid",
  "format": "talking_head",
  "targetLength": 60,
  "keyPoints": ["Not listening", "Being pushy", "No follow-up"],
  "targetAudience": "sales professionals",
  "contentType": "educational"
}

Response:
{
  "overview": {
    "title": "3 Sales Mistakes to Avoid",
    "contentType": "educational",
    "nicheCategory": "business",
    "targetAudience": "sales professionals",
    "length": 60
  },
  "beats": [
    {
      "beatNumber": 1,
      "startTime": 0,
      "endTime": 5,
      "type": "hook",
      "title": "Hook - Sales Mistakes",
      "directorNotes": "• Open with direct eye contact...",
      "script": "Avoid these 3 sales mistakes...",
      "visual": "Close-up, confident expression",
      "audio": "Upbeat background music"
    },
    // ... more beats
  ],
  "generatedAt": "2025-12-30T00:00:00Z"
}
```

### Data Models

```typescript
interface StoryboardChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ExtractedStoryboardData {
  topic: string;
  format: 'talking_head' | 'b_roll' | 'vlog' | 'tutorial';
  targetLength: number;  // seconds
  keyPoints: string[];   // 3-5 main ideas
  targetAudience?: string;
  contentType?: 'educational' | 'entertaining' | 'inspirational';
}

interface ChatResponse {
  message: string;
  isReady: boolean;      // true when ready to generate
  extractedData?: ExtractedStoryboardData;
}
```

### System Prompt

```
You are a helpful AI assistant helping users create video storyboards.

Your goal: Extract the following information through natural conversation:
- Topic/title (what the video is about)
- Format (talking_head, b_roll, vlog, tutorial)
- Target length (15s, 30s, 60s, 90s)
- Key points (3-5 main ideas to cover)
- Target audience (optional but helpful)
- Content type (educational, entertaining, inspirational)

Guidelines:
1. Be conversational and friendly
2. Ask 1-2 questions at a time, not all at once
3. If user provides everything upfront, confirm and mark as ready
4. If user is vague, ask specific follow-up questions
5. Once you have topic, format, length, and key points → mark isReady: true
6. Show a summary of extracted info when ready

Response format:
{
  "message": "Your conversational response",
  "isReady": true/false,
  "extractedData": { topic, format, ... } or null
}
```

### UI Components

**Chat Interface:**
- Message list (scrollable)
- Text input at bottom
- Send button
- Loading state while AI responds
- "Generate Storyboard" button (appears when isReady: true)

**Styling:**
- Match existing Shorta design (black background, purple accents)
- User messages: right-aligned, purple bubble
- AI messages: left-aligned, gray bubble
- Generate button: prominent, disabled until ready

---

## State Management

```typescript
const [messages, setMessages] = useState<StoryboardChatMessage[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [isReady, setIsReady] = useState(false);
const [extractedData, setExtractedData] = useState<ExtractedStoryboardData | null>(null);
const [input, setInput] = useState('');
```

---

## Flow Diagram

```
User lands on /storyboard/create
  ↓
Types initial message
  ↓
POST /api/storyboard-chat
  ↓
AI responds (isReady: false)
  ↓
User provides more details
  ↓
POST /api/storyboard-chat (with full message history)
  ↓
AI confirms (isReady: true, extractedData: {...})
  ↓
"Generate Storyboard" button appears
  ↓
User clicks Generate
  ↓
POST /api/create-storyboard (with extractedData)
  ↓
Storyboard generated
  ↓
Navigate to /storyboard/generate/[id]
  ↓
Display results (reuse existing UI)
```

---

## Advantages

✅ **Natural UX** - Conversation vs rigid forms
✅ **Flexible** - Handles vague or detailed input
✅ **Guided** - AI asks right questions
✅ **Fast** - ~30-45 seconds total
✅ **No video required** - Plan before shooting

---

## Success Metrics

- Time to generate: < 2 minutes (including conversation)
- Conversation rounds: 2-4 messages average
- User satisfaction: High (natural flow)
- Storyboard quality: Same as analysis-based generation

---

## Future Enhancements

- **Templates**: Pre-fill common formats ("unboxing video", "tutorial")
- **Save drafts**: Resume conversation later
- **Inspiration**: "I'm stuck, give me ideas"
- **Refine storyboard**: Edit generated beats via chat
- **Multi-language**: Support other languages
- **Voice input**: Speak instead of type
