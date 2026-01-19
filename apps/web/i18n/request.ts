import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['en', 'es', 'ko', 'zh-TW'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const languageNames: Record<Locale, string> = {
  'en': 'English',
  'es': 'Español',
  'ko': '한국어',
  'zh-TW': '繁體中文',
};

export const languageNamesEnglish: Record<Locale, string> = {
  'en': 'English',
  'es': 'Spanish',
  'ko': 'Korean',
  'zh-TW': 'Traditional Chinese',
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export default getRequestConfig(async () => {
  // Priority 1: Check cookie (user preference)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`../messages/${cookieLocale}.json`)).default
    };
  }

  // Priority 2: Check x-locale header (set by middleware from Accept-Language)
  const headerStore = await headers();
  const headerLocale = headerStore.get('x-locale');
  if (headerLocale && isValidLocale(headerLocale)) {
    return {
      locale: headerLocale,
      messages: (await import(`../messages/${headerLocale}.json`)).default
    };
  }

  // Priority 3: Fallback to default
  return {
    locale: defaultLocale,
    messages: (await import(`../messages/${defaultLocale}.json`)).default
  };
});
