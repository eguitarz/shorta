"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Package, Pencil, Upload, X } from "lucide-react";
import type { ProductContext } from "@/lib/types/beat";

interface Props {
	storyboardId: string;
	/** Called after a successful attach so the parent can refresh state. */
	onProductAttached?: (productContext: ProductContext) => void;
}

/**
 * Product panel on /storyboard/generate/[id]. Lets the user upload (or
 * replace) the product image on an existing animation storyboard.
 *
 * When the storyboard has no productContext yet, shows an "Upload product
 * image" CTA that unlocks the per-beat "Use product image" toggles. When
 * productContext exists, shows the current hero + an "Edit" affordance to
 * replace the image or update the product name / CTA.
 */
export function AnimationProductPanel({ storyboardId, onProductAttached }: Props) {
	const [productContext, setProductContext] = useState<ProductContext | null>(null);
	const [heroSignedUrl, setHeroSignedUrl] = useState<string | undefined>();
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(
					`/api/animation/storyboard/product?storyboardId=${encodeURIComponent(storyboardId)}`,
					{ credentials: "include" }
				);
				if (!res.ok) return;
				const data = await res.json();
				if (!cancelled) {
					setProductContext(data.productContext ?? null);
					setHeroSignedUrl(data.heroSignedUrl);
				}
			} catch {
				// panel gracefully hides on fetch failure
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [storyboardId]);

	function handleAttached(next: ProductContext, signedUrl?: string) {
		setProductContext(next);
		if (signedUrl) setHeroSignedUrl(signedUrl);
		setEditing(false);
		onProductAttached?.(next);
	}

	if (loading) {
		return (
			<div className="bg-gray-900 rounded-lg border border-gray-800 p-4 flex items-center gap-3 text-sm text-gray-400">
				<Loader2 className="w-4 h-4 animate-spin" />
				<span>Loading product…</span>
			</div>
		);
	}

	return (
		<div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
			<div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Package className="w-4 h-4 text-gray-400" />
					<div>
						<h3 className="text-sm font-semibold text-white">Product</h3>
						<p className="text-[11px] text-gray-500 mt-0.5">
							{productContext
								? "The AI uses this image as the reference on reveal + feature + CTA beats."
								: "Upload a product image to unlock the 'Use product image' toggle on each beat."}
						</p>
					</div>
				</div>
				{productContext && !editing && (
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 rounded transition-colors"
					>
						<Pencil className="w-3 h-3" />
						<span>Edit</span>
					</button>
				)}
			</div>
			{editing || !productContext ? (
				<ProductEditor
					storyboardId={storyboardId}
					current={productContext}
					currentSignedUrl={heroSignedUrl}
					onCancel={() => setEditing(false)}
					onSaved={handleAttached}
				/>
			) : (
				<ProductRow
					productContext={productContext}
					signedUrl={heroSignedUrl}
				/>
			)}
		</div>
	);
}

function ProductRow({
	productContext,
	signedUrl,
}: {
	productContext: ProductContext;
	signedUrl?: string;
}) {
	return (
		<div className="p-4 flex items-start gap-4">
			<div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-[#0a0a0a] border border-gray-800 flex items-center justify-center">
				{signedUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={signedUrl}
						alt={productContext.productName}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				) : (
					<Package className="w-6 h-6 text-gray-700" />
				)}
			</div>
			<div className="flex-1 min-w-0 space-y-1">
				<p className="text-sm font-semibold text-white truncate">
					{productContext.productName}
				</p>
				{productContext.subhead && (
					<p className="text-xs text-gray-400 truncate">{productContext.subhead}</p>
				)}
				<p className="text-[11px] text-gray-500">
					<span className="uppercase tracking-wider text-gray-600">CTA:</span>{" "}
					{productContext.ctaText}
				</p>
			</div>
		</div>
	);
}

