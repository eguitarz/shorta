"use client";

import { useTranslations } from "next-intl";
import { ARC_TEMPLATES } from "@/lib/animation/arc-templates";
import type { ArcTemplateId } from "@/lib/types/beat";

export interface ArcPayoffFields {
	arcTemplate: ArcTemplateId;
	arcCustomDescription?: string;
	payoff: string;
}

interface ArcPayoffStepProps {
	fields: ArcPayoffFields;
	onChange: (next: ArcPayoffFields) => void;
	onSubmit: () => void;
	onBack: () => void;
	submitting?: boolean;
	/** Estimated credit cost to show near the submit button. */
	estimatedCredits?: number;
}

/**
 * Wizard Step 3: Arc + Payoff.
 * Per Pass 1B statement (eng review): payoff textarea is the hero (creative act),
 * arc template rows live above as the framework selector.
 *
 * Arc picker is a single-column list of rows (NOT a 3×2 grid per Pass 4 AI-slop
 * mitigation). Each row uses the ScoreAccordion pattern.
 * A 7th row "+ Custom arc" expands a textarea when selected.
 */
export function ArcPayoffStep({
	fields,
	onChange,
	onSubmit,
	onBack,
	submitting = false,
	estimatedCredits,
}: ArcPayoffStepProps) {
	const t = useTranslations("animation.wizard");

	const payoffValid = fields.payoff.trim().length >= 5;
	const customValid =
		fields.arcTemplate !== "custom" ||
		(fields.arcCustomDescription?.trim().length ?? 0) >= 10;

	const canSubmit = payoffValid && customValid && !submitting;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-[var(--font-space-grotesk)] text-lg text-white">
					{t("arc.title")}
				</h2>
				<p className="text-xs text-gray-400 mt-1">{t("arc.subtitle")}</p>
			</div>

			{/* Arc template rows */}
			<div
				className="space-y-2"
				role="radiogroup"
				aria-label={t("arc.template_label")}
			>
				<span className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
					{t("arc.template_label")}
				</span>

				{ARC_TEMPLATES.map((tpl) => {
					const active = fields.arcTemplate === tpl.id;
					return (
						<button
							key={tpl.id}
							type="button"
							role="radio"
							aria-checked={active}
							onClick={() => onChange({ ...fields, arcTemplate: tpl.id })}
							className={`w-full text-left bg-[#1a1a1a] border rounded-xl p-3 transition-colors focus-visible:ring-1 ring-gray-500 ring-offset-2 ring-offset-[#0a0a0a] ${
								active
									? "border-white bg-[#141414]"
									: "border-gray-800 hover:border-gray-700"
							}`}
						>
							<div className="flex items-baseline justify-between gap-3">
								<span
									className={`font-[var(--font-space-grotesk)] text-sm ${
										active ? "text-white" : "text-gray-200"
									}`}
								>
									{tpl.label}
								</span>
								<span className="text-[10px] text-gray-600 uppercase tracking-wider shrink-0">
									{tpl.roles.length}{" "}
									{t("arc.roles_word", { count: tpl.roles.length })}
								</span>
							</div>
							<p className="text-xs text-gray-400 mt-1">{tpl.description}</p>
						</button>
					);
				})}

				{/* Custom arc */}
				<button
					type="button"
					role="radio"
					aria-checked={fields.arcTemplate === "custom"}
					onClick={() => onChange({ ...fields, arcTemplate: "custom" })}
					className={`w-full text-left bg-[#1a1a1a] border rounded-xl p-3 transition-colors focus-visible:ring-1 ring-gray-500 ring-offset-2 ring-offset-[#0a0a0a] ${
						fields.arcTemplate === "custom"
							? "border-white bg-[#141414]"
							: "border-gray-800 hover:border-gray-700 border-dashed"
					}`}
				>
					<span
						className={`font-[var(--font-space-grotesk)] text-sm ${
							fields.arcTemplate === "custom" ? "text-white" : "text-gray-200"
						}`}
					>
						+ {t("arc.custom_label")}
					</span>
					<p className="text-xs text-gray-400 mt-1">{t("arc.custom_description")}</p>
				</button>

				{/* Custom arc textarea — only visible when selected */}
				{fields.arcTemplate === "custom" && (
					<div className="pt-1">
						<textarea
							rows={3}
							value={fields.arcCustomDescription ?? ""}
							onChange={(e) =>
								onChange({ ...fields, arcCustomDescription: e.target.value })
							}
							placeholder={t("arc.custom_placeholder")}
							className="w-full bg-[#111] border border-gray-800 focus:border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 resize-none focus:outline-none"
							maxLength={300}
						/>
						<p className="text-[11px] text-gray-600 mt-1">
							{t("arc.custom_hint")}
						</p>
					</div>
				)}
			</div>

			{/* PAYOFF — the hero */}
			<div className="space-y-1.5">
				<label
					htmlFor="anim-payoff"
					className="block text-[10px] uppercase tracking-wider text-gray-500"
				>
					{t("arc.payoff_label")}
				</label>
				<textarea
					id="anim-payoff"
					rows={3}
					value={fields.payoff}
					onChange={(e) => onChange({ ...fields, payoff: e.target.value })}
					placeholder={t("arc.payoff_placeholder")}
					className="w-full bg-[#111] border border-gray-800 focus:border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none"
					maxLength={300}
				/>
				<p className="text-[11px] text-gray-600">
					{payoffValid ? t("arc.payoff_ok") : t("arc.payoff_hint")}
				</p>
			</div>

			<div className="flex items-center justify-between pt-4">
				<button
					type="button"
					onClick={onBack}
					className="text-xs text-gray-500 hover:text-gray-300"
				>
					{t("nav.back")}
				</button>

				<div className="flex items-center gap-3">
					{typeof estimatedCredits === "number" && (
						<span className="text-[11px] text-gray-500 font-mono tabular-nums">
							~{estimatedCredits} {t("nav.credits")}
						</span>
					)}
					<button
						type="button"
						onClick={onSubmit}
						disabled={!canSubmit}
						className="bg-white text-black rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-1 ring-gray-500 ring-offset-2 ring-offset-[#0a0a0a]"
					>
						{submitting ? t("nav.generating") : t("nav.generate")}
					</button>
				</div>
			</div>
		</div>
	);
}
