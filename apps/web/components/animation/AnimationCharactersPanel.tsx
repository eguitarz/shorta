"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, RefreshCw, Upload, X } from "lucide-react";
import { TagInput } from "@/components/ui/TagInput";
import type { AnimationCharacter } from "@/lib/types/beat";

interface Props {
	storyboardId: string;
	/** Called when the user clicks "Regenerate images with current characters". */
	onRegenerateImages: () => void;
	regenerating: boolean;
}

/**
 * Characters panel on /storyboard/generate/[id] for animation storyboards.
 * Lets the user view + edit each character's name / traits / personality /
 * talent photo, then click "Regenerate images" to re-run Pass 4 against the
 * existing script with the new character identity.
 */
export function AnimationCharactersPanel({
	storyboardId,
	onRegenerateImages,
	regenerating,
}: Props) {
	const [characters, setCharacters] = useState<AnimationCharacter[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [dirty, setDirty] = useState(false); // edited since last regen

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(
					`/api/animation/characters?storyboardId=${encodeURIComponent(storyboardId)}`,
					{ credentials: "include" }
				);
				if (!res.ok) return;
				const data = await res.json();
				if (!cancelled) {
					setCharacters(data.characters ?? []);
				}
			} catch {
				// Silently ignore — panel just won't show anything.
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [storyboardId]);

	function applyUpdated(next: AnimationCharacter[]) {
		setCharacters(next);
		setDirty(true);
		setEditingId(null);
	}

	if (loading) {
		return (
			<div className="bg-gray-900 rounded-lg border border-gray-800 p-4 flex items-center gap-3 text-sm text-gray-400">
				<Loader2 className="w-4 h-4 animate-spin" />
				<span>Loading characters…</span>
			</div>
		);
	}
	if (characters.length === 0) {
		return null;
	}

	return (
		<div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
			<div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between gap-3">
				<div>
					<h3 className="text-sm font-semibold text-white">Characters</h3>
					<p className="text-[11px] text-gray-500 mt-0.5">
						Edit the talent or traits, then regenerate images with the same script.
					</p>
				</div>
				<button
					type="button"
					onClick={onRegenerateImages}
					disabled={regenerating}
					className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900 disabled:cursor-not-allowed rounded text-xs font-medium text-white transition-colors"
					title="Clear existing beat images and regenerate them using the current characters."
				>
					{regenerating ? (
						<>
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
							<span>Regenerating…</span>
						</>
					) : (
						<>
							<RefreshCw className="w-3.5 h-3.5" />
							<span>
								{dirty ? "Regenerate images" : "Regenerate images"}
							</span>
						</>
					)}
				</button>
			</div>
			<div className="divide-y divide-gray-800">
				{characters.map((char) =>
					editingId === char.id ? (
						<CharacterEditor
							key={char.id}
							storyboardId={storyboardId}
							character={char}
							onCancel={() => setEditingId(null)}
							onSaved={applyUpdated}
						/>
					) : (
						<CharacterRow
							key={char.id}
							character={char}
							onEdit={() => setEditingId(char.id)}
						/>
					)
				)}
			</div>
			{dirty && !regenerating && (
				<div className="px-4 py-2 bg-amber-950/40 border-t border-amber-900/50 text-[11px] text-amber-300">
					Characters updated. Regenerate images to apply changes to the
					beat frames.
				</div>
			)}
		</div>
	);
}

// ────────────────────────────────────────────────────────────────────────────
// Read-only row
// ────────────────────────────────────────────────────────────────────────────

function CharacterRow({
	character,
	onEdit,
}: {
	character: AnimationCharacter;
	onEdit: () => void;
}) {
	return (
		<div className="p-4 flex items-start gap-4">
			<div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-[#0a0a0a] border border-gray-800 flex items-center justify-center">
				{character.sheetSignedUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={character.sheetSignedUrl}
						alt={character.name}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				) : (
					<span className="text-[10px] text-gray-600">No sheet</span>
				)}
			</div>
			<div className="flex-1 min-w-0 space-y-1">
				<div className="flex items-center justify-between gap-2">
					<p className="text-sm font-semibold text-white truncate">{character.name}</p>
					<button
						type="button"
						onClick={onEdit}
						className="inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 rounded transition-colors"
					>
						<Pencil className="w-3 h-3" />
						<span>Edit</span>
					</button>
				</div>
				{character.traits.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{character.traits.map((t, i) => (
							<span
								key={i}
								className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300"
							>
								{t}
							</span>
						))}
					</div>
				)}
				{character.personality && (
					<p className="text-xs text-gray-400">{character.personality}</p>
				)}
			</div>
		</div>
	);
}

