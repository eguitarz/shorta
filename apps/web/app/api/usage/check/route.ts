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
      .select('tier')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({
        tier: 'free',
        can_analyze: false,
      });
    }

    // Paid users - storyboard usage with monthly limit
    if (profile.tier === 'founder' || profile.tier === 'lifetime') {
      const { data: usageData } = await supabase.rpc('reset_storyboard_usage_if_needed', {
        p_user_id: user.id,
      });

      const storyboardsUsed = usageData?.[0]?.storyboards_used ?? 0;
      const storyboardsLimit = usageData?.[0]?.storyboards_limit ?? 50;
      const storyboardsResetAt = usageData?.[0]?.storyboards_reset_at ?? null;

      return NextResponse.json({
        tier: profile.tier,
        can_analyze: storyboardsUsed < storyboardsLimit,
        storyboards_used: storyboardsUsed,
        storyboards_limit: storyboardsLimit,
        storyboards_remaining: Math.max(0, storyboardsLimit - storyboardsUsed),
        storyboards_reset_at: storyboardsResetAt,
        can_create_storyboard: storyboardsUsed < storyboardsLimit,
      });
    }

    // Free tier - no storyboard access
    return NextResponse.json({
      tier: profile.tier,
      can_analyze: false,
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
