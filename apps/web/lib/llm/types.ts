export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Edge-compatible: env passed as parameter
export interface LLMEnv {
  GEMINI_API_KEY?: string;
  LLM_MODEL?: string;
}

export interface VideoClassification {
  format: 'talking_head' | 'gameplay' | 'other';
  confidence: number;
  evidence: string[];
  fallback: {
    format: 'talking_head' | 'gameplay' | 'other';
    confidence: number;
  };
}

export interface MetadataSuggestions {
  titles: string[];
  description: string;
}

export interface CachedContent {
  name: string;
  model: string;
  createTime: string;
  updateTime: string;
  expireTime: string;
}

export interface LLMClient {
  chat(messages: Message[], config?: LLMConfig): Promise<LLMResponse>;
  stream(messages: Message[], config?: LLMConfig): AsyncIterable<string>;
  analyzeVideo?(videoUrl: string, prompt: string, config?: LLMConfig): Promise<LLMResponse>;
  classifyVideo?(videoUrl: string, config?: LLMConfig): Promise<VideoClassification>;
}