// ────────────────────────────────────────────────────────────────────────────
// Inline editor
// ────────────────────────────────────────────────────────────────────────────

function CharacterEditor({
	storyboardId,
	character,
	onCancel,
	onSaved,
}: {
	storyboardId: string;
	character: AnimationCharacter;
	onCancel: () => void;
	onSaved: (next: AnimationCharacter[]) => void;
}) {
	const [name, setName] = useState(character.name);
	const [traits, setTraits] = useState<string[]>(character.traits ?? []);
	const [personality, setPersonality] = useState(character.personality ?? "");
	const [sheetStoragePath, setSheetStoragePath] = useState<string | undefined>(
		character.sheetStoragePath
	);
	const [localPreview, setLocalPreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	async function handleTalentUpload(file: File) {
		setError(null);
		setUploading(true);
		try {
			setLocalPreview(URL.createObjectURL(file));
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/animation/character-sheet/upload", {
				method: "POST",
				body: fd,
				credentials: "include",
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data?.error || "Upload failed");
				setLocalPreview(null);
				return;
			}
			setSheetStoragePath(data.path);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
			setLocalPreview(null);
		} finally {
			setUploading(false);
		}
	}

	async function handleSave() {
		setError(null);
		setSaving(true);
		try {
			const res = await fetch("/api/animation/character/update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					storyboardId,
					characterId: character.id,
					name: name.trim() || character.name,
					traits,
					personality,
					sheetStoragePath,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data?.error || "Save failed");
				return;
			}
			onSaved(data.characters ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}

	const previewUrl = localPreview || character.sheetSignedUrl || null;

	return (
		<div className="p-4 bg-[#111111]">
			<div className="flex items-start gap-4">
				<div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-[#0a0a0a] border border-gray-800 flex items-center justify-center">
					{previewUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={previewUrl}
							alt={name}
							className="w-full h-full object-cover"
						/>
					) : (
						<span className="text-[10px] text-gray-600">No sheet</span>
					)}
				</div>
				<div className="flex-1 min-w-0 space-y-3">
					<button
						type="button"
						onClick={() => fileRef.current?.click()}
						disabled={uploading || saving}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 rounded text-[11px] uppercase tracking-wider text-gray-300 hover:text-white transition-colors disabled:opacity-50"
					>
						{uploading ? (
							<>
								<Loader2 className="w-3 h-3 animate-spin" />
								<span>Uploading…</span>
							</>
						) : (
							<>
								<Upload className="w-3 h-3" />
								<span>
									{character.sheetStoragePath
										? "Replace talent photo"
										: "Upload talent photo"}
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
							if (f) void handleTalentUpload(f);
							e.target.value = "";
						}}
					/>

					<div className="space-y-1">
						<label className="block text-[10px] uppercase tracking-wider text-gray-500">
							Name
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={120}
							className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1.5 text-sm text-white focus:outline-none"
						/>
					</div>

					<div className="space-y-1">
						<label className="block text-[10px] uppercase tracking-wider text-gray-500">
							Appearance
						</label>
						<TagInput
							value={traits}
							onChange={setTraits}
							placeholder="Type traits, press Enter"
							maxTags={10}
							ariaLabel="Character appearance traits"
						/>
					</div>

					<div className="space-y-1">
						<label className="block text-[10px] uppercase tracking-wider text-gray-500">
							Personality
						</label>
						<input
							type="text"
							value={personality}
							onChange={(e) => setPersonality(e.target.value)}
							maxLength={400}
							className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1.5 text-xs text-gray-200 focus:outline-none"
						/>
					</div>

					{error && (
						<p role="alert" className="text-[11px] text-red-400">
							{error}
						</p>
					)}

					<div className="flex items-center gap-2 pt-1">
						<button
							type="button"
							onClick={handleSave}
							disabled={saving || uploading}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-200 text-black rounded text-xs font-medium disabled:opacity-50 transition-colors"
						>
							{saving ? (
								<>
									<Loader2 className="w-3 h-3 animate-spin" />
									<span>Saving…</span>
								</>
							) : (
								<span>Save</span>
							)}
						</button>
						<button
							type="button"
							onClick={onCancel}
							disabled={saving || uploading}
							className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
						>
							<X className="w-3 h-3" />
							<span>Cancel</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
