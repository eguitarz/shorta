import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { processClassification } from '@/lib/analysis/process-classification';
import { processLinting } from '@/lib/analysis/process-linting';
import { processStoryboard } from '@/lib/analysis/process-storyboard';

/**
 * GET /api/jobs/analysis/[job_id]
 * Get job status and trigger next processing step if needed
 * This endpoint completes in <100 seconds per step
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  // Require authentication
  const authError = await requireAuth(request);
  if (authError) return authError;

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
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

    // Fetch job
    const { data: job, error: fetchError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job belongs to user
    if (job.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this job' },
        { status: 403 }
      );
    }

    console.log(`[Poll] Job ${job_id}, Status: ${job.status}, Step: ${job.current_step}`);

    // State machine: trigger next step based on status and current_step
    if (job.status === 'pending') {
      if (job.current_step === 0) {
        // Run Step 1: Classification (5-10s)
        console.log(`[Poll] Triggering classification for job ${job_id}`);
        await processClassification(job_id);

        // Refetch job after processing
        const { data: updatedJob } = await supabase
          .from('analysis_jobs')
          .select('*')
          .eq('id', job_id)
          .single();

        return buildJobResponse(updatedJob || job);

      } else if (job.current_step === 1) {
        // Run Step 2: Linting (30-45s)
        console.log(`[Poll] Triggering linting for job ${job_id}`);
        await processLinting(job_id);

        // Refetch job after processing
        const { data: updatedJob } = await supabase
          .from('analysis_jobs')
          .select('*')
          .eq('id', job_id)
          .single();

        return buildJobResponse(updatedJob || job);

      } else if (job.current_step === 2) {
        // Run Step 3: Storyboard (60-90s)
        console.log(`[Poll] Triggering storyboard for job ${job_id}`);
        await processStoryboard(job_id);

        // Refetch job after processing
        const { data: updatedJob } = await supabase
          .from('analysis_jobs')
          .select('*')
          .eq('id', job_id)
          .single();

        return buildJobResponse(updatedJob || job);
      }
    }

    // If not pending or step out of range, just return current job status
    return buildJobResponse(job);

  } catch (error) {
    console.error('Poll job API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Build standardized job response
 */
function buildJobResponse(job: any) {
  const progressPercent = job.total_steps > 0
    ? (job.current_step / job.total_steps) * 100
    : 0;

  return NextResponse.json({
    job_id: job.id,
    status: job.status,
    current_step: job.current_step,
    total_steps: job.total_steps,
    progress_percent: progressPercent,

    // Results (available as each step completes)
    classification: job.classification_result || null,
    lintSummary: job.lint_result || null,
    storyboard: job.storyboard_result?.storyboard || null,

    // Full storyboard result (when completed)
    ...(job.status === 'completed' && job.storyboard_result ? {
      url: job.storyboard_result.url,
      classification: job.storyboard_result.classification,
      lintSummary: job.storyboard_result.lintSummary,
      storyboard: job.storyboard_result.storyboard,
    } : {}),

    // Metadata
    video_url: job.video_url,
    created_at: job.created_at,
    updated_at: job.updated_at,
    completed_at: job.completed_at,
    error_message: job.error_message,
  });
}
