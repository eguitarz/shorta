/**
 * Nano-banana image prompt for a single character sheet.
 *
 * Generates a neutral-pose portrait that the beat-image pipeline then uses as
 * a `referenceImage` for every beat the character appears in. Prompt aims at
 * IDENTITY, not storytelling — no scene, no action, no props beyond what
 * defines the character.
 *
 * Output image is 9:16 (matches the existing NanaBananaClient default) to
 * keep aspect consistency with the beat images that use it as reference.
 */

import type { AnimationCharacter, AnimationMeta } from '@/lib/types/beat';

/**
 * Build the image prompt for a character sheet. The character's `sheetPrompt`
 * (produced by Pass 1) is the core identity description; this function wraps
 * it with framing + quality controls + style anchor.
 */
export function buildCharacterSheetImagePrompt(
	character: Pick<AnimationCharacter, 'name' | 'sheetPrompt'>,
	meta: Pick<AnimationMeta, 'styleAnchor'>
): string {
	if (!character.sheetPrompt) {
		throw new Error(
			`buildCharacterSheetImagePrompt: character '${character.name}' has no sheetPrompt. ` +
				`Run Pass 1 first.`
		);
	}

	return `Generate a character reference sheet portrait.

CHARACTER: ${character.name}
${character.sheetPrompt}

VISUAL STYLE (apply exactly):
${meta.styleAnchor}

COMPOSITION:
- Single character, centered, 3/4 view or front-facing.
- Neutral pose. Neutral expression. Arms relaxed.
- Plain, uncluttered background (solid color or simple gradient appropriate to the style).
- Full upper body visible (head to mid-torso). NOT a head-only crop.
- 9:16 vertical frame.

QUALITY RULES:
- NO text, NO labels, NO watermarks, NO written words of any kind.
- NO multiple angles in one image (this is one portrait, not a multi-view sheet).
- NO scene props, background objects, or other characters.
- The character's face, hair, build, and clothing MUST be render-consistent enough that a downstream image model can reproduce the same identity in other scenes using this image as reference.`.trim();
}
