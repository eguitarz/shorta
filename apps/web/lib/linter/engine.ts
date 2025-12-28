import type { VideoFormat, RuleSet, LintResult, RuleViolation } from './types';
import { talkingHeadRules } from './rules/talking_head';
import { gameplayRules } from './rules/gameplay';
import { otherRules } from './rules/other';
import type { LLMClient } from '../llm';

export class VideoLinter {
  private client: LLMClient;

  constructor(client: LLMClient) {
    this.client = client;
  }

  /**
   * Load ruleset for a specific video format
   */
  getRuleSet(format: VideoFormat): RuleSet {
    switch (format) {
      case 'talking_head':
        return talkingHeadRules;
      case 'gameplay':
        return gameplayRules;
      case 'other':
        return otherRules;
      default:
        return otherRules;
    }
  }

  /**
   * Build prompt with rules injected
   */
  private buildPrompt(ruleSet: RuleSet): string {
    const rulesList = ruleSet.rules
      .map((rule, idx) => {
        return `${idx + 1}. [${rule.severity.toUpperCase()}] ${rule.name} (${rule.id})
   Category: ${rule.category}
   Check: ${rule.check}`;
      })
      .join('\n\n');

    return ruleSet.promptTemplate.replace('{{RULES_LIST}}', rulesList);
  }

  /**
   * Lint a video and return structured results
   */
  async lint(videoUrl: string, format: VideoFormat): Promise<LintResult> {
    const ruleSet = this.getRuleSet(format);
    const prompt = this.buildPrompt(ruleSet);

    if (!this.client.analyzeVideo) {
      throw new Error('Client does not support video analysis');
    }

    // Call Gemini with the linting prompt (uses gemini-2.5-flash by default)
    const response = await this.client.analyzeVideo(
      videoUrl,
      prompt,
      {
        temperature: 0.2, // Low temperature for consistent linting
        maxTokens: 4096, // Increased to ensure complete responses
      }
    );

    // Parse JSON response
    let parsedResult;
    try {
      let jsonText = response.content.trim();

      // Handle markdown code blocks
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      parsedResult = JSON.parse(jsonText);
    } catch (error) {
      const preview = response.content.substring(0, 500);
      console.error('Failed to parse lint JSON. Preview:', preview);
      console.error('Parse error:', error);
      throw new Error(`Failed to parse lint results. The response may be incomplete or malformed. Check server logs for details.`);
    }

    const violations: RuleViolation[] = parsedResult.violations || [];

    // Calculate stats
    const totalRules = ruleSet.rules.length;
    const critical = violations.filter(v => v.severity === 'critical').length;
    const moderate = violations.filter(v => v.severity === 'moderate').length;
    const passed = totalRules - violations.length;

    // Calculate score (0-100)
    // Critical: -10 points each, Moderate: -5 points each, Minor: -2 points each
    let score = 100;
    violations.forEach(v => {
      if (v.severity === 'critical') score -= 10;
      else if (v.severity === 'moderate') score -= 5;
      else score -= 2;
    });
    score = Math.max(0, Math.min(100, score));

    return {
      format,
      totalRules,
      violations,
      passed,
      moderate,
      critical,
      score,
      summary: parsedResult.summary || 'Analysis complete',
    };
  }

  /**
   * Get rule details by ID
   */
  getRule(format: VideoFormat, ruleId: string) {
    const ruleSet = this.getRuleSet(format);
    return ruleSet.rules.find(r => r.id === ruleId);
  }

  /**
   * Get all rules for a format
   */
  getRules(format: VideoFormat) {
    return this.getRuleSet(format).rules;
  }
}
