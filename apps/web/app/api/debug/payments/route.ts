import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/payments
 * Debug endpoint to view all user profiles with Stripe payment data - DEV ONLY
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [profilesRes, authRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('user_id, tier, credits, credits_cap, stripe_customer_id, stripe_subscription_id, subscription_status, last_visited_at, created_at, updated_at')
        .order('updated_at', { ascending: false }),
      supabase.auth.admin.listUsers(),
    ]);

    if (profilesRes.error) {
      return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
    }

    // Build a map of user_id -> last_sign_in_at from auth users
    const lastSignInMap: Record<string, string | null> = {};
    for (const u of authRes.data?.users ?? []) {
      lastSignInMap[u.id] = u.last_sign_in_at ?? null;
    }

    // Merge last_sign_in_at into each profile
    const profiles = (profilesRes.data ?? []).map((p) => ({
      ...p,
      last_sign_in_at: lastSignInMap[p.user_id] ?? null,
    }));

    const byTier: Record<string, number> = { free: 0, hobby: 0, pro: 0, producer: 0, founder: 0, lifetime: 0 };
    const byStatus: Record<string, number> = { active: 0, canceled: 0, past_due: 0, trialing: 0, null: 0 };

    for (const p of profiles) {
      if (p.tier in byTier) byTier[p.tier]++;
      const statusKey = p.subscription_status ?? 'null';
      if (statusKey in byStatus) byStatus[statusKey]++;
    }

    return NextResponse.json({
      profiles,
      summary: {
        total: profiles?.length ?? 0,
        byTier,
        byStatus,
      },
    });
  } catch (error) {
    console.error('Debug payments API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
