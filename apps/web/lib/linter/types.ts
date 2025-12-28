export type RuleSeverity = 'critical' | 'moderate' | 'minor';
export type RuleCategory = 'hook' | 'retention' | 'audio' | 'visual' | 'pacing' | 'structure' | 'cta';
export type VideoFormat = 'talking_head' | 'gameplay' | 'other';

export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: RuleSeverity;
  category: RuleCategory;
  check: string; // What to look for in the video
  goodExample?: string;
  badExample?: string;
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  severity: RuleSeverity;
  category: RuleCategory;
  message: string;
  timestamp?: string; // e.g., "0:03" when the issue occurs
  suggestion?: string; // How to fix it
  confidence: number; // 0-1
}

export interface LintResult {
  format: VideoFormat;
  totalRules: number;
  violations: RuleViolation[];
  passed: number;
  moderate: number;
  critical: number;
  score: number; // 0-100
  summary: string;
}

export interface RuleSet {
  format: VideoFormat;
  rules: Rule[];
  promptTemplate: string;
}
