"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { PremiseStep, type PremiseFields } from "@/components/animation/PremiseStep";
import {
	CharactersStep,
	type CharacterFields,
} from "@/components/animation/CharactersStep";
import {
	ArcPayoffStep,
	type ArcPayoffFields,
} from "@/components/animation/ArcPayoffStep";
import {
	ProductStep,
	emptyProductFields,
	type ProductFields,
} from "@/components/animation/ProductStep";
import {
	ProgressPolling,
	type JobStatus,
} from "@/components/animation/ProgressPolling";
import type {
	AnimationCharacter,
	AnimationWizardSpec,
} from "@/lib/types/beat";

type Phase = "wizard" | "polling";
type Mode = "story" | "product_demo";

const PRODUCT_MODE_ENABLED =
	process.env.NEXT_PUBLIC_ANIMATION_PRODUCT_MODE_ENABLED === "1" ||
	process.env.NEXT_PUBLIC_ANIMATION_PRODUCT_MODE_ENABLED?.toLowerCase() === "true";

interface JobState {
	job_id: string;
	status: JobStatus;
	storyboard_id: string | null;
	storyboard?: {
		id: string;
		animation_meta?: { characters?: AnimationCharacter[] } | null;
	} | null;
	error_message?: string | null;
}

/**
 * AI Animation Storyboard wizard host.
 *
 * Phases:
 *   wizard  — steps 1 → 2 → 3 collecting AnimationWizardSpec
 *   polling — after submit, poll GET /api/jobs/animation-storyboard/[job_id]
 *             every 3s. When status=beats_complete or completed, navigate to
 *             /storyboard/generate/[storyboardId] per Pass 1C.
 *
 * The wizard is credit-gated at the server level (403 on insufficient), and
 * feature-flag-gated (404 if ANIMATION_MODE_ENABLED is unset). Both surfaces
 * here render as error states.
 */
