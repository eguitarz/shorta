import type { VideoSignals, ScoreBreakdown } from './types';

export type Driver = {
	key: string;
	value: string;
	score: number;
	status: 'strong' | 'ok' | 'weak';
};

export type Category = 'hook' | 'structure' | 'clarity' | 'delivery';

function classify(score: number): Driver['status'] {
	if (score >= 70) return 'strong';
	if (score >= 40) return 'ok';
	return 'weak';
}

function formatBool(value: boolean): string {
	return value ? 'yes' : 'no';
}

export function buildDrivers(
	category: Category,
	signals: VideoSignals[Category] | undefined,
	breakdown: ScoreBreakdown[Category] | undefined,
): Driver[] {
	if (!signals || !breakdown) return [];

	switch (category) {
		case 'hook': {
			const s = signals as VideoSignals['hook'];
			const b = breakdown as ScoreBreakdown['hook'];
			return [
				{ key: 'TTClaim', value: `${s.TTClaim}s`, score: b.TTClaim, status: classify(b.TTClaim) },
				{ key: 'PB', value: `${s.PB}/5`, score: b.PB, status: classify(b.PB) },
				{ key: 'Spec', value: String(s.Spec), score: b.Spec, status: classify(b.Spec) },
				{ key: 'QC', value: String(s.QC), score: b.QC, status: classify(b.QC) },
			];
		}
		case 'structure': {
			const s = signals as VideoSignals['structure'];
			const b = breakdown as ScoreBreakdown['structure'];
			return [
				{ key: 'BC', value: String(s.BC), score: b.BC, status: classify(b.BC) },
				{ key: 'PM', value: String(s.PM), score: b.PM, status: classify(b.PM) },
				{ key: 'PP', value: formatBool(s.PP), score: b.PP, status: classify(b.PP) },
				{ key: 'LC', value: formatBool(s.LC), score: b.LC, status: classify(b.LC) },
			];
		}
		case 'clarity': {
			const s = signals as VideoSignals['clarity'];
			const b = breakdown as ScoreBreakdown['clarity'];
			const wps = s.duration > 0 ? (s.wordCount / s.duration).toFixed(1) : '0';
			return [
				{ key: 'WPS', value: `${wps} wps`, score: b.WPS, status: classify(b.WPS) },
				{ key: 'SC', value: `${s.SC}/5`, score: b.SC, status: classify(b.SC) },
				{ key: 'TJ', value: String(s.TJ), score: b.TJ, status: classify(b.TJ) },
				{ key: 'RD', value: `${s.RD}/5`, score: b.RD, status: classify(b.RD) },
			];
		}
		case 'delivery': {
			const s = signals as VideoSignals['delivery'];
			const b = breakdown as ScoreBreakdown['delivery'];
			return [
				{ key: 'LS', value: `${s.LS}/5`, score: b.LS, status: classify(b.LS) },
				{ key: 'NS', value: `${s.NS}/5`, score: b.NS, status: classify(b.NS) },
				{ key: 'PQ', value: `fillers:${s.fillerCount} pauses:${s.pauseCount}`, score: b.PQ, status: classify(b.PQ) },
				{ key: 'EC', value: formatBool(s.EC), score: b.EC, status: classify(b.EC) },
			];
		}
	}
}

export function topWeaknesses(drivers: Driver[], limit = 2): Driver[] {
	return [...drivers]
		.filter((d) => d.status === 'weak')
		.sort((a, b) => a.score - b.score)
		.slice(0, limit);
}

export function topStrengths(drivers: Driver[], limit = 2): Driver[] {
	return [...drivers]
		.filter((d) => d.status === 'strong')
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);
}
