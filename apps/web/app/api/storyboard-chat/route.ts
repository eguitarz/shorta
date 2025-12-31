import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ExtractedData {
  topic: string;
  format: string;
  targetLength: number;
  keyPoints: string[];
  targetAudience?: string;
  contentType?: string;
}

interface ChatResponse {
  message: string;
  isReady: boolean;
  extractedData?: ExtractedData;
}

const SYSTEM_PROMPT = `You are a helpful AI assistant helping users create video storyboards.

Your goal: Extract the following information through natural conversation:
- Topic/title (what the video is about)
- Format (talking_head, b_roll, vlog, tutorial)
- Target length (15, 30, 60, or 90 seconds)
- Key points (3-5 main ideas to cover)

Guidelines:
1. Be conversational and friendly
2. Ask 1-2 questions at a time, not all at once
3. If user provides everything upfront, confirm details
4. If user is vague, ask specific follow-up questions
5. When you have all required info, say "Ready to generate!" and show a summary

Example conversation:
User: "I want to make a video about sales mistakes"
You: "Great topic! To create the perfect storyboard, I need a few details:
• What format works best? (talking head, b-roll, demo)
• How long should it be? (15s, 30s, 60s, 90s)
• What specific mistakes do you want to cover?"

Keep responses natural and conversational. Don't return JSON.`;

async function extractDataFromConversation(
  client: any,
  messages: Message[],
  latestResponse: string
): Promise<ExtractedData> {
  // Use LLM to extract structured data from conversation
  const extractionPrompt = `You are a data extraction agent. Read the conversation below and extract video storyboard information.

CONVERSATION:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
assistant: ${latestResponse}

Extract the following information:
- topic: The main topic/title of the video (empty string if not mentioned)
- format: One of "talking_head", "b_roll", "vlog", "tutorial" (empty string if not mentioned)
- targetLength: Video length in seconds - use 15, 30, 60, or 90 (0 if not mentioned)
- keyPoints: Array of main points to cover (empty array if not mentioned)
- targetAudience: Who the video is for (omit if not mentioned)
- contentType: One of "educational", "entertaining", "inspirational" (default to "educational")

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "topic": "string or empty",
  "format": "talking_head|b_roll|vlog|tutorial or empty",
  "targetLength": 15|30|60|90|0,
  "keyPoints": ["point1", "point2"] or [],
  "targetAudience": "string",
  "contentType": "educational|entertaining|inspirational"
}`;

  try {
    const extractionResponse = await client.chat([
      { role: 'user', content: extractionPrompt }
    ], {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.1,
      maxTokens: 512,
    });

    // Parse JSON response
    let jsonContent = extractionResponse.content.trim();

    // Remove markdown code blocks if present
    if (jsonContent.includes('```')) {
      const match = jsonContent.match(/```(?:json)?\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/);
      if (match) {
        jsonContent = match[1];
      } else {
        jsonContent = jsonContent.replace(/```json/g, '').replace(/```/g, '').trim();
      }
    }

    const extracted = JSON.parse(jsonContent);
    console.log('Extracted via LLM:', extracted);

    return extracted;
  } catch (error) {
    console.error('Extraction error:', error);
    // Return empty data if extraction fails
    return {
      topic: '',
      format: '',
      targetLength: 0,
      keyPoints: [],
      contentType: 'educational',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Build conversation with system prompt
    const conversation = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages,
    ];

    console.log('Storyboard chat - message count:', messages.length);

    const response = await client.chat(conversation, {
      model: 'gemini-3-flash-preview',
      temperature: 0.7,
      maxTokens: 1024,
    });

    console.log('AI response:', response.content);

    // Extract data from conversation history + new response using LLM agent
    const extractedData = await extractDataFromConversation(client, messages, response.content);

    console.log('Extracted data:', JSON.stringify(extractedData, null, 2));

    // Check if we have minimum required data
    const hasRequiredData = !!(
      extractedData.topic &&
      extractedData.format &&
      extractedData.targetLength > 0 &&
      extractedData.keyPoints &&
      extractedData.keyPoints.length >= 1
    );

    console.log('Has required data check:', {
      topic: !!extractedData.topic,
      format: !!extractedData.format,
      targetLength: extractedData.targetLength > 0,
      keyPoints: extractedData.keyPoints?.length || 0,
      isReady: hasRequiredData
    });

    const chatResponse: ChatResponse = {
      message: response.content,
      isReady: hasRequiredData,
      extractedData: hasRequiredData ? extractedData : extractedData, // Always send extractedData for debugging
    };

    console.log('Is ready:', hasRequiredData);

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('Storyboard chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
