import { SupabaseClient } from '@supabase/supabase-js';

const STORYBOARD_COST = 100; // Define the cost of a storyboard in credits
const IMAGE_GENERATION_COST_PER_IMAGE = 10; // Define the cost per image in credits
const THUMBNAIL_ANALYSIS_COST = 20; // AI thumbnail analysis with Gemini vision
const STORYBOARD_GENERATION_COST = 50; // Generate director storyboard from approved changes
const CHAT_MESSAGE_COST = 5; // Per-message cost for storyboard chat with Gemini

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

export {
  IMAGE_GENERATION_COST_PER_IMAGE,
  THUMBNAIL_ANALYSIS_COST,
  STORYBOARD_GENERATION_COST,
  CHAT_MESSAGE_COST,
};
