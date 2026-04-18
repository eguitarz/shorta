import { describe, it, expect } from 'vitest';
import { parsePass1Output } from '../../lib/animation/process-story';
import { parsePass2Output } from '../../lib/animation/process-beats';
import type { NarrativeRole } from '../../lib/types/beat';

const ALLOWED_ROLES: NarrativeRole[] = [
	'setup',
	'inciting',
	'escalation',
	'twist',
	'payoff',
	'button',
];

describe('parsePass1Output', () => {
	const EXPECTED = {
		characterIds: ['char_1'],
		beatCount: 3,
		allowedRoles: ALLOWED_ROLES,
	};

	it('parses a valid Pass 1 response', () => {
		const raw = {
			characters: [{ id: 'char_1', sheetPrompt: 'Orange cat, tired eyes.' }],
			beatIntents: [
				{ beatIndex: 1, narrativeRole: 'setup', intent: 'Cat naps.' },
				{ beatIndex: 2, narrativeRole: 'twist', intent: 'Vacuum turns on.' },
				{ beatIndex: 3, narrativeRole: 'payoff', intent: 'Cat befriends vacuum.' },
			],
		};

		const out = parsePass1Output(raw, EXPECTED);
		expect(out.characters).toHaveLength(1);
		expect(out.characters[0].id).toBe('char_1');
		expect(out.characters[0].sheetPrompt).toBe('Orange cat, tired eyes.');
		expect(out.beatIntents).toHaveLength(3);
		expect(out.beatIntents[0].narrativeRole).toBe('setup');
	});

	it('throws when output is not an object', () => {
		expect(() => parsePass1Output(null, EXPECTED)).toThrow(/not an object/);
		expect(() => parsePass1Output('nope', EXPECTED)).toThrow(/not an object/);
	});

	it('throws when characters[] is missing', () => {
		expect(() => parsePass1Output({ beatIntents: [] }, EXPECTED)).toThrow(/characters/);
	});

	it('throws when beatIntents[] is missing', () => {
		expect(() => parsePass1Output({ characters: [] }, EXPECTED)).toThrow(/beatIntents/);
	});

	it('throws when not every expected character id is produced', () => {
		// Expected 2 chars (char_1, char_2), got only char_1.
		const raw = {
			characters: [{ id: 'char_1', sheetPrompt: 'A' }],
			beatIntents: [
				{ beatIndex: 1, narrativeRole: 'setup', intent: 'x' },
				{ beatIndex: 2, narrativeRole: 'twist', intent: 'x' },
				{ beatIndex: 3, narrativeRole: 'payoff', intent: 'x' },
			],
		};
		expect(() =>
			parsePass1Output(raw, { ...EXPECTED, characterIds: ['char_1', 'char_2'] })
		).toThrow(/1 character sheetPrompts; expected 2/);
	});

	it('silently filters unknown character ids (prompt robustness)', () => {
		// The LLM occasionally echoes an extra phantom character — we drop it
		// rather than failing the whole job. Valid chars still parsed.
		const raw = {
			characters: [
				{ id: 'char_1', sheetPrompt: 'Real' },
				{ id: 'char_99', sheetPrompt: 'Phantom' },
			],
			beatIntents: [
				{ beatIndex: 1, narrativeRole: 'setup', intent: 'x' },
				{ beatIndex: 2, narrativeRole: 'twist', intent: 'x' },
				{ beatIndex: 3, narrativeRole: 'payoff', intent: 'x' },
			],
		};
		const out = parsePass1Output(raw, EXPECTED); // expects just char_1
		expect(out.characters).toHaveLength(1);
		expect(out.characters[0].id).toBe('char_1');
		expect(out.characters[0].sheetPrompt).toBe('Real');
	});

	it('sorts beatIntents by beatIndex and enforces contiguous 1..N', () => {
		const raw = {
			characters: [{ id: 'char_1', sheetPrompt: 'A' }],
			beatIntents: [
				{ beatIndex: 3, narrativeRole: 'payoff', intent: 'z' },
				{ beatIndex: 1, narrativeRole: 'setup', intent: 'x' },
				{ beatIndex: 2, narrativeRole: 'twist', intent: 'y' },
			],
		};

		const out = parsePass1Output(raw, EXPECTED);
		expect(out.beatIntents[0].beatIndex).toBe(1);
		expect(out.beatIntents[1].beatIndex).toBe(2);
		expect(out.beatIntents[2].beatIndex).toBe(3);
	});

	it('throws on gap in beatIndex', () => {
		const raw = {
			characters: [{ id: 'char_1', sheetPrompt: 'A' }],
			beatIntents: [
				{ beatIndex: 1, narrativeRole: 'setup', intent: 'x' },
				{ beatIndex: 3, narrativeRole: 'payoff', intent: 'z' }, // skip 2
			],
		};
		expect(() => parsePass1Output(raw, { ...EXPECTED, beatCount: 2 })).toThrow(/position 1.*beatIndex 3/);
	});

	it('filters out invalid narrativeRole values', () => {
		const raw = {
			characters: [{ id: 'char_1', sheetPrompt: 'A' }],
			beatIntents: [
				{ beatIndex: 1, narrativeRole: 'setup', intent: 'x' },
				{ beatIndex: 2, narrativeRole: 'invented_role', intent: 'bad' },
				{ beatIndex: 3, narrativeRole: 'payoff', intent: 'z' },
			],
		};
		// Only 2 valid intents → fails the count check (expected 3)
		expect(() => parsePass1Output(raw, EXPECTED)).toThrow(/2 beat intents; expected 3/);
	});
});

