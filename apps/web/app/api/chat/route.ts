import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv, Message } from '@/lib/llm';
import { requireAuthWithCsrf } from '@/lib/auth-helpers';
import { ApiSchemas, validateRequestBody } from '@/lib/validation';
import { validateLLMInput, validateTopicRelevance, SHORTA_AI_REFUSAL_MESSAGE } from '@/lib/prompt-injection';
import { safeParseJSON, createErrorResponse, ErrorCode } from '@/lib/error-handler';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Require authentication and CSRF protection
  const authError = await requireAuthWithCsrf(request);
  if (authError) {
    return authError;
  }

  // Parse and validate request size
  const parseResult = await safeParseJSON(request);
  if (!parseResult.success) {
    return parseResult.error;
  }

  // Validate request schema
  const validation = validateRequestBody(ApiSchemas.chat, parseResult.data);
  if (!validation.success) {
    return validation.error;
  }

  const { messages, config } = validation.data;

  try {
    // Validate each message for prompt injection and topic relevance
    for (const message of messages) {
      if (message.role === 'user') {
        // Check topic relevance first
        const topicValidation = validateTopicRelevance(message.content);
        if (!topicValidation.isRelevant) {
          return NextResponse.json({
            content: SHORTA_AI_REFUSAL_MESSAGE,
            role: 'assistant',
          });
        }

        const llmValidation = validateLLMInput(message.content);
        if (!llmValidation.valid) {
          return NextResponse.json(
            {
              error: 'Invalid message content',
              message: llmValidation.reason,
            },
            { status: 400 }
          );
        }
        // Use sanitized content
        message.content = llmValidation.sanitized;
      }
    }

    // Create LLM client with environment variables
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Make the LLM call
    const response = await client.chat(messages as Message[], config);

    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error, ErrorCode.LLM_ERROR, 'Chat API');
  }
}
