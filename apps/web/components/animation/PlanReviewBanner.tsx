"use client";

import { Loader2, Sparkles } from "lucide-react";

interface BeatSummary {
	beatNumber: number;
	narrativeRole?: string;
	useRefAsImage?: 'product' | 'character';
	/** Present when the beat asks for the product as a reference. */
	productRefs?: Array<'hero'>;
}

interface Props {
	beats: BeatSummary[];
	hasProduct: boolean;
	onGenerate: () => void;
	generating?: boolean;
}

const IMAGE_COST_PER_CALL = 10;

/**
 * Plan Review banner shown on /storyboard/generate/[id] for animation
 * storyboards before the user commits to Pass 4 image generation. Lets them
 * see the beat breakdown, see which beats will use the product as a
 * reference, and gate the expensive image-gen step behind an explicit CTA.
 */
export function PlanReviewBanner({
	beats,
	hasProduct,
	onGenerate,
	generating = false,
}: Props) {
	// Cost estimate per beat, matching the backend pipeline:
	//   - useRefAsImage beat: 0 credits (direct copy, no Gemini)
	//   - productRef beat: 40 credits (2 frames × 2 passes: scene + edit)
	//   - plain beat: 20 credits (2 frames × 1 pass)
	let estimatedCredits = 0;
	let productBeats = 0;
	let useRefBeats = 0;
	for (const b of beats) {
		if (b.useRefAsImage) {
			useRefBeats += 1;
		} else if (b.productRefs?.includes('hero')) {
			estimatedCredits += 4 * IMAGE_COST_PER_CALL;
			productBeats += 1;
		} else {
			estimatedCredits += 2 * IMAGE_COST_PER_CALL;
		}
	}

	return (
		<div className="rounded-lg border border-amber-900/50 bg-amber-950/20 overflow-hidden mb-6">
			<div className="px-5 py-4 border-b border-amber-900/40 flex items-start justify-between gap-4">
				<div className="flex items-start gap-3">
					<div className="w-9 h-9 rounded-full bg-amber-600/30 border border-amber-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
						<Sparkles className="w-4 h-4 text-amber-300" />
					</div>
					<div>
						<h3 className="text-base font-semibold text-white">Plan review</h3>
						<p className="text-sm text-gray-300 mt-0.5">
							Review the {beats.length}-beat plan below. Edit any beat's text,
							or pin your real product image on specific beats, then generate
							images when you're ready.
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={onGenerate}
					disabled={generating}
					className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-amber-900 disabled:to-orange-900 disabled:cursor-not-allowed rounded text-sm font-semibold text-white transition-all"
				>
					{generating ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Generating…</span>
						</>
					) : (
						<>
							<Sparkles className="w-4 h-4" />
							<span>
								Generate images (~{estimatedCredits} credits)
							</span>
						</>
					)}
				</button>
			</div>
			<div className="px-5 py-3 text-[11px] text-gray-400 grid grid-cols-1 sm:grid-cols-3 gap-2">
				<div>
					<span className="uppercase tracking-wider text-gray-500 text-[10px]">Beats</span>
					<p className="text-gray-200 text-sm mt-0.5">{beats.length} total</p>
				</div>
				{hasProduct && (
					<div>
						<span className="uppercase tracking-wider text-gray-500 text-[10px]">
							With product reference
						</span>
						<p className="text-gray-200 text-sm mt-0.5">
							{productBeats} AI-generated + insert-edit
							{useRefBeats > 0 ? `, ${useRefBeats} pinned to real product` : ''}
						</p>
					</div>
				)}
				<div>
					<span className="uppercase tracking-wider text-gray-500 text-[10px]">Tip</span>
					<p className="text-gray-200 text-sm mt-0.5">
						Click "Use product image" on any beat below to pin your
						uploaded product directly.
					</p>
				</div>
			</div>
		</div>
	);
}
