import type { HookCategory } from '../scoring/hook-types';
import { HOOK_TYPE_DESCRIPTIONS } from '../scoring/hook-types';
import type { RehookPreset, VideoContext } from './types';

/**
 * Style-specific instructions for each preset
 */
const PRESET_INSTRUCTIONS: Record<RehookPreset, string> = {
  emotional: `Rewrite the hook to emphasize PAIN POINTS, URGENCY, and EMOTIONAL TRIGGERS.
- Tap into fears, frustrations, or desires
- Use words that evoke strong feelings
- Create a sense of urgency or importance
- Make it feel personal and relatable`,

  specific: `Rewrite the hook to include CONCRETE NUMBERS, DATA, and SPECIFICITY.
- Add specific numbers, percentages, or timeframes
- Use precise metrics or results
- Replace vague claims with measurable outcomes
- Ground abstract concepts in tangible details`,

  shorter: `Rewrite the hook to be SHORTER and PUNCHIER.
- Cut all filler words and unnecessary phrases
- Hit hard immediately with the core message
- Maximum 10-12 words
- Front-load the most impactful word`,

  question: `Rewrite the hook as a QUESTION that voices the viewer's inner doubt or curiosity.
- Frame it as something they've wondered about
- Create a curiosity gap that demands an answer
- Make them feel understood
- Use "you" to make it direct and personal`,
};

/**
 * Builds the prompt for re-hook generation
 */
export function buildRehookPrompt(
  originalHook: string,
  style: RehookPreset | 'custom',
  hookType: HookCategory | undefined,
  context: VideoContext
): string {
  let styleInstruction: string;

  if (style === 'custom' && hookType) {
    const description = HOOK_TYPE_DESCRIPTIONS[hookType] || hookType;
    styleInstruction = `Rewrite the hook using the "${hookType}" style.
This hook type: ${description}

Apply this pattern while maintaining the core message of the original hook.`;
  } else if (style !== 'custom') {
    styleInstruction = PRESET_INSTRUCTIONS[style];
  } else {
    throw new Error('Custom style requires a hookType');
  }

  return `You are an expert YouTube Shorts hook writer. Your task is to rewrite a video hook in a new style.

ORIGINAL HOOK:
"${originalHook}"

VIDEO CONTEXT:
- Niche: ${context.nicheCategory}
- Content Type: ${context.contentType}
- Target Audience: ${context.targetAudience}
- Current Hook Type: ${context.currentHookType}

YOUR TASK:
${styleInstruction}

REQUIREMENTS:
1. Keep the core message/topic of the original hook
2. Make it feel natural to say out loud
3. Optimize for the first 2 seconds of attention
4. Match the style instruction precisely

Return ONLY valid JSON in this exact format:
{
  "text": "The rewritten hook text (what the creator would say)",
  "explanation": "Brief explanation of why this version works (1-2 sentences)",
  "style": "${style === 'custom' ? hookType : style}"
}`;
}
