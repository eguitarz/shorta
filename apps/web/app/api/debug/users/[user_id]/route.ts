import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/debug/users/[user_id]
 * Debug endpoint to view user profile, recent analyses, and storyboards - DEV ONLY
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    const { user_id } = await params;

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id parameter' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all in parallel
    const [profileRes, jobsRes, storyboardsRes, prefsRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user_id)
        .single(),
      supabase
        .from('analysis_jobs')
        .select('id, status, video_url, file_uri, title, deterministic_score, hook_strength, structure_pacing, delivery_performance, value_clarity, lint_score, niche_category, content_type, hook_category, video_format, video_duration, is_public, starred, created_at, updated_at, completed_at, error_message')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('generated_storyboards')
        .select('id, analysis_job_id, source, title, niche_category, content_type, hook_pattern, video_length_seconds, changes_count, created_at, updated_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('user_issue_preferences')
        .select('issue_key, severity, original_severity, updated_at')
        .eq('user_id', user_id)
        .order('updated_at', { ascending: false }),
    ]);

    return NextResponse.json({
      user_id,
      profile: profileRes.data ?? null,
      profile_error: profileRes.error?.message ?? null,
      analysis_jobs: jobsRes.data ?? [],
      generated_storyboards: storyboardsRes.data ?? [],
      issue_preferences: prefsRes.data ?? [],
    });
  } catch (error) {
    console.error('Debug user API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
