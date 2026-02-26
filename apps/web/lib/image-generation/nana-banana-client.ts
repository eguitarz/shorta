import { GoogleGenAI } from '@google/genai';
import type { GeneratedImageData, ReferenceImage } from './types';

const IMAGE_MODEL = 'gemini-2.5-flash-image';

export class NanaBananaClient {
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required for image generation');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateImage(
    prompt: string,
    referenceImage?: ReferenceImage
  ): Promise<GeneratedImageData> {
    return this.generateImageWithRetry(prompt, referenceImage, 2);
  }

  private async generateImageWithRetry(
    prompt: string,
    referenceImage: ReferenceImage | undefined,
    maxRetries: number
  ): Promise<GeneratedImageData> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Build contents: text prompt + optional reference image
        const parts: any[] = [{ text: prompt }];

        if (referenceImage) {
          parts.push({
            inlineData: {
              mimeType: referenceImage.mimeType,
              data: referenceImage.data,
            },
          });
        }

        const response = await this.ai.models.generateContent({
          model: IMAGE_MODEL,
          contents: [{ role: 'user', parts }],
          config: {
            responseModalities: ['TEXT', 'IMAGE'] as any,
            imageConfig: {
              aspectRatio: '9:16',
            },
          } as any,
        });

        const candidates = (response as any).candidates;
        if (!candidates?.length) {
          throw new Error('No candidates in image response');
        }

        const responseParts = candidates[0]?.content?.parts;
        if (!responseParts?.length) {
          throw new Error('No parts in image response');
        }

        const imagePart = responseParts.find((p: any) => p.inlineData);
        if (!imagePart?.inlineData) {
          throw new Error('No image data in response');
        }

        return {
          base64: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType || 'image/png',
        };
      } catch (error) {
        if (attempt === maxRetries) throw error;
        // Exponential backoff: 1s, 2s
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    throw new Error('Unreachable');
  }
}
