import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hashIP, getClientIp } from '@/lib/ip-hash';

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
      .select('tier, analyses_used, analyses_limit')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      // Profile doesn't exist yet (shouldn't happen with trigger, but defensive)
      // Default to free tier
      return NextResponse.json({
        tier: 'free',
        analyses_used: 0,
        analyses_limit: 3,
        analyses_remaining: 3,
        can_analyze: true,
      });
    }

    // Paid users - credit system to be implemented
    if (profile.tier === 'founder' || profile.tier === 'lifetime') {
      return NextResponse.json({
        tier: profile.tier,
        analyses_used: profile.analyses_used,
        analyses_limit: -1, // -1 indicates unlimited (will be replaced with credit system)
        analyses_remaining: -1,
        can_analyze: true,
      });
    }

    // Free tier users have limit
    const analysesRemaining = Math.max(0, profile.analyses_limit - profile.analyses_used);
    const canAnalyze = profile.analyses_used < profile.analyses_limit;

    return NextResponse.json({
      tier: profile.tier,
      analyses_used: profile.analyses_used,
      analyses_limit: profile.analyses_limit,
      analyses_remaining: analysesRemaining,
      can_analyze: canAnalyze,
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
