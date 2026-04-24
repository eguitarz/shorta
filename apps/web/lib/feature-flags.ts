/**
 * Feature flags. Env-backed, evaluated server-side so we can gate routes and
 * UI bits without shipping dead code paths.
 *
 * Read flags via the exported helpers; don't inline `process.env.*` at call
 * sites. Keeps naming consistent and gives us one place to add audience rules
 * (beta cohort, user allowlist, etc.) later.
 */

/**
 * AI Animation Storyboard mode. Gates the new /storyboard/create/animation
 * route, the "Animation" option on the format selector, and the animation
 * job routes. OFF by default in prod during ramp-up per the eng review
 * rollout decision (Codex T5).
 *
 * Enable locally: set ANIMATION_MODE_ENABLED=1 (or 'true').
 */
export function isAnimationModeEnabled(): boolean {
	const raw = process.env.ANIMATION_MODE_ENABLED;
	if (!raw) return false;
	return raw === '1' || raw.toLowerCase() === 'true';
}

/**
 * Product Demo mode for AI Animation. Gates the Product Demo toggle in the
 * wizard, URL ingestion, screenshot upload, and product_demo arc. Requires
 * animation mode to also be enabled; if animation mode is off, this returns
 * false regardless.
 *
 * Enable locally: set ANIMATION_PRODUCT_MODE_ENABLED=1 (or 'true').
 */
export function isAnimationProductModeEnabled(): boolean {
	if (!isAnimationModeEnabled()) return false;
	const raw = process.env.ANIMATION_PRODUCT_MODE_ENABLED;
	if (!raw) return false;
	return raw === '1' || raw.toLowerCase() === 'true';
}

/**
 * Evidence Mode on the analyzer page. When enabled, beat issues backed by a
 * linter rule expose an evidence expander showing the rule's rationale, and
 * score cards show a "why this grade" narration grounded in the raw signals.
 * The trust story: stop asking users to take the AI's word for it. Show the
 * receipts that produced each claim.
 *
 * Full rollout via env flag (no A/B cohorts). Works in both server and client
 * code paths because NEXT_PUBLIC_* is statically inlined into client bundles.
 * Enable: set NEXT_PUBLIC_EVIDENCE_MODE_ENABLED=1 (client-visible) or
 * EVIDENCE_MODE_ENABLED=1 (server-only).
 */
export function isEvidenceModeEnabled(): boolean {
	const raw = process.env.NEXT_PUBLIC_EVIDENCE_MODE_ENABLED ?? process.env.EVIDENCE_MODE_ENABLED;
	if (!raw) return false;
	return raw === '1' || raw.toLowerCase() === 'true';
}
