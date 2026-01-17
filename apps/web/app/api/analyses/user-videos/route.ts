import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

/**
 * GET /api/analyses/user-videos
 * Fetch authenticated user's completed analysis jobs for video comparison picker
 * 
 * Query params:
 * - exclude: job ID to exclude from results (current video)
 * - limit: max number of results (default 20)
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const excludeId = searchParams.get('exclude');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

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

        // Build query for completed analysis jobs
        let query = supabase
            .from('analysis_jobs')
            .select(`
				id,
				video_url,
				file_uri,
				created_at,
				completed_at,
				storyboard_result,
				lint_result,
				deterministic_score,
				hook_strength,
				structure_pacing,
				delivery_performance,
				value_clarity,
				video_format,
				hook_category,
				niche_category,
				content_type
			`)
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(limit);

        // Exclude specified job ID if provided
        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data: jobs, error } = await query;

        if (error) {
            console.error('[UserVideos] Failed to fetch jobs:', error);
            return NextResponse.json(
                { error: 'Failed to fetch videos' },
                { status: 500 }
            );
        }

        // Format response with video info and scores
        const videos = (jobs || []).map((job) => {
            // Extract title from storyboard result
            let title = 'Untitled Analysis';
            if (job.storyboard_result?.overview?.title) {
                title = job.storyboard_result.overview.title;
            } else if (job.storyboard_result?.storyboard?.overview?.title) {
                title = job.storyboard_result.storyboard.overview.title;
            } else if (job.video_url) {
                // Extract video ID from YouTube URL for display
                const match = job.video_url.match(/(?:shorts\/|v=)([a-zA-Z0-9_-]{11})/);
                if (match) {
                    title = `YouTube Short ${match[1].substring(0, 6)}...`;
                } else {
                    title = 'YouTube Video';
                }
            } else if (job.file_uri) {
                title = 'Uploaded Video';
            }

            // Check if it's a Short (has /shorts/ in URL)
            const isShort = job.video_url?.includes('/shorts/') || false;

            // Extract YouTube video ID for thumbnail
            let videoId: string | null = null;
            if (job.video_url) {
                const match = job.video_url.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                if (match) {
                    videoId = match[1];
                }
            }

            // Extract issues from lint result for comparison
            const issues = job.lint_result?.issues ||
                job.storyboard_result?.beats?.flatMap((beat: any) =>
                    (beat.retention?.issues || []).map((issue: any) => ({
                        ...issue,
                        beatNumber: beat.beatNumber,
                    }))
                ) || [];

            return {
                id: job.id,
                title,
                videoUrl: job.video_url,
                fileUri: job.file_uri,
                isShort,
                videoId,
                thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
                createdAt: job.created_at,
                completedAt: job.completed_at,
                scores: {
                    overall: job.deterministic_score,
                    hook: job.hook_strength,
                    structure: job.structure_pacing,
                    delivery: job.delivery_performance,
                    clarity: job.value_clarity,
                },
                metadata: {
                    format: job.video_format,
                    hookCategory: job.hook_category,
                    niche: job.niche_category,
                    contentType: job.content_type,
                },
                // Include full storyboard for detailed comparison
                storyboard: job.storyboard_result?.storyboard || job.storyboard_result,
                lintResult: job.lint_result,
                issues,
            };
        });

        return NextResponse.json({ videos });
    } catch (error) {
        console.error('[UserVideos] API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
