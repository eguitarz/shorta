import { describe, it, expect } from 'vitest';
import {
	buildBeatsPrompt,
	computeBeatTimings,
	type BeatIntent,
} from '../../lib/animation/beat-prompt';
import type { AnimationMeta } from '../../lib/types/beat';

const META: AnimationMeta = {
	logline: 'A tired cat discovers the vacuum is actually its friend',
	tone: 'heartwarming',
	styleAnchor: 'Pixar-ish 3D with soft lighting',
	sceneAnchor: 'A sunny suburban living room',
	arcTemplate: 'setup_twist_payoff',
	payoff: 'The cat curls up on the vacuum like a bed',
	characters: [
		{
			id: 'char_1',
			name: 'Whiskers',
			traits: ['orange tabby', 'grumpy face', 'tired eyes'],
			personality: 'Exhausted but secretly curious',
			sheetPrompt:
				'An orange tabby cat with grumpy face and tired eyes. Distinctive notched left ear. Pixar-ish 3D rendering.',
		},
	],
};

const INTENTS: BeatIntent[] = [
	{ beatIndex: 1, narrativeRole: 'setup', intent: 'The cat naps on the couch, oblivious.' },
	{ beatIndex: 2, narrativeRole: 'twist', intent: 'The vacuum turns on; the cat startles.' },
	{ beatIndex: 3, narrativeRole: 'payoff', intent: 'The cat tests the vacuum, finds it warm, curls up.' },
	{ beatIndex: 4, narrativeRole: 'button', intent: 'Gentle purring fades to black.' },
];

describe('computeBeatTimings', () => {
	it('divides total length evenly and rounds start/end to 1 decimal', () => {
		const t = computeBeatTimings(4, 30);
		expect(t).toHaveLength(4);
		expect(t[0]).toEqual({ beatIndex: 1, startTime: 0, endTime: 7.5 });
		expect(t[3].endTime).toBe(30); // last beat pins to totalLengthSeconds exactly
	});

	it('handles uneven division without drifting past totalLengthSeconds', () => {
		const t = computeBeatTimings(3, 10);
		expect(t[t.length - 1].endTime).toBe(10);
	});

	it('throws on invalid inputs', () => {
		expect(() => computeBeatTimings(0, 10)).toThrow();
		expect(() => computeBeatTimings(3, 0)).toThrow();
		expect(() => computeBeatTimings(3, -1)).toThrow();
	});
});

describe('buildBeatsPrompt', () => {
	it('throws when beatIntents is empty', () => {
		expect(() =>
			buildBeatsPrompt({ meta: META, beatIntents: [], totalLengthSeconds: 30 })
		).toThrow(/empty/);
	});

	it('injects character sheetPrompt VERBATIM (identity lock)', () => {
		const p = buildBeatsPrompt({ meta: META, beatIntents: INTENTS, totalLengthSeconds: 30 });
		// The full sheet text must appear in the prompt so the LLM has the
		// identity payload when producing beat actions.
		expect(p).toContain('notched left ear');
		expect(p).toContain('Pixar-ish 3D rendering');
	});

	it('embeds meta context (logline, tone, style, setting, payoff)', () => {
		const p = buildBeatsPrompt({ meta: META, beatIntents: INTENTS, totalLengthSeconds: 30 });
		expect(p).toContain(META.logline);
		expect(p).toContain(META.tone);
		expect(p).toContain(META.styleAnchor);
		expect(p).toContain(META.sceneAnchor);
		expect(p).toContain(META.payoff);
	});

	it('enumerates beat intents with narrative role and timings', () => {
		const p = buildBeatsPrompt({ meta: META, beatIntents: INTENTS, totalLengthSeconds: 30 });
		expect(p).toMatch(/Beat 1 \[setup\]/);
		expect(p).toMatch(/Beat 2 \[twist\]/);
		expect(p).toMatch(/Beat 3 \[payoff\]/);
		expect(p).toContain('The cat tests the vacuum');
	});

	it('requests strict JSON with the expected shot-level fields', () => {
		const p = buildBeatsPrompt({ meta: META, beatIntents: INTENTS, totalLengthSeconds: 30 });
		for (const field of [
			'"beats"',
			'"beatNumber"',
			'"characterRefs"',
			'"characterAction"',
			'"cameraAction"',
			'"sceneSnippet"',
			'"dialogue"',
			'"script"',
			'"visual"',
			'"audio"',
			'"directorNotes"',
			'"shotType"',
			'"cameraMovement"',
			'"transition"',
		]) {
			expect(p).toContain(field);
		}
		expect(p).toContain('Return ONLY the JSON');
	});

	it('requires the payoff to land in the payoff beat', () => {
		const p = buildBeatsPrompt({ meta: META, beatIntents: INTENTS, totalLengthSeconds: 30 });
		expect(p).toMatch(/LAND the payoff/);
		expect(p).toContain(META.payoff);
	});

	it('uses CUSTOM ARC directive when arcTemplate is custom', () => {
		const customMeta: AnimationMeta = {
			...META,
			arcTemplate: 'custom',
			arcCustomDescription: 'Two-act structure with a hidden flashback',
		};
		const p = buildBeatsPrompt({ meta: customMeta, beatIntents: INTENTS, totalLengthSeconds: 30 });
		expect(p).toContain('CUSTOM ARC');
		expect(p).toContain('Two-act structure with a hidden flashback');
	});

	it('handles characters without sheetPrompt gracefully (fallback language)', () => {
		const noSheetMeta: AnimationMeta = {
			...META,
			characters: [{ ...META.characters[0], sheetPrompt: undefined }],
		};
		const p = buildBeatsPrompt({
			meta: noSheetMeta,
			beatIntents: INTENTS,
			totalLengthSeconds: 30,
		});
		expect(p).toMatch(/no sheet description|Pass 1 did not populate/);
	});

	it('adds locale instruction for non-en locales', () => {
		const p = buildBeatsPrompt({
			meta: META,
			beatIntents: INTENTS,
			totalLengthSeconds: 30,
			locale: 'zh-TW',
		});
		expect(p).toMatch(/Write ALL user-facing text/);
	});

	it('enforces visual identity language to prevent style drift', () => {
		const p = buildBeatsPrompt({ meta: META, beatIntents: INTENTS, totalLengthSeconds: 30 });
		expect(p).toMatch(/SAME.*world|style identity|not drift between styles/i);
	});
});
