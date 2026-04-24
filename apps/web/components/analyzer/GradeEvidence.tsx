"use client";

import { useTranslations } from "next-intl";
import { buildDrivers, topStrengths, topWeaknesses, type Category } from "@/lib/scoring/grade-evidence";
import { buildFalsifier } from "@/lib/scoring/falsifier";
import type { VideoSignals, ScoreBreakdown } from "@/lib/scoring/types";

interface GradeEvidenceProps {
	category: Category;
	signals: VideoSignals[Category] | undefined;
	breakdown: ScoreBreakdown[Category] | undefined;
	/** Video duration in seconds. Used to pick short-form vs long-form flip thresholds. */
	videoDuration?: number;
}

export function GradeEvidence({ category, signals, breakdown, videoDuration }: GradeEvidenceProps) {
	const t = useTranslations("analyzer.evidence.grade");
	const tFalsifier = useTranslations("analyzer.evidence.falsifier");

	if (!signals || !breakdown) return null;

	const drivers = buildDrivers(category, signals, breakdown);
	const weaknesses = topWeaknesses(drivers);
	const strengths = topStrengths(drivers);

	if (weaknesses.length === 0 && strengths.length === 0) return null;

	return (
		<div className="mb-3 rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2 text-[11px] space-y-1.5">
			<div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
				<span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
				{t("heading")}
			</div>

			{weaknesses.length > 0 && (
				<div className="space-y-1">
					<p className="text-gray-300">
						<span className="text-red-400">↓ {t("pulledDown")}:</span>{" "}
						{weaknesses.map((d, i) => (
							<span key={d.key}>
								{i > 0 && ", "}
								<span className="font-mono text-gray-400">{t(`signals.${category}.${d.key}`)}</span>{" "}
								<span className="text-gray-500">({d.value})</span>
							</span>
						))}
					</p>
					{weaknesses.map((d) => {
						const flip = buildFalsifier(category, d.key, signals, d.score, videoDuration);
						if (!flip) return null;
						return (
							<p key={`flip-${d.key}`} className="pl-3 text-[10px] text-gray-500">
								↪ {tFalsifier(flip.direction, {
									driver: t(`signals.${category}.${d.key}`),
									current: d.value,
									threshold: flip.threshold,
								})}
							</p>
						);
					})}
				</div>
			)}

			{strengths.length > 0 && (
				<div className="space-y-1">
					<p className="text-gray-300">
						<span className="text-green-400">↑ {t("pulledUp")}:</span>{" "}
						{strengths.map((d, i) => (
							<span key={d.key}>
								{i > 0 && ", "}
								<span className="font-mono text-gray-400">{t(`signals.${category}.${d.key}`)}</span>{" "}
								<span className="text-gray-500">({d.value})</span>
							</span>
						))}
					</p>
					{strengths.map((d) => {
						const flip = buildFalsifier(category, d.key, signals, d.score, videoDuration);
						if (!flip) return null;
						return (
							<p key={`flip-${d.key}`} className="pl-3 text-[10px] text-gray-500">
								↪ {tFalsifier(flip.direction, {
									driver: t(`signals.${category}.${d.key}`),
									current: d.value,
									threshold: flip.threshold,
								})}
							</p>
						);
					})}
				</div>
			)}
		</div>
	);
}
