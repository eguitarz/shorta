import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hashIP, getClientIp } from '@/lib/ip-hash';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

/**
 * GET /api/usage/check
 * Check current usage limits for a user or anonymous IP
 * Returns tier, usage count, and remaining analyses
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // API route - ignore cookie setting errors
            }
          },
        },
      }
    );

    if (!user) {
      // Anonymous user - check by IP hash
      const clientIp = getClientIp(request);
      const ipHash = await hashIP(clientIp);

      const { data: anonUsage } = await supabase
        .from('anonymous_usage')
        .select('analyses_used, job_id')
        .eq('ip_hash', ipHash)
        .single();

      const analysesUsed = anonUsage?.analyses_used || 0;
      const analysesLimit = 1; // Anonymous users get 1 analysis
      const analysesRemaining = Math.max(0, analysesLimit - analysesUsed);

      return NextResponse.json({
        tier: 'anonymous',
        analyses_used: analysesUsed,
        analyses_limit: analysesLimit,
        analyses_remaining: analysesRemaining,
        can_analyze: analysesUsed < analysesLimit,
      });
    }

    // Authenticated user - check user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier, credits, credits_cap, current_period_end')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({
        tier: 'free',
        credits: 0,
        credits_cap: 0,
        can_analyze: false,
        can_create_storyboard: false,
      });
    }

    // Founders have unlimited credits
    if (profile.tier === 'founder') {
      return NextResponse.json({
        tier: profile.tier,
        credits: null,
        credits_cap: null,
        can_analyze: true,
        can_create_storyboard: true,
      });
    }

    // Lifetime and paid tiers use credits
    if (['lifetime', 'hobby', 'pro', 'producer'].includes(profile.tier)) {
      const credits = profile.credits ?? 0;
      const creditsCap = profile.credits_cap ?? 0;
      const storyboardCost = 100;

      return NextResponse.json({
        tier: profile.tier,
        credits,
        credits_cap: creditsCap,
        can_analyze: credits >= storyboardCost,
        can_create_storyboard: credits >= storyboardCost,
        current_period_end: profile.current_period_end ?? null,
      });
    }

    // Free tier - one-time 300 credits, no monthly reset
    const freeCredits = profile.credits ?? 0;
    const storyboardCost = 100;
    return NextResponse.json({
      tier: profile.tier,
      credits: freeCredits,
      credits_cap: 0,
      can_analyze: freeCredits >= storyboardCost,
      can_create_storyboard: freeCredits >= storyboardCost,
    });

  } catch (error) {
    console.error('[Usage Check] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
