import { SupabaseClient } from '@supabase/supabase-js';

const STORYBOARD_COST = 100; // Define the cost of a storyboard in credits
const IMAGE_GENERATION_COST_PER_IMAGE = 10; // Define the cost per image in credits
const THUMBNAIL_ANALYSIS_COST = 20; // AI thumbnail analysis with Gemini vision
const STORYBOARD_GENERATION_COST = 50; // Generate director storyboard from approved changes

// ────────────────────────────────────────────────────────────────────────────
// AI Animation Storyboard pricing
// ────────────────────────────────────────────────────────────────────────────

/**
 * Base cost for an animation storyboard. Covers Pass 1 (arc + char
 * descriptions) and Pass 2 (beat generation). Per-image costs are charged
 * separately as they generate, at IMAGE_GENERATION_COST_PER_IMAGE each.
 * Decided in eng review (4A): 150 base + ~70 for images = ~220 typical.
 */
const ANIMATION_STORYBOARD_BASE_COST = 150;

/**
 * Hard cap per animation job. If cumulative charges (base + char sheets +
 * beat images + re-roll retries) reach this, the job halts and the overage
 * (if any) is refunded; the UI renders a "Spend cap reached" banner with a
 * continue CTA. Prevents retry-loop billing surprises (Codex T6).
 */
// Raised from 350 → 450 to accommodate the two-pass product-insert edit
// step added in product_demo mode (each productRef beat does a scene gen
// + a second edit pass to insert the real product). Worst case for a 5-
// beat storyboard with 3 productRef beats: 150 base + 20 char sheets + 40
// (hook non-product frames) + 120 (product beats × 2 frames × 2 passes)
// = 330. Leaving headroom for retries / edge cases.
const MAX_CREDITS_PER_ANIMATION_JOB = 450;

/**
 * How many free re-rolls a user gets per animation storyboard before further
 * re-rolls are credit-gated at IMAGE_GENERATION_COST_PER_IMAGE each. Tracked
 * per-storyboard on the client + validated server-side.
 */
const FREE_REROLLS_PER_STORYBOARD = 3;

/**
 * Checks if a user has enough credits to create a storyboard.
 * All tiers (including founder/lifetime) use credits.
 *
 * @returns {Promise<boolean>} - True if the user can create a storyboard.
 */
export async function hasSufficientCreditsForStoryboard(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('credits, tier')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    console.error('[Credit Check] Failed to get user profile:', error);
    return false;
  }

  // Founders have unlimited credits
  if (profile.tier === 'founder') {
    return true;
  }

  return profile.credits >= STORYBOARD_COST;
}

/**
 * Charges a user for creating a storyboard by calling the database function.
 * This is the source of truth for credit deduction.
 *
 * @returns {Promise<{ error: any }>} - An object containing an error if one occurred.
 */
export async function chargeUserForStoryboard(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: any }> {
  const { error } = await supabase.rpc('deduct_storyboard_credits', {
    p_user_id: userId,
    p_amount: STORYBOARD_COST,
  });

  if (error) {
    console.error('[Credit Charge] Failed to deduct credits:', error);
    // The error from the DB function will be 'insufficient_credits' if they can't afford it.
    return { error };
  }

  return { error: null };
}

/**
 * Checks if a user has enough credits to generate images.
 * Costs 10 credits per image.
 */
export async function hasSufficientCreditsForImageGeneration(
  supabase: SupabaseClient,
  userId: string,
  imageCount: number = 1
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('credits, tier')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    console.error('[Credit Check] Failed to get user profile:', error);
    return false;
  }

  if (profile.tier === 'founder') {
    return true;
  }

  return profile.credits >= IMAGE_GENERATION_COST_PER_IMAGE * imageCount;
}

/**
 * Charges a user for generating a single storyboard image (10 credits).
 */
export async function chargeUserForImageGeneration(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: any }> {
  const { error } = await supabase.rpc('deduct_storyboard_credits', {
    p_user_id: userId,
    p_amount: IMAGE_GENERATION_COST_PER_IMAGE,
  });

  if (error) {
    console.error('[Credit Charge] Failed to deduct image generation credits:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Generic credit check: returns true if user has enough credits for the given cost.
 * Founders bypass all credit checks.
 */
export async function hasSufficientCredits(
  supabase: SupabaseClient,
  userId: string,
  cost: number
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('credits, tier')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    console.error('[Credit Check] Failed to get user profile:', error);
    return false;
  }

  if (profile.tier === 'founder') {
    return true;
  }

  return profile.credits >= cost;
}

/**
 * Generic credit deduction: deducts the given amount from user's credits.
 */
export async function chargeCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<{ error: any }> {
  const { error } = await supabase.rpc('deduct_storyboard_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error(`[Credit Charge] Failed to deduct ${amount} credits:`, error);
    return { error };
  }

  return { error: null };
}

// ────────────────────────────────────────────────────────────────────────────
// Animation-mode helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Check whether user has enough credits to START an animation job (base cost
 * only; image costs are checked as they're generated).
 */
export async function hasSufficientCreditsForAnimationStoryboard(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  return hasSufficientCredits(supabase, userId, ANIMATION_STORYBOARD_BASE_COST);
}

/**
 * Charge the animation storyboard base cost (Pass 1 + Pass 2 LLM). Called on
 * job creation. If the job later fails before delivering any value (i.e. char
 * sheets gen fails hard — though that's now soft-fail per Codex T3), the
 * caller should compensate via `chargeCredits(..., -ANIMATION_STORYBOARD_BASE_COST)`.
 */
export async function chargeAnimationStoryboardBase(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: any }> {
  return chargeCredits(supabase, userId, ANIMATION_STORYBOARD_BASE_COST);
}

/**
 * Given a user's current re-roll count on a storyboard, tell callers whether
 * this re-roll should be free or should charge IMAGE_GENERATION_COST_PER_IMAGE.
 */
export function canRerollFree(currentRerollCount: number): boolean {
  return currentRerollCount < FREE_REROLLS_PER_STORYBOARD;
}

/**
 * Charge for a post-cap re-roll. Returns an error if insufficient credits.
 * Callers handle the "show upgrade modal" UX on error.
 */
export async function chargeReroll(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: any }> {
  return chargeCredits(supabase, userId, IMAGE_GENERATION_COST_PER_IMAGE);
}

export {
  IMAGE_GENERATION_COST_PER_IMAGE,
  THUMBNAIL_ANALYSIS_COST,
  STORYBOARD_GENERATION_COST,
  ANIMATION_STORYBOARD_BASE_COST,
  MAX_CREDITS_PER_ANIMATION_JOB,
  FREE_REROLLS_PER_STORYBOARD,
};
