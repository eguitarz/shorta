import { GoogleGenAI } from '@google/genai';
import type { Message, LLMResponse, LLMConfig, LLMClient, VideoClassification, CachedContent } from './types';

export class GeminiClient implements LLMClient {
  private readonly ai: GoogleGenAI;
  private readonly defaultModel = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async chat(messages: Message[], config?: LLMConfig): Promise<LLMResponse> {
    const modelName = config?.model || this.defaultModel;

    // Build contents from messages
    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

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
    const modelName = config?.model || 'gemini-2.5-flash';

    const systemPrompt = `You are a short-form video FORMAT CLASSIFIER.

Your job is ONLY to identify the PRIMARY visual format of the video.
Do NOT give feedback, suggestions, or evaluation.

**Available Formats (choose ONE):**
1. **talking_head** - Person speaking directly to camera (can include b-roll, but speaker is the PRIMARY focus)
2. **gameplay** - Video game footage (can include commentary, but gameplay is the PRIMARY visual)
3. **other** - Everything else (tutorials, animations, vlogs, montages, product reviews, etc.)

Return ONLY this JSON structure:
{
  "format": "talking_head | gameplay | other",
  "confidence": 0.95,
  "evidence": ["short bullet points explaining why"],
  "fallback": {
    "format": "talking_head | gameplay | other",
    "confidence": 0.0
  }
}`;

    const userPrompt = `Classify this video's PRIMARY format.

IMPORTANT:
- Return ONLY the JSON structure above
- NO additional commentary
- Choose the MOST DOMINANT format

Return JSON:
{
  "format": "talking_head | gameplay | other",
  "confidence": 0.95,
  "evidence": ["short bullet points explaining why"],
  "fallback": {
    "format": "talking_head | gameplay | other",
    "confidence": 0.0
  }
}`;

    console.log('Classifying video with:', { model: modelName, url: videoUrl });

    try {
      // Build contents with video file
      const contents = [
        { text: `${systemPrompt}\n\n${userPrompt}` },
        { fileData: { fileUri: videoUrl } },
      ];

      const response = await this.ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      });

      const resultText = response.text;

      if (!resultText) {
        throw new Error('No classification result returned');
      }

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = resultText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const classification: VideoClassification = JSON.parse(jsonText);
      return classification;
    } catch (error) {
      console.error('Classification error:', error);
      throw new Error(`Gemini classification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeVideo(videoUrl: string, prompt: string, config?: LLMConfig): Promise<LLMResponse> {
    const modelName = config?.model || 'gemini-2.5-flash';

    console.log('Analyzing video with:', { model: modelName, url: videoUrl });

    try {
      // Build contents with video file
      const contents = [
        { text: prompt },
        { fileData: { fileUri: videoUrl } },
      ];

      const response = await this.ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          temperature: config?.temperature ?? 0.7,
          maxOutputTokens: config?.maxTokens ?? 8192,
        },
      });

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
      throw new Error(`Gemini video analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
