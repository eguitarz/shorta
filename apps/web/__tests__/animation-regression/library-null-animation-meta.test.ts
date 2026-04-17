/**
 * Regression guard for library / dashboard rendering of storyboards that have
 * no `animation_meta` — i.e. every storyboard that exists TODAY, before the
 * animation feature ships.
 *
 * Migration 034 will add `animation_meta jsonb DEFAULT NULL` to the
 * `generated_storyboards` table. All existing rows will read back with
 * `animation_meta === null`. Any UI code the animation PR adds must null-check
 * before it dereferences animation_meta — otherwise every user with legacy
 * storyboards gets a runtime crash on the library/dashboard route.
 *
 * This test encodes the contract that animation-meta readers be null-safe.
 */

import { describe, it, expect } from 'vitest';

type StoryboardRow = {
	id: string;
	title: string;
	source: 'analyzed' | 'created' | null;
	generated_overview: unknown;
	generated_beats: unknown;
	animation_meta?: unknown | null;
};

// Mirrors the shape a dashboard list item factory would extract from a row.
// The animation PR will add an `isAnimation` flag / badge; the helper below
// MUST handle null animation_meta gracefully.
function isAnimationStoryboard(row: StoryboardRow): boolean {
	return row.animation_meta !== null && row.animation_meta !== undefined;
}

function hasCharacters(row: StoryboardRow): boolean {
	const meta = row.animation_meta as { characters?: unknown[] } | null | undefined;
	return Array.isArray(meta?.characters) && meta!.characters!.length > 0;
}

describe('library/dashboard: null animation_meta regression', () => {
	const LEGACY_TALKING_HEAD_ROW: StoryboardRow = {
		id: 'sb-legacy-1',
		title: 'My first storyboard (from 2 months ago)',
		source: 'created',
		generated_overview: { title: 'Budget tips', contentType: 'talking_head' },
		generated_beats: [{ beatNumber: 1, title: 'Hook' }],
		// Field not present at all — as it'd appear for rows created before
		// migration 034.
	};

	const LEGACY_ANALYZED_ROW: StoryboardRow = {
		id: 'sb-legacy-2',
		title: 'Analyzer output',
		source: 'analyzed',
		generated_overview: { title: 'X', contentType: 'talking_head' },
		generated_beats: [],
		animation_meta: null, // explicitly null — as it'd appear after 034 on existing rows
	};

	const ANIMATION_ROW: StoryboardRow = {
		id: 'sb-new-1',
		title: 'Animated cat adventure',
		source: 'created',
		generated_overview: { title: 'Cat', contentType: 'ai_animation' },
		generated_beats: [],
		animation_meta: {
			logline: 'A tired cat discovers the vacuum is its friend',
			characters: [{ name: 'Whiskers', traits: ['orange', 'tired'], personality: 'grumpy' }],
		},
	};

	it('isAnimationStoryboard returns false for legacy row with missing animation_meta', () => {
		expect(() => isAnimationStoryboard(LEGACY_TALKING_HEAD_ROW)).not.toThrow();
		expect(isAnimationStoryboard(LEGACY_TALKING_HEAD_ROW)).toBe(false);
	});

	it('isAnimationStoryboard returns false for legacy row with null animation_meta', () => {
		expect(() => isAnimationStoryboard(LEGACY_ANALYZED_ROW)).not.toThrow();
		expect(isAnimationStoryboard(LEGACY_ANALYZED_ROW)).toBe(false);
	});

	it('isAnimationStoryboard returns true for new animation row', () => {
		expect(isAnimationStoryboard(ANIMATION_ROW)).toBe(true);
	});

	it('hasCharacters is null-safe on legacy rows (no crash, returns false)', () => {
		expect(() => hasCharacters(LEGACY_TALKING_HEAD_ROW)).not.toThrow();
		expect(() => hasCharacters(LEGACY_ANALYZED_ROW)).not.toThrow();
		expect(hasCharacters(LEGACY_TALKING_HEAD_ROW)).toBe(false);
		expect(hasCharacters(LEGACY_ANALYZED_ROW)).toBe(false);
	});

	it('hasCharacters returns true when animation row has characters', () => {
		expect(hasCharacters(ANIMATION_ROW)).toBe(true);
	});

	it('a mixed-list render pass does not throw on legacy + animation rows interleaved', () => {
		const rows = [LEGACY_TALKING_HEAD_ROW, ANIMATION_ROW, LEGACY_ANALYZED_ROW, ANIMATION_ROW];

		expect(() => {
			for (const r of rows) {
				isAnimationStoryboard(r);
				hasCharacters(r);
			}
		}).not.toThrow();
	});
});
