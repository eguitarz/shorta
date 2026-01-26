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
  private buildPrompt(ruleSet: RuleSet, locale?: string): string {
    const rulesList = ruleSet.rules
      .map((rule, idx) => {
        return `${idx + 1}. [${rule.severity.toUpperCase()}] ${rule.name} (${rule.id})
   Category: ${rule.category}
   Check: ${rule.check}`;
      })
      .join('\n\n');

    let prompt = ruleSet.promptTemplate.replace('{{RULES_LIST}}', rulesList);

    // Inject language requirement if locale is not English
    if (locale && locale !== 'en') {
      const languageMap: Record<string, string> = {
        'es': 'Spanish',
        'ko': 'Korean',
        'zh-TW': 'Traditional Chinese (zh-TW)'
      };
      const languageName = languageMap[locale] || locale;

      prompt += `\n\nCRITICAL LANGUAGE REQUIREMENT:
All output text—specifically the "message", "suggestion", and "summary" fields—MUST be written in ${languageName}.
This is essential as the user is analyzing the video in this language.`;
    }

    return prompt;
  }

  /**
   * Lint a video and return structured results
   * @param videoUrl - Video URL or file URI
   * @param format - Video format for rule selection
   * @param locale - Optional locale for output language
   */
  async lint(videoUrl: string, format: VideoFormat, videoDuration?: number, locale?: string): Promise<LintResult> {
    const ruleSet = this.getRuleSet(format);
    const prompt = this.buildPrompt(ruleSet, locale);

    if (!this.client.analyzeVideo) {
      throw new Error('Client does not support video analysis');
    }

    // Call Gemini with the linting prompt using flash-lite for faster response (avoid 524 timeouts)
    const response = await this.client.analyzeVideo(
      videoUrl,
      prompt,
      {
        model: 'gemini-2.5-flash-lite', // Use lite model for faster linting
        temperature: 0.0, // Minimum temperature for maximum consistency in scoring
        maxTokens: 16384, // Very high limit to prevent incomplete JSON responses
        videoDuration, // Pass duration for FPS optimization on long videos
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
      const contentLength = response.content.length;
      const preview = response.content.substring(0, 1000);
      const ending = response.content.substring(Math.max(0, contentLength - 500));
      console.error('Failed to parse lint JSON.');
      console.error('Content length:', contentLength);
      console.error('Preview (first 1000 chars):', preview);
      console.error('Ending (last 500 chars):', ending);
      console.error('Parse error:', error);
      throw new Error(`Failed to parse lint results. The response may be incomplete or malformed. Content length: ${contentLength} chars. Check server logs for details.`);
    }

    const violations: RuleViolation[] = parsedResult.violations || [];

    // Deduplicate violations by ruleId - same rule type only counts once for scoring
    const uniqueViolations = Array.from(
      violations.reduce((map, v) => {
        if (!map.has(v.ruleId)) {
          map.set(v.ruleId, v);
        }
        return map;
      }, new Map<string, RuleViolation>()).values()
    );

    // Calculate stats based on unique violations
    const totalRules = ruleSet.rules.length;
    const critical = uniqueViolations.filter(v => v.severity === 'critical').length;
    const moderate = uniqueViolations.filter(v => v.severity === 'moderate').length;
    const minor = uniqueViolations.filter(v => v.severity === 'minor').length;
    const passed = totalRules - uniqueViolations.length;

    // Debug logging
    console.log('=== SCORE CALCULATION DEBUG ===');
    console.log('Total violations (before dedup):', violations.length);
    console.log('Unique violations (after dedup):', uniqueViolations.length);
    console.log('Critical:', critical, 'x -10 =', critical * -10);
    console.log('Moderate:', moderate, 'x -5 =', moderate * -5);
    console.log('Minor:', minor, 'x -2 =', minor * -2);
    console.log('Unique violations:', uniqueViolations.map(v => ({ id: v.ruleId, severity: v.severity })));

    // Calculate score (0-100) using unique violations only
    // Same rule type only counts once, even if it fails in multiple beats
    let score = 100;
    uniqueViolations.forEach(v => {
      if (v.severity === 'critical') score -= 10;
      else if (v.severity === 'moderate') score -= 5;
      else score -= 2;
    });
    score = Math.max(0, Math.min(100, score));

    console.log('Expected score:', 100 - (critical * 10) - (moderate * 5) - (minor * 2));
    console.log('Actual score:', score);
    console.log('============================');

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
