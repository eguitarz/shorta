/**
 * Falsifier: turn a deterministic sub-score into a single concrete condition
 * that would flip its status (weak ↔ strong). This is the "what would change
 * our mind" layer. The score is a formula; the falsifier narrates the formula
 * in human terms.
 *
 * Example:
 *   Hook scored 62/C. TTClaim was 3.2s, weak.
 *   buildFalsifier('hook', 'TTClaim', signals.hook, breakdown.hook.TTClaim)
 *     → { direction: 'flipStrong', threshold: '≤ 3s' }
 *
 * The output is threshold notation in language-neutral math form
 * (numbers + unit letters + comparators). The surrounding UI template
 * handles the grammatical wrap per locale.
 */

import type { VideoSignals } from './types';
import { isLongForm } from './constants';

export type FlipDirection = 'flipStrong' | 'flipWeak';

export interface Flip {
	direction: FlipDirection;
	threshold: string;
}

export type Category = 'hook' | 'structure' | 'clarity' | 'delivery';

function classify(score: number): 'strong' | 'ok' | 'weak' {
	if (score >= 70) return 'strong';
	if (score >= 40) return 'ok';
	return 'weak';
}

/**
 * Build a falsifier for a single (category, signalKey) pair.
 * Returns null when:
 *   - The signal status is 'ok' (too close to boundary, both flips equally
 *     likely, not a useful statement).
 *   - The signal is derived / compound (e.g. delivery.PQ) and has no crisp
 *     single-variable threshold.
 */
export function buildFalsifier(
	category: Category,
	key: string,
	signals: VideoSignals[Category] | undefined,
	score: number,
	videoDuration?: number,
): Flip | null {
	if (!signals) return null;
	const status = classify(score);
	if (status === 'ok') return null;
	const dir: FlipDirection = status === 'weak' ? 'flipStrong' : 'flipWeak';

	switch (category) {
		case 'hook':
			return flipHook(key, dir, videoDuration);
		case 'structure':
			return flipStructure(key, dir, videoDuration);
		case 'clarity':
			return flipClarity(key, dir, videoDuration);
		case 'delivery':
			return flipDelivery(key, dir);
	}
}

function flipHook(key: string, direction: FlipDirection, videoDuration?: number): Flip | null {
	const longForm = videoDuration != null && isLongForm(videoDuration);
	switch (key) {
		case 'TTClaim':
			// Short-form: 3s = "good" threshold (70). Long-form: 10s.
			return { direction, threshold: longForm ? (direction === 'flipStrong' ? '≤ 10s' : '> 10s') : (direction === 'flipStrong' ? '≤ 3s' : '> 3s') };
		case 'PB':
			// scorePB: (rating-1)*25. 4→75 (strong), 2→25 (weak). Flip threshold: 4.
			return { direction, threshold: direction === 'flipStrong' ? '≥ 4/5' : '< 3/5' };
		case 'Spec':
			// scoreSpec: 0→0, 1→50, 2→75, 3+→100. Flip strong at 2+.
			return { direction, threshold: direction === 'flipStrong' ? '≥ 2' : '0' };
		case 'QC':
			// scoreQC: presence flips to strong.
			return { direction, threshold: direction === 'flipStrong' ? '≥ 1' : '0' };
		default:
			return null;
	}
}

function flipStructure(key: string, direction: FlipDirection, videoDuration?: number): Flip | null {
	const longForm = videoDuration != null && isLongForm(videoDuration);
	switch (key) {
		case 'BC':
			// Short-form ideal 3–6, acceptable 2–7. Long-form scales with duration.
			if (longForm && videoDuration != null) {
				const idealMin = Math.max(3, Math.floor(videoDuration / 60));
				const idealMax = Math.max(idealMin + 3, Math.ceil(videoDuration / 30));
				return { direction, threshold: direction === 'flipStrong' ? `${idealMin}–${idealMax}` : `< ${idealMin} or > ${idealMax}` };
			}
			return { direction, threshold: direction === 'flipStrong' ? '3–6' : '< 3 or > 6' };
		case 'PM':
			return { direction, threshold: direction === 'flipStrong' ? '≥ 2' : '0' };
		case 'PP':
		case 'LC':
			// booleans — direction is just the opposite presence.
			return { direction, threshold: direction === 'flipStrong' ? 'present' : 'absent' };
		default:
			return null;
	}
}

function flipClarity(key: string, direction: FlipDirection, videoDuration?: number): Flip | null {
	const longForm = videoDuration != null && isLongForm(videoDuration);
	switch (key) {
		case 'WPS':
			return { direction, threshold: direction === 'flipStrong' ? '3.0–4.0 wps' : '< 3.0 or > 4.0 wps' };
		case 'SC':
			return { direction, threshold: direction === 'flipStrong' ? '≤ 2/5' : '≥ 4/5' };
		case 'TJ':
			return { direction, threshold: longForm ? (direction === 'flipStrong' ? '≤ 2' : '≥ 3') : (direction === 'flipStrong' ? '0' : '≥ 2') };
		case 'RD':
			return { direction, threshold: direction === 'flipStrong' ? '≤ 1/5' : '≥ 3/5' };
		default:
			return null;
	}
}

function flipDelivery(key: string, direction: FlipDirection): Flip | null {
	switch (key) {
		case 'LS':
		case 'NS':
			return { direction, threshold: direction === 'flipStrong' ? '≥ 4/5' : '< 3/5' };
		case 'EC':
			return { direction, threshold: direction === 'flipStrong' ? 'present' : 'absent' };
		case 'PQ':
			// Compound (fillers + pauses). No crisp single-variable threshold.
			return null;
		default:
			return null;
	}
}
