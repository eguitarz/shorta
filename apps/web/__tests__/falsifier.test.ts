import { describe, it, expect } from 'vitest';
import { buildFalsifier } from '../lib/scoring/falsifier';
import type { VideoSignals } from '../lib/scoring/types';

const hookSignals: VideoSignals['hook'] = { TTClaim: 3.2, PB: 2, Spec: 0, QC: 0 };
const structureSignals: VideoSignals['structure'] = { BC: 2, PM: 0, PP: false, LC: false };
const claritySignals: VideoSignals['clarity'] = { wordCount: 50, duration: 30, SC: 4, TJ: 2, RD: 4 };
const deliverySignals: VideoSignals['delivery'] = { LS: 2, NS: 2, pauseCount: 0, fillerCount: 8, EC: false };

describe('buildFalsifier — hook category', () => {
	it('weak TTClaim on short-form flips at ≤ 3s', () => {
		const flip = buildFalsifier('hook', 'TTClaim', hookSignals, 30);
		expect(flip).toEqual({ direction: 'flipStrong', threshold: '≤ 3s' });
	});

	it('weak TTClaim on long-form (duration > 90s) flips at ≤ 10s', () => {
		const flip = buildFalsifier('hook', 'TTClaim', hookSignals, 30, 180);
		expect(flip).toEqual({ direction: 'flipStrong', threshold: '≤ 10s' });
	});

	it('strong TTClaim drops at > 3s (short-form)', () => {
		const flip = buildFalsifier('hook', 'TTClaim', { ...hookSignals, TTClaim: 0.5 }, 90);
		expect(flip).toEqual({ direction: 'flipWeak', threshold: '> 3s' });
	});

	it('weak PB flips at ≥ 4/5', () => {
		const flip = buildFalsifier('hook', 'PB', hookSignals, 20);
		expect(flip).toEqual({ direction: 'flipStrong', threshold: '≥ 4/5' });
	});

	it('weak Spec flips at ≥ 2', () => {
		const flip = buildFalsifier('hook', 'Spec', hookSignals, 0);
		expect(flip).toEqual({ direction: 'flipStrong', threshold: '≥ 2' });
	});
});

describe('buildFalsifier — structure category', () => {
	it('weak BC on short-form flips in range 3–6', () => {
		const flip = buildFalsifier('structure', 'BC', structureSignals, 20);
		expect(flip).toEqual({ direction: 'flipStrong', threshold: '3–6' });
	});

	it('weak BC on long-form scales threshold with duration', () => {
		// duration 180s → idealMin=3, idealMax=6
		const flip = buildFalsifier('structure', 'BC', structureSignals, 20, 180);
		expect(flip?.threshold).toMatch(/^\d+–\d+$/);
	});

	it('weak PP (boolean) flips to "present"', () => {
		const flip = buildFalsifier('structure', 'PP', structureSignals, 0);
		expect(flip).toEqual({ direction: 'flipStrong', threshold: 'present' });
	});
});

describe('buildFalsifier — clarity category', () => {
	it('weak WPS falls back to the 3.0–4.0 wps window', () => {
		const flip = buildFalsifier('clarity', 'WPS', claritySignals, 20);
		expect(flip).toEqual({ direction: 'flipStrong', threshold: '3.0–4.0 wps' });
	});

	it('strong SC drops at ≥ 4/5', () => {
		const flip = buildFalsifier('clarity', 'SC', claritySignals, 90);
		expect(flip).toEqual({ direction: 'flipWeak', threshold: '≥ 4/5' });
	});
});

describe('buildFalsifier — delivery category', () => {
	it('weak LS flips at ≥ 4/5', () => {
		const flip = buildFalsifier('delivery', 'LS', deliverySignals, 20);
		expect(flip).toEqual({ direction: 'flipStrong', threshold: '≥ 4/5' });
	});

	it('compound PQ has no single-variable threshold → null', () => {
		const flip = buildFalsifier('delivery', 'PQ', deliverySignals, 20);
		expect(flip).toBeNull();
	});
});

describe('buildFalsifier — edge cases', () => {
	it('returns null when status is "ok" (score 40-69) to avoid near-boundary noise', () => {
		const flip = buildFalsifier('hook', 'TTClaim', hookSignals, 55);
		expect(flip).toBeNull();
	});

	it('returns null when signals are undefined', () => {
		expect(buildFalsifier('hook', 'TTClaim', undefined, 20)).toBeNull();
	});

	it('returns null for an unknown signal key', () => {
		expect(buildFalsifier('hook', 'NotARealKey', hookSignals, 20)).toBeNull();
	});
});
