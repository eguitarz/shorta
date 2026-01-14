import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/debug/jobs/[job_id]
 * Debug endpoint to view raw job data - DEV ONLY
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    const { job_id } = await params;

    if (!job_id) {
      return NextResponse.json(
        { error: 'Missing job_id parameter' },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch complete job data
    const { data: job, error: fetchError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      current_step: job.current_step,
      total_steps: job.total_steps,
      video_url: job.video_url,
      file_uri: job.file_uri,
      is_anonymous: job.is_anonymous,
      is_public: job.is_public,
      user_id: job.user_id,
      created_at: job.created_at,
      updated_at: job.updated_at,
      completed_at: job.completed_at,
      error_message: job.error_message,
      classification_result: job.classification_result,
      lint_result: job.lint_result,
      storyboard_result: job.storyboard_result,
    });
  } catch (error) {
    console.error('Debug job API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
