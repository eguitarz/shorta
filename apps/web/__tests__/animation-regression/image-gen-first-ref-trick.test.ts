/**
 * Regression guard for the image-gen "first image as reference" trick.
 *
 * The existing /api/storyboard-images/generate route generates images
 * sequentially: the first generated image becomes the `referenceImage` for
 * beats 2+, which enforces character/style consistency. This test locks in
 * the prompt-builder behavior the trick depends on:
 *
 *   - buildCharacterContext detects subjects from beat content
 *   - buildStyleContext produces a style anchor string
 *   - buildImagePrompt wires both + beat details into a Gemini prompt
 *   - A `hasReferenceImage: true` flag injects the reference-image clause
 *
 * The animation PR adds explicit char-sheet references and an animation
 * content-type style. It must not break any of the above for non-animation
 * callers.
 */

import { describe, it, expect } from 'vitest';
import {
	buildCharacterContext,
	buildStyleContext,
	buildImagePrompt,
} from '../../lib/image-generation/prompt-builder';
import type { StoryboardOverviewForImage, BeatForImage } from '../../lib/image-generation/types';

const TALKING_HEAD_OVERVIEW: StoryboardOverviewForImage = {
	title: 'Budget grocery tips',
	contentType: 'talking_head',
	nicheCategory: 'Finance',
	targetAudience: 'US adults 25-45',
};

const BEATS: BeatForImage[] = [
	{
		beatNumber: 1,
		title: 'Hook',
		type: 'hook',
		visual: 'Close-up on speaker talking to camera',
		script: 'You are overspending on groceries.',
		directorNotes: '• High energy',
		shotType: 'CU',
		cameraMovement: 'static',
	},
	{
		beatNumber: 2,
		title: 'Tip 1',
		type: 'main_content',
		visual: 'MCU with b-roll',
		script: 'Stop shopping when hungry.',
		directorNotes: '• Slow the pace',
		shotType: 'MCU',
		cameraMovement: 'pan',
	},
];

describe('image-gen: first-image-as-reference trick (talking_head regression)', () => {
	it('buildCharacterContext detects a PERSON subject from talking_head contentType', () => {
		const ctx = buildCharacterContext(TALKING_HEAD_OVERVIEW, BEATS);

		expect(ctx).toMatch(/SAME single person/i);
		expect(ctx).toContain('Maintain identical face structure');
	});

	it('buildCharacterContext injects cross-beat consistency rules', () => {
		const ctx = buildCharacterContext(TALKING_HEAD_OVERVIEW, BEATS);

		// These phrases encode the consistency contract that the reference-image
		// trick depends on. The animation PR must not weaken them.
		expect(ctx).toMatch(/SAME video/);
		expect(ctx).toMatch(/Do NOT change the appearance/);
	});

	it('buildStyleContext emits the talking_head style anchor', () => {
		const style = buildStyleContext(TALKING_HEAD_OVERVIEW);

		expect(style).toContain('Single person speaking directly to camera');
		expect(style).toContain('Finance');
		// No text / no UI — prevents text rendering in output images
		expect(style).toMatch(/DO NOT include any text/);
		expect(style).toMatch(/DO NOT render any written words/);
	});

	it('buildImagePrompt includes the style block, character block, and beat-specific details', () => {
		const styleContext = buildStyleContext(TALKING_HEAD_OVERVIEW);
		const characterContext = buildCharacterContext(TALKING_HEAD_OVERVIEW, BEATS);
		const prompt = buildImagePrompt(TALKING_HEAD_OVERVIEW, BEATS[0], {
			styleContext,
			characterContext,
			hasReferenceImage: false,
		});

		expect(prompt).toContain('SCENE DETAILS');
		expect(prompt).toContain('Hook');
		expect(prompt).toContain(BEATS[0].visual);
		expect(prompt).toContain('Close-up shot'); // CU framing line
		expect(prompt).toContain(styleContext);
		expect(prompt).toContain(characterContext);
	});

	it('buildImagePrompt adds a REFERENCE IMAGE clause when hasReferenceImage is true', () => {
		const styleContext = buildStyleContext(TALKING_HEAD_OVERVIEW);
		const characterContext = buildCharacterContext(TALKING_HEAD_OVERVIEW, BEATS);

		const promptNoRef = buildImagePrompt(TALKING_HEAD_OVERVIEW, BEATS[1], {
			styleContext,
			characterContext,
			hasReferenceImage: false,
		});
		const promptWithRef = buildImagePrompt(TALKING_HEAD_OVERVIEW, BEATS[1], {
			styleContext,
			characterContext,
			hasReferenceImage: true,
		});

		expect(promptNoRef).not.toMatch(/REFERENCE IMAGE/);
		expect(promptWithRef).toMatch(/REFERENCE IMAGE/);
		// The reference image is what carries character identity forward from
		// beat 1 → beat N. The text below must demand visual match, not just
		// aesthetic match.
		expect(promptWithRef).toMatch(/MUST appear identical|same face/i);
	});

	it('omits camera movement phrase when movement is static (noise reduction)', () => {
		const prompt = buildImagePrompt(TALKING_HEAD_OVERVIEW, BEATS[0], {
			hasReferenceImage: false,
		});
		// Beat 1 has cameraMovement='static'
		expect(prompt).not.toMatch(/Camera movement suggests: static/i);
	});
});
