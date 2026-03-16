import { GoogleGenAI } from '@google/genai';
import type { Message, LLMResponse, LLMConfig, LLMClient, VideoClassification, CachedContent } from './types';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// Timeout configuration (ms)
const CLASSIFY_TIMEOUT_MS = 60_000;   // 60s for classification (short clip)
const ANALYZE_TIMEOUT_MS = 300_000;   // 300s for full video analysis (long videos need more time)

/**
 * Repair common LLM JSON corruption:
 * - Stray digits replacing closing braces (e.g. `"value" 0, {` → `"value"}, {`)
 * - Stray digits before closing braces (e.g. `"LC": true\n    1}` → `"LC": true}`)
 * - Trailing commas before closing braces/brackets
 */
function repairJSON(jsonStr: string): string {
  let repaired = jsonStr;

  // Pattern 1: Stray digit REPLACING a closing brace before a comma
  // e.g. `"Hook Within 3 Seconds" 0, {` → `"Hook Within 3 Seconds"}, {`
  // This happens when the model outputs a digit instead of `}`
  repaired = repaired.replace(
    /(")\s+(\d+)\s*,\s*\{/g,
    '$1}, {'
  );

  // Pattern 2: Stray bare digits between valid JSON values (on same or next line)
  // e.g. `"LC": true\n    1}` → `"LC": true}`
  repaired = repaired.replace(
    /(true|false|null|\d+\.?\d*|"|\]|\})\s*\n?\s+(\d+)\s*(?=[}\]"])/g,
    '$1'
  );

  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  return repaired;
}

/**
 * Robustly extract a JSON object from LLM text that may contain preamble,
 * markdown code fences, thinking blocks, or trailing degenerate repetition.
 */
function extractJSONObject<T = any>(raw: string): T {
  let text = raw;

  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1];

  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) throw new Error('No JSON object found in response');

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\' && inString) { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = text.substring(firstBrace, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          // Try repairing stray characters
          const repaired = repairJSON(candidate);
          return JSON.parse(repaired);
        }
      }
    }
  }

  // Fallback: find last '}' before any degenerate repetition
  const degMatch = text.match(/(.)\1{19,}/);
  const cutoff = degMatch ? degMatch.index! : text.length;
  const lastBrace = text.lastIndexOf('}', cutoff);
  if (lastBrace > firstBrace) {
    const candidate = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      const repaired = repairJSON(candidate);
      return JSON.parse(repaired);
    }
  }

  throw new Error('Could not extract valid JSON from LLM response');
}

/**
 * Retry a Gemini API call with exponential backoff.
 * Retries on transient errors: network failures, 429 (rate limit), 500/503.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  backoffMs = INITIAL_BACKOFF_MS
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    const message = error instanceof Error ? error.message : String(error);
    const isTransient =
      message.includes('503') ||
      message.includes('500') ||
      message.includes('429') ||
      message.includes('UNAVAILABLE') ||
      message.includes('network') ||
      message.includes('fetch failed') ||
      message.includes('RESOURCE_EXHAUSTED');

    if (!isTransient) throw error;

    const waitMs = backoffMs * (MAX_RETRIES - retries + 1);
    console.log(`[Gemini] Transient error, retrying in ${waitMs}ms (${retries} attempts left):`, message);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return withRetry(fn, retries - 1, backoffMs * 2);
  }
}

/**
 * Race a promise against a timeout. Throws if the timeout fires first.
 */
