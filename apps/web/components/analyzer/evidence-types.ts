import type { RuleSeverity, RuleCategory } from '@/lib/linter/types';

export interface RuleEvidence {
	kind: 'rule';
	ruleId: string;
	ruleName: string;
	description: string;
	check: string;
	goodExample?: string;
	severity: RuleSeverity;
	category: RuleCategory;
}

export interface AIEvidence {
	kind: 'ai';
	startTime?: number;
	endTime?: number;
	transcriptSnippet?: string;
	reasoning?: string;
	/** Phase 2: Gemini-supplied counterfactual that would prove this call wrong. */
	falsifier?: string;
}

export type BeatIssueEvidence = RuleEvidence | AIEvidence;
