import { describe, it, expect } from 'vitest';
import {
	ARC_TEMPLATES,
	getArcTemplate,
	rolesForBeatCount,
} from '../../lib/animation/arc-templates';
import type { ArcTemplateId, NarrativeRole } from '../../lib/types/beat';

describe('ARC_TEMPLATES', () => {
	it('contains exactly 7 presets', () => {
		expect(ARC_TEMPLATES).toHaveLength(7);
	});

	it('each template has a unique id matching ArcTemplateId (minus custom)', () => {
		const ids = ARC_TEMPLATES.map((t) => t.id);
		const expected: ArcTemplateId[] = [
			'setup_twist_payoff',
			'problem_escalation_resolution',
			'loop',
			'reveal',
			'reversal',
			'chase_build',
			'product_demo',
		];
		expect(new Set(ids)).toEqual(new Set(expected));
	});

	it('each template has non-empty label, description, and roles array', () => {
		for (const t of ARC_TEMPLATES) {
			expect(t.label.length).toBeGreaterThan(0);
			expect(t.description.length).toBeGreaterThan(0);
			expect(t.roles.length).toBeGreaterThan(0);
		}
	});

	it('every role in every template is a valid NarrativeRole value', () => {
		const validRoles: NarrativeRole[] = [
			'setup',
			'inciting',
			'escalation',
			'twist',
			'payoff',
			'button',
			'hook_problem',
			'product_reveal',
			'feature_highlight',
			'cta',
		];
		for (const t of ARC_TEMPLATES) {
			for (const role of t.roles) {
				expect(validRoles).toContain(role);
			}
		}
	});

	it('is frozen (immutable)', () => {
		expect(() => {
			// @ts-expect-error testing frozen mutation
			ARC_TEMPLATES.push({ id: 'nope', label: 'x', description: 'x', roles: [] });
		}).toThrow();
	});
});

describe('getArcTemplate', () => {
	it('returns the template for a valid preset id', () => {
		const t = getArcTemplate('setup_twist_payoff');
		expect(t.id).toBe('setup_twist_payoff');
		expect(t.roles).toContain('setup');
		expect(t.roles).toContain('payoff');
	});

	it("throws on 'custom' with a message pointing to arcCustomDescription", () => {
		expect(() => getArcTemplate('custom')).toThrow(/custom/);
		expect(() => getArcTemplate('custom')).toThrow(/arcCustomDescription/);
	});

	it('throws on unknown id', () => {
		expect(() => getArcTemplate('nonsense' as ArcTemplateId)).toThrow(/unknown arc template/);
	});
});

describe('rolesForBeatCount', () => {
	const LONG_ARC = getArcTemplate('problem_escalation_resolution'); // 4 roles
	const LOOP_ARC = getArcTemplate('loop'); // 5 roles

	it('returns roles verbatim when beatCount matches template length', () => {
		expect(rolesForBeatCount(LONG_ARC, 4)).toEqual(['setup', 'inciting', 'escalation', 'payoff']);
	});

	it('stretches by repeating escalation when beatCount > template length', () => {
		const roles = rolesForBeatCount(LONG_ARC, 6);
		expect(roles).toHaveLength(6);
		expect(roles[0]).toBe('setup'); // first preserved
		expect(roles[roles.length - 1]).toBe('payoff'); // last preserved
		// Should contain multiple escalations
		const escalationCount = roles.filter((r) => r === 'escalation').length;
		expect(escalationCount).toBeGreaterThanOrEqual(2);
	});

	it('packs by dropping middle duplicates when beatCount < template length', () => {
		const roles = rolesForBeatCount(LOOP_ARC, 3);
		expect(roles).toHaveLength(3);
		// Loop arc is: setup, inciting, escalation, payoff, button
		// Packing to 3: first (setup), one middle, last (button)
		expect(roles[0]).toBe('setup');
		expect(roles[2]).toBe('button');
	});

	it('handles single-beat storyboards by returning just the payoff', () => {
		expect(rolesForBeatCount(LONG_ARC, 1)).toEqual(['payoff']);
	});

	it('throws on beatCount <= 0', () => {
		expect(() => rolesForBeatCount(LONG_ARC, 0)).toThrow();
		expect(() => rolesForBeatCount(LONG_ARC, -1)).toThrow();
	});

	it('stretches reversal arc (3 roles) cleanly even though it has no escalation', () => {
		const reversalArc = getArcTemplate('reversal'); // setup, twist, button
		const roles = rolesForBeatCount(reversalArc, 5);
		expect(roles).toHaveLength(5);
		expect(roles[0]).toBe('setup');
		expect(roles[roles.length - 1]).toBe('button');
	});

	it('returns a fresh array each call (no aliasing with source template)', () => {
		const a = rolesForBeatCount(LONG_ARC, 4);
		const b = rolesForBeatCount(LONG_ARC, 4);
		a[0] = 'twist';
		expect(b[0]).toBe('setup'); // unchanged
	});
});