function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    fn().then(
      (result) => { clearTimeout(timer); resolve(result); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

export class GeminiClient implements LLMClient {
  private readonly ai: GoogleGenAI;
  private readonly defaultModel = 'gemini-3.1-flash-lite-preview';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async chat(messages: Message[], config?: LLMConfig): Promise<LLMResponse> {
    const modelName = config?.model || this.defaultModel;

    // Build contents from messages, including file attachments
    const contents = messages.map((msg) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: msg.content },
      ];

      // Add file attachments if present
      if (msg.files && msg.files.length > 0) {
        for (const file of msg.files) {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data,
            },
          });
        }
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    const response = await this.ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxTokens ?? 2048,
      },
    });

    return {
      content: response.text || '',
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  async *stream(messages: Message[], config?: LLMConfig): AsyncIterable<string> {
    const modelName = config?.model || this.defaultModel;

    // Build contents from messages
    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await this.ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxTokens ?? 2048,
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  async classifyVideo(videoUrl: string, config?: LLMConfig): Promise<VideoClassification> {
    const modelName = config?.model || 'gemini-3.1-flash-lite-preview';

    const systemPrompt = `You are a short-form video FORMAT CLASSIFIER.

Your job is ONLY to identify the PRIMARY visual format of the video.
Do NOT give feedback, suggestions, or evaluation.

**Available Formats (choose ONE):**
1. **talking_head** - Person speaking directly to camera (can include b-roll, but speaker is the PRIMARY focus)
2. **gameplay** - Video game footage (can include commentary, but gameplay is the PRIMARY visual)
3. **demo** - Screen recording, product demo, software walkthrough, or tutorial showing a screen/app/tool. The PRIMARY visual is a screen, UI, or product being demonstrated (with or without voiceover/facecam). Key indicators: cursor movement, UI interactions, code editors, browser windows, app interfaces, product showcases.
4. **other** - Everything else (animations, vlogs, montages, lifestyle content, etc.)

Return ONLY this JSON structure:
{
  "format": "talking_head | gameplay | demo | other",
  "confidence": 0.95,
  "evidence": ["short bullet points explaining why"],
  "fallback": {
    "format": "talking_head | gameplay | demo | other",
    "confidence": 0.0
  }
}`;

    const userPrompt = `Classify this video's PRIMARY format.

IMPORTANT:
- Return ONLY the JSON structure above
- NO additional commentary
- Choose the MOST DOMINANT format
- If the video primarily shows a screen, UI, app, or product being demonstrated, classify as "demo"

Return JSON:
{
  "format": "talking_head | gameplay | demo | other",
  "confidence": 0.95,
  "evidence": ["short bullet points explaining why"],
  "fallback": {
    "format": "talking_head | gameplay | demo | other",
    "confidence": 0.0
  }
}`;

    console.log('Classifying video with:', { model: modelName, url: videoUrl });

    try {
      // Build contents with video file - only first 15 seconds needed for classification
      const contents = [
        { text: `${systemPrompt}\n\n${userPrompt}` },
        {
          fileData: { fileUri: videoUrl },
          videoMetadata: { endOffset: '15s' },
        },
      ];

      const response = await withTimeout(
        () => withRetry(() =>
          this.ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              temperature: 0.1,
              maxOutputTokens: 1500,
              responseMimeType: 'application/json',
            },
          })
        ),
        CLASSIFY_TIMEOUT_MS,
        `Video classification timed out after ${CLASSIFY_TIMEOUT_MS / 1000}s`
      );

      const resultText = response.text;

      if (!resultText) {
        throw new Error('No classification result returned');
      }

      // Robustly extract JSON — handle preamble, code fences, trailing garbage
      const classification: VideoClassification = extractJSONObject(resultText);
      return classification;
    } catch (error) {
      console.error('Classification error:', error);
      throw new Error(`Gemini classification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeVideo(videoUrl: string, prompt: string, config?: LLMConfig): Promise<LLMResponse> {
    const modelName = config?.model || 'gemini-3.1-flash-lite-preview';

    // Calculate optimal FPS based on video duration
    // Default: 1 fps (~258 tokens/frame)
    // Long videos (>60s): 0.5 fps to save tokens
    // NOTE: Do NOT use fps < 0.5. Values like 0.1 cause the API to
    // internally set maxNumberOfFrames=0, meaning the model receives
    // ZERO video frames and can only work from the text prompt.
    let fps = config?.fps;
    if (!fps && config?.videoDuration) {
      if (config.videoDuration > 60) {
        fps = 0.5;
      }
    }

    console.log('Analyzing video with:', { model: modelName, url: videoUrl, fps: fps || 'default (1)' });

    try {
      // Build contents with video file and optional FPS optimization
      const videoContent: { fileData: { fileUri: string }; videoMetadata?: { fps: number } } = {
        fileData: { fileUri: videoUrl },
      };
      if (fps) {
        videoContent.videoMetadata = { fps };
      }

      const contents = [{ text: prompt }, videoContent];

      // NOTE: Do NOT use responseMimeType: 'application/json' here.
      // With gemini-2.5-flash (thinking model), it causes:
      // 1. Output wrapped in array [...] instead of object {...}
      // 2. Severely truncated output (4K chars instead of 50K+)
      // 3. Stray digits replacing braces in JSON
      // The SDK already handles thinking blocks (skips thought:true parts).
      const response = await withTimeout(
        () => withRetry(() =>
          this.ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              temperature: config?.temperature ?? 0.7,
              maxOutputTokens: config?.maxTokens ?? 8192,
            },
          })
        ),
        ANALYZE_TIMEOUT_MS,
        `Video analysis timed out after ${ANALYZE_TIMEOUT_MS / 1000}s. Try a shorter video.`
      );

      // Handle safety blocks or empty responses
      if (!response.text) {
        throw new Error('Gemini response blocked or empty');
      }

      return {
        content: response.text,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      console.error('Video analysis error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Surface video-length specific errors
      if (message.includes('too long') || message.includes('exceeds') || message.includes('FILE_TOO_LARGE')) {
        throw new Error('Video is too long for analysis. Please try a shorter video (under 10 minutes).');
      }
      throw new Error(`Gemini video analysis error: ${message}`);
    }
  }
}