function ProductEditor({
	storyboardId,
	current,
	currentSignedUrl,
	onCancel,
	onSaved,
}: {
	storyboardId: string;
	current: ProductContext | null;
	currentSignedUrl?: string;
	onCancel: () => void;
	onSaved: (next: ProductContext, signedUrl?: string) => void;
}) {
	const [productName, setProductName] = useState(current?.productName ?? "");
	const [subhead, setSubhead] = useState(current?.subhead ?? "");
	const [ctaText, setCtaText] = useState(current?.ctaText ?? "Try it free");
	const [heroAssetPath, setHeroAssetPath] = useState<string | undefined>(
		current?.heroAssetPath
	);
	const [localPreview, setLocalPreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	async function handleUpload(file: File) {
		setError(null);
		setUploading(true);
		try {
			setLocalPreview(URL.createObjectURL(file));
			const fd = new FormData();
			fd.append("files", file);
			const res = await fetch("/api/animation/product-assets/upload", {
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
			const paths: string[] = data.paths ?? [];
			if (!paths[0]) {
				setError("Upload succeeded but no path returned");
				return;
			}
			setHeroAssetPath(paths[0]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
			setLocalPreview(null);
		} finally {
			setUploading(false);
		}
	}

	async function handleSave() {
		setError(null);
		if (!productName.trim()) {
			setError("Product name is required");
			return;
		}
		if (!heroAssetPath) {
			setError("Upload a product image first");
			return;
		}
		setSaving(true);
		try {
			const res = await fetch("/api/animation/storyboard/attach-product", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					storyboardId,
					productName: productName.trim(),
					subhead: subhead.trim() || undefined,
					ctaText: ctaText.trim() || undefined,
					heroAssetPath,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data?.error || "Save failed");
				return;
			}
			onSaved(data.productContext, data.heroSignedUrl);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}

	const previewUrl = localPreview || currentSignedUrl || null;

	return (
		<div className="p-4 bg-[#111111] space-y-3">
			<div className="flex items-start gap-4">
				<div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-[#0a0a0a] border border-gray-800 flex items-center justify-center">
					{previewUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={previewUrl} alt="Product preview" className="w-full h-full object-cover" />
					) : (
						<Package className="w-6 h-6 text-gray-700" />
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
									{heroAssetPath ? "Replace product image" : "Upload product image"}
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
							if (f) void handleUpload(f);
							e.target.value = "";
						}}
					/>

					<div className="space-y-1">
						<label className="block text-[10px] uppercase tracking-wider text-gray-500">
							Product name
						</label>
						<input
							type="text"
							value={productName}
							onChange={(e) => setProductName(e.target.value)}
							placeholder="e.g. Shiseido Ultimune Serum"
							maxLength={120}
							className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none"
						/>
					</div>

					<div className="space-y-1">
						<label className="block text-[10px] uppercase tracking-wider text-gray-500">
							One-line value prop (optional)
						</label>
						<input
							type="text"
							value={subhead}
							onChange={(e) => setSubhead(e.target.value)}
							placeholder="e.g. Daily defense serum for sensitive skin"
							maxLength={280}
							className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
						/>
					</div>

					<div className="space-y-1">
						<label className="block text-[10px] uppercase tracking-wider text-gray-500">
							CTA text
						</label>
						<input
							type="text"
							value={ctaText}
							onChange={(e) => setCtaText(e.target.value)}
							placeholder="Try it free"
							maxLength={80}
							className="w-full bg-transparent border-b border-gray-800 focus:border-gray-600 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
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
							disabled={saving || uploading || !heroAssetPath || !productName.trim()}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-200 text-black rounded text-xs font-medium disabled:opacity-50 transition-colors"
						>
							{saving ? (
								<>
									<Loader2 className="w-3 h-3 animate-spin" />
									<span>Saving…</span>
								</>
							) : (
								<span>{current ? "Save" : "Attach product"}</span>
							)}
						</button>
						{current && (
							<button
								type="button"
								onClick={onCancel}
								disabled={saving || uploading}
								className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
							>
								<X className="w-3 h-3" />
								<span>Cancel</span>
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