describe('parsePass2Output', () => {
	const EXPECTED = {
		beatCount: 2,
		validCharacterIds: ['char_1'],
	};

	const VALID_BEAT = {
		beatNumber: 1,
		startTime: 0,
		endTime: 10,
		type: 'setup',
		narrativeRole: 'setup',
		title: 'Opener',
		characterRefs: ['char_1'],
		characterAction: 'Whiskers naps on the couch.',
		cameraAction: 'Medium shot, static.',
		sceneSnippet: 'A sunny living room with dust motes.',
		dialogue: '',
		script: 'Whiskers naps.',
		visual: '• MS on cat',
		audio: '• Ambient',
		directorNotes: '• Keep it calm',
		shotType: 'MS',
		cameraMovement: 'static',
		transition: 'cut',
	};

	it('parses valid beats', () => {
		const raw = {
			beats: [
				{ ...VALID_BEAT, beatNumber: 1 },
				{ ...VALID_BEAT, beatNumber: 2, narrativeRole: 'payoff', type: 'payoff' },
			],
		};

		const out = parsePass2Output(raw, EXPECTED);
		expect(out).toHaveLength(2);
		expect(out[0].beatNumber).toBe(1);
		expect(out[0].narrativeRole).toBe('setup');
		expect(out[0].characterRefs).toEqual(['char_1']);
		expect(out[1].narrativeRole).toBe('payoff');
	});

	it('throws when output is not an object', () => {
		expect(() => parsePass2Output('nope', EXPECTED)).toThrow(/not an object/);
	});

	it('throws when beats[] is missing', () => {
		expect(() => parsePass2Output({}, EXPECTED)).toThrow(/beats/);
	});

	it('throws when beat count mismatches', () => {
		const raw = { beats: [VALID_BEAT] };
		expect(() => parsePass2Output(raw, { ...EXPECTED, beatCount: 2 })).toThrow(
			/1 beats; expected 2/
		);
	});

	it('filters out invalid character refs (unknown ids)', () => {
		const raw = {
			beats: [
				{
					...VALID_BEAT,
					characterRefs: ['char_1', 'char_99', 'hackery'],
				},
				{ ...VALID_BEAT, beatNumber: 2 },
			],
		};
		const out = parsePass2Output(raw, EXPECTED);
		expect(out[0].characterRefs).toEqual(['char_1']);
	});

	it('narrows shotType/cameraMovement/transition to valid enum values', () => {
		const raw = {
			beats: [
				{
					...VALID_BEAT,
					shotType: 'INVALID',
					cameraMovement: 'sneaky',
					transition: 'supernova',
				},
				{ ...VALID_BEAT, beatNumber: 2 },
			],
		};
		const out = parsePass2Output(raw, EXPECTED);
		// Invalid values become undefined (rather than throwing — the prompt can
		// occasionally produce out-of-enum values and we want to be forgiving)
		expect(out[0].shotType).toBeUndefined();
		expect(out[0].cameraMovement).toBeUndefined();
		expect(out[0].transition).toBeUndefined();
	});

	it('omits dialogue when blank', () => {
		const raw = {
			beats: [
				{ ...VALID_BEAT, dialogue: '' },
				{ ...VALID_BEAT, beatNumber: 2, dialogue: 'Hello there.' },
			],
		};
		const out = parsePass2Output(raw, EXPECTED);
		expect(out[0].dialogue).toBeUndefined();
		expect(out[1].dialogue).toBe('Hello there.');
	});

	it('throws on missing truly-required string fields (title)', () => {
		// title is structurally required — no sensible fallback.
		const raw = {
			beats: [
				{ ...VALID_BEAT, title: undefined },
				{ ...VALID_BEAT, beatNumber: 2 },
			],
		};
		expect(() => parsePass2Output(raw, EXPECTED)).toThrow(/title/);
	});

	it('synthesizes missing legacy fields (visual/audio/script/directorNotes) from animation fields', () => {
		// Pass 2 sometimes omits the legacy bullet fields because the richer
		// animation fields already cover them. Parser should fill in rather
		// than discarding the whole job.
		const raw = {
			beats: [
				{
					...VALID_BEAT,
					visual: undefined,
					audio: undefined,
					script: undefined,
					directorNotes: undefined,
				},
				{ ...VALID_BEAT, beatNumber: 2 },
			],
		};

		const out = parsePass2Output(raw, EXPECTED);
		expect(out).toHaveLength(2);

		// Synthesized visual should include cameraAction + sceneSnippet bullets
		expect(out[0].visual).toContain('•');
		expect(out[0].visual).toMatch(/Medium shot|MS/);
		expect(out[0].visual).toContain(VALID_BEAT.sceneSnippet);

		// Script falls back to characterAction (or dialogue/title, whichever first)
		expect(out[0].script.length).toBeGreaterThan(0);

		// Audio has a non-empty default
		expect(out[0].audio).toContain('•');

		// Director notes include narrative role + action
		expect(out[0].directorNotes).toContain('•');
		expect(out[0].directorNotes).toMatch(/setup/i);
	});

	it('prefers provided legacy fields over synthesized ones when present', () => {
		const raw = {
			beats: [
				{ ...VALID_BEAT, visual: '• Author-provided visual line' },
				{ ...VALID_BEAT, beatNumber: 2 },
			],
		};

		const out = parsePass2Output(raw, EXPECTED);
		expect(out[0].visual).toBe('• Author-provided visual line');
	});

	it('sorts beats by beatNumber', () => {
		const raw = {
			beats: [
				{ ...VALID_BEAT, beatNumber: 2, narrativeRole: 'payoff' },
				{ ...VALID_BEAT, beatNumber: 1 },
			],
		};
		const out = parsePass2Output(raw, EXPECTED);
		expect(out[0].beatNumber).toBe(1);
		expect(out[1].beatNumber).toBe(2);
	});
});
