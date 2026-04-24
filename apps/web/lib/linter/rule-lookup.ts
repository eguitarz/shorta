import type { Rule } from './types';
import { talkingHeadRules } from './rules/talking_head';
import { gameplayRules } from './rules/gameplay';
import { demoRules } from './rules/demo';
import { otherRules } from './rules/other';

const ALL_RULES: Rule[] = [
	...talkingHeadRules.rules,
	...gameplayRules.rules,
	...demoRules.rules,
	...otherRules.rules,
];

const RULE_INDEX: Record<string, Rule> = ALL_RULES.reduce<Record<string, Rule>>((acc, rule) => {
	acc[rule.id] = rule;
	return acc;
}, {});

export function lookupRule(ruleId: string): Rule | undefined {
	return RULE_INDEX[ruleId];
}
