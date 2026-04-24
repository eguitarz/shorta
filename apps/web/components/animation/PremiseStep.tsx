"use client";

import { useTranslations } from "next-intl";

export interface PremiseFields {
	logline: string;
	tone: string;
	styleAnchor: string;
	sceneAnchor: string;
}

const TONE_OPTIONS = [
	"funny",
	"heartwarming",
	"chaotic",
	"epic",
	"mysterious",
	"absurd",
] as const;

const STYLE_OPTIONS = [
	// Photoreal — for real-person product promos (cosmetics, skincare, physical goods).
	// Short label; expandStyleAnchor() on the server injects the full photoreal prompt.
	"Photoreal beauty",
	"Photoreal creator",
	"Photoreal studio ad",
	// Animated — for stylized demos and narrative shorts.
	"Pixar-ish 3D",
	"Ghibli-style 2D",
	"Low-poly stylized",
	"Claymation",
	"Pixel art",
	"Anime",
	"Flat illustration",
] as const;

interface PremiseStepProps {
	fields: PremiseFields;
	onChange: (next: PremiseFields) => void;
	/** Called when user clicks Continue. The wizard validates min-length server-side too. */
	onContinue: () => void;
	onBack?: () => void;
	/**
	 * Optional override for the primary-action button label, as an
	 * `animation.wizard.*` translation key. Defaults to `nav.continue`.
	 * The Ad Generator final step overrides with `nav.generate_ad` so
	 * the button reads "Generate the ad" instead of a generic "Continue".
	 */
	ctaKey?: string;
	/** Optional disabled-state label, mirrors ctaKey. Defaults to `nav.generating`. */
	ctaBusyKey?: string;
	busy?: boolean;
}

/**
 * Wizard Step 1: Premise.
 * Per Pass 1A (eng review): logline is the HERO, everything else is secondary.
 *
 * Layout:
 *   - Title "What's the story?" (Space Grotesk text-lg)
 *   - Big logline textarea (4 rows min)
 *   - Compact row below: TONE chips + STYLE chips + SETTING text input
 */
export function PremiseStep({
	fields,
	onChange,
	onContinue,
	onBack,
	ctaKey = "nav.continue",
	ctaBusyKey = "nav.generating",
	busy = false,
}: PremiseStepProps) {
	const t = useTranslations("animation.wizard");

	const loglineValid = fields.logline.trim().length >= 10;
	const canContinue =
		loglineValid &&
		fields.tone.trim().length > 0 &&
		fields.styleAnchor.trim().length > 0 &&
		fields.sceneAnchor.trim().length > 0;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-[var(--font-space-grotesk)] text-lg text-white">
					{t("premise.title")}
				</h2>
				<p className="text-xs text-gray-400 mt-1">{t("premise.subtitle")}</p>
			</div>

			{/* LOGLINE — the hero */}
			<div className="space-y-1.5">
				<label
					htmlFor="anim-logline"
					className="block text-[10px] uppercase tracking-wider text-gray-500"
				>
					{t("premise.logline_label")}
				</label>
				<textarea
					id="anim-logline"
					rows={4}
					value={fields.logline}
					onChange={(e) => onChange({ ...fields, logline: e.target.value })}
					placeholder={t("premise.logline_placeholder")}
					className="w-full bg-[#111] border border-gray-800 focus:border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none"
					maxLength={500}
				/>
				<div className="flex justify-between text-[11px] text-gray-600">
					<span className={loglineValid ? "text-green-400" : ""}>
						{loglineValid ? t("premise.logline_ok") : t("premise.logline_hint")}
					</span>
					<span>{fields.logline.length}/500</span>
				</div>
			</div>

			{/* Compact secondary row: tone / style / scene */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<ChipPicker
					label={t("premise.tone_label")}
					options={TONE_OPTIONS}
					value={fields.tone}
					onChange={(v) => onChange({ ...fields, tone: v })}
				/>
				<ChipPicker
					label={t("premise.style_label")}
					options={STYLE_OPTIONS}
					value={fields.styleAnchor}
					onChange={(v) => onChange({ ...fields, styleAnchor: v })}
				/>
				<div className="space-y-1.5">
					<label
						htmlFor="anim-scene"
						className="block text-[10px] uppercase tracking-wider text-gray-500"
					>
						{t("premise.scene_label")}
					</label>
					<input
						id="anim-scene"
						type="text"
						value={fields.sceneAnchor}
						onChange={(e) => onChange({ ...fields, sceneAnchor: e.target.value })}
						placeholder={t("premise.scene_placeholder")}
						className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
						maxLength={120}
					/>
				</div>
			</div>

			{/* Nav */}
			<div className="flex items-center justify-between pt-4">
				<button
					type="button"
					onClick={onBack}
					className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-40"
					disabled={!onBack}
				>
					{t("nav.back")}
				</button>
				<button
					type="button"
					onClick={onContinue}
					disabled={!canContinue || busy}
					className="bg-white text-black rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-1 ring-gray-500 ring-offset-2 ring-offset-[#0a0a0a]"
				>
					{busy ? t(ctaBusyKey) : t(ctaKey)}
				</button>
			</div>
		</div>
	);
}

interface ChipPickerProps {
	label: string;
	options: readonly string[];
	value: string;
	onChange: (next: string) => void;
}

function ChipPicker({ label, options, value, onChange }: ChipPickerProps) {
	return (
		<div className="space-y-1.5">
			<span className="block text-[10px] uppercase tracking-wider text-gray-500">
				{label}
			</span>
			<div className="flex flex-wrap gap-1.5">
				{options.map((opt) => {
					const active = value === opt;
					return (
						<button
							key={opt}
							type="button"
							onClick={() => onChange(opt)}
							className={`px-2 py-0.5 rounded text-[11px] transition-colors focus-visible:ring-1 ring-gray-500 ring-offset-2 ring-offset-[#0a0a0a] ${
								active
									? "bg-white text-black"
									: "bg-gray-800 text-gray-300 hover:bg-gray-700"
							}`}
							aria-pressed={active}
						>
							{opt}
						</button>
					);
				})}
			</div>
		</div>
	);
}
