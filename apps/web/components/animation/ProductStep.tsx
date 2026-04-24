"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import type { ProductDemoBrief } from "@/lib/types/beat";
import { TagInput } from "@/components/ui/TagInput";

export interface ProductFields {
	mode: "url" | "upload";
	sourceUrl?: string;
	productName: string;
	headline: string;
	subhead?: string;
	ctaText: string;
	assetPaths: string[];
	heroAssetPath?: string;
	scrapePartial?: boolean;
	/**
	 * Ephemeral preview URLs keyed by storage path. Not persisted to the job —
	 * used only to display thumbnails in the wizard. Blob URLs for uploaded
	 * files, signed URLs for URL-scraped hero images.
	 */
	previewUrls?: Record<string, string>;
	/** Structured demo brief from Jina + Gemini. Persisted via productContext. */
	brief?: ProductDemoBrief;
}

interface ProductStepProps {
	value: ProductFields;
	onChange: (next: ProductFields) => void;
	onContinue: () => void;
	onBack?: () => void;
}

const MAX_FILES = 4;
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_DIM = 2048;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

/** Read dimensions client-side via an off-screen image. */
async function measureImage(file: File): Promise<{ w: number; h: number }> {
	const url = URL.createObjectURL(file);
	try {
		const { w, h } = await new Promise<{ w: number; h: number }>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
			img.onerror = () => reject(new Error("Could not read image"));
			img.src = url;
		});
		return { w, h };
	} finally {
		URL.revokeObjectURL(url);
	}
}

/**
 * Wizard Step 1 (product-demo mode): URL scrape OR upload screenshots,
 * plus auto-filled product metadata fields. Matches DESIGN.md tokens and
 * the existing Premise/Characters step shape.
 */
