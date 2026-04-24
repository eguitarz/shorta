import { describe, it, expect } from 'vitest';
import { buildDrivers, topWeaknesses, topStrengths } from '../lib/scoring/grade-evidence';
import type { VideoSignals, ScoreBreakdown } from '../lib/scoring/types';

const baseSignals: VideoSignals = {
	hook: { TTClaim: 3.2, PB: 1, Spec: 0, QC: 0 },
	structure: { BC: 5, PM: 2, PP: true, LC: false },
	clarity: { wordCount: 120, duration: 30, SC: 2, TJ: 1, RD: 1 },
	delivery: { LS: 4, NS: 4, pauseCount: 2, fillerCount: 3, EC: true },
};

const baseBreakdown: ScoreBreakdown = {
	hook: { TTClaim: 30, PB: 0, Spec: 0, QC: 0 },
	structure: { BC: 80, PM: 75, PP: 100, LC: 0 },
	clarity: { WPS: 90, SC: 75, TJ: 70, RD: 80 },
	delivery: { LS: 80, NS: 80, PQ: 50, EC: 100 },
};

describe('grade-evidence', () => {
	it('builds four drivers for hook with TTClaim flagged weak', () => {
		const drivers = buildDrivers('hook', baseSignals.hook, baseBreakdown.hook);
		expect(drivers).toHaveLength(4);
		const ttclaim = drivers.find((d) => d.key === 'TTClaim');
		expect(ttclaim?.status).toBe('weak');
		expect(ttclaim?.value).toBe('3.2s');
	});

	it('returns [] when signals or breakdown are missing', () => {
		expect(buildDrivers('hook', undefined, baseBreakdown.hook)).toEqual([]);
		expect(buildDrivers('hook', baseSignals.hook, undefined)).toEqual([]);
	});

	it('ranks topWeaknesses by ascending score with limit 2', () => {
		const drivers = buildDrivers('hook', baseSignals.hook, baseBreakdown.hook);
		const weak = topWeaknesses(drivers);
		expect(weak).toHaveLength(2);
		// All three (PB, Spec, QC) score 0; any two of them qualify, sort is stable.
		expect(weak.every((d) => d.status === 'weak')).toBe(true);
	});

	it('ranks topStrengths by descending score with limit 2', () => {
		const drivers = buildDrivers('structure', baseSignals.structure, baseBreakdown.structure);
		const strong = topStrengths(drivers);
		expect(strong[0].key).toBe('PP'); // PP: 100 tops
		expect(strong.every((d) => d.status === 'strong')).toBe(true);
	});

	it('computes WPS value for clarity from wordCount/duration', () => {
		const drivers = buildDrivers('clarity', baseSignals.clarity, baseBreakdown.clarity);
		const wps = drivers.find((d) => d.key === 'WPS');
		// 120 words / 30 seconds = 4.0 wps
		expect(wps?.value).toBe('4.0 wps');
	});

	it('handles extreme-signal case: all-strong hook', () => {
		const allStrong = { TTClaim: 100, PB: 100, Spec: 100, QC: 100 };
		const drivers = buildDrivers('hook', { TTClaim: 0.5, PB: 5, Spec: 3, QC: 1 }, allStrong);
		expect(topWeaknesses(drivers)).toEqual([]);
		expect(topStrengths(drivers)).toHaveLength(2);
	});
});
