/**
 * Regression guard for /api/regenerate-beat.
 *
 * Before the AI Animation Storyboard feature lands, this file ENCODES the
 * existing behavior of `createRegenerationPrompt` on a talking_head storyboard
 * that has no `animation_meta`. After the feature PR modifies this file to add
 * animation awareness (injecting char-sheet references when animation_meta is
 * present), these tests MUST still pass — proving the non-animation path is
 * unchanged.
 *
 * See eng review plan: supabase/migrations/034... and Decision 3A.
 */

import { describe, it, expect } from 'vitest';
import { createRegenerationPrompt } from '../../lib/regenerate-beat-prompt';
import type { Beat } from '../../lib/types/beat';

// Minimal talking_head storyboard fixture. Shape must match what the route
// receives in production (jsonb from Supabase, passed straight through).
const TALKING_HEAD_STORYBOARD = {
	overview: {
		title: '3 ways to save on groceries',
		contentType: 'talking_head',
		nicheCategory: 'Finance',
		targetAudience: 'US adults 25-45',
		length: 45,
	},
	beats: [
		{
			beatNumber: 1,
			startTime: 0,
			endTime: 5,
			type: 'hook',
			title: 'Hook',
			directorNotes: '• Direct eye contact\n• High energy',
			script: 'You are overspending by 30% at the store.',
			visual: '• CU on speaker',
			audio: '• Upbeat music bed',
		},
		{
			beatNumber: 2,
			startTime: 5,
			endTime: 20,
			type: 'main_content',
			title: 'Tip 1',
			directorNotes: '• Slow the pace',
			script: 'Stop shopping when hungry.',
			visual: '• MCU + b-roll',
			audio: '• Fade music',
		},
		{
			beatNumber: 3,
			startTime: 20,
			endTime: 45,
			type: 'main_content',
			title: 'Tip 2',
			directorNotes: '• Enumerate clearly',
			script: 'Buy store brands.',
			visual: '• OTS on shelf',
			audio: '• Music returns',
		},
	] as Beat[],
};

describe('regenerate-beat: talking_head regression (no animation_meta)', () => {
	it('builds a prompt that preserves video context and beat identity', () => {
		const beat = TALKING_HEAD_STORYBOARD.beats[1];
		const prompt = createRegenerationPrompt(TALKING_HEAD_STORYBOARD as any, beat);

		expect(prompt).toContain('3 ways to save on groceries');
		expect(prompt).toContain('talking_head');
		expect(prompt).toContain('Finance');
		expect(prompt).toContain('Stop shopping when hungry.');
		expect(prompt).toContain('Beat 2');
	});

	it('includes previous beat context when a prev beat exists', () => {
		const beat = TALKING_HEAD_STORYBOARD.beats[1];
		const prompt = createRegenerationPrompt(TALKING_HEAD_STORYBOARD as any, beat);

		expect(prompt).toContain('PREVIOUS BEAT');
		expect(prompt).toContain('You are overspending by 30% at the store.');
	});

	it('includes next beat context when a next beat exists', () => {
		const beat = TALKING_HEAD_STORYBOARD.beats[1];
		const prompt = createRegenerationPrompt(TALKING_HEAD_STORYBOARD as any, beat);

		expect(prompt).toContain('NEXT BEAT');
		expect(prompt).toContain('Buy store brands.');
	});

	it('marks first beat as FIRST (no prev beat)', () => {
		const firstBeat = TALKING_HEAD_STORYBOARD.beats[0];
		const prompt = createRegenerationPrompt(TALKING_HEAD_STORYBOARD as any, firstBeat);

		expect(prompt).toContain('FIRST beat');
	});

	it('marks last beat as LAST (no next beat)', () => {
		const lastBeat = TALKING_HEAD_STORYBOARD.beats[2];
		const prompt = createRegenerationPrompt(TALKING_HEAD_STORYBOARD as any, lastBeat);

		expect(prompt).toContain('LAST beat');
	});

	it('enforces consistency language (locks production identity across beats)', () => {
		const beat = TALKING_HEAD_STORYBOARD.beats[1];
		const prompt = createRegenerationPrompt(TALKING_HEAD_STORYBOARD as any, beat);

		// This is the exact sentence the talking_head flow relies on. The animation
		// PR must not delete or materially weaken it — consistency is the whole point.
		expect(prompt).toMatch(/same setting|maintain.*consistent|production identity|SAME video/i);
	});

	it('does NOT reference animation concepts (char sheet, narrative role) in non-animation flow', () => {
		const beat = TALKING_HEAD_STORYBOARD.beats[1];
		const prompt = createRegenerationPrompt(TALKING_HEAD_STORYBOARD as any, beat);

		// If the animation PR accidentally leaks char-sheet refs into the non-animation
		// path, this will flag it.
		expect(prompt).not.toMatch(/character sheet|sheetPrompt|narrativeRole/i);
	});

	it('appends locale instruction when a non-en locale is provided', () => {
		const beat = TALKING_HEAD_STORYBOARD.beats[1];
		const promptEn = createRegenerationPrompt(TALKING_HEAD_STORYBOARD as any, beat, 'en');
		const promptKo = createRegenerationPrompt(TALKING_HEAD_STORYBOARD as any, beat, 'ko');

		expect(promptEn).not.toMatch(/Write ALL text content/);
		expect(promptKo).toMatch(/Write ALL text content/);
	});
});
