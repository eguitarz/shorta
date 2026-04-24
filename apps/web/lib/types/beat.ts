/**
 * Canonical Beat type definitions for storyboards.
 *
 * This module is the single source of truth for the Beat shape and its
 * production-identity union types (ShotType, CameraMovement, TransitionType).
 *
 * Previously defined inline in 3 places:
 *   - app/api/create-storyboard/route.ts (strict version)
 *   - app/api/regenerate-beat/route.ts (loose version)
 *   - lib/image-generation/types.ts (BeatForImage subset)
 *
 * Consolidating here eliminates drift when new fields are added (e.g. the
 * animation storyboard schema that follows this refactor).
 */

/** Shot framing types used in video production */
export type ShotType = 'CU' | 'MCU' | 'MS' | 'MLS' | 'WS' | 'OTS' | 'POV' | 'INSERT';

/** Camera movement verbs */
export type CameraMovement = 'static' | 'pan' | 'tilt' | 'track' | 'zoom' | 'handheld' | 'dolly';

/** Cut/transition styles between beats */
export type TransitionType = 'cut' | 'dissolve' | 'fade' | 'zoom' | 'swipe' | 'whip' | 'none';

/** On-screen text overlay on a beat */
export interface TextOverlay {
	text: string;
	position: 'top' | 'center' | 'bottom' | 'lower-third';
	timing: string;
}

/**
 * Canonical Beat shape used across storyboard generation, regeneration,
 * and image generation flows.
 *
 * Note on `directorNotes`: accepts both `string` (legacy, serialized bullet
 * list) and `string[]` (new, already-split). Regenerate and image-gen paths
 * sometimes receive beats from upstream LLM output that chose either form.
 * Consumers should normalize if they need a guaranteed shape.
 */
export interface Beat {
	beatNumber: number;
	startTime: number;
	endTime: number;
	type: string;
	title: string;
	directorNotes: string | string[];
	script: string;
	visual: string;
	audio: string;

	// Optional production-identity fields
	shotType?: ShotType;
	cameraMovement?: CameraMovement;
	transition?: TransitionType;

	// Optional enrichments
	textOverlays?: TextOverlay[];
	bRollSuggestions?: string[];
	retentionTip?: string;
}

/**
 * Subset of Beat fields that the image-generation pipeline needs to build
 * a per-beat image prompt. Derived from Beat to stay in sync automatically.
 */
export type BeatForImage = Pick<
	Beat,
	'beatNumber' | 'title' | 'type' | 'visual' | 'script' | 'directorNotes' | 'shotType' | 'cameraMovement' | 'bRollSuggestions'
>;

// ────────────────────────────────────────────────────────────────────────────
// AI Animation Storyboard types
// ────────────────────────────────────────────────────────────────────────────

/** Arc template id. `custom` routes to `arcCustomDescription`. */
export type ArcTemplateId =
	| 'setup_twist_payoff'
	| 'problem_escalation_resolution'
	| 'loop'
	| 'reveal'
	| 'reversal'
	| 'chase_build'
	| 'product_demo'
	| 'custom';

/** Where a beat sits in the narrative arc. */
export type NarrativeRole =
	| 'setup'
	| 'inciting'
	| 'escalation'
	| 'twist'
	| 'payoff'
	| 'button'
	| 'hook_problem'
	| 'product_reveal'
	| 'feature_highlight'
	| 'cta';

/** One character in an animation storyboard. */
export interface AnimationCharacter {
	/** Stable id used as characterRefs entry on beats. e.g. 'char_1'. */
	id: string;
	name: string;
	/** 3-5 appearance traits, user-authored. */
	traits: string[];
	/** One-sentence personality, user-authored. */
	personality: string;
	/**
	 * AI-generated description of the character, suitable for injecting into
	 * every beat prompt as text. Set by Pass 1 of the animation pipeline.
	 */
	sheetPrompt?: string;
	/** Storage path in the private character-sheets bucket. Undefined until image generated. */
	sheetStoragePath?: string;
	sheetGeneratedAt?: string;
	/** If char sheet generation failed, reason surfaced to the retry UI. */
	sheetFailureReason?: string;
	/**
	 * Transient short-lived signed URL for the private sheet image. NEVER
	 * persisted — the API attaches this on polling responses so the UI can
	 * render character thumbnails during the reveal card (and any other
	 * future preview surfaces). Expires in ~120s.
	 */
	sheetSignedUrl?: string;
}

