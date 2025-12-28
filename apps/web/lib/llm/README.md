# LLM Client

Edge-optimized LLM client for Cloudflare Workers with Gemini API support.

## Features

- ✅ **Edge-optimized** - Works on Cloudflare Workers and Next.js Edge Runtime
- ✅ **Streaming support** - Real-time response streaming
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Strategy pattern** - Extensible for multiple providers
- ✅ **Lightweight** - No heavy dependencies, pure Web APIs

## Setup

### 1. Get a Gemini API Key

Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Local Development

Add to `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-1.5-flash-8b  # Optional, defaults to this
```

### 3. Production Deployment (Cloudflare)

Set the secret using Wrangler:

```bash
cd apps/web
wrangler secret put GEMINI_API_KEY
# Enter your API key when prompted
```

The model is configured in `wrangler.toml`:

```toml
[vars]
LLM_MODEL = "gemini-1.5-flash-8b"
```

## Usage

### Direct Usage

```typescript
import { GeminiClient } from '@/lib/llm';

const client = new GeminiClient(process.env.GEMINI_API_KEY!);

// Simple chat
const response = await client.chat([
  { role: 'user', content: 'Hello!' }
]);

console.log(response.content);
console.log(response.usage); // Token usage stats

// With configuration
const response = await client.chat(
  [{ role: 'user', content: 'Explain TypeScript' }],
  {
    model: 'gemini-1.5-pro',
    temperature: 0.9,
    maxTokens: 1000,
  }
);

// Streaming
for await (const chunk of client.stream([
  { role: 'user', content: 'Tell me a story' }
])) {
  process.stdout.write(chunk);
}
```

### Using the Factory (Recommended)

```typescript
import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';

const env: LLMEnv = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL,
};

const client = createDefaultLLMClient(env);
const response = await client.chat([
  { role: 'user', content: 'Hello!' }
]);
```

## API Routes

Two API routes are provided as examples:

### Non-Streaming Chat

**Endpoint:** `POST /api/chat`

```typescript
// Client-side usage
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    config: {
      temperature: 0.7,
      maxTokens: 2048,
    }
  })
});

const data = await response.json();
console.log(data.content);
console.log(data.usage);
```

### Streaming Chat

**Endpoint:** `POST /api/chat/stream`

```typescript
// Client-side usage with EventSource or fetch
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Tell me a story' }
    ]
  })
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

  for (const line of lines) {
    const data = line.slice(6);
    if (data === '[DONE]') continue;

    const json = JSON.parse(data);
    console.log(json.content); // Each chunk of text
  }
}
```

## Available Models

Default: `gemini-1.5-flash-8b` (fast, efficient, cost-effective)

Other options:
- `gemini-1.5-flash` - Balanced speed and capability
- `gemini-1.5-pro` - Most capable, slower
- `gemini-2.0-flash-exp` - Latest experimental model

## Adding More Providers

The strategy pattern makes it easy to add more providers:

```typescript
// lib/llm/openrouter-client.ts
export class OpenRouterClient implements LLMClient {
  async chat(messages: Message[], config?: LLMConfig): Promise<LLMResponse> {
    // Implementation
  }

  async *stream(messages: Message[], config?: LLMConfig): AsyncIterable<string> {
    // Implementation
  }
}

// lib/llm/factory.ts
export type LLMProvider = 'gemini' | 'openrouter';

export function createLLMClient(env: LLMEnv, provider: LLMProvider): LLMClient {
  switch (provider) {
    case 'gemini':
      return new GeminiClient(env.GEMINI_API_KEY!);
    case 'openrouter':
      return new OpenRouterClient(env.OPENROUTER_API_KEY!);
  }
}
```

## Error Handling

The client throws descriptive errors:

```typescript
try {
  const response = await client.chat(messages);
} catch (error) {
  if (error.message.includes('API error')) {
    // Handle API errors (rate limits, invalid key, etc.)
  } else if (error.message.includes('blocked')) {
    // Handle safety blocks
  }
}
```

## Type Definitions

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
```
