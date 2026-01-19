/**
 * Language helpers for i18n integration with AI
 */

export const languageMap: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'ko': 'Korean',
  'zh-TW': 'Traditional Chinese',
};

/**
 * Get the full language name from a locale code
 */
export function getLanguageName(locale: string): string {
  return languageMap[locale] || 'English';
}

/**
 * Build the language instruction for AI prompts
 */
export function buildLanguageInstruction(locale: string): string {
  const languageName = getLanguageName(locale);
  return `IMPORTANT: Always respond in ${languageName}.`;
}

/**
 * Append language instruction to a system prompt
 */
export function appendLanguageInstruction(prompt: string, locale: string | undefined): string {
  if (!locale || locale === 'en') {
    return prompt;
  }
  return `${prompt}\n\n${buildLanguageInstruction(locale)}`;
}