/**
 * Per-beat narrative intent produced by Pass 1 and consumed by Pass 2.
 * Not user-facing; intermediate pipeline state.
 */
export interface AnimationBeatIntent {
	beatIndex: number;
	narrativeRole: NarrativeRole;
	intent: string;
}

/**
 * Distilled demo brief produced by Gemini from the Jina-rendered page markdown.
 * Feeds Pass 1 / Pass 2 prompts and the beat image prompt. Optional throughout
 * because URL ingest may fail partially, and upload-only jobs never populate it.
 */
export interface ProductDemoBrief {
	/** One-sentence product description — punchier than the scraped headline. */
	oneLiner?: string;
	/** 3-5 concise value props in the product's voice. */
	valueProps?: string[];
	/** 2-4 specific features worth highlighting, each with a one-line benefit. */
	features?: Array<{ name: string; benefit: string }>;
	/** Inferred emotional register of the product's own copy. */
	inferredTone?: string;
	/** Who the product is for, inferred from the page. */
	inferredAudience?: string;
	/** 2-3 punchy CTA variants Gemini distilled from the page. */
	ctaSuggestions?: string[];
	/** Brand signals Gemini inferred from copy tone + og:image colors. */
	brandSignals?: string;
	/** Recommended styleAnchor for the animation pipeline. */
	recommendedStyleAnchor?: string;
	/** What NOT to do — pitfalls Gemini flagged. */
	avoid?: string[];
	/**
	 * Characters Gemini spotted in the attached page images (mascots, avatars,
	 * team photos, illustrated figures). Each carries a `sheetStoragePath`
	 * pointing to the image we saved in the character-sheets bucket — if the
	 * user picks one, Pass 3 sheet generation is skipped and the landing-page
	 * image is pinned as the character reference on every beat.
	 */
	suggestedCharacters?: Array<{
		name: string;
		traits: string[];
		personality: string;
		sheetStoragePath: string;
		/** Short-lived signed URL for wizard preview only. Not persisted to the job. */
		sheetSignedUrl?: string;
	}>;
}

/**
 * Product demo context. Optional — set when the user picks Product Demo mode
 * in the wizard. Lives alongside (not instead of) the story fields so the
 * pipeline can still produce characters/narration on top of the product.
 */
export interface ProductContext {
	mode: 'url' | 'upload';
	/** URL the user pasted (present for `mode: 'url'`, optional for 'upload'). */
	sourceUrl?: string;
	productName: string;
	headline: string;
	subhead?: string;
	/** CTA text shown at the final beat. Replaces the narrative `payoff`. */
	ctaText: string;
	/** Storage paths in the private product-assets bucket. 1-4 items. */
	assetPaths: string[];
	/** The canonical product frame (pinned on reveal + feature beats). */
	heroAssetPath: string;
	/** True when partial scrape left some fields empty. UI-only, non-authoritative. */
	scrapePartial?: boolean;
	/**
	 * Structured demo brief from Jina Reader → Gemini summarizer. Drives
	 * prompts at every pipeline stage. Populated on URL ingest only.
	 */
	brief?: ProductDemoBrief;
}

/**
 * Storyboard-level animation metadata. NULL on non-animation storyboards.
 * Lives as a jsonb column on `generated_storyboards`.
 */
