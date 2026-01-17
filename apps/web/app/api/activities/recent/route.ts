import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

// Helper to calculate time ago string
function getTimeAgo(dateString: string): string {
	const createdAt = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - createdAt.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) {
		return 'Just now';
	} else if (diffMins < 60) {
		return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
	} else if (diffHours < 24) {
		return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
	} else if (diffDays === 1) {
		return 'Yesterday';
	} else if (diffDays < 7) {
		return `${diffDays} days ago`;
	} else {
		return createdAt.toLocaleDateString();
	}
}

/**
 * GET /api/activities/recent
 * Fetch recent activities (analysis jobs + generated storyboards) for the authenticated user
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

		// Fetch recent analysis jobs (up to 5)
		// Include generated score columns for fast access without JSONB extraction
		const { data: jobs, error: jobsError } = await supabase
			.from('analysis_jobs')
			.select(`
				id,
				status,
				video_url,
				file_uri,
				created_at,
				storyboard_result,
				classification_result,
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
			.order('created_at', { ascending: false })
			.limit(5);

		if (jobsError) {
			console.error('[Activities] Failed to fetch jobs:', jobsError);
		}

		// Fetch recent generated storyboards (up to 5)
		const { data: storyboards, error: storyboardsError } = await supabase
			.from('generated_storyboards')
			.select('id, title, niche_category, content_type, created_at')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(5);

		if (storyboardsError) {
			console.error('[Activities] Failed to fetch storyboards:', storyboardsError);
		}

		// Format analysis job activities
		const jobActivities = (jobs || []).map((job) => {
			let title = 'Untitled Analysis';
			if (job.storyboard_result?.storyboard?.overview?.title) {
				title = job.storyboard_result.storyboard.overview.title;
			} else if (job.video_url) {
				const urlMatch = job.video_url.match(/[?&]v=([^&]+)/);
				if (urlMatch) {
					title = `YouTube Video ${urlMatch[1].substring(0, 8)}...`;
				} else {
					title = 'YouTube Video';
				}
			} else if (job.file_uri) {
				title = 'Uploaded Video';
			}

			const type = job.status === 'completed' ? 'Analysis' :
				job.status === 'failed' ? 'Failed' :
					'In Progress';

			return {
				id: job.id,
				title,
				type,
				timeAgo: getTimeAgo(job.created_at),
				status: job.status,
				activityType: 'analysis' as const,
				createdAt: job.created_at,
				// Include score metrics (from generated columns)
				scores: job.status === 'completed' ? {
					overall: job.deterministic_score,
					hook: job.hook_strength,
					structure: job.structure_pacing,
					delivery: job.delivery_performance,
					clarity: job.value_clarity,
				} : undefined,
				metadata: {
					format: job.video_format,
					hookCategory: job.hook_category,
					niche: job.niche_category,
					contentType: job.content_type,
				},
			};
		});

		// Format generated storyboard activities
		const storyboardActivities = (storyboards || []).map((sb) => ({
			id: sb.id,
			title: sb.title || 'Generated Storyboard',
			type: 'Generated',
			timeAgo: getTimeAgo(sb.created_at),
			status: 'completed',
			activityType: 'generated' as const,
			createdAt: sb.created_at,
		}));

		// Merge and sort by created_at, take top 5
		const allActivities = [...jobActivities, ...storyboardActivities]
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 5)
			.map(({ createdAt, ...rest }) => rest); // Remove createdAt from response

		return NextResponse.json({ activities: allActivities });
	} catch (error) {
		console.error('[Activities] API error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