export function ProductStep({ value, onChange, onContinue, onBack }: ProductStepProps) {
	const t = useTranslations("animation.wizard");
	const [url, setUrl] = useState(value.sourceUrl ?? "");
	const [scraping, setScraping] = useState(false);
	const [scrapeError, setScrapeError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const canContinue =
		value.assetPaths.length > 0 &&
		!!value.heroAssetPath &&
		value.productName.trim().length > 0 &&
		value.headline.trim().length > 0 &&
		value.ctaText.trim().length > 0 &&
		!scraping &&
		!uploading;

	async function scrapeUrl() {
		const trimmed = url.trim();
		if (!trimmed) return;
		setScraping(true);
		setScrapeError(null);
		try {
			const res = await fetch("/api/animation/product-assets/ingest-url", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ url: trimmed }),
			});
			const data = await res.json();
			if (!res.ok) {
				setScrapeError(data?.error ?? t("product.scrape_error_generic"));
				return;
			}
			// Re-scrape always overwrites per the design review decision.
			const previewUrls: Record<string, string> = {};
			if (data.heroAssetPath && data.heroSignedUrl) {
				previewUrls[data.heroAssetPath] = data.heroSignedUrl;
			}
			// If Gemini returned CTA suggestions, use the first one as default
			// (user can still edit). Fall back to existing value or i18n default.
			const briefCta = data.brief?.ctaSuggestions?.[0];
			onChange({
				mode: "url",
				sourceUrl: data.sourceUrl ?? trimmed,
				productName: data.productName ?? "",
				headline: data.headline ?? "",
				subhead: data.subhead ?? undefined,
				ctaText: value.ctaText || briefCta || t("product.cta_default"),
				assetPaths: data.heroAssetPath ? [data.heroAssetPath] : [],
				heroAssetPath: data.heroAssetPath,
				scrapePartial: data.partial === true,
				previewUrls,
				brief: data.brief ?? undefined,
			});
		} catch (err) {
			setScrapeError(err instanceof Error ? err.message : t("product.scrape_error_generic"));
		} finally {
			setScraping(false);
		}
	}

	async function handleFiles(files: FileList | File[]) {
		const list = Array.from(files);
		if (list.length === 0) return;
		if (list.length > MAX_FILES) {
			setUploadError(t("product.upload_error_count", { n: MAX_FILES }));
			return;
		}
		for (const f of list) {
			if (!ALLOWED_MIME.has(f.type)) {
				setUploadError(t("product.upload_error_type"));
				return;
			}
			if (f.size > MAX_BYTES) {
				setUploadError(t("product.upload_error_size"));
				return;
			}
			try {
				const { w, h } = await measureImage(f);
				if (w > MAX_DIM || h > MAX_DIM) {
					setUploadError(t("product.upload_error_dim", { max: MAX_DIM }));
					return;
				}
			} catch {
				setUploadError(t("product.upload_error_type"));
				return;
			}
		}

		setUploadError(null);
		setUploading(true);
		try {
			const fd = new FormData();
			for (const f of list) fd.append("files", f);
			const res = await fetch("/api/animation/product-assets/upload", {
				method: "POST",
				body: fd,
			});
			const data = await res.json();
			if (!res.ok) {
				setUploadError(data?.error ?? t("product.upload_error_generic"));
				return;
			}
			const paths: string[] = data.paths ?? [];
			// Pair each returned path with the local File's blob URL for preview.
			const previewUrls: Record<string, string> = { ...(value.previewUrls ?? {}) };
			for (let i = 0; i < paths.length && i < list.length; i++) {
				previewUrls[paths[i]] = URL.createObjectURL(list[i]);
			}
			onChange({
				...value,
				mode: "upload",
				sourceUrl: undefined,
				assetPaths: paths,
				heroAssetPath: value.heroAssetPath && paths.includes(value.heroAssetPath) ? value.heroAssetPath : paths[0],
				ctaText: value.ctaText || t("product.cta_default"),
				previewUrls,
			});
		} catch (err) {
			setUploadError(err instanceof Error ? err.message : t("product.upload_error_generic"));
		} finally {
			setUploading(false);
		}
	}

	// Revoke blob URLs on unmount to avoid leaks.
	useEffect(() => {
		return () => {
			if (!value.previewUrls) return;
			for (const url of Object.values(value.previewUrls)) {
				if (url.startsWith("blob:")) URL.revokeObjectURL(url);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-[var(--font-space-grotesk)] text-lg text-white">
					{t("product.title")}
				</h2>
				<p className="text-xs text-gray-400 mt-1">{t("product.subtitle")}</p>
			</div>

			{/* URL ingestion */}
			<div className="space-y-2">
				<label
					htmlFor="product-url"
					className="block text-[10px] uppercase tracking-wider text-gray-500"
				>
					{t("product.url_label")}
				</label>
				<div className="flex items-center gap-2" aria-busy={scraping}>
					<input
						id="product-url"
						type="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								scrapeUrl();
							}
						}}
						placeholder="tabnora.com"
						disabled={scraping}
						className="flex-1 bg-[#111111] border border-gray-800 focus:border-gray-600 rounded-md px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none disabled:opacity-50"
					/>
					<button
						type="button"
						onClick={scrapeUrl}
						disabled={scraping || !url.trim()}
						className="bg-[#252525] hover:bg-[#303030] text-white rounded-md px-3 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-1 ring-gray-500"
					>
						{scraping ? (
							<span className="flex items-center gap-1.5">
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
								{t("product.url_fetching")}
							</span>
						) : (
							t("product.url_fetch")
						)}
					</button>
				</div>
				{scrapeError && (
					<p role="alert" aria-live="polite" className="text-xs text-red-400">
						{scrapeError}
					</p>
				)}
				{value.scrapePartial && !scrapeError && (
					<p className="text-[10px] text-gray-500">{t("product.scrape_partial")}</p>
				)}
			</div>

			{/* OR divider */}
			<div className="flex items-center gap-3">
				<div className="flex-1 h-px bg-gray-800" />
				<span className="text-[10px] uppercase tracking-wider text-gray-600">
					{t("product.or")}
				</span>
				<div className="flex-1 h-px bg-gray-800" />
			</div>

			{/* Upload dropzone */}
			<div className="space-y-2">
				<label className="block text-[10px] uppercase tracking-wider text-gray-500">
					{t("product.upload_label")}
				</label>
				<label
					htmlFor="product-upload"
					className="block w-full border border-dashed border-gray-700 rounded-xl p-4 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors text-center cursor-pointer focus-within:ring-1 ring-gray-500"
				>
					{uploading ? (
						<span className="inline-flex items-center gap-1.5">
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
							{t("product.uploading")}
						</span>
					) : (
						t("product.upload_placeholder", { max: MAX_FILES })
					)}
					<input
						ref={fileInputRef}
						id="product-upload"
						type="file"
						accept="image/png,image/jpeg,image/webp"
						multiple
						disabled={uploading}
						className="sr-only"
						onChange={(e) => {
							if (e.target.files) void handleFiles(e.target.files);
						}}
					/>
				</label>
				{uploadError && (
					<p role="alert" aria-live="polite" className="text-xs text-red-400">
						{uploadError}
					</p>
				)}
			</div>

			{/* Thumbnails + hero selection */}
			{value.assetPaths.length > 0 && (
				<fieldset className="space-y-2">
					<legend className="block text-[10px] uppercase tracking-wider text-gray-500">
						{t("product.hero_label")}
					</legend>
					<div role="radiogroup" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
						{value.assetPaths.map((path) => {
							const selected = path === value.heroAssetPath;
							const preview = value.previewUrls?.[path];
							return (
								<label
									key={path}
									className={`relative bg-[#1a1a1a] border rounded-lg overflow-hidden cursor-pointer transition-colors ${
										selected
											? "border-gray-500 ring-1 ring-gray-500"
											: "border-gray-800 hover:border-gray-700"
									}`}
								>
									<input
										type="radio"
										name="hero-asset"
										value={path}
										checked={selected}
										onChange={() => onChange({ ...value, heroAssetPath: path })}
										className="sr-only"
									/>
									<div className="aspect-video bg-[#0a0a0a] flex items-center justify-center">
										{preview ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={preview}
												alt={t("product.hero_preview_alt")}
												className="max-w-full max-h-full object-contain"
												loading="lazy"
											/>
										) : (
											<span className="text-[10px] text-gray-600 px-2 text-center">
												{path.split("/").pop()}
											</span>
										)}
									</div>
									<div
										className={`px-2 py-1.5 text-[10px] uppercase tracking-wider ${
											selected ? "text-white bg-[#252525]" : "text-gray-500"
										}`}
									>
										{selected ? t("product.hero_selected_short") : t("product.hero_choose")}
									</div>
								</label>
							);
						})}
					</div>
				</fieldset>
			)}

			{/* Product fields */}
			<div className="space-y-3">
				<TextField
					id="product-name"
					label={t("product.name_label")}
					value={value.productName}
					onChange={(v) => onChange({ ...value, productName: v })}
					placeholder={t("product.name_placeholder")}
					maxLength={120}
					showFromWebsite={!!value.sourceUrl && value.productName.length > 0}
				/>
				<TextField
					id="product-headline"
					label={t("product.headline_label")}
					value={value.headline}
					onChange={(v) => onChange({ ...value, headline: v })}
					placeholder={t("product.headline_placeholder")}
					maxLength={200}
					showFromWebsite={!!value.sourceUrl && value.headline.length > 0}
				/>
				<TextField
					id="product-subhead"
					label={t("product.subhead_label")}
					value={value.subhead ?? ""}
					onChange={(v) => onChange({ ...value, subhead: v || undefined })}
					placeholder={t("product.subhead_placeholder")}
					maxLength={280}
					showFromWebsite={!!value.sourceUrl && (value.subhead ?? "").length > 0}
				/>
				<TextField
					id="product-cta"
					label={t("product.cta_label")}
					value={value.ctaText}
					onChange={(v) => onChange({ ...value, ctaText: v })}
					placeholder={t("product.cta_placeholder")}
					maxLength={80}
				/>
			</div>

			{/* Demo brief — editable. Only shown when the Gemini distiller ran. */}
			{value.brief && (
				<BriefEditor
					brief={value.brief}
					onChange={(next) => onChange({ ...value, brief: next })}
				/>
			)}

			<div className="flex items-center justify-between pt-4">
				{onBack ? (
					<button
						type="button"
						onClick={onBack}
						className="text-xs text-gray-500 hover:text-gray-300"
					>
						{t("nav.back")}
					</button>
				) : (
					<span />
				)}
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

