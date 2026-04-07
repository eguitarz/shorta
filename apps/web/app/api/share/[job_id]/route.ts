import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

/**
 * GET /api/share/[job_id]
 * Fetch analysis data for public viewing (NO AUTHENTICATION REQUIRED)
 * Anyone with the link can view if job.is_public === true
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;

    if (!job_id) {
      return NextResponse.json(
        { error: 'Missing job_id parameter' },
        { status: 400 }
      );
    }

    // Create service client (bypasses RLS)
    const supabase = createServiceClient();

    // Fetch job
    const { data: job, error: fetchError } = await supabase
      .from('analysis_jobs')
      .select('id, status, is_public, storyboard_result, completed_at')
      .eq('id', job_id)
      .single();

    if (fetchError) {
      console.error('[Share] Database error:', fetchError);
      return NextResponse.json(
        {
          error: 'Database error while fetching analysis',
          details: fetchError.message,
          hint: fetchError.hint || 'Check if migrations have been applied'
        },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Check if job is public
    if (!job.is_public) {
      console.log('[Share] Job is not public:', { job_id, is_public: job.is_public });
      return NextResponse.json(
        { error: 'This analysis is not publicly shared' },
        { status: 404 }
      );
    }

    // Check if job is completed
    if (job.status !== 'completed' || !job.storyboard_result) {
      console.log('[Share] Job not ready:', {
        job_id,
        status: job.status,
        has_storyboard: !!job.storyboard_result,
        completed_at: job.completed_at
      });
      return NextResponse.json(
        {
          error: 'Analysis is not available. It may be incomplete or failed.',
          status: job.status,
          has_data: !!job.storyboard_result
        },
        { status: 410 } // 410 Gone
      );
    }

    console.log('[Share] Successfully serving public share for job:', job_id);

    // Strip replicationBlueprint from public responses — contains
    // creator-copying instructions that could cause PR issues
    const rawStoryboard = job.storyboard_result.storyboard;
    const storyboard = rawStoryboard
      ? (() => { const { replicationBlueprint, ...rest } = rawStoryboard; return rest; })()
      : rawStoryboard;

    // Return analysis data (NO USER PII)
    const response = NextResponse.json({
      analysis: {
        url: job.storyboard_result.url,
        isUploadedFile: job.storyboard_result.isUploadedFile || false,
        classification: job.storyboard_result.classification,
        lintSummary: job.storyboard_result.lintSummary,
        storyboard,
        analyzedAt: job.completed_at,
      },
    });

    // Cache for 24h — analysis data doesn't change after completion
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    return response;

  } catch (error) {
    console.error('Public share API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
