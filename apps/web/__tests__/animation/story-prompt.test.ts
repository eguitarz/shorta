import { describe, it, expect } from 'vitest';
import {
	buildStoryPrompt,
	resolveBeatRoles,
	characterId,
} from '../../lib/animation/story-prompt';
import type { AnimationWizardSpec } from '../../lib/types/beat';

const BASE_SPEC: AnimationWizardSpec = {
	logline: 'A tired cat discovers the vacuum is actually its friend',
	tone: 'heartwarming',
	styleAnchor: 'Pixar-ish 3D with soft lighting',
	sceneAnchor: 'A sunny suburban living room',
	arcTemplate: 'setup_twist_payoff',
	payoff: 'The cat curls up on the vacuum like a bed',
	characters: [
		{
			name: 'Whiskers',
			traits: ['orange tabby', 'grumpy face', 'tired eyes'],
			personality: 'Exhausted but secretly curious',
		},
	],
};

describe('characterId', () => {
	it('returns stable id for index', () => {
		expect(characterId(0)).toBe('char_1');
		expect(characterId(1)).toBe('char_2');
	});
});

describe('resolveBeatRoles', () => {
	it('packs preset arc to beat count', () => {
		const roles = resolveBeatRoles(BASE_SPEC, 3);
		expect(roles).toHaveLength(3);
	});

	it('produces a 5-role default for custom arcs', () => {
		const custom: AnimationWizardSpec = {
			...BASE_SPEC,
			arcTemplate: 'custom',
			arcCustomDescription: 'A unique arc shape',
		};
		const roles = resolveBeatRoles(custom, 5);
		expect(roles).toHaveLength(5);
	});

	it('truncates default for custom arcs when beatCount < 5', () => {
		const custom: AnimationWizardSpec = { ...BASE_SPEC, arcTemplate: 'custom' };
		const roles = resolveBeatRoles(custom, 3);
		expect(roles).toHaveLength(3);
	});
});

describe('buildStoryPrompt', () => {
	it('embeds the logline, tone, style, setting, and payoff verbatim', () => {
		const p = buildStoryPrompt({ spec: BASE_SPEC, beatCount: 4 });

		expect(p).toContain(BASE_SPEC.logline);
		expect(p).toContain(BASE_SPEC.tone);
		expect(p).toContain(BASE_SPEC.styleAnchor);
		expect(p).toContain(BASE_SPEC.sceneAnchor);
		expect(p).toContain(BASE_SPEC.payoff);
	});

	it('lists each character with id, name, traits, and personality', () => {
		const p = buildStoryPrompt({ spec: BASE_SPEC, beatCount: 4 });

		expect(p).toContain('char_1');
		expect(p).toContain('Whiskers');
		expect(p).toContain('orange tabby');
		expect(p).toContain('Exhausted but secretly curious');
	});

	it('enumerates the role sequence (beatIndex → role)', () => {
		const p = buildStoryPrompt({ spec: BASE_SPEC, beatCount: 4 });

		expect(p).toMatch(/ROLE SEQUENCE.*1→/);
		expect(p).toContain('setup');
		expect(p).toContain('payoff');
	});

	it('uses CUSTOM ARC directive when arcTemplate is custom', () => {
		const custom: AnimationWizardSpec = {
			...BASE_SPEC,
			arcTemplate: 'custom',
			arcCustomDescription: 'Three acts with a flashback in the middle',
		};
		const p = buildStoryPrompt({ spec: custom, beatCount: 5 });

		expect(p).toContain('CUSTOM ARC');
		expect(p).toContain('Three acts with a flashback in the middle');
	});

	it('requests strict JSON with the expected shape fields', () => {
		const p = buildStoryPrompt({ spec: BASE_SPEC, beatCount: 4 });

		expect(p).toContain('"characters"');
		expect(p).toContain('"sheetPrompt"');
		expect(p).toContain('"beatIntents"');
		expect(p).toContain('"narrativeRole"');
		expect(p).toContain('"intent"');
		expect(p).toContain('Return ONLY the JSON');
	});

	it('adds locale instruction when non-en locale is provided', () => {
		const pEn = buildStoryPrompt({ spec: BASE_SPEC, beatCount: 4, locale: 'en' });
		const pKo = buildStoryPrompt({ spec: BASE_SPEC, beatCount: 4, locale: 'ko' });

		expect(pEn).not.toMatch(/Write ALL user-facing text/);
		expect(pKo).toMatch(/Write ALL user-facing text/);
		expect(pKo).toMatch(/Korean/);
	});

	it('includes the exact beat count in BEAT COUNT', () => {
		const p = buildStoryPrompt({ spec: BASE_SPEC, beatCount: 6 });
		expect(p).toContain('BEAT COUNT: 6');
	});

	it('forbids inventing characters or shifting setting', () => {
		const p = buildStoryPrompt({ spec: BASE_SPEC, beatCount: 4 });
		expect(p).toMatch(/Do NOT invent new characters/);
		expect(p).toMatch(/Do NOT shift the setting/);
	});
});
