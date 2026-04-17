import { describe, it, expect } from 'vitest';
import { renderExportPrompt } from '../../lib/animation/render-export';
import type { AnimationMeta, AnimationBeat } from '../../lib/types/beat';

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
			sheetPrompt: 'Orange tabby cat with grumpy face, tired eyes, notched left ear.',
		},
	],
};

const BEAT: AnimationBeat = {
	beatNumber: 3,
	startTime: 15,
	endTime: 22.5,
	type: 'payoff',
	title: 'The vacuum becomes a bed',
	directorNotes: '• Slow the pacing',
	script: 'Whiskers tests the vacuum cautiously, then lies down.',
	visual: '• MCU on cat',
	audio: '• Gentle ambient',
	shotType: 'MCU',
	cameraMovement: 'static',
	narrativeRole: 'payoff',
	characterRefs: ['char_1'],
	characterAction: 'Whiskers pads over to the humming vacuum, sniffs it, then curls up on top.',
	cameraAction: 'Medium close-up, slow dolly in.',
	sceneSnippet: 'The vacuum rests in a patch of afternoon sun on the living room rug.',
	dialogue: undefined,
};

describe('renderExportPrompt (universal)', () => {
	it('produces a multi-section prompt with Camera/Subject/Action/Scene/Style', () => {
		const out = renderExportPrompt({ meta: META, beat: BEAT });

		expect(out).toMatch(/^Camera:/m);
		expect(out).toMatch(/Subject:/);
		expect(out).toMatch(/Action:/);
		expect(out).toMatch(/Scene:/);
		expect(out).toMatch(/Style:/);
	});

	it('uses cameraAction verbatim when provided', () => {
		const out = renderExportPrompt({ meta: META, beat: BEAT });
		expect(out).toContain('Medium close-up, slow dolly in.');
	});

	it('falls back to shotType + cameraMovement when cameraAction is missing', () => {
		const beatNoCamera: AnimationBeat = { ...BEAT, cameraAction: undefined };
		const out = renderExportPrompt({ meta: META, beat: beatNoCamera });
		expect(out).toMatch(/Camera: MCU/);
		expect(out).toMatch(/static/);
	});

	it('injects character sheetPrompt inline with character name in Subject', () => {
		const out = renderExportPrompt({ meta: META, beat: BEAT });
		expect(out).toContain('Whiskers');
		expect(out).toContain('Orange tabby cat');
		expect(out).toContain('notched left ear');
	});

	it('falls back to traits + personality when character lacks sheetPrompt', () => {
		const metaNoSheet: AnimationMeta = {
			...META,
			characters: [{ ...META.characters[0], sheetPrompt: undefined }],
		};
		const out = renderExportPrompt({ meta: metaNoSheet, beat: BEAT });
		expect(out).toContain('Whiskers');
		expect(out).toMatch(/orange tabby|grumpy face/);
		expect(out).toContain('Exhausted but secretly curious');
	});

	it('emits an empty Subject segment when characterRefs is empty (rare beats like pure landscape)', () => {
		const noCharBeat: AnimationBeat = { ...BEAT, characterRefs: [] };
		const out = renderExportPrompt({ meta: META, beat: noCharBeat });
		expect(out).not.toMatch(/Subject:/);
	});

	it('includes sceneAnchor and sceneSnippet in Scene segment', () => {
		const out = renderExportPrompt({ meta: META, beat: BEAT });
		expect(out).toContain(META.sceneAnchor);
		expect(out).toContain(BEAT.sceneSnippet as string);
	});

	it('omits Dialogue segment when beat has no dialogue', () => {
		const out = renderExportPrompt({ meta: META, beat: BEAT });
		expect(out).not.toMatch(/Dialogue:/);
	});

	it('includes Dialogue in double quotes when beat speaks', () => {
		const speakingBeat: AnimationBeat = { ...BEAT, dialogue: "I guess you're not so bad." };
		const out = renderExportPrompt({ meta: META, beat: speakingBeat });
		expect(out).toMatch(/Dialogue: "I guess you're not so bad\."/);
	});

	it('sanitizes smart quotes, backticks, and trailing whitespace', () => {
		const dirtyMeta: AnimationMeta = {
			...META,
			styleAnchor: '\u201cfancy\u201d style with `backticks`   ',
			characters: [
				{
					...META.characters[0],
					sheetPrompt: "Don\u2019t render text `inline`.   ",
				},
			],
		};
		const out = renderExportPrompt({ meta: dirtyMeta, beat: BEAT });

		expect(out).not.toContain('\u201c');
		expect(out).not.toContain('\u201d');
		expect(out).not.toContain('\u2019');
		expect(out).not.toContain('`');
		expect(out).toContain('"fancy" style');
		expect(out).toContain("Don't render text inline.");
	});

	it('rejects unsupported platforms (v1 is universal only)', () => {
		expect(() =>
			renderExportPrompt({ meta: META, beat: BEAT, platform: 'veo' as any })
		).toThrow(/not yet supported/);
	});

	it('uses script as Action fallback when characterAction is missing', () => {
		const beatNoAction: AnimationBeat = { ...BEAT, characterAction: undefined };
		const out = renderExportPrompt({ meta: META, beat: beatNoAction });
		expect(out).toMatch(/Action:.*Whiskers tests the vacuum cautiously/);
	});

	it('output is copy-paste-safe (no markdown fences, no code blocks)', () => {
		const out = renderExportPrompt({ meta: META, beat: BEAT });
		expect(out).not.toMatch(/```/);
		expect(out).not.toMatch(/^#+ /m);
	});
});
