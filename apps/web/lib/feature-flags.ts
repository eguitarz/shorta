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
