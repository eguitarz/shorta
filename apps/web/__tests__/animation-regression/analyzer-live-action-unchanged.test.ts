/**
 * Regression guard for the analyzer live-action flow.
 *
 * The analyzer's `processStoryboard` is a large orchestration function that
 * hits Supabase + Gemini — not cheap to unit-test directly. Instead, this
 * test locks in the two dependencies the animation PR will modify:
 *
 *   1. `buildStyleContext` / `buildCharacterContext` must still emit sensible
 *      output when contentType is a LIVE-ACTION format (talking_head, demo,
 *      vlog, tutorial, gameplay, b_roll) — NOT 'ai_animation'.
 *   2. Regex-based subject detection in buildCharacterContext must still fire
 *      for live-action content so the consistency prompts are injected.
 *
 * When the animation PR adds an 'ai_animation' branch to these builders, the
 * existing contentType mapping must remain untouched for all live-action
 * formats. This test encodes that contract.
 */

import { describe, it, expect } from 'vitest';
import {
	buildStyleContext,
	buildCharacterContext,
} from '../../lib/image-generation/prompt-builder';
import type { StoryboardOverviewForImage, BeatForImage } from '../../lib/image-generation/types';

const LIVE_ACTION_FORMATS = [
	'talking_head',
	'demo',
	'b_roll',
	'vlog',
	'tutorial',
	'gameplay',
] as const;

function makeOverview(contentType: string): StoryboardOverviewForImage {
	return {
		title: 'Test video',
		contentType,
		nicheCategory: 'Tech',
		targetAudience: 'General',
	};
}

const NEUTRAL_BEATS: BeatForImage[] = [
	{
		beatNumber: 1,
		title: 'Opener',
		type: 'hook',
		visual: 'On-screen action',
		script: 'Something happens here.',
		directorNotes: '• note 1',
	},
];

describe('analyzer: live-action flow unchanged', () => {
	for (const format of LIVE_ACTION_FORMATS) {
		it(`buildStyleContext produces non-empty output for ${format}`, () => {
			const style = buildStyleContext(makeOverview(format));

			expect(style.length).toBeGreaterThan(50);
			expect(style).toContain('Tech'); // niche passes through
			// Universal rule: no text in generated images
			expect(style).toMatch(/DO NOT include any text/);
		});

		it(`buildCharacterContext works for ${format} without crashing`, () => {
			// Must handle any live-action contentType without throwing, even if
			// the beat content doesn't match any subject keywords.
			expect(() => buildCharacterContext(makeOverview(format), NEUTRAL_BEATS)).not.toThrow();
			const ctx = buildCharacterContext(makeOverview(format), NEUTRAL_BEATS);
			expect(ctx).toContain('SUBJECT CONSISTENCY');
		});
	}

	it('buildStyleContext falls back to talking_head style for unknown contentType', () => {
		// This fallback is how the system degrades gracefully when a new format
		// is added without a matching style entry. The animation PR must preserve
		// this fallback so legacy data (contentType='ai_animation' rendered before
		// the new entry ships) doesn't render as an empty string.
		const style = buildStyleContext(makeOverview('some_unknown_format'));

		expect(style).toContain('Single person speaking directly to camera');
	});

	it('buildCharacterContext fires PERSON block for talking_head even with no keyword matches', () => {
		const beatsWithoutPersonKeywords: BeatForImage[] = [
			{
				beatNumber: 1,
				title: 'Abstract',
				type: 'hook',
				visual: 'Abstract visual',
				script: 'Data points matter.',
				directorNotes: 'notes',
			},
		];

		const ctx = buildCharacterContext(makeOverview('talking_head'), beatsWithoutPersonKeywords);

		// The `['talking_head', 'vlog', 'tutorial'].includes(contentType)` short
		// circuit must keep firing the PERSON block — this is what keeps the
		// speaker's face consistent across beats.
		expect(ctx).toMatch(/SAME single person/i);
	});

	it('buildCharacterContext fires ANIMAL block when beat content mentions pets', () => {
		const animalBeats: BeatForImage[] = [
			{
				beatNumber: 1,
				title: 'Pet intro',
				type: 'hook',
				visual: 'My dog greets the camera',
				script: 'Meet my puppy Luna.',
				directorNotes: '',
			},
		];

		const ctx = buildCharacterContext(makeOverview('b_roll'), animalBeats);

		expect(ctx).toMatch(/SAME animal|ANIMAL\/PET/i);
	});
});
