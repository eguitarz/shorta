import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hashIP, getClientIp } from '@/lib/ip-hash';
import { verifyTurnstile } from '@/lib/turnstile';
import { hasSufficientCreditsForStoryboard, chargeUserForStoryboard } from '@/lib/storyboard-usage';

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Parse ISO 8601 duration (PT1M30S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// Fetch video duration from YouTube API (lightweight call)
async function fetchVideoDuration(videoId: string): Promise<number | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.items?.[0]?.contentDetails?.duration) return null;

    return parseDuration(data.items[0].contentDetails.duration);
  } catch {
    return null;
  }
}

/**
 * POST /api/jobs/analysis/create
 * Creates a new analysis job and returns job ID immediately
 * This endpoint completes in <5 seconds (just a database insert)
 *
 * Supports both authenticated and anonymous users
 * - Anonymous: 1 free analysis (IP-tracked with CAPTCHA)
 * - Authenticated: Usage limits based on user tier
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, fileUri, turnstileToken } = body;

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

    // Try to get authenticated user (optional for anonymous trials)
    const user = await getAuthenticatedUser(request);

    // Create Supabase client (for regular operations)
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

    // Create service role client (for anonymous_usage table - bypasses RLS)
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Get client IP for anonymous usage tracking
    const clientIp = getClientIp(request);
    const ipHash = await hashIP(clientIp);

    if (!user) {
      // ============================================
      // ANONYMOUS USER PATH
      // ============================================

      // 1. Verify CAPTCHA (Cloudflare Turnstile)
      if (!turnstileToken) {
        return NextResponse.json(
          { error: 'CAPTCHA verification required' },
          { status: 400 }
        );
      }

      const turnstileValid = await verifyTurnstile(turnstileToken, clientIp);
      if (!turnstileValid) {
        return NextResponse.json(
          { error: 'CAPTCHA verification failed. Please try again.' },
          { status: 403 }
        );
      }

      // 2. Check anonymous usage limit (1 analysis per IP)
      const { data: existingUsage } = await supabaseAdmin
        .from('anonymous_usage')
        .select('analyses_used')
        .eq('ip_hash', ipHash)
        .single();

      // Bypass limit check in development
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (!isDevelopment && existingUsage && existingUsage.analyses_used >= 1) {
        return NextResponse.json(
          {
            error: 'Usage limit reached',
            message: 'You have used your free trial. Upgrade to Pro for full access!',
            limitType: 'anonymous',
            upgradeRequired: true,
            analyses_used: existingUsage.analyses_used,
            analyses_limit: 1,
          },
          { status: 429 }
        );
      }

      if (isDevelopment && existingUsage && existingUsage.analyses_used >= 1) {
        console.warn('[Anonymous] Bypassing usage limit in development mode');
      }

      // 3. Create job with is_anonymous=true
      const videoUrl = url || null;
      const videoFileUri = fileUri || null;

      // Fetch video duration for FPS optimization (non-blocking, optional)
      let videoDuration: number | null = null;
      if (videoUrl) {
        const videoId = extractYouTubeId(videoUrl);
        if (videoId) {
          videoDuration = await fetchVideoDuration(videoId);
        }
      }

      // Extract YouTube video ID for channel video matching
      const youtubeVideoId = videoUrl ? extractYouTubeId(videoUrl) : null;

      const { data: job, error: jobError } = await supabase
        .from('analysis_jobs')
        .insert({
          user_id: null, // Anonymous job
          video_url: videoUrl,
          file_uri: videoFileUri,
          video_duration: videoDuration,
          youtube_video_id: youtubeVideoId,
          status: 'pending',
          current_step: 0,
          is_anonymous: true,
          ip_hash: ipHash,
        })
        .select()
        .single();

      if (jobError) {
        console.error('[Job Create] Anonymous job failed:', jobError);
        return NextResponse.json(
          { error: `Failed to create job: ${jobError.message}` },
          { status: 500 }
        );
      }

      // 4. Track anonymous usage (use admin client to bypass RLS)
      if (existingUsage) {
        // Increment existing and store job_id
        const { error: updateError } = await supabaseAdmin
          .from('anonymous_usage')
          .update({
            analyses_used: existingUsage.analyses_used + 1,
            job_id: job.id, // Store the latest job_id for this anonymous user
          })
          .eq('ip_hash', ipHash);

        if (updateError) {
          console.error('[Anonymous Usage] Failed to increment:', updateError);
        }
      } else {
        // Create new
        const { error: insertError } = await supabaseAdmin
          .from('anonymous_usage')
          .insert({
            ip_hash: ipHash,
            analyses_used: 1,
            job_id: job.id, // Store the job_id for this anonymous user
          });

        if (insertError) {
          console.error('[Anonymous Usage] Failed to insert:', insertError);
        }
      }

      console.log(`[Job Created] ID: ${job.id}, Type: Anonymous, IP: ${clientIp.substring(0, 8)}...`);

      return NextResponse.json({
        job_id: job.id,
        status: job.status,
        video_url: job.video_url,
        current_step: job.current_step,
        total_steps: job.total_steps,
        created_at: job.created_at,
        tier: 'anonymous',
        analyses_remaining: 0, // Used their 1 free analysis
      }, { status: 201 });

    } else {
      // ============================================
      // AUTHENTICATED USER PATH (Unlimited Access)
      // ============================================

      // CSRF validation required for authenticated requests
      const csrfResult = validateCsrf(request);
      if (!csrfResult.isValid) {
        return NextResponse.json(
          { error: csrfResult.error || 'CSRF validation failed' },
          { status: 403 }
        );
      }

      // Check if user has enough credits
      const hasCredits = await hasSufficientCreditsForStoryboard(supabase, user.id);
      if (!hasCredits) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            message: 'You don\'t have enough credits to create a storyboard. Please upgrade your plan.',
          },
          { status: 403 }
        );
      }

      const videoUrl = url || null;
      const videoFileUri = fileUri || null;

      // Fetch video duration for FPS optimization (non-blocking, optional)
      let videoDuration: number | null = null;
      if (videoUrl) {
        const videoId = extractYouTubeId(videoUrl);
        if (videoId) {
          videoDuration = await fetchVideoDuration(videoId);
        }
      }

      // Extract YouTube video ID for channel video matching
      const youtubeVideoId = videoUrl ? extractYouTubeId(videoUrl) : null;

      const { data: job, error: jobError } = await supabase
        .from('analysis_jobs')
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          file_uri: videoFileUri,
          video_duration: videoDuration,
          youtube_video_id: youtubeVideoId,
          status: 'pending',
          current_step: 0,
        })
        .select()
        .single();

      if (jobError) {
        console.error('[Job Create] Failed:', jobError);
        return NextResponse.json(
          { error: `Failed to create job: ${jobError.message}` },
          { status: 500 }
        );
      }

      // Charge credits after successful job creation
      const { error: chargeError } = await chargeUserForStoryboard(supabase, user.id);
      if (chargeError) {
        console.error('[Job Create] Failed to charge credits:', chargeError);
        return NextResponse.json(
          { error: 'Failed to process credits. Please try again.' },
          { status: 402 }
        );
      }

      console.log(`[Job Created] ID: ${job.id}, User: ${user.id}`);

      return NextResponse.json({
        job_id: job.id,
        status: job.status,
        video_url: job.video_url,
        current_step: job.current_step,
        total_steps: job.total_steps,
        created_at: job.created_at,
      }, { status: 201 });
    }

  } catch (error) {
    console.error('[Job Create] API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
