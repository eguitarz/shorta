import type { Message, LLMResponse, LLMConfig, LLMClient } from './types';

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

  async analyzeVideo(videoUrl: string, prompt: string, config?: LLMConfig): Promise<LLMResponse> {
    const model = config?.model || this.defaultModel;

    // Format request according to Gemini API docs for YouTube videos
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                file_data: {
                  file_uri: videoUrl
                }
              }
            ]
          }],
          generationConfig: {
            temperature: config?.temperature ?? 0.7,
            maxOutputTokens: config?.maxTokens ?? 2048,
          },
        }),
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
