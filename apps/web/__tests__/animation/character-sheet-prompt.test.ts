import { describe, it, expect } from 'vitest';
import { buildCharacterSheetImagePrompt } from '../../lib/animation/character-sheet-prompt';

describe('buildCharacterSheetImagePrompt', () => {
	const META = { styleAnchor: 'Pixar-ish 3D with soft lighting' };

	const CHAR_WITH_SHEET = {
		name: 'Whiskers',
		sheetPrompt:
			'An orange tabby cat with a grumpy face, tired eyes, and slightly scruffy fur. Medium build, wearing no clothing. Signature features: a small white spot on the chest and a notched left ear.',
	};

	it('throws if sheetPrompt is missing (Pass 1 must run first)', () => {
		expect(() =>
			buildCharacterSheetImagePrompt({ name: 'Whiskers', sheetPrompt: undefined }, META)
		).toThrow(/sheetPrompt/);
	});

	it('embeds the character name and sheetPrompt', () => {
		const prompt = buildCharacterSheetImagePrompt(CHAR_WITH_SHEET, META);
		expect(prompt).toContain('Whiskers');
		expect(prompt).toContain('orange tabby cat');
		expect(prompt).toContain('notched left ear');
	});

	it('embeds the style anchor exactly', () => {
		const prompt = buildCharacterSheetImagePrompt(CHAR_WITH_SHEET, META);
		expect(prompt).toContain(META.styleAnchor);
	});

	it('specifies neutral-pose composition rules', () => {
		const prompt = buildCharacterSheetImagePrompt(CHAR_WITH_SHEET, META);
		expect(prompt).toMatch(/Neutral pose/i);
		expect(prompt).toMatch(/Plain, uncluttered background/i);
		expect(prompt).toMatch(/9:16/);
	});

	it('enforces no-text / no-labels quality rules', () => {
		const prompt = buildCharacterSheetImagePrompt(CHAR_WITH_SHEET, META);
		expect(prompt).toMatch(/NO text/);
		expect(prompt).toMatch(/NO labels/);
		expect(prompt).toMatch(/NO watermarks/);
	});

	it('forbids multi-view sheets (v1 is single portrait, not grid)', () => {
		const prompt = buildCharacterSheetImagePrompt(CHAR_WITH_SHEET, META);
		expect(prompt).toMatch(/NO multiple angles/i);
	});

	it('does not include scene props or other characters', () => {
		const prompt = buildCharacterSheetImagePrompt(CHAR_WITH_SHEET, META);
		expect(prompt).toMatch(/NO scene props/i);
		expect(prompt).toMatch(/NO.*other characters/i);
	});

	it('emphasizes identity reproducibility for downstream reference use', () => {
		const prompt = buildCharacterSheetImagePrompt(CHAR_WITH_SHEET, META);
		expect(prompt).toMatch(/reference/i);
		expect(prompt).toMatch(/same identity|render-consistent|reproduce/i);
	});
});
