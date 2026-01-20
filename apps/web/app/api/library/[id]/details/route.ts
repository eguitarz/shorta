import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/library/[id]/details
 * Get full analysis details including script, beats, lints for a specific job
 * Used by Draft AI to reference past analyses
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Optional: selective includes (comma-separated)
    const includeParam = searchParams.get('include');
    const includes = includeParam ? includeParam.split(',') : ['overview', 'beats', 'lints', 'hooks', 'scores'];

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
              // Ignore
            }
          },
        },
      }
    );

    // Fetch the full analysis job
    const { data: job, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const storyboardResult = job.storyboard_result;
    const storyboard = storyboardResult?.storyboard;

    if (!storyboard) {
      return NextResponse.json({ error: 'Storyboard data not available' }, { status: 404 });
    }

    // Build response based on includes
    const response: Record<string, any> = {
      id: job.id,
      title: job.title || storyboard.overview?.title || 'Untitled',
      videoUrl: job.video_url,
      analyzedAt: job.created_at,
      starred: job.starred,
    };

    // Overview - basic metadata
    if (includes.includes('overview')) {
      response.overview = {
        title: storyboard.overview?.title,
        niche: storyboard.overview?.nicheCategory,
        nicheDescription: storyboard.overview?.nicheDescription,
        contentType: storyboard.overview?.contentType,
        hookCategory: storyboard.overview?.hookCategory,
        hookPattern: storyboard.overview?.hookPattern,
        targetAudience: storyboard.overview?.targetAudience,
        format: storyboard._format,
        directorTake: storyboard.overview?.directorTake,
      };
    }

    // Hooks - hook text and variants
    if (includes.includes('hooks')) {
      const firstBeat = storyboard.beats?.[0];
      response.hooks = {
        hookText: firstBeat?.script || firstBeat?.transcript,
        hookCategory: storyboard.overview?.hookCategory,
        hookPattern: storyboard.overview?.hookPattern,
        hookDuration: storyboard.performance?.hook?.hookDuration,
        timeToClaim: storyboard._signals?.hook?.TTClaim,
      };
    }

    // Beats - full beat breakdown with scripts
    if (includes.includes('beats')) {
      response.beats = (storyboard.beats || []).map((beat: any, index: number) => ({
        beatNumber: index + 1,
        title: beat.title,
        script: beat.script || beat.transcript,
        visual: beat.visual,
        audio: beat.audio,
        duration: beat.duration,
        timestamp: beat.timestamp,
        issues: beat.issues?.map((issue: any) => ({
          severity: issue.severity,
          message: issue.message,
          suggestion: issue.suggestion,
          ruleId: issue.ruleId,
        })) || [],
      }));
      response.beatCount = storyboard.beats?.length || 0;
    }

    // Lints - issues and suggestions grouped by severity
    if (includes.includes('lints')) {
      const allIssues: any[] = [];
      (storyboard.beats || []).forEach((beat: any, index: number) => {
        (beat.issues || []).forEach((issue: any) => {
          allIssues.push({
            beatNumber: index + 1,
            severity: issue.severity,
            message: issue.message,
            suggestion: issue.suggestion,
            ruleId: issue.ruleId,
            ruleName: issue.ruleName,
          });
        });
      });

      response.lints = {
        summary: storyboardResult.lintSummary,
        critical: allIssues.filter(i => i.severity === 'critical'),
        moderate: allIssues.filter(i => i.severity === 'moderate'),
        minor: allIssues.filter(i => i.severity === 'minor'),
        totalIssues: allIssues.length,
      };
    }

    // Scores - all score metrics
    if (includes.includes('scores')) {
      response.scores = {
        overall: job.deterministic_score,
        hook: job.hook_strength,
        structure: job.structure_pacing,
        clarity: job.value_clarity,
        delivery: job.delivery_performance,
        // Detailed signals
        signals: storyboard._signals,
        scoreBreakdown: storyboard._scoreBreakdown,
      };
    }

    // Full script - concatenated transcript
    if (includes.includes('script')) {
      response.fullScript = (storyboard.beats || [])
        .map((beat: any) => beat.script || beat.transcript)
        .filter(Boolean)
        .join('\n\n');
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Library Details] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
