"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Upload } from "lucide-react";
import { TagInput } from "@/components/ui/TagInput";

export interface CharacterFields {
	name: string;
	traits: string[];
	personality: string;
	/**
	 * Optional pre-pinned character sheet path (set when user picks a
	 * suggested character from the product's landing page). When present,
	 * Pass 3 skips sheet generation.
	 */
	sheetStoragePath?: string;
}

export interface SuggestedCharacter {
	name: string;
	traits: string[];
	personality: string;
	sheetStoragePath: string;
	sheetSignedUrl?: string;
}

interface CharactersStepProps {
	characters: CharacterFields[];
	onChange: (next: CharacterFields[]) => void;
	onContinue: () => void;
	onBack: () => void;
	/**
	 * When true, 0 characters is a valid state (product demo mode —
	 * the product is the star, characters are narrator/mascot optional).
	 * When false (default), at least one named + personality-described
	 * character is required to continue.
	 */
	optional?: boolean;
	/**
	 * Characters Gemini spotted in the user's landing page, available for
	 * one-click reuse. Only rendered when non-empty (product demo mode).
	 */
	suggestedCharacters?: SuggestedCharacter[];
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
	optional = false,
	suggestedCharacters = [],
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
		// Slot 0 is always rendered — clear its fields instead of dropping it
		// (dropping would just cause the default empty slot to re-render anyway,
		// and this makes "Remove" feel consistent for pre-filled auto-suggestions).
		if (index === 0) {
			const copy = [...ensured];
			copy[0] = emptyCharacter();
			onChange(copy);
			return;
		}
		onChange(ensured.filter((_, i) => i !== index));
	}

	function applySuggestion(s: SuggestedCharacter) {
		// Fill the first empty slot, or slot 0 if none empty.
		const targetIndex = ensured.findIndex((c) => !c.name.trim());
		const idx = targetIndex >= 0 ? targetIndex : 0;
		updateAt(idx, {
			name: s.name,
			traits: s.traits,
			personality: s.personality,
			sheetStoragePath: s.sheetStoragePath,
		});
	}

	// Hide suggestions whose sheet is already applied to a slot.
	const appliedSheets = new Set(
		ensured.map((c) => c.sheetStoragePath).filter((p): p is string => !!p)
	);
	const unappliedSuggestions = suggestedCharacters.filter(
		(s) => !appliedSheets.has(s.sheetStoragePath)
	);

	// Slot 0 removable only when it has content (name, personality, or sheet).
	// Slot 1 always removable (it was explicitly added by the user).
	function removeHandlerFor(i: number, char: CharacterFields): (() => void) | undefined {
		if (i === 1) return () => removeAt(1);
		if (i === 0) {
			const hasContent =
				!!char.name.trim() || !!char.personality.trim() || !!char.sheetStoragePath;
			return hasContent ? () => removeAt(0) : undefined;
		}
		return undefined;
	}

	// In optional mode, users can skip characters entirely (all slots empty).
	// Any filled slot must be complete (both name and personality).
	const allEmpty = ensured.every(
		(c) => c.name.trim().length === 0 && c.personality.trim().length === 0
	);
	const filledSlotsComplete = ensured.every(
		(c) =>
			(c.name.trim().length === 0 && c.personality.trim().length === 0) ||
			(c.name.trim().length > 0 && c.personality.trim().length > 0)
	);
	const canContinue = optional
		? allEmpty || filledSlotsComplete
		: ensured.every(
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

			{unappliedSuggestions.length > 0 && (
				<div className="space-y-2">
					<span className="block text-[10px] uppercase tracking-wider text-gray-500">
						{t("characters.suggested_label")}
					</span>
					<div className="grid grid-cols-2 gap-2">
						{unappliedSuggestions.map((s, i) => (
							<button
								key={i}
								type="button"
								onClick={() => applySuggestion(s)}
								className="flex items-center gap-3 p-3 bg-[#111111] border border-gray-800 hover:border-gray-600 rounded-lg text-left transition-colors"
							>
								<div className="w-12 h-12 rounded-md overflow-hidden bg-[#0a0a0a] flex-shrink-0 flex items-center justify-center">
									{s.sheetSignedUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={s.sheetSignedUrl}
											alt={s.name}
											className="w-full h-full object-cover"
											loading="lazy"
										/>
									) : (
										<span className="text-[10px] text-gray-600">—</span>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs text-white truncate">{s.name}</p>
									<p className="text-[11px] text-gray-500 truncate">
										{s.traits.slice(0, 3).join(", ")}
									</p>
								</div>
							</button>
						))}
					</div>
					<p className="text-[10px] text-gray-600">
						{t("characters.suggested_hint")}
					</p>
				</div>
			)}

			<div className="space-y-3">
				{ensured.map((char, i) => (
					<CharacterCard
						key={i}
						index={i}
						value={char}
						onChange={(next) => updateAt(i, next)}
						onRemove={removeHandlerFor(i, char)}
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
	const fileRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [localPreview, setLocalPreview] = useState<string | null>(null);

	async function handleUploadTalent(file: File) {
		setUploadError(null);
		setUploading(true);
		try {
			const localUrl = URL.createObjectURL(file);
			setLocalPreview(localUrl);
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/animation/character-sheet/upload", {
				method: "POST",
				body: fd,
			});
			const data = await res.json();
			if (!res.ok) {
				setUploadError(data?.error ?? t("characters.talent_upload_error"));
				setLocalPreview(null);
				return;
			}
			onChange({ ...value, sheetStoragePath: data.path });
		} catch (err) {
			setUploadError(
				err instanceof Error ? err.message : t("characters.talent_upload_error")
			);
			setLocalPreview(null);
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
			<div className="flex items-center justify-between mb-3">
				<span className="text-[10px] uppercase tracking-wider text-orange-400">
					{t("characters.slot_label", { n: index + 1 })}
				</span>
				<div className="flex items-center gap-2">
					{value.sheetStoragePath && (
						<span className="text-[10px] uppercase tracking-wider text-gray-500">
							{t("characters.sheet_pinned")}
						</span>
					)}
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
			</div>

			<div className="space-y-3">
				{/* TALENT PHOTO — upload a real person's photo to pin as the
				    character sheet. Useful for photoreal beauty / creator /
				    commercial shoots. Skips Pass 3's AI sheet generation. */}
				<div className="space-y-1">
					<label className="block text-[10px] uppercase tracking-wider text-gray-500">
						{t("characters.talent_photo_label")}
					</label>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => fileRef.current?.click()}
							disabled={uploading}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] border border-gray-800 hover:border-gray-600 rounded text-[11px] uppercase tracking-wider text-gray-300 hover:text-white transition-colors disabled:opacity-50"
						>
							{uploading ? (
								<>
									<Loader2 className="w-3 h-3 animate-spin" />
									<span>{t("characters.talent_uploading")}</span>
								</>
							) : (
								<>
									<Upload className="w-3 h-3" />
									<span>
										{value.sheetStoragePath
											? t("characters.talent_replace")
											: t("characters.talent_upload")}
									</span>
								</>
							)}
						</button>
						<input
							ref={fileRef}
							type="file"
							accept="image/png,image/jpeg,image/webp"
							className="sr-only"
							onChange={(e) => {
								const f = e.target.files?.[0];
								if (f) void handleUploadTalent(f);
								e.target.value = "";
							}}
						/>
						{localPreview && (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={localPreview}
								alt={t("characters.talent_photo_label")}
								className="w-10 h-10 object-cover rounded border border-gray-700"
							/>
						)}
						<span className="text-[10px] text-gray-600">
							{t("characters.talent_hint")}
						</span>
					</div>
					{uploadError && (
						<p role="alert" aria-live="polite" className="text-[11px] text-red-400">
							{uploadError}
						</p>
					)}
				</div>

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
