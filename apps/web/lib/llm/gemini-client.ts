import type { Message, LLMResponse, LLMConfig, LLMClient, VideoClassification, CachedContent } from './types';

export class GeminiClient implements LLMClient {
  private readonly apiKey: string;
  private readonly defaultModel = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = apiKey;
  }

  async chat(messages: Message[], config?: LLMConfig): Promise<LLMResponse> {
    const model = config?.model || this.defaultModel;

    // Transform messages to Gemini format
    const contents = this.transformMessages(messages);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: config?.temperature ?? 0.7,
            maxOutputTokens: config?.maxTokens ?? 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = await response.json();

    // Handle safety blocks or empty responses
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const blockReason = data.candidates?.[0]?.finishReason || 'UNKNOWN';
      throw new Error(`Gemini response blocked or empty. Reason: ${blockReason}`);
    }

    return {
      content: data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  async *stream(messages: Message[], config?: LLMConfig): AsyncIterable<string> {
    const model = config?.model || this.defaultModel;

    // Transform messages to Gemini format
    const contents = this.transformMessages(messages);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: config?.temperature ?? 0.7,
            maxOutputTokens: config?.maxTokens ?? 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini streaming error (${response.status}): ${error}`);
    }

    if (!response.body) {
      throw new Error('Gemini streaming response has no body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
            }
          } catch (e) {
            // Skip malformed JSON chunks
            console.warn('Failed to parse SSE chunk:', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async createVideoCache(videoUrl: string, config?: LLMConfig): Promise<CachedContent> {
    // Must use versioned model for caching
    const model = config?.model || 'gemini-2.0-flash-exp-001';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${model}`,
          contents: [{
            parts: [{
              file_data: {
                file_uri: videoUrl
              }
            }]
          }],
          ttl: '3600s', // 1 hour cache
          displayName: `video-cache-${Date.now()}`
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create cache (${response.status}): ${error}`);
    }

    const data = await response.json();
    return {
      name: data.name,
      model: data.model,
      createTime: data.createTime,
      updateTime: data.updateTime,
      expireTime: data.expireTime,
    };
  }

  async classifyVideo(videoUrl: string, config?: LLMConfig, cachedContentName?: string): Promise<VideoClassification> {
    // Use versioned model for caching compatibility
    const model = config?.model || 'gemini-2.0-flash-exp-001';

    const systemPrompt = `You are a short-form video FORMAT CLASSIFIER.

Your job is ONLY to identify the PRIMARY visual format of the video.
Do NOT give feedback, suggestions, or evaluation.

Choose ONE format:
- talking_head: a person speaking to camera is the dominant visual
- gameplay: gameplay visuals dominate (game HUD / game scene), facecam may be present but secondary
- other: vlog, montage, screen recording, or anything else

Be conservative. If uncertain, choose "other".

Return VALID JSON ONLY.`;

    const userPrompt = `Classify the following short video.

Watch the video and analyze:
- What are the dominant visuals throughout the video?
- Is a person speaking to camera the main focus?
- Are gameplay/game visuals the main focus?
- What format best describes this video?

Return JSON in this exact format:
{
  "format": "talking_head | gameplay | other",
  "confidence": 0.95,
  "evidence": ["short bullet points explaining why"],
  "fallback": {
    "format": "talking_head | gameplay | other",
    "confidence": 0.0
  }
}`;

    // Build request body with or without cache
    const requestBody: any = {
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent classification
        maxOutputTokens: 500,
      },
    };

    if (cachedContentName) {
      // Use cached content
      requestBody.cachedContent = cachedContentName;
      requestBody.contents = [{
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
      }];
    } else {
      // No cache - include video directly
      requestBody.contents = [{
        parts: [
          { text: `${systemPrompt}\n\n${userPrompt}` },
          {
            file_data: {
              file_uri: videoUrl
            }
          }
        ]
      }];
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini classification error (${response.status}): ${error}`);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No classification result returned');
    }

    const resultText = data.candidates[0].content.parts[0].text;

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = resultText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    try {
      const classification: VideoClassification = JSON.parse(jsonText);
      return classification;
    } catch (error) {
      throw new Error(`Failed to parse classification JSON: ${jsonText}`);
    }
  }

  async analyzeVideo(videoUrl: string, prompt: string, config?: LLMConfig, cachedContentName?: string): Promise<LLMResponse> {
    const model = config?.model || 'gemini-2.0-flash-exp-001';

    // Build request body with or without cache
    const requestBody: any = {
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxTokens ?? 2048,
      },
    };

    if (cachedContentName) {
      // Use cached content
      requestBody.cachedContent = cachedContentName;
      requestBody.contents = [{
        parts: [{ text: prompt }]
      }];
    } else {
      // No cache - include video directly
      requestBody.contents = [{
        parts: [
          { text: prompt },
          {
            file_data: {
              file_uri: videoUrl
            }
          }
        ]
      }];
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini video analysis error (${response.status}): ${error}`);
    }

    const data = await response.json();

    // Handle safety blocks or empty responses
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const blockReason = data.candidates?.[0]?.finishReason || 'UNKNOWN';
      throw new Error(`Gemini response blocked or empty. Reason: ${blockReason}`);
    }

    return {
      content: data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  private transformMessages(messages: Message[]) {
    return messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }
}
