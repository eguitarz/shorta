"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { AnimationCharacter } from "@/lib/types/beat";

export type JobStatus =
	| "pending"
	| "classifying"
	| "storyboarding"
	| "story_complete"
	| "chars_complete"
	| "chars_partial"
	| "beats_complete"
	| "images_partial"
	| "completed"
	| "failed"
	| "capped"
	| "stale";

interface ProgressPollingProps {
	status: JobStatus;
	/** Characters from animation_meta once Pass 1 completes — for brief reveal on chars_complete. */
	characters?: AnimationCharacter[];
	/** Optional Supabase signed URL fetcher for character sheet thumbnails. */
	signedUrlFor?: (storagePath: string) => Promise<string | null>;
	/** Shown when failed / capped so user can retry. */
	onRetry?: () => void;
	errorMessage?: string | null;
}

type StepKey = "story" | "chars" | "beats" | "images";
type StepState = "pending" | "active" | "done" | "failed";

/**
 * Build-log style progress UI per Pass 4A (design review).
 *
 *   ▰▰▰▰▱▱▱  orange-500 fill on bg-gray-900 track, 2px tall
 *
 *   ✓ Writing story            12s
 *   ▸ Meeting your characters  08s   ← active with pulse
 *     Scene by scene
 *     Rendering frames
 *
 * Character sheet brief reveal (per Pass 3A): when status='chars_complete',
 * show a small card below the step list with tiny thumbnails for 10-15s,
 * then fade back to the polling list.
 */
export function ProgressPolling({
	status,
	characters,
	signedUrlFor,
	onRetry,
	errorMessage,
}: ProgressPollingProps) {
	const t = useTranslations("animation.progress");
	const stepStates = statusToStepStates(status);
	const percent = statusToPercent(status);

	const [elapsed, setElapsed] = useState<Record<StepKey, number>>({
		story: 0,
		chars: 0,
		beats: 0,
		images: 0,
	});
	const [lastActiveStep, setLastActiveStep] = useState<StepKey | null>(null);

	// Tick the elapsed counter for the currently-active step.
	useEffect(() => {
		const activeStep = (Object.keys(stepStates) as StepKey[]).find(
			(k) => stepStates[k] === "active"
		);
		setLastActiveStep(activeStep ?? null);

		if (!activeStep) return;
		const interval = setInterval(() => {
			setElapsed((prev) => ({ ...prev, [activeStep]: (prev[activeStep] ?? 0) + 1 }));
		}, 1000);
		return () => clearInterval(interval);
	}, [stepStates]);

	const terminal = status === "completed" || status === "failed" || status === "capped" || status === "stale";

	return (
		<div className="space-y-6" aria-live="polite" role="status">
			{/* Thin progress bar — data-dense industrial feel */}
			<div className="w-full h-[2px] bg-gray-900 rounded overflow-hidden">
				<div
					className={`h-full transition-all duration-500 ${
						status === "failed" || status === "stale"
							? "bg-red-500"
							: status === "capped"
							? "bg-orange-400"
							: "bg-orange-500"
					}`}
					style={{ width: `${percent}%` }}
				/>
			</div>

			{/* Step list */}
			<ul className="space-y-1.5" role="list">
				<StepRow
					label={t("steps.story")}
					state={stepStates.story}
					elapsed={elapsed.story}
				/>
				<StepRow
					label={t("steps.chars")}
					state={stepStates.chars}
					elapsed={elapsed.chars}
				/>
				<StepRow
					label={t("steps.beats")}
					state={stepStates.beats}
					elapsed={elapsed.beats}
					highlight={status === "beats_complete"}
					highlightLabel={t("beats_complete_hint")}
				/>
				<StepRow
					label={t("steps.images")}
					state={stepStates.images}
					elapsed={elapsed.images}
				/>
			</ul>

			{/* Character sheet brief reveal — Pass 3A */}
			{(status === "chars_complete" || status === "chars_partial") && characters && characters.length > 0 && (
				<CharacterRevealCard
					characters={characters}
					signedUrlFor={signedUrlFor}
				/>
			)}

			{/* Terminal states */}
			{terminal && status !== "completed" && (
				<div
					className={`rounded-xl p-4 border ${
						status === "capped"
							? "bg-orange-500/10 border-orange-500/30"
							: "bg-red-500/10 border-red-500/30"
					}`}
				>
					<p className={`text-sm ${status === "capped" ? "text-orange-400" : "text-red-400"}`}>
						{status === "capped"
							? t("capped_title")
							: status === "stale"
							? t("stale_title")
							: t("failed_title")}
					</p>
					{errorMessage && (
						<p className="text-xs text-gray-400 mt-1">{errorMessage}</p>
					)}
					{onRetry && (
						<button
							type="button"
							onClick={onRetry}
							className="mt-3 bg-white text-black rounded-md px-3 py-1.5 text-xs font-medium hover:bg-gray-200 focus-visible:ring-1 ring-gray-500 ring-offset-2 ring-offset-[#0a0a0a]"
						>
							{t("retry")}
						</button>
					)}
				</div>
			)}
		</div>
	);
}

