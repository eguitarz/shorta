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
/**
 * PATCH /api/storyboards/generated/[id]
 *
 * Persist edits to a storyboard. Used by the generate page whenever the
 * user edits beat text, regenerates a beat, applies a hook variant,
 * reorders/deletes/duplicates beats, etc. Without this, those edits only
 * lived in local state + sessionStorage — so any server-side action
 * (image regen, export pack, polling) read stale beats from the DB.
 *
 * Body (all optional): {
 *   beats?: Beat[],
 *   hookVariants?: HookVariant[],
 *   selectedHookId?: string,
 * }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const update: Record<string, unknown> = {};
        if (Array.isArray(body?.beats)) {
            update.generated_beats = body.beats;
        }
        if (Array.isArray(body?.hookVariants)) {
            update.hook_variants = body.hookVariants;
        }
        if (typeof body?.selectedHookId === 'string') {
            update.selected_hook_id = body.selectedHookId;
        }
        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
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
                            // ignore
                        }
                    },
                },
            }
        );

        // Ownership check: RLS would block too, but explicit 403 is clearer.
        const { data: sb, error: sbErr } = await supabase
            .from('generated_storyboards')
            .select('id, user_id')
            .eq('id', id)
            .single();
        if (sbErr || !sb) {
            return NextResponse.json({ error: 'Storyboard not found' }, { status: 404 });
        }
        if (sb.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error: updateErr } = await supabase
            .from('generated_storyboards')
            .update(update)
            .eq('id', id);
        if (updateErr) {
            return NextResponse.json(
                { error: `Update failed: ${updateErr.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[storyboards/generated PATCH] error:', message);
        return NextResponse.json({ error: 'Update failed', message }, { status: 500 });
    }
}

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

        // Self-healing backfill: older animation storyboards were created
        // before productContext was persisted into animation_meta. The UI
        // reads productContext from animation_meta to render the "Use
        // product image" toggle — so without this backfill, old storyboards
        // never show the button. We backfill from analysis_jobs.animation_spec
        // on read, then write it back so future reads are clean.
        let animationMeta = storyboard.animation_meta;
        if (
            animationMeta &&
            typeof animationMeta === 'object' &&
            !animationMeta.productContext &&
            storyboard.analysis_job_id
        ) {
            const { data: job } = await supabase
                .from('analysis_jobs')
                .select('animation_spec')
                .eq('id', storyboard.analysis_job_id)
                .single();
            const specProduct = job?.animation_spec?.productContext;
            if (specProduct) {
                animationMeta = { ...animationMeta, productContext: specProduct };
                // Persist the repair. Fire-and-forget — response doesn't
                // wait for the write to land.
                void supabase
                    .from('generated_storyboards')
                    .update({ animation_meta: animationMeta })
                    .eq('id', storyboard.id);
            }
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

            // Animation mode metadata (null for non-animation storyboards).
            // Uses the backfilled copy when productContext was missing.
            animation_meta: animationMeta || null,
        });
    } catch (error) {
        console.error('[Storyboard] API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
