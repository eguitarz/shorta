import { GeminiClient } from './gemini-client';
import type { LLMEnv, LLMClient } from './types';

export type LLMProvider = 'gemini';
// Future: 'gemini' | 'openrouter' | 'openai' | 'anthropic'

export function createLLMClient(env: LLMEnv, provider: LLMProvider = 'gemini'): LLMClient {
  switch (provider) {
    case 'gemini':
      if (!env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is required for Gemini provider');
      }
      return new GeminiClient(env.GEMINI_API_KEY);

    // Future providers can be added here:
    // case 'openrouter':
    //   return new OpenRouterClient(env.OPENROUTER_API_KEY);

    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

// Convenience function using environment variable to determine provider
export function createDefaultLLMClient(env: LLMEnv): LLMClient {
  const provider = 'gemini'; // For now, always use Gemini
  return createLLMClient(env, provider);
}
