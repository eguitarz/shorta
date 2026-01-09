import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * POST /api/jobs/[job_id]/share
 * Toggle job.is_public = true and return shareable URL
 * Requires authentication - user must own the job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  // Require authentication with CSRF protection
  const authError = await requireAuthWithCsrf(request);
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
      .select('id, user_id, status, is_public')
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

    // Verify job is completed
    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Cannot share incomplete job. Please wait for analysis to complete.' },
        { status: 400 }
      );
    }

    // If already public, just return the URL (idempotent)
    if (job.is_public) {
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${job_id}`;
      return NextResponse.json({
        share_url: shareUrl,
        is_public: true,
        message: 'Job is already public'
      });
    }

    // Update job to be public
    const { error: updateError } = await supabase
      .from('analysis_jobs')
      .update({ is_public: true })
      .eq('id', job_id);

    if (updateError) {
      console.error('Error making job public:', updateError);
      return NextResponse.json(
        { error: 'Failed to make job public' },
        { status: 500 }
      );
    }

    // Return share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${job_id}`;

    console.log(`[Share] Job ${job_id} made public by user ${user.id}`);

    return NextResponse.json({
      share_url: shareUrl,
      is_public: true,
      message: 'Share link created successfully'
    });

  } catch (error) {
    console.error('Share job API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