interface StepRowProps {
	label: string;
	state: StepState;
	elapsed: number;
	highlight?: boolean;
	highlightLabel?: string;
}

function StepRow({ label, state, elapsed, highlight, highlightLabel }: StepRowProps) {
	return (
		<li className="flex items-center gap-3 text-sm">
			<span
				className={`w-4 font-mono text-[11px] ${
					state === "done"
						? "text-gray-400"
						: state === "active"
						? "text-orange-400"
						: state === "failed"
						? "text-red-400"
						: "text-gray-700"
				}`}
				aria-hidden
			>
				{state === "done" ? "✓" : state === "active" ? "▸" : state === "failed" ? "✗" : " "}
			</span>
			<span
				className={
					state === "done"
						? "text-gray-400"
						: state === "active"
						? "text-white"
						: state === "failed"
						? "text-red-400"
						: "text-gray-700"
				}
			>
				{label}
				{highlight && highlightLabel && (
					<span className="ml-2 text-[10px] uppercase tracking-wider text-green-400">
						{highlightLabel}
					</span>
				)}
			</span>
			<span className="flex-1" />
			{state !== "pending" && (
				<span className="text-xs font-mono tabular-nums text-gray-600">
					{formatElapsed(elapsed)}
				</span>
			)}
		</li>
	);
}

interface CharacterRevealCardProps {
	characters: AnimationCharacter[];
	signedUrlFor?: (storagePath: string) => Promise<string | null>;
}

function CharacterRevealCard({ characters, signedUrlFor }: CharacterRevealCardProps) {
	const t = useTranslations("animation.progress");
	const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		let cancelled = false;
		async function loadThumbs() {
			if (!signedUrlFor) return;
			const next: Record<string, string | null> = {};
			for (const char of characters) {
				if (char.sheetStoragePath) {
					const url = await signedUrlFor(char.sheetStoragePath);
					if (cancelled) return;
					next[char.id] = url;
				}
			}
			if (!cancelled) setThumbs(next);
		}
		loadThumbs();

		// Auto-fade after 15s per design review
		const timer = setTimeout(() => !cancelled && setVisible(false), 15000);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [characters, signedUrlFor]);

	if (!visible) return null;

	return (
		<div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 transition-opacity duration-500">
			<p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
				{t("chars_reveal_title")}
			</p>
			<div className="flex gap-3">
				{characters.map((char) => {
					const thumb = thumbs[char.id];
					const failed = !!char.sheetFailureReason;
					return (
						<div key={char.id} className="flex items-center gap-2">
							<div
								className={`w-12 h-16 rounded bg-gray-900 overflow-hidden ${
									failed ? "border border-red-500/30" : ""
								}`}
							>
								{thumb ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={thumb} alt={char.name} className="w-full h-full object-cover" />
								) : (
									<div className="w-full h-full" />
								)}
							</div>
							<span className="text-xs text-gray-300">{char.name}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ────────────────────────────────────────────────────────────────────────────
// State → progress mapping
// ────────────────────────────────────────────────────────────────────────────

function statusToStepStates(status: JobStatus): Record<StepKey, StepState> {
	switch (status) {
		case "pending":
			return { story: "active", chars: "pending", beats: "pending", images: "pending" };
		case "classifying":
			// Reused transient state: story step is running (processStory uses 'classifying' as its in-progress sentinel)
			return { story: "active", chars: "pending", beats: "pending", images: "pending" };
		case "story_complete":
			return { story: "done", chars: "active", beats: "pending", images: "pending" };
		case "chars_complete":
		case "chars_partial":
			return {
				story: "done",
				chars: status === "chars_partial" ? "failed" : "done",
				beats: "active",
				images: "pending",
			};
		case "storyboarding":
			return { story: "done", chars: "done", beats: "active", images: "pending" };
		case "beats_complete":
			return { story: "done", chars: "done", beats: "done", images: "active" };
		case "images_partial":
			return { story: "done", chars: "done", beats: "done", images: "failed" };
		case "completed":
			return { story: "done", chars: "done", beats: "done", images: "done" };
		case "failed":
		case "stale":
			return { story: "failed", chars: "pending", beats: "pending", images: "pending" };
		case "capped":
			return { story: "done", chars: "done", beats: "done", images: "failed" };
	}
}

function statusToPercent(status: JobStatus): number {
	switch (status) {
		case "pending":
		case "classifying":
			return 10;
		case "story_complete":
			return 30;
		case "chars_complete":
		case "chars_partial":
			return 50;
		case "storyboarding":
			return 65;
		case "beats_complete":
			return 80;
		case "images_partial":
			return 90;
		case "completed":
			return 100;
		case "capped":
			return 90;
		case "failed":
		case "stale":
			return 20;
	}
}

function formatElapsed(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}m${s.toString().padStart(2, "0")}s`;
}
