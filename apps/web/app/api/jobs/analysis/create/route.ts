import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * POST /api/jobs/analysis/create
 * Creates a new analysis job and returns job ID immediately
 * This endpoint completes in <5 seconds (just a database insert)
 */
export async function POST(request: NextRequest) {
  // Require authentication
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
    const body = await request.json();
    const { url, fileUri } = body;

    // Validate that either URL or fileUri is provided
    if ((!url || typeof url !== 'string') && (!fileUri || typeof fileUri !== 'string')) {
      return NextResponse.json(
        { error: 'Either URL or fileUri parameter is required' },
        { status: 400 }
      );
    }

    // If URL provided, validate it's a YouTube URL
    if (url && !url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Must be a YouTube Shorts or video link.' },
        { status: 400 }
      );
    }

    // Determine the video source
    const videoUrl = url || null;
    const videoFileUri = fileUri || null;

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

    // Create job in database
    const { data: job, error } = await supabase
      .from('analysis_jobs')
      .insert({
        user_id: user.id,
        video_url: videoUrl,
        file_uri: videoFileUri,
        status: 'pending',
        current_step: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create analysis job:', error);
      return NextResponse.json(
        { error: `Failed to create job: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`[Job Created] ID: ${job.id}, User: ${user.id}, Source: ${videoUrl ? 'YouTube URL' : 'Uploaded file'}`);

    // Return job info
    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      video_url: job.video_url,
      current_step: job.current_step,
      total_steps: job.total_steps,
      created_at: job.created_at,
    }, { status: 201 });

  } catch (error) {
    console.error('Create job API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
