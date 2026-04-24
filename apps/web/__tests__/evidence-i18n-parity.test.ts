import { describe, it, expect } from 'vitest';
import en from '../messages/en.json';
import es from '../messages/es.json';
import ko from '../messages/ko.json';
import zhTW from '../messages/zh-TW.json';

const LOCALES = { en, es, ko, 'zh-TW': zhTW } as const;

function gatherKeys(obj: unknown, prefix = ''): string[] {
	if (typeof obj !== 'object' || obj === null) return [prefix];
	if (Array.isArray(obj)) return [prefix];
	return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
		gatherKeys(v, prefix ? `${prefix}.${k}` : k),
	);
}

describe('analyzer.evidence i18n parity', () => {
	const enKeys = gatherKeys((en as any).analyzer.evidence, 'analyzer.evidence').sort();

	for (const [locale, bundle] of Object.entries(LOCALES)) {
		it(`${locale} has identical analyzer.evidence key set`, () => {
			const localeKeys = gatherKeys((bundle as any).analyzer.evidence, 'analyzer.evidence').sort();
			expect(localeKeys).toEqual(enKeys);
		});
	}

	it('every locale has non-empty string for every evidence leaf', () => {
		for (const [locale, bundle] of Object.entries(LOCALES)) {
			const evidence = (bundle as any).analyzer?.evidence;
			const walk = (node: any, path: string) => {
				if (typeof node === 'string') {
					expect(node.length, `${locale}:${path} must be non-empty`).toBeGreaterThan(0);
					return;
				}
				for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
			};
			walk(evidence, 'analyzer.evidence');
		}
	});
});
