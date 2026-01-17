import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

/**
 * GET /api/analyses/search
 * Search and filter analysis jobs using generated score columns
 *
 * Query Parameters:
 * - minScore: Minimum deterministic score (0-100)
 * - maxScore: Maximum deterministic score (0-100)
 * - minHook: Minimum hook strength (0-100)
 * - maxHook: Maximum hook strength (0-100)
 * - minStructure: Minimum structure pacing (0-100)
 * - minDelivery: Minimum delivery performance (0-100)
 * - minClarity: Minimum value clarity (0-100)
 * - format: Video format (talking_head, gameplay, other)
 * - hookCategory: Hook category (premise, visual, conflict, etc.)
 * - niche: Niche category
 * - contentType: Content type
 * - minWPS: Minimum words per second score
 * - maxFillerWords: Maximum filler word count
 * - maxHookTime: Maximum time to claim (seconds)
 * - hasPayoff: Boolean filter for payoff presence
 * - hasLoopCue: Boolean filter for loop cue presence
 * - sortBy: Field to sort by (deterministic_score, hook_strength, created_at, etc.)
 * - sortOrder: Sort order (asc, desc) - default: desc
 * - limit: Number of results to return (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
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

		// Parse query parameters
		const { searchParams } = new URL(request.url);

		// Score filters
		const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : null;
		const maxScore = searchParams.get('maxScore') ? parseInt(searchParams.get('maxScore')!) : null;
		const minHook = searchParams.get('minHook') ? parseInt(searchParams.get('minHook')!) : null;
		const maxHook = searchParams.get('maxHook') ? parseInt(searchParams.get('maxHook')!) : null;
		const minStructure = searchParams.get('minStructure') ? parseInt(searchParams.get('minStructure')!) : null;
		const minDelivery = searchParams.get('minDelivery') ? parseInt(searchParams.get('minDelivery')!) : null;
		const minClarity = searchParams.get('minClarity') ? parseInt(searchParams.get('minClarity')!) : null;

		// Metadata filters
		const format = searchParams.get('format');
		const hookCategory = searchParams.get('hookCategory');
		const niche = searchParams.get('niche');
		const contentType = searchParams.get('contentType');

		// Submetric filters
		const minWPS = searchParams.get('minWPS') ? parseInt(searchParams.get('minWPS')!) : null;
		const maxFillerWords = searchParams.get('maxFillerWords') ? parseInt(searchParams.get('maxFillerWords')!) : null;
		const maxHookTime = searchParams.get('maxHookTime') ? parseFloat(searchParams.get('maxHookTime')!) : null;
		const hasPayoff = searchParams.get('hasPayoff') === 'true' ? true : searchParams.get('hasPayoff') === 'false' ? false : null;
		const hasLoopCue = searchParams.get('hasLoopCue') === 'true' ? true : searchParams.get('hasLoopCue') === 'false' ? false : null;

		// Pagination and sorting
		const sortBy = searchParams.get('sortBy') || 'created_at';
		const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
		const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
		const offset = parseInt(searchParams.get('offset') || '0');

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

		// Build query using generated columns (much faster than JSONB extraction!)
		let query = supabase
			.from('analysis_jobs')
			.select(`
				id,
				status,
				video_url,
				file_uri,
				created_at,
				completed_at,
				deterministic_score,
				hook_strength,
				structure_pacing,
				delivery_performance,
				value_clarity,
				lint_score,
				video_format,
				hook_category,
				hook_pattern,
				niche_category,
				content_type,
				target_audience,
				hook_tt_claim,
				hook_pb,
				hook_spec,
				clarity_score_wps,
				clarity_word_count,
				clarity_duration,
				structure_bc,
				structure_pp,
				structure_lc,
				delivery_filler_count,
				delivery_pause_count,
				storyboard_result
			`, { count: 'exact' })
			.eq('user_id', user.id)
			.eq('status', 'completed'); // Only return completed analyses

		// Apply filters using generated columns
		if (minScore !== null) query = query.gte('deterministic_score', minScore);
		if (maxScore !== null) query = query.lte('deterministic_score', maxScore);
		if (minHook !== null) query = query.gte('hook_strength', minHook);
		if (maxHook !== null) query = query.lte('hook_strength', maxHook);
		if (minStructure !== null) query = query.gte('structure_pacing', minStructure);
		if (minDelivery !== null) query = query.gte('delivery_performance', minDelivery);
		if (minClarity !== null) query = query.gte('value_clarity', minClarity);

		if (format) query = query.eq('video_format', format);
		if (hookCategory) query = query.eq('hook_category', hookCategory);
		if (niche) query = query.eq('niche_category', niche);
		if (contentType) query = query.eq('content_type', contentType);

		if (minWPS !== null) query = query.gte('clarity_score_wps', minWPS);
		if (maxFillerWords !== null) query = query.lte('delivery_filler_count', maxFillerWords);
		if (maxHookTime !== null) query = query.lte('hook_tt_claim', maxHookTime);
		if (hasPayoff !== null) query = query.eq('structure_pp', hasPayoff);
		if (hasLoopCue !== null) query = query.eq('structure_lc', hasLoopCue);

		// Apply sorting - validate sortBy is a safe column name
		const validSortColumns = [
			'deterministic_score',
			'hook_strength',
			'structure_pacing',
			'delivery_performance',
			'value_clarity',
			'created_at',
			'completed_at',
			'hook_tt_claim',
			'delivery_filler_count',
			'clarity_score_wps',
		];

		const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
		query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

		// Execute query with count and pagination
		const { data: results, error, count } = await query.range(offset, offset + limit - 1);

		if (error) {
			console.error('[Search] Query error:', error);
			return NextResponse.json(
				{ error: 'Failed to search analyses' },
				{ status: 500 }
			);
		}

		// Format results
		const formattedResults = (results || []).map((job) => {
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

			// Calculate words per second from raw data
			const wordsPerSecond = job.clarity_duration > 0
				? (job.clarity_word_count / job.clarity_duration).toFixed(1)
				: null;

			return {
				id: job.id,
				title,
				videoUrl: job.video_url,
				fileUri: job.file_uri,
				createdAt: job.created_at,
				completedAt: job.completed_at,

				// Overall scores
				scores: {
					overall: job.deterministic_score,
					hook: job.hook_strength,
					structure: job.structure_pacing,
					delivery: job.delivery_performance,
					clarity: job.value_clarity,
					lint: job.lint_score,
				},

				// Metadata
				metadata: {
					format: job.video_format,
					hookCategory: job.hook_category,
					hookPattern: job.hook_pattern,
					niche: job.niche_category,
					contentType: job.content_type,
					targetAudience: job.target_audience,
				},

				// Key submetrics
				submetrics: {
					hookTimeToClaim: job.hook_tt_claim,
					hookPatternBreak: job.hook_pb,
					hookSpecificity: job.hook_spec,
					wordsPerSecond: wordsPerSecond,
					wordsPerSecondScore: job.clarity_score_wps,
					wordCount: job.clarity_word_count,
					duration: job.clarity_duration,
					beatCount: job.structure_bc,
					hasPayoff: job.structure_pp,
					hasLoopCue: job.structure_lc,
					fillerWordCount: job.delivery_filler_count,
					pauseCount: job.delivery_pause_count,
				},
			};
		});

		return NextResponse.json({
			results: formattedResults,
			pagination: {
				total: count || 0,
				limit,
				offset,
				hasMore: (count || 0) > offset + limit,
			},
		});

	} catch (error) {
		console.error('[Search] API error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