export interface AnimationMeta {
	/** User-authored one-sentence premise. */
	logline: string;
	/** Tone picked from chip group (e.g. 'funny', 'heartwarming'). */
	tone: string;
	/** Visual style descriptor (e.g. 'Pixar-ish 3D', 'Ghibli 2D', 'low-poly'). */
	styleAnchor: string;
	/** Setting/world in one sentence. */
	sceneAnchor: string;
	/** Arc structure the user picked. */
	arcTemplate: ArcTemplateId;
	/** Free-form arc description. Only set when arcTemplate === 'custom'. */
	arcCustomDescription?: string;
	/** User-authored payoff — required; this is the fun moment. */
	payoff: string;
	/** 0-2 characters. Product demo mode allows 0. */
	characters: AnimationCharacter[];
	/**
	 * Beat intents from Pass 1, consumed by Pass 2. Discarded from the UI
	 * after Pass 2 writes them into beats. Left here so Pass 2 can run in a
	 * separate request from Pass 1 (resumable pipeline).
	 */
	beatIntents?: AnimationBeatIntent[];
	/** Product demo context. Undefined for story-mode jobs. */
	productContext?: ProductContext;
}

/** Wizard input before a storyboard exists (posted to /api/jobs/animation-storyboard/create). */
export interface AnimationWizardSpec {
	logline: string;
	tone: string;
	styleAnchor: string;
	sceneAnchor: string;
	arcTemplate: ArcTemplateId;
	arcCustomDescription?: string;
	payoff: string;
	characters: Array<
		Pick<AnimationCharacter, 'name' | 'traits' | 'personality'> & {
			/**
			 * Optional pre-set character sheet storage path. When present,
			 * Pass 3 skips sheet generation and pins this image as the
			 * reference across every beat. Used for "reuse avatar from
			 * landing page" in product demo mode.
			 */
			sheetStoragePath?: string;
		}
	>;
	/** Product demo context. When set, characters may be 0-length. */
	productContext?: ProductContext;
}

/**
 * Animation-mode beat extensions. Additive — all fields optional on the base
 * Beat type so legacy talking_head storyboards (animation_meta = null) still
 * type-check. Pipelines that produce animation output MUST populate these.
 */
export interface AnimationBeatFields {
	narrativeRole?: NarrativeRole;
	/** Character ids from AnimationMeta.characters[].id that appear in this beat. */
	characterRefs?: string[];
	/**
	 * Product asset references. Values: 'hero' pins the heroAssetPath from
	 * ProductContext as a reference image. Set on reveal + feature beats in
	 * product_demo mode. Empty/undefined for story-mode beats.
	 */
	productRefs?: Array<'hero'>;
	/** What each character does in this beat. */
	characterAction?: string;
	/** Framing + movement semantics (richer than just shotType + cameraMovement). */
	cameraAction?: string;
	/** Scene-specific visual detail that inherits from AnimationMeta.sceneAnchor. */
	sceneSnippet?: string;
	/** Optional dialogue line. */
	dialogue?: string;
	/**
	 * Description of the beat's FINAL state — post-action, pre-transition.
	 * Used to generate the END frame so downstream video models (Veo 3,
	 * Runway Gen-4) can operate in their strongest "first + last frame"
	 * mode. If undefined, Pass 4 skips end-frame generation and users fall
	 * back to image-to-video mode for this beat.
	 */
	endFrameIntent?: string;
	/**
	 * When set, Pass 4 SKIPS Gemini image generation for this beat and copies
	 * the referenced asset directly to beat_images. Guarantees pixel-perfect
	 * fidelity for product hero shots, brand reveals, etc. — the viewer sees
	 * the user's uploaded image verbatim, not a re-interpretation.
	 *
	 * Values:
	 *   'product'   — use ProductContext.heroAssetPath as the beat frame
	 *   'character' — use characterRefs[0]'s sheetStoragePath as the beat frame
	 *
	 * Typical usage: CTA beat in product_demo arc → 'product' (100% label
	 * accuracy). Set either automatically by Pass 2 based on narrativeRole or
	 * toggled per-beat by the user in the storyboard editor.
	 */
	useRefAsImage?: 'product' | 'character';
}

/**
 * Beat with optional animation fields attached. Beats written by the animation
 * pipeline should populate the Animation* fields; readers can narrow via
 * `'narrativeRole' in beat` or similar.
 *
 * We intentionally do NOT store rendered exportPrompts on the beat. Per the
 * eng review (Codex T1), prompts are rendered on demand from this structured
 * data via `lib/animation/render-export.ts` so prompt-engineering improvements
 * propagate without migration.
 */
export type AnimationBeat = Beat & AnimationBeatFields;
