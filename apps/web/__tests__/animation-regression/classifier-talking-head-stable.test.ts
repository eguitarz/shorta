/**
 * Regression guard for the video classifier's format enum.
 *
 * The existing `VideoClassification.format` accepts 4 values:
 *   'talking_head' | 'gameplay' | 'demo' | 'other'
 *
 * The animation PR adds 'ai_animation' to this union. When it does, this test
 * will FAIL — forcing the implementer to consciously extend it rather than
 * silently breaking downstream code that narrows on the existing 4 values.
 *
 * The test also verifies the parsing behavior on a known talking_head response
 * shape from Gemini (stored as a fixture, not a live call).
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import type { VideoClassification } from '../../lib/llm/types';

describe('classifier: talking_head regression', () => {
	it('VideoClassification.format accepts talking_head', () => {
		const sample: VideoClassification = {
			format: 'talking_head',
			confidence: 0.95,
			evidence: ['Speaker visible at frame 1', 'Direct-to-camera address'],
			fallback: { format: 'other', confidence: 0.1 },
		};

		expect(sample.format).toBe('talking_head');
	});

	it('VideoClassification.format accepts all existing non-animation values', () => {
		const formats: VideoClassification['format'][] = ['talking_head', 'gameplay', 'demo', 'other'];

		expect(formats).toHaveLength(4);
		for (const f of formats) {
			const sample: VideoClassification = {
				format: f,
				confidence: 0.9,
				evidence: [],
				fallback: { format: 'other', confidence: 0 },
			};
			expect(sample.format).toBe(f);
		}
	});

	// Snapshot: if someone adds 'ai_animation' without updating this list, the
	// runtime length check below will still pass (it's a union, no iteration at
	// runtime). But the TYPE-LEVEL guard here will fail to compile.
	it('[TYPE GUARD] format union has NOT yet been extended (fails once ai_animation is added)', () => {
		type CurrentFormats = VideoClassification['format'];
		type Expected = 'talking_head' | 'gameplay' | 'demo' | 'other';

		// These type-level assertions fail the build the moment the union is widened
		// in either direction. When the animation PR adds 'ai_animation', update
		// both `Expected` above AND the array in the previous test — that's the
		// conscious-extension checkpoint this regression is designed to force.
		expectTypeOf<CurrentFormats>().toEqualTypeOf<Expected>();
	});

	it('parses a well-formed talking_head Gemini classification payload', () => {
		// Realistic fixture matching the JSON Gemini returns for /api/classify-video
		const payload = JSON.stringify({
			format: 'talking_head',
			confidence: 0.93,
			evidence: [
				'Single person visible throughout',
				'Direct eye contact with camera',
				'No gameplay, UI, or product visible',
			],
			fallback: { format: 'other', confidence: 0.07 },
		});

		const parsed: VideoClassification = JSON.parse(payload);

		expect(parsed.format).toBe('talking_head');
		expect(parsed.confidence).toBeGreaterThan(0.5);
		expect(parsed.evidence.length).toBeGreaterThan(0);
		expect(parsed.fallback.format).toBe('other');
	});
});
