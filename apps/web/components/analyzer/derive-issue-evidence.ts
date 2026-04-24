import { lookupRule } from '@/lib/linter/rule-lookup';
import type { BeatIssueEvidence } from './evidence-types';

/**
 * Derive an evidence payload for the "Why we flagged this" expander on a beat
 * issue.
 *
 * - Linter-backed issues (have ruleId): pull the static rule definition.
 * - AI-discovered issues (no ruleId): use the per-issue `evidence` object
 *   emitted by Gemini in Phase 1b. Pre-1b storyboards have no `evidence`
 *   field — in that case the expander hides (EvidencePanel returns null).
 *
 * This function is the single source of truth for the back-compat contract
 * between pre-1b and post-1b storyboard payloads. Treat its test suite as a
 * regression gate.
 */
export function deriveIssueEvidence(issue: any): BeatIssueEvidence | null {
	if (issue == null) return null;
	if (issue.ruleId) {
		const rule = lookupRule(issue.ruleId);
		if (!rule) return null;
		return {
			kind: 'rule',
			ruleId: rule.id,
			ruleName: rule.name,
			description: rule.description,
			check: rule.check,
			goodExample: rule.goodExample,
			severity: rule.severity,
			category: rule.category,
		};
	}
	const ev = issue.evidence;
	if (ev && (ev.transcriptSnippet || ev.reasoning)) {
		return {
			kind: 'ai',
			startTime: typeof ev.startTime === 'number' ? ev.startTime : undefined,
			endTime: typeof ev.endTime === 'number' ? ev.endTime : undefined,
			transcriptSnippet: ev.transcriptSnippet || undefined,
			reasoning: ev.reasoning || undefined,
			falsifier: typeof ev.falsifier === 'string' && ev.falsifier.length > 0 ? ev.falsifier : undefined,
		};
	}
	return null;
}
