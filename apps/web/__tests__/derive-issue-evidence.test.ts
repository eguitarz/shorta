import { describe, it, expect } from 'vitest';
import { deriveIssueEvidence } from '../components/analyzer/derive-issue-evidence';

// Representative shapes of what `retention.issues[N]` looks like across the
// pre-1b -> post-1b migration. This suite is the back-compat gate. If it
// starts failing, the UI breaks on existing analysis_jobs rows in prod.

describe('deriveIssueEvidence — REGRESSION gate for pre-1b storyboards', () => {
	it('returns null for a pre-1b AI-only issue (no ruleId, no evidence field)', () => {
		// This is the CRITICAL case: any storyboard written before the Phase 1b
		// prompt change has this exact shape. Parser must not throw, UI must not
		// crash, and the expander must hide gracefully.
		const preMigrationIssue = {
			severity: 'moderate',
			message: 'Hook is weak',
			suggestion: 'Start with a specific claim',
			timestamp: '0:02',
		};
		expect(() => deriveIssueEvidence(preMigrationIssue)).not.toThrow();
		expect(deriveIssueEvidence(preMigrationIssue)).toBeNull();
	});

	it('returns null for a pre-1b lint-backed issue whose rule id is unknown in the current rule registry', () => {
		// A rule was removed from the static rule tables but prior storyboards
		// still reference it. Must not throw.
		const orphanRuleIssue = {
			severity: 'critical',
			message: 'Foo',
			suggestion: 'Bar',
			ruleId: 'th_nonexistent_rule_that_was_deleted',
			ruleName: 'Ghost Rule',
		};
		expect(deriveIssueEvidence(orphanRuleIssue)).toBeNull();
	});

	it('handles issue === null / undefined without throwing', () => {
		expect(deriveIssueEvidence(null)).toBeNull();
		expect(deriveIssueEvidence(undefined)).toBeNull();
	});

	it('handles issue.evidence that is an empty object (malformed response)', () => {
		const malformed = {
			severity: 'moderate',
			message: 'Something',
			suggestion: 'Anything',
			evidence: {},
		};
		expect(deriveIssueEvidence(malformed)).toBeNull();
	});

	it('handles issue.evidence with non-numeric startTime (prompt drift)', () => {
		const drift = {
			severity: 'moderate',
			message: 'Something',
			suggestion: 'Anything',
			evidence: {
				startTime: 'twelve seconds', // string instead of number
				transcriptSnippet: 'So um anyway',
				reasoning: 'Filler detected',
			},
		};
		const result = deriveIssueEvidence(drift);
		expect(result).not.toBeNull();
		expect(result?.kind).toBe('ai');
		if (result?.kind === 'ai') {
			// startTime silently dropped; snippet and reasoning still render.
			expect(result.startTime).toBeUndefined();
			expect(result.transcriptSnippet).toBe('So um anyway');
		}
	});
});

describe('deriveIssueEvidence — Phase 1b forward contract', () => {
	it('builds rule evidence from a real rule id', () => {
		// th_hook_timing is a stable real rule; see lib/linter/rules/talking_head.ts
		const lintIssue = {
			severity: 'critical',
			message: 'Hook is slow',
			suggestion: 'Front-load the claim',
			ruleId: 'th_hook_timing',
			ruleName: 'Hook Within 3 Seconds',
		};
		const ev = deriveIssueEvidence(lintIssue);
		expect(ev?.kind).toBe('rule');
		if (ev?.kind === 'rule') {
			expect(ev.ruleId).toBe('th_hook_timing');
			expect(ev.ruleName).toBe('Hook Within 3 Seconds');
			expect(ev.description.length).toBeGreaterThan(0);
			expect(ev.check.length).toBeGreaterThan(0);
		}
	});

	it('builds AI evidence from a fully-populated Phase 1b issue', () => {
		const aiIssue = {
			severity: 'moderate',
			message: 'Filler phrase drops energy',
			suggestion: 'Cut the "so anyway" transition',
			evidence: {
				startTime: 12.5,
				endTime: 14,
				transcriptSnippet: 'So anyway, back to what I was saying',
				reasoning: 'The transition kills pacing right after the hook lands.',
			},
		};
		const ev = deriveIssueEvidence(aiIssue);
		expect(ev?.kind).toBe('ai');
		if (ev?.kind === 'ai') {
			expect(ev.startTime).toBe(12.5);
			expect(ev.endTime).toBe(14);
			expect(ev.transcriptSnippet).toBe('So anyway, back to what I was saying');
			expect(ev.reasoning).toContain('transition kills pacing');
		}
	});

	it('builds AI evidence when only reasoning is present (no transcript)', () => {
		const reasoningOnly = {
			severity: 'minor',
			message: 'Energy dips',
			suggestion: 'Lift volume',
			evidence: {
				reasoning: 'Delivery becomes monotone for too long.',
			},
		};
		const ev = deriveIssueEvidence(reasoningOnly);
		expect(ev?.kind).toBe('ai');
		if (ev?.kind === 'ai') {
			expect(ev.transcriptSnippet).toBeUndefined();
			expect(ev.reasoning).toBe('Delivery becomes monotone for too long.');
			expect(ev.startTime).toBeUndefined();
		}
	});

	it('prefers rule evidence when both ruleId and evidence are present', () => {
		const hybrid = {
			severity: 'critical',
			message: 'Hook slow',
			suggestion: 'Fix it',
			ruleId: 'th_hook_timing',
			ruleName: 'Hook Within 3 Seconds',
			evidence: {
				transcriptSnippet: 'Hello everyone, today I want to...',
				reasoning: 'The speaker takes 4 seconds to get to the claim.',
			},
		};
		const ev = deriveIssueEvidence(hybrid);
		expect(ev?.kind).toBe('rule'); // rule takes precedence
	});
});
