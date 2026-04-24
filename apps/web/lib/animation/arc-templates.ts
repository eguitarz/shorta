/**
 * Arc templates for the AI Animation Storyboard mode.
 *
 * Each template defines the narrative-role sequence the beat-generation
 * prompt will enforce. Users pick one in the wizard's Step 3 OR choose
 * 'custom' and supply their own logline. The 6 presets cover ~90% of
 * short-form animation arcs per our research.
 *
 * Copy (labels + descriptions) is intentionally workmanlike for v1 — the
 * /plan-design-review pass flagged this as TODO work. Revisit once
 * analytics show which templates users actually pick.
 */

import type { ArcTemplateId, NarrativeRole } from '@/lib/types/beat';

export interface ArcTemplate {
	id: ArcTemplateId;
	label: string;
	/** One-line user-facing description shown in the wizard row. */
	description: string;
	/**
	 * Ordered list of narrative roles the beat-generation prompt should
	 * assign, in sequence. Variable-length storyboards fill by proportion:
	 * a 4-beat run over a 6-role arc packs roles; a 6-beat run over a 4-role
	 * arc repeats the middle (escalation) role. The prompt handles packing.
	 */
	roles: NarrativeRole[];
}

/**
 * Preset arc templates. `custom` is handled separately — it routes to
 * `AnimationMeta.arcCustomDescription` and doesn't have a fixed role list.
 */
export const ARC_TEMPLATES: readonly ArcTemplate[] = Object.freeze([
	{
		id: 'setup_twist_payoff',
		label: 'Setup → Twist → Payoff',
		description: 'The classic joke shape. Establish, subvert expectation, land it.',
		roles: ['setup', 'twist', 'payoff', 'button'],
	},
	{
		id: 'problem_escalation_resolution',
		label: 'Problem → Escalation → Resolution',
		description: 'Show a problem, make it worse, then resolve. The Pixar shape.',
		roles: ['setup', 'inciting', 'escalation', 'payoff'],
	},
	{
		id: 'loop',
		label: 'Loop',
		description: 'Start at A, travel to B, return to A — but changed. Great for replays.',
		roles: ['setup', 'inciting', 'escalation', 'payoff', 'button'],
	},
	{
		id: 'reveal',
		label: 'Reveal',
		description: 'Misdirect the viewer, then reveal what was actually happening.',
		roles: ['setup', 'escalation', 'twist', 'payoff'],
	},
	{
		id: 'reversal',
		label: 'Reversal',
		description: 'Set up an expected outcome, deliver the opposite. Short and punchy.',
		roles: ['setup', 'twist', 'button'],
	},
	{
		id: 'chase_build',
		label: 'Chase / Build',
		description: 'Stakes keep rising until a climax, then release.',
		roles: ['inciting', 'escalation', 'escalation', 'payoff'],
	},
	{
		id: 'product_demo',
		label: 'Product Demo',
		description: 'Problem → product reveal → feature tour → CTA. Auto-selected in Product Demo mode.',
		roles: ['hook_problem', 'product_reveal', 'feature_highlight', 'feature_highlight', 'cta'],
	},
]);

const TEMPLATE_BY_ID: Record<ArcTemplateId, ArcTemplate | undefined> = Object.fromEntries(
	ARC_TEMPLATES.map((t) => [t.id, t])
) as Record<ArcTemplateId, ArcTemplate | undefined>;

/**
 * Lookup by id. Throws on unknown id EXCEPT 'custom' — callers must handle
 * 'custom' separately (it has no preset roles; the user-supplied
 * arcCustomDescription drives the prompt).
 */
export function getArcTemplate(id: ArcTemplateId): ArcTemplate {
	if (id === 'custom') {
		throw new Error("getArcTemplate: 'custom' has no preset roles; read arcCustomDescription directly");
	}
	const found = TEMPLATE_BY_ID[id];
	if (!found) {
		throw new Error(`getArcTemplate: unknown arc template id '${id}'`);
	}
	return found;
}

/**
 * Distribute the arc's narrative roles across a variable beat count.
 *
 *   beatCount < roles.length → pack: drop middle 'escalation' duplicates
 *     and lower-priority roles to fit.
 *   beatCount = roles.length → use roles verbatim.
 *   beatCount > roles.length → stretch: repeat 'escalation' roles to fill
 *     the middle (they're the most repeatable). Setup stays first, payoff
 *     stays last.
 *
 * Returns an array of length `beatCount`.
 */
export function rolesForBeatCount(
	template: ArcTemplate,
	beatCount: number
): NarrativeRole[] {
	if (beatCount <= 0) {
		throw new Error('rolesForBeatCount: beatCount must be >= 1');
	}

	const source = template.roles;

	if (beatCount === source.length) {
		return [...source];
	}

	if (beatCount < source.length) {
		// Pack: preserve first + last, then pick from middle by priority.
		// Priority order for middle slots (highest first): payoff, twist,
		// escalation, inciting, setup, button.
		const first = source[0];
		const last = source[source.length - 1];
		const middle = source.slice(1, -1);
		const slotsForMiddle = Math.max(0, beatCount - 2);

		if (slotsForMiddle === 0 && beatCount === 1) {
			// Single-beat storyboards just show the payoff.
			return ['payoff'];
		}

		// Priority filter: keep in order, but skip duplicate 'escalation' beyond 1.
		const kept: NarrativeRole[] = [];
		let escalationKept = false;
		for (const role of middle) {
			if (role === 'escalation') {
				if (!escalationKept) {
					kept.push(role);
					escalationKept = true;
				}
			} else {
				kept.push(role);
			}
			if (kept.length >= slotsForMiddle) break;
		}

		return beatCount === 1 ? ['payoff'] : [first, ...kept.slice(0, slotsForMiddle), last];
	}

	// Stretch: repeat the middle 'escalation' (or the most stretchable middle
	// role if no escalation exists) to reach beatCount.
	const first = source[0];
	const last = source[source.length - 1];
	const middle = source.slice(1, -1);
	const stretchTarget: NarrativeRole =
		middle.includes('escalation') ? 'escalation' : middle[0] ?? 'escalation';

	const extraNeeded = beatCount - source.length;
	const stretched: NarrativeRole[] = [];
	let inserted = false;
	for (const role of middle) {
		stretched.push(role);
		if (!inserted && role === stretchTarget) {
			for (let i = 0; i < extraNeeded; i++) stretched.push(stretchTarget);
			inserted = true;
		}
	}
	// If no middle role matched, tack the extras on before `last`.
	if (!inserted) {
		for (let i = 0; i < extraNeeded; i++) stretched.push(stretchTarget);
	}

	return [first, ...stretched, last];
}