export default function AnimationWizardPage() {
	const router = useRouter();
	const locale = useLocale();
	const t = useTranslations("animation.wizard");

	const [phase, setPhase] = useState<Phase>("wizard");
	const [mode, setMode] = useState<Mode>("story");
	const [step, setStep] = useState<1 | 2 | 3>(1);

	// Story mode state.
	const [premise, setPremise] = useState<PremiseFields>({
		logline: "",
		tone: "",
		styleAnchor: "",
		sceneAnchor: "",
	});
	const [characters, setCharacters] = useState<CharacterFields[]>([
		{ name: "", traits: [], personality: "" },
	]);
	const [arcPayoff, setArcPayoff] = useState<ArcPayoffFields>({
		arcTemplate: "setup_twist_payoff",
		payoff: "",
	});

	// Product demo mode state (preserved when toggling; lives alongside story state).
	const [product, setProduct] = useState<ProductFields>(() => emptyProductFields());
	const [productStyle, setProductStyle] = useState<PremiseFields>({
		logline: "",
		tone: "",
		styleAnchor: "",
		sceneAnchor: "",
	});

	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [job, setJob] = useState<JobState | null>(null);

	// Rough credit estimate shown on step 3: base + 10/char + 10/beat. 5 beats default.
	const charCount = characters.filter((c) => c.name.trim()).length;
	const storyCharCount = mode === "story" ? charCount || 1 : charCount;
	const estimatedCredits = 150 + 10 * storyCharCount + 10 * 5;

	// Auto-seed product-mode style step from scraped product context so the
	// user isn't forced to write a 10-char logline for a product demo.
	useEffect(() => {
		if (mode !== "product_demo") return;
		if (!product.productName && !product.headline) return;
		setProductStyle((prev) => {
			if (prev.logline.trim().length >= 10) return prev;
			const autoLogline = `Animated product demo for ${product.productName}: ${product.headline}`;
			return {
				...prev,
				logline: autoLogline,
				styleAnchor: prev.styleAnchor || "Clean SaaS marketing",
				sceneAnchor: prev.sceneAnchor || `The ${product.productName} product interface`,
			};
		});
	}, [mode, product.productName, product.headline]);

	// Auto-apply Gemini's first suggested character to slot 0 when the brief
	// arrives. Only fires if every slot is empty (no typed name, no typed
	// personality, no pinned sheet) so we never clobber user edits.
	useEffect(() => {
		if (mode !== "product_demo") return;
		const suggestions = product.brief?.suggestedCharacters;
		if (!suggestions?.length) return;
		setCharacters((prev) => {
			const allEmpty = prev.every(
				(c) =>
					!c.name.trim() && !c.personality.trim() && !c.sheetStoragePath
			);
			if (!allEmpty) return prev;
			return suggestions.slice(0, 2).map((s) => ({
				name: s.name,
				traits: s.traits,
				personality: s.personality,
				sheetStoragePath: s.sheetStoragePath,
			}));
		});
	}, [mode, product.brief?.suggestedCharacters]);

	// ──────────────────────────────────────────────────────────────────────
	// Submit: create job
	// ──────────────────────────────────────────────────────────────────────
	async function submit() {
		if (submitting) return;

		const isProduct = mode === "product_demo";
		const activePremise = isProduct ? productStyle : premise;
		const activeCharacters = characters;

		const spec: AnimationWizardSpec & { beatCount: number; totalLengthSeconds: number } = {
			logline: activePremise.logline.trim(),
			tone: activePremise.tone,
			styleAnchor: activePremise.styleAnchor,
			sceneAnchor: activePremise.sceneAnchor.trim(),
			arcTemplate: isProduct ? "product_demo" : arcPayoff.arcTemplate,
			arcCustomDescription: arcPayoff.arcCustomDescription?.trim(),
			payoff: isProduct ? product.ctaText.trim() : arcPayoff.payoff.trim(),
			characters: activeCharacters
				.filter((c) => c.name.trim().length > 0)
				.map((c) => ({
					name: c.name.trim(),
					traits: c.traits,
					personality: c.personality.trim(),
					sheetStoragePath: c.sheetStoragePath,
				})),
			beatCount: 5,
			totalLengthSeconds: 30,
			productContext: isProduct
				? {
						mode: product.mode,
						sourceUrl: product.sourceUrl,
						productName: product.productName.trim(),
						headline: product.headline.trim(),
						subhead: product.subhead?.trim() || undefined,
						ctaText: product.ctaText.trim(),
						assetPaths: product.assetPaths,
						heroAssetPath: product.heroAssetPath || product.assetPaths[0],
						scrapePartial: product.scrapePartial === true,
						brief: product.brief,
				  }
				: undefined,
		};

		setSubmitting(true);
		setSubmitError(null);

		try {
			const res = await fetch("/api/jobs/animation-storyboard/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(spec),
				credentials: "include",
			});

			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as {
					error?: string;
					message?: string;
				};
				throw new Error(data.message || data.error || `HTTP ${res.status}`);
			}

			const data = (await res.json()) as JobState;
			setJob(data);
			setPhase("polling");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : String(err));
			setSubmitting(false);
		}
	}

	// ──────────────────────────────────────────────────────────────────────
	// Poll when a job exists
	// ──────────────────────────────────────────────────────────────────────
	useEffect(() => {
		if (phase !== "polling" || !job?.job_id) return;

		const terminal = new Set([
			"completed",
			"failed",
			"capped",
			"stale",
			"beats_complete", // navigate away — output page takes over
		]);

		let cancelled = false;

		async function poll() {
			if (cancelled || !job?.job_id) return;
			try {
				const res = await fetch(
					`/api/jobs/animation-storyboard/${job.job_id}?locale=${locale}`,
					{ credentials: "include" }
				);
				if (!res.ok) {
					throw new Error(`poll failed: HTTP ${res.status}`);
				}
				const data = (await res.json()) as JobState;
				if (cancelled) return;
				setJob(data);

				// Route transition per Pass 1C: as soon as text is deliverable,
				// take the user to the output page. Image gen continues async
				// on the server; the output page shows shimmer slots until each
				// image arrives.
				if (
					(data.status === "beats_complete" ||
						data.status === "completed" ||
						data.status === "images_partial") &&
					data.storyboard_id
				) {
					router.push(`/storyboard/generate/${data.storyboard_id}`);
					return;
				}

				if (!terminal.has(data.status)) {
					setTimeout(poll, 3000);
				}
			} catch (err) {
				if (cancelled) return;
				setJob((prev) =>
					prev
						? { ...prev, status: "failed", error_message: String(err) }
						: prev
				);
			}
		}

		poll();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [phase, job?.job_id, locale]);

	// ──────────────────────────────────────────────────────────────────────
	// Render
	// ──────────────────────────────────────────────────────────────────────
	return (
		<div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
			<div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
				{/* Header breadcrumb */}
				<div className="flex items-center justify-between mb-6">
					<button
						type="button"
						onClick={() => router.back()}
						className="text-xs text-gray-500 hover:text-gray-300"
						aria-label={t("nav.back")}
					>
						← {t("nav.back_to_create")}
					</button>

					{phase === "wizard" && (
						<nav
							className="text-[10px] uppercase tracking-wider text-gray-500"
							aria-label={t("steps_nav_label")}
						>
							<WizardCrumb current={step} mode={mode} />
						</nav>
					)}
				</div>

				{/* Title */}
				<div className="mb-6">
					<h1 className="font-[var(--font-space-grotesk)] text-2xl text-white">
						{t("title")}
					</h1>
					<p className="text-xs text-gray-400 mt-1">{t("subtitle")}</p>
				</div>

				{/* Mode toggle (above step indicator). Story / Product Demo. */}
				{phase === "wizard" && PRODUCT_MODE_ENABLED && (
					<div
						role="tablist"
						aria-label={t("mode.tablist")}
						className="inline-flex items-center gap-1 mb-6 p-1 bg-[#111111] border border-gray-800 rounded-md"
					>
						<ModeTab
							selected={mode === "story"}
							label={t("mode.story")}
							onClick={() => {
								setMode("story");
								setStep(1);
							}}
						/>
						<ModeTab
							selected={mode === "product_demo"}
							label={t("mode.product_demo")}
							onClick={() => {
								setMode("product_demo");
								setStep(1);
							}}
						/>
					</div>
				)}

				{/* Step 1: Premise (story) OR Product (product_demo) */}
				{phase === "wizard" && step === 1 && mode === "story" && (
					<PremiseStep
						fields={premise}
						onChange={setPremise}
						onContinue={() => setStep(2)}
					/>
				)}

				{phase === "wizard" && step === 1 && mode === "product_demo" && (
					<ProductStep
						value={product}
						onChange={setProduct}
						onContinue={() => setStep(2)}
					/>
				)}

				{/* Step 2: Characters (both modes). Product mode allows 0-2
				    and renders Gemini-suggested characters from the page. */}
				{phase === "wizard" && step === 2 && (
					<CharactersStep
						characters={characters}
						onChange={setCharacters}
						onContinue={() => setStep(3)}
						onBack={() => setStep(1)}
						optional={mode === "product_demo"}
						suggestedCharacters={
							mode === "product_demo"
								? product.brief?.suggestedCharacters
								: undefined
						}
					/>
				)}

				{/* Step 3 story mode: Arc + Payoff. Product mode: Style + Submit. */}
				{phase === "wizard" && step === 3 && mode === "story" && (
					<>
						<ArcPayoffStep
							fields={arcPayoff}
							onChange={setArcPayoff}
							onSubmit={submit}
							onBack={() => setStep(2)}
							submitting={submitting}
							estimatedCredits={estimatedCredits}
						/>
						{submitError && (
							<div className="mt-4 rounded-xl p-3 bg-red-500/10 border border-red-500/30">
								<p className="text-xs text-red-400">{submitError}</p>
							</div>
						)}
					</>
				)}

				{phase === "wizard" && step === 3 && mode === "product_demo" && (
					<>
						<PremiseStep
							fields={productStyle}
							onChange={setProductStyle}
							onContinue={submit}
							onBack={() => setStep(2)}
							ctaKey="nav.generate_ad"
							ctaBusyKey="nav.generating"
							busy={submitting}
						/>
						{submitError && (
							<div className="mt-4 rounded-xl p-3 bg-red-500/10 border border-red-500/30">
								<p className="text-xs text-red-400">{submitError}</p>
							</div>
						)}
					</>
				)}

				{phase === "polling" && job && (
					<ProgressPolling
						status={job.status}
						characters={job.storyboard?.animation_meta?.characters}
						errorMessage={job.error_message}
						onRetry={
							job.status === "failed" || job.status === "stale"
								? () => {
										setJob(null);
										setPhase("wizard");
										setSubmitting(false);
								  }
								: undefined
						}
					/>
				)}
			</div>
		</div>
	);
}

