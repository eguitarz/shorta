"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { renderExportPrompt } from "@/lib/animation/render-export";
import type { AnimationBeat, AnimationMeta } from "@/lib/types/beat";

interface ExportPromptsProps {
	meta: AnimationMeta;
	beat: AnimationBeat;
}

/**
 * Inline-collapsed export prompt block per Pass 1B (design review).
 *
 *   [Copy prompt ↓]                        ← small ghost button
 *    click expands ──▼
 *   ┌──────────────────────────────────────────────────────┐
 *   │ Camera: Medium close-up, slow dolly in.              │
 *   │ Subject: Whiskers (Orange tabby cat with …)          │
 *   │ Action: Whiskers pads over …                         │
 *   │ …                                                    │
 *   │                                       [Copy icon →]  │
 *   └──────────────────────────────────────────────────────┘
 *
 * Per Pass 3B, the Copy button MORPHS in place on success:
 *   "Copy prompt ↓"  →  "✓ Copied — paste into your video tool"  (2.5s)
 */
export function ExportPrompts({ meta, beat }: ExportPromptsProps) {
	const t = useTranslations("animation.export");
	const [expanded, setExpanded] = useState(false);
	const [copied, setCopied] = useState(false);

	const prompt = expanded ? renderExportPrompt({ meta, beat, platform: "universal" }) : "";

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(
				renderExportPrompt({ meta, beat, platform: "universal" })
			);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		} catch (err) {
			console.error("Copy failed:", err);
		}
	}

	return (
		<div className="mt-2">
			<button
				type="button"
				onClick={() => {
					if (!expanded) {
						setExpanded(true);
						return;
					}
					copyToClipboard();
				}}
				className={`text-xs transition-colors focus-visible:ring-1 ring-gray-500 ring-offset-2 ring-offset-[#0a0a0a] ${
					copied
						? "text-green-400"
						: "text-gray-500 hover:text-white"
				}`}
				aria-expanded={expanded}
				aria-label={expanded ? t("copy_label") : t("expand_label")}
			>
				{copied
					? t("copied_with_context")
					: expanded
					? t("copy_prompt")
					: t("expand_prompt")}
			</button>

			{expanded && (
				<div className="relative mt-2 bg-[#111] border border-gray-800 rounded-lg p-3">
					<pre className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
						{prompt}
					</pre>
					<button
						type="button"
						onClick={() => setExpanded(false)}
						className="absolute top-1 right-1 text-[10px] text-gray-600 hover:text-gray-400 px-1 py-0.5"
						aria-label={t("collapse_label")}
					>
						×
					</button>
				</div>
			)}
		</div>
	);
}