interface TextFieldProps {
	id: string;
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
	maxLength: number;
	showFromWebsite?: boolean;
}

function TextField({ id, label, value, onChange, placeholder, maxLength, showFromWebsite }: TextFieldProps) {
	const t = useTranslations("animation.wizard");
	return (
		<div className="space-y-1">
			<div className="flex items-center gap-2">
				<label
					htmlFor={id}
					className="block text-[10px] uppercase tracking-wider text-gray-500"
				>
					{label}
				</label>
				{showFromWebsite && (
					<span className="text-[10px] uppercase tracking-wider text-gray-500">
						{t("product.from_website")}
					</span>
				)}
			</div>
			<input
				id={id}
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				maxLength={maxLength}
				className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none"
			/>
		</div>
	);
}

interface BriefEditorProps {
	brief: ProductDemoBrief;
	onChange: (next: ProductDemoBrief) => void;
}

function BriefEditor({ brief, onChange }: BriefEditorProps) {
	const t = useTranslations("animation.wizard");

	function update<K extends keyof ProductDemoBrief>(
		key: K,
		value: ProductDemoBrief[K]
	) {
		onChange({ ...brief, [key]: value });
	}

	function updateFeatureAt(i: number, next: { name: string; benefit: string }) {
		const copy = [...(brief.features ?? [])];
		copy[i] = next;
		update("features", copy);
	}

	function removeFeatureAt(i: number) {
		const copy = (brief.features ?? []).filter((_, idx) => idx !== i);
		update("features", copy.length ? copy : undefined);
	}

	function addFeature() {
		update("features", [...(brief.features ?? []), { name: "", benefit: "" }]);
	}

	return (
		<div className="space-y-2 pt-2">
			<span className="block text-[10px] uppercase tracking-wider text-gray-500">
				{t("product.brief_label")}
			</span>
			<div className="bg-[#111111] border border-gray-800 rounded-lg p-3 space-y-3">
				{/* One-liner */}
				<div className="space-y-1">
					<label
						htmlFor="brief-oneliner"
						className="block text-[10px] uppercase tracking-wider text-gray-500"
					>
						{t("product.brief_oneliner_label")}
					</label>
					<textarea
						id="brief-oneliner"
						rows={2}
						value={brief.oneLiner ?? ""}
						onChange={(e) => update("oneLiner", e.target.value || undefined)}
						placeholder={t("product.brief_oneliner_placeholder")}
						maxLength={240}
						className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1 text-sm text-white placeholder-gray-600 resize-none focus:outline-none"
					/>
				</div>

				{/* Value props — TagInput */}
				<div className="space-y-1">
					<label className="block text-[10px] uppercase tracking-wider text-gray-500">
						{t("product.brief_valueprops_label")}
					</label>
					<TagInput
						value={brief.valueProps ?? []}
						onChange={(next) =>
							update("valueProps", next.length ? next : undefined)
						}
						placeholder={t("product.brief_valueprops_placeholder")}
						maxTags={6}
						ariaLabel={t("product.brief_valueprops_label")}
					/>
				</div>

				{/* Features — editable rows */}
				<div className="space-y-1.5">
					<label className="block text-[10px] uppercase tracking-wider text-gray-500">
						{t("product.brief_features_label")}
					</label>
					{(brief.features ?? []).map((f, i) => (
						<div key={i} className="flex items-center gap-2">
							<input
								type="text"
								value={f.name}
								onChange={(e) =>
									updateFeatureAt(i, { ...f, name: e.target.value })
								}
								placeholder={t("product.brief_feature_name_placeholder")}
								maxLength={80}
								className="w-40 bg-transparent border-b border-gray-800 focus:border-gray-600 py-1 text-xs text-white placeholder-gray-600 focus:outline-none"
							/>
							<input
								type="text"
								value={f.benefit}
								onChange={(e) =>
									updateFeatureAt(i, { ...f, benefit: e.target.value })
								}
								placeholder={t("product.brief_feature_benefit_placeholder")}
								maxLength={200}
								className="flex-1 bg-transparent border-b border-gray-800 focus:border-gray-600 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
							/>
							<button
								type="button"
								onClick={() => removeFeatureAt(i)}
								className="text-[11px] text-gray-500 hover:text-red-400 transition-colors"
								aria-label={t("product.brief_remove_feature")}
							>
								×
							</button>
						</div>
					))}
					{(brief.features?.length ?? 0) < 5 && (
						<button
							type="button"
							onClick={addFeature}
							className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
						>
							+ {t("product.brief_add_feature")}
						</button>
					)}
				</div>

				{/* Brand signals */}
				<div className="space-y-1">
					<label
						htmlFor="brief-brand"
						className="block text-[10px] uppercase tracking-wider text-gray-500"
					>
						{t("product.brief_brand")}
					</label>
					<textarea
						id="brief-brand"
						rows={2}
						value={brief.brandSignals ?? ""}
						onChange={(e) => update("brandSignals", e.target.value || undefined)}
						placeholder={t("product.brief_brand_placeholder")}
						maxLength={400}
						className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1 text-xs text-gray-200 placeholder-gray-600 resize-none focus:outline-none"
					/>
				</div>

				{/* Read-only hints (inferred tone, audience, avoid) */}
				{(brief.inferredTone || brief.inferredAudience || brief.avoid?.length) && (
					<div className="pt-2 border-t border-gray-800 space-y-1 text-[11px] text-gray-500">
						{brief.inferredTone && (
							<p>
								<span className="text-gray-600 uppercase tracking-wider text-[10px]">
									{t("product.brief_tone")}
								</span>{" "}
								{brief.inferredTone}
							</p>
						)}
						{brief.inferredAudience && (
							<p>
								<span className="text-gray-600 uppercase tracking-wider text-[10px]">
									{t("product.brief_audience")}
								</span>{" "}
								{brief.inferredAudience}
							</p>
						)}
						{brief.avoid?.length ? (
							<p>
								<span className="text-gray-600 uppercase tracking-wider text-[10px]">
									{t("product.brief_avoid")}
								</span>{" "}
								{brief.avoid.join(" · ")}
							</p>
						) : null}
					</div>
				)}
			</div>
		</div>
	);
}

export function emptyProductFields(): ProductFields {
	return {
		mode: "url",
		productName: "",
		headline: "",
		ctaText: "",
		assetPaths: [],
		previewUrls: {},
	};
}
