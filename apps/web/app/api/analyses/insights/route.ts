import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

/**
 * GET /api/analyses/insights
 * Returns aggregated score insights for the authenticated user's analyses.
 * Used by the dashboard improvement tracking panel.
 */
export async function GET(request: NextRequest) {
	try {
		const user = await getAuthenticatedUser(request);

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

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

		const now = new Date();
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

		// Fetch last 30 completed analyses (for trend chart + stats)
		const { data: recent, error: recentError } = await supabase
			.from('analysis_jobs')
			.select('id, created_at, deterministic_score, storyboard_result, video_url, file_uri')
			.eq('user_id', user.id)
			.eq('status', 'completed')
			.not('deterministic_score', 'is', null)
			.order('created_at', { ascending: false })
			.limit(30);

		if (recentError) {
			console.error('[Insights] Failed to fetch recent analyses:', recentError);
			return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
		}

		if (!recent || recent.length === 0) {
			return NextResponse.json({
				trend: [],
				thisMonthAvg: null,
				lastMonthAvg: null,
				totalCompleted: 0,
				bestScore: null,
				allTimeAvg: null,
			});
		}

		// Build trend data: last 15 analyses in chronological order
		const trendData = [...recent]
			.reverse()
			.slice(-15)
			.map((job) => {
				let title = 'Analysis';
				if (job.storyboard_result?.storyboard?.overview?.title) {
					title = job.storyboard_result.storyboard.overview.title;
				} else if (job.video_url) {
					const urlMatch = job.video_url.match(/[?&]v=([^&]+)/);
					title = urlMatch ? `Video ${urlMatch[1].substring(0, 6)}` : 'YouTube Video';
				} else if (job.file_uri) {
					title = 'Uploaded Video';
				}
				return {
					id: job.id,
					date: job.created_at,
					score: job.deterministic_score as number,
					title,
				};
			});

		// Period stats
		const scores = recent.map((j) => j.deterministic_score as number);
		const allTimeAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
		const bestScore = Math.max(...scores);

		const thisMonthScores = recent
			.filter((j) => new Date(j.created_at) >= thirtyDaysAgo)
			.map((j) => j.deterministic_score as number);

		const lastMonthScores = recent
			.filter(
				(j) =>
					new Date(j.created_at) >= sixtyDaysAgo &&
					new Date(j.created_at) < thirtyDaysAgo
			)
			.map((j) => j.deterministic_score as number);

		const thisMonthAvg =
			thisMonthScores.length > 0
				? Math.round(thisMonthScores.reduce((a, b) => a + b, 0) / thisMonthScores.length)
				: null;

		const lastMonthAvg =
			lastMonthScores.length > 0
				? Math.round(lastMonthScores.reduce((a, b) => a + b, 0) / lastMonthScores.length)
				: null;

		return NextResponse.json({
			trend: trendData,
			thisMonthAvg,
			lastMonthAvg,
			totalCompleted: recent.length,
			bestScore,
			allTimeAvg,
		});
	} catch (error) {
		console.error('[Insights] API error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
