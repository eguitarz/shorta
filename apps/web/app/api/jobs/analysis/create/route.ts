import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { hashIP, getClientIp } from '@/lib/ip-hash';
import { verifyTurnstile } from '@/lib/turnstile';

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

      if (existingUsage && existingUsage.analyses_used >= 1) {
        return NextResponse.json(
          {
            error: 'Usage limit reached',
            message: 'You have used your free trial. Upgrade to Pro for unlimited analyses!',
            limitType: 'anonymous',
            upgradeRequired: true,
            analyses_used: existingUsage.analyses_used,
            analyses_limit: 1,
          },
          { status: 429 }
        );
      }

      // 3. Create job with is_anonymous=true
      const videoUrl = url || null;
      const videoFileUri = fileUri || null;

      const { data: job, error: jobError } = await supabase
        .from('analysis_jobs')
        .insert({
          user_id: null, // Anonymous job
          video_url: videoUrl,
          file_uri: videoFileUri,
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
        // Increment existing
        const { error: updateError } = await supabaseAdmin
          .from('anonymous_usage')
          .update({ analyses_used: existingUsage.analyses_used + 1 })
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

      // Logged-in users get unlimited analyses - no tier checking needed
      const videoUrl = url || null;
      const videoFileUri = fileUri || null;

      const { data: job, error: jobError } = await supabase
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

      if (jobError) {
        console.error('[Job Create] Failed:', jobError);
        return NextResponse.json(
          { error: `Failed to create job: ${jobError.message}` },
          { status: 500 }
        );
      }

      console.log(`[Job Created] ID: ${job.id}, User: ${user.id}, Access: Unlimited`);

      return NextResponse.json({
        job_id: job.id,
        status: job.status,
        video_url: job.video_url,
        current_step: job.current_step,
        total_steps: job.total_steps,
        created_at: job.created_at,
        tier: 'unlimited', // All logged-in users have unlimited access
        analyses_remaining: -1, // -1 = unlimited
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