interface WizardCrumbProps {
	current: 1 | 2 | 3;
	mode: Mode;
}

function WizardCrumb({ current, mode }: WizardCrumbProps) {
	const t = useTranslations("animation.wizard");
	const labels =
		mode === "product_demo"
			? [t("crumb.product"), t("crumb.characters"), t("crumb.style")]
			: [t("crumb.premise"), t("crumb.characters"), t("crumb.arc")];
	return (
		<span>
			{labels.map((label, i) => {
				const step = i + 1;
				const active = step === current;
				return (
					<span key={step}>
						<span
							className={
								active ? "text-white" : step < current ? "text-gray-400" : "text-gray-600"
							}
						>
							{step} {label}
						</span>
						{step < 3 && <span className="text-gray-700"> · </span>}
					</span>
				);
			})}
		</span>
	);
}

interface ModeTabProps {
	selected: boolean;
	label: string;
	onClick: () => void;
}

function ModeTab({ selected, label, onClick }: ModeTabProps) {
	return (
		<button
			type="button"
			role="tab"
			aria-selected={selected}
			onClick={onClick}
			className={
				selected
					? "px-3 py-1.5 text-xs uppercase tracking-wide rounded-md text-white bg-[#252525] focus-visible:ring-1 ring-gray-500"
					: "px-3 py-1.5 text-xs uppercase tracking-wide rounded-md text-gray-400 hover:text-gray-200 focus-visible:ring-1 ring-gray-500"
			}
		>
			{label}
		</button>
	);
}
