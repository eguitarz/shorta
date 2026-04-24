"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, BookOpen, Sparkles } from "lucide-react";
import type { BeatIssueEvidence } from "./evidence-types";

export type { BeatIssueEvidence, RuleEvidence, AIEvidence } from "./evidence-types";

interface EvidencePanelProps {
	evidence: BeatIssueEvidence | null;
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
	const t = useTranslations("analyzer.evidence");
	const [expanded, setExpanded] = useState(false);

	if (!evidence) return null;
	if (evidence.kind === "ai" && !evidence.transcriptSnippet && !evidence.reasoning) {
		return null;
	}

	const Icon = evidence.kind === "rule" ? BookOpen : Sparkles;

	return (
		<div className="mt-3 border-t border-gray-800 pt-2">
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-orange-400 transition-colors group"
				aria-expanded={expanded}
			>
				<Icon className="w-3 h-3" />
				<span className="group-hover:underline">{t("toggle")}</span>
				{expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
			</button>

			{expanded && (
				<div className="mt-2 space-y-2 text-[11px] text-gray-300 bg-gray-900/40 border border-gray-800 rounded-md p-3">
					{evidence.kind === "rule" ? (
						<RuleEvidenceBody
							ruleName={evidence.ruleName}
							description={evidence.description}
							check={evidence.check}
							goodExample={evidence.goodExample}
							t={t}
						/>
					) : (
						<AIEvidenceBody
							startTime={evidence.startTime}
							transcriptSnippet={evidence.transcriptSnippet}
							reasoning={evidence.reasoning}
							falsifier={evidence.falsifier}
							t={t}
						/>
					)}
				</div>
			)}
		</div>
	);
}

function RuleEvidenceBody({
	ruleName,
	description,
	check,
	goodExample,
	t,
}: {
	ruleName: string;
	description: string;
	check: string;
	goodExample?: string;
	t: ReturnType<typeof useTranslations>;
}) {
	return (
		<>
			<div>
				<span className="text-[10px] uppercase tracking-wider text-gray-500">{t("rule")}</span>
				<p className="text-gray-200 font-medium">{ruleName}</p>
			</div>
			<div>
				<span className="text-[10px] uppercase tracking-wider text-gray-500">{t("why")}</span>
				<p>{description}</p>
			</div>
			<div>
				<span className="text-[10px] uppercase tracking-wider text-gray-500">{t("howChecked")}</span>
				<p className="text-gray-400 italic">{check}</p>
			</div>
			{goodExample && (
				<div>
					<span className="text-[10px] uppercase tracking-wider text-green-500">{t("goodExample")}</span>
					<p className="text-green-300">{goodExample}</p>
				</div>
			)}
		</>
	);
}

function AIEvidenceBody({
	startTime,
	transcriptSnippet,
	reasoning,
	falsifier,
	t,
}: {
	startTime?: number;
	transcriptSnippet?: string;
	reasoning?: string;
	falsifier?: string;
	t: ReturnType<typeof useTranslations>;
}) {
	return (
		<>
			{transcriptSnippet && (
				<div>
					<span className="text-[10px] uppercase tracking-wider text-gray-500">
						{t("transcriptAt", { time: startTime != null ? formatSeconds(startTime) : "—" })}
					</span>
					<p className="text-gray-200 italic">"{transcriptSnippet}"</p>
				</div>
			)}
			{reasoning && (
				<div>
					<span className="text-[10px] uppercase tracking-wider text-gray-500">{t("reasoning")}</span>
					<p>{reasoning}</p>
				</div>
			)}
			{falsifier && (
				<div>
					<span className="text-[10px] uppercase tracking-wider text-amber-500">{t("falsifierAi")}</span>
					<p className="text-amber-200/90">↪ {falsifier}</p>
				</div>
			)}
		</>
	);
}

function formatSeconds(s: number): string {
	const mins = Math.floor(s / 60);
	const secs = Math.floor(s % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
