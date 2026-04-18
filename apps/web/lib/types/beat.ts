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
	| 'custom';

/** Where a beat sits in the narrative arc. */
export type NarrativeRole =
	| 'setup'
	| 'inciting'
	| 'escalation'
	| 'twist'
	| 'payoff'
	| 'button';

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
	/** 1-2 characters. */
	characters: AnimationCharacter[];
	/**
	 * Beat intents from Pass 1, consumed by Pass 2. Discarded from the UI
	 * after Pass 2 writes them into beats. Left here so Pass 2 can run in a
	 * separate request from Pass 1 (resumable pipeline).
	 */
	beatIntents?: AnimationBeatIntent[];
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
	characters: Array<Pick<AnimationCharacter, 'name' | 'traits' | 'personality'>>;
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
	/** What each character does in this beat. */
	characterAction?: string;
	/** Framing + movement semantics (richer than just shotType + cameraMovement). */
	cameraAction?: string;
	/** Scene-specific visual detail that inherits from AnimationMeta.sceneAnchor. */
	sceneSnippet?: string;
	/** Optional dialogue line. */
	dialogue?: string;
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
