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
