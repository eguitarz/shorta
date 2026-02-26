import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic';

/**
 * GET /api/storyboards/generated/[id]
 * Fetch a generated storyboard by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Missing storyboard ID' },
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

        // Fetch storyboard (RLS will enforce ownership)
        const { data: storyboard, error } = await supabase
            .from('generated_storyboards')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !storyboard) {
            console.error('[Storyboard] Fetch error:', error);
            return NextResponse.json(
                { error: 'Storyboard not found' },
                { status: 404 }
            );
        }

        // Return in the same format as the original sessionStorage data
        return NextResponse.json({
            id: storyboard.id,
            url: null, // Original URL not stored separately
            original: {
                overview: storyboard.original_overview,
                beats: storyboard.original_beats,
            },
            generated: {
                overview: storyboard.generated_overview,
                beats: storyboard.generated_beats,
            },
            appliedChanges: storyboard.applied_changes || [],
            generatedAt: storyboard.created_at,

            // Hook variants (for created storyboards)
            hookVariants: storyboard.hook_variants || [],

            // Additional metadata
            source: storyboard.source || 'analyzed',
            analysisJobId: storyboard.analysis_job_id,
            title: storyboard.title,
            nicheCategory: storyboard.niche_category,
            contentType: storyboard.content_type,
            hookPattern: storyboard.hook_pattern,

            // Beat images
            beatImages: storyboard.beat_images || {},
        });
    } catch (error) {
        console.error('[Storyboard] API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
