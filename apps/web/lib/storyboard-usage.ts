import { SupabaseClient } from '@supabase/supabase-js';

const STORYBOARD_COST = 100; // Define the cost of a storyboard in credits

/**
 * Checks if a user has enough credits to create a storyboard.
 * This is intended for client-side checks to update the UI.
 * It also returns true for legacy users with unlimited plans.
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
    // Fail open to not block UI, the server-side check will be the source of truth
    return true;
  }

  // Legacy users have unlimited credits
  if (profile.tier === 'founder' || profile.tier === 'lifetime') {
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
