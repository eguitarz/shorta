"use client";

import { useTranslations } from "next-intl";
import { TagInput } from "@/components/ui/TagInput";

export interface CharacterFields {
	name: string;
	traits: string[];
	personality: string;
}

interface CharactersStepProps {
	characters: CharacterFields[];
	onChange: (next: CharacterFields[]) => void;
	onContinue: () => void;
	onBack: () => void;
}

const MAX_CHARACTERS = 2;

/**
 * Wizard Step 2: Characters.
 * Per Pass 1B statement (eng review): character cards are the stars.
 *
 * Layout:
 *   - Title "Who's in this story?"
 *   - 2 stacked card slots. Filled card: NAME / APPEARANCE (TagInput) / PERSONALITY.
 *   - Empty second slot: "+ Add second character (optional)" dashed card.
 *
 * No icons, no colored circles above the form (per Pass 4 AI-slop mitigation).
 */
export function CharactersStep({
	characters,
	onChange,
	onContinue,
	onBack,
}: CharactersStepProps) {
	const t = useTranslations("animation.wizard");

	// Always render one slot; optionally a second.
	const ensured = characters.length > 0 ? characters : [emptyCharacter()];
	const hasSecond = ensured.length >= 2;

	function updateAt(index: number, next: CharacterFields) {
		const copy = [...ensured];
		copy[index] = next;
		onChange(copy);
	}

	function addSecond() {
		if (ensured.length >= MAX_CHARACTERS) return;
		onChange([...ensured, emptyCharacter()]);
	}

	function removeAt(index: number) {
		onChange(ensured.filter((_, i) => i !== index));
	}

	const canContinue = ensured.every(
		(c) => c.name.trim().length > 0 && c.personality.trim().length > 0
	);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-[var(--font-space-grotesk)] text-lg text-white">
					{t("characters.title")}
				</h2>
				<p className="text-xs text-gray-400 mt-1">{t("characters.subtitle")}</p>
			</div>

			<div className="space-y-3">
				{ensured.map((char, i) => (
					<CharacterCard
						key={i}
						index={i}
						value={char}
						onChange={(next) => updateAt(i, next)}
						onRemove={i === 1 ? () => removeAt(1) : undefined}
					/>
				))}

				{!hasSecond && (
					<button
						type="button"
						onClick={addSecond}
						className="block w-full border border-dashed border-gray-700 rounded-xl p-4 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors text-center focus-visible:ring-1 ring-gray-500"
					>
						+ {t("characters.add_second")}
					</button>
				)}
			</div>

			<div className="flex items-center justify-between pt-4">
				<button
					type="button"
					onClick={onBack}
					className="text-xs text-gray-500 hover:text-gray-300"
				>
					{t("nav.back")}
				</button>
				<button
					type="button"
					onClick={onContinue}
					disabled={!canContinue}
					className="bg-white text-black rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-1 ring-gray-500 ring-offset-2 ring-offset-[#0a0a0a]"
				>
					{t("nav.continue")}
				</button>
			</div>
		</div>
	);
}

interface CharacterCardProps {
	index: number;
	value: CharacterFields;
	onChange: (next: CharacterFields) => void;
	/** Remove button only shown for slot 2. */
	onRemove?: () => void;
}

function CharacterCard({ index, value, onChange, onRemove }: CharacterCardProps) {
	const t = useTranslations("animation.wizard");

	return (
		<div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
			<div className="flex items-center justify-between mb-3">
				<span className="text-[10px] uppercase tracking-wider text-orange-400">
					{t("characters.slot_label", { n: index + 1 })}
				</span>
				{onRemove && (
					<button
						type="button"
						onClick={onRemove}
						className="text-[11px] text-gray-500 hover:text-red-400 transition-colors"
					>
						{t("characters.remove")}
					</button>
				)}
			</div>

			<div className="space-y-3">
				{/* NAME */}
				<div className="space-y-1">
					<label
						htmlFor={`char-${index}-name`}
						className="block text-[10px] uppercase tracking-wider text-gray-500"
					>
						{t("characters.name_label")}
					</label>
					<input
						id={`char-${index}-name`}
						type="text"
						value={value.name}
						onChange={(e) => onChange({ ...value, name: e.target.value })}
						placeholder={t("characters.name_placeholder")}
						className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none"
						maxLength={60}
					/>
				</div>

				{/* APPEARANCE — TagInput */}
				<div className="space-y-1">
					<label className="block text-[10px] uppercase tracking-wider text-gray-500">
						{t("characters.appearance_label")}
					</label>
					<TagInput
						value={value.traits}
						onChange={(next) => onChange({ ...value, traits: next })}
						placeholder={t("characters.appearance_placeholder")}
						maxTags={8}
						ariaLabel={t("characters.appearance_label")}
					/>
					<p className="text-[11px] text-gray-600">
						{t("characters.appearance_hint")}
					</p>
				</div>

				{/* PERSONALITY */}
				<div className="space-y-1">
					<label
						htmlFor={`char-${index}-personality`}
						className="block text-[10px] uppercase tracking-wider text-gray-500"
					>
						{t("characters.personality_label")}
					</label>
					<input
						id={`char-${index}-personality`}
						type="text"
						value={value.personality}
						onChange={(e) => onChange({ ...value, personality: e.target.value })}
						placeholder={t("characters.personality_placeholder")}
						className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
						maxLength={200}
					/>
				</div>
			</div>
		</div>
	);
}

function emptyCharacter(): CharacterFields {
	return { name: "", traits: [], personality: "" };
}
