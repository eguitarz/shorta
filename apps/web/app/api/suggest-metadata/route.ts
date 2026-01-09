import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv, MetadataSuggestions } from '@/lib/llm';

/**
 * POST /api/suggest-metadata
 * Generate viral title variants and description based on analysis results
 */
export async function POST(request: NextRequest) {
    // Require authentication
    const authError = await requireAuth(request);
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
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json(
                { error: 'jobId is required' },
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

        // Fetch job with all results
        const { data: job, error: fetchError } = await supabase
            .from('analysis_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (fetchError || !job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        // Verify job belongs to user
        if (job.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - You do not own this job' },
                { status: 403 }
            );
        }

        // Ensure analysis is complete
        if (job.status !== 'completed' || !job.storyboard_result) {
            return NextResponse.json(
                { error: 'Analysis must be completed before generating suggestions' },
                { status: 400 }
            );
        }

        // Extract analysis data
        const storyboard = job.storyboard_result.storyboard;
        const classification = job.storyboard_result.classification;
        const videoSource = job.video_url || job.file_uri;

        if (!storyboard || !videoSource) {
            return NextResponse.json(
                { error: 'Missing storyboard or video source' },
                { status: 400 }
            );
        }

        // Create LLM client
        const env: LLMEnv = {
            GEMINI_API_KEY: process.env.GEMINI_API_KEY,
            LLM_MODEL: process.env.LLM_MODEL,
        };

        const client = createDefaultLLMClient(env);

        if (!client.analyzeVideo) {
            return NextResponse.json(
                { error: 'Video analysis not supported' },
                { status: 500 }
            );
        }

        // Build context from analysis results
        const prompt = buildMetadataPrompt(storyboard, classification);

        console.log('[SuggestMetadata] Generating suggestions for job:', jobId);

        // Generate suggestions using the video
        const response = await client.analyzeVideo(videoSource, prompt, {
            temperature: 0.7,
            maxTokens: 2048,
        });

        // Parse JSON response
        const suggestions = parseMetadataResponse(response.content);

        console.log('[SuggestMetadata] Generated:', {
            titlesCount: suggestions.titles.length,
            descriptionLength: suggestions.description.length,
        });

        return NextResponse.json(suggestions);

    } catch (error) {
        console.error('Suggest metadata API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to generate suggestions',
            },
            { status: 500 }
        );
    }
}

function buildMetadataPrompt(storyboard: any, classification: any): string {
    const overview = storyboard.overview || {};
    const performance = storyboard.performance || {};

    return `You are an expert YouTube Shorts growth strategist. Based on the video analysis, generate viral-optimized metadata.

VIDEO ANALYSIS CONTEXT:
- Hook Category: ${overview.hookCategory || 'N/A'}
- Hook Pattern: ${overview.hookPattern || 'N/A'}
- Niche: ${overview.nicheCategory || 'N/A'} (${overview.nicheDescription || 'N/A'})
- Content Type: ${overview.contentType || 'N/A'}
- Target Audience: ${overview.targetAudience || 'N/A'}
- Video Format: ${classification?.format || 'unknown'}

PERFORMANCE METRICS:
- Hook Strength: ${performance.hookStrength || 0}/100
- Viral Pattern Match: ${performance.hook?.viralPattern || 0}/100
- Value Clarity: ${performance.content?.valueClarity || 0}/100

VIRAL TITLE PRINCIPLES:
1. **Curiosity Gap**: Leave something unfinished that demands completion
2. **Specificity**: Use numbers, timeframes, or concrete results
3. **Emotional Trigger**: Tap into fear of missing out, desire, or pain points
4. **Pattern Match**: Mirror successful formats in the niche
5. **Character Limit**: Keep under 70 characters for full visibility

DESCRIPTION BEST PRACTICES:
1. Front-load the value proposition in first line
2. Include 3-5 relevant hashtags at the end
3. Add a call-to-action (follow, like, comment)
4. Keep it scannable with line breaks
5. Include searchable keywords for discoverability

Generate:
- 3 title variants (each with different hook approach)
- 1 description optimized for the platform

Return ONLY this JSON format:
{
  "titles": [
    "Title variant 1 (under 70 chars)",
    "Title variant 2 (under 70 chars)",
    "Title variant 3 (under 70 chars)"
  ],
  "description": "Multi-line description with hashtags"
}`;
}

function parseMetadataResponse(content: string): MetadataSuggestions {
    try {
        let jsonText = content.trim();

        // Handle markdown code blocks
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const parsed = JSON.parse(jsonText);

        // Validate structure
        if (!Array.isArray(parsed.titles) || typeof parsed.description !== 'string') {
            throw new Error('Invalid response structure');
        }

        return {
            titles: parsed.titles.slice(0, 3), // Ensure max 3 titles
            description: parsed.description,
        };
    } catch (error) {
        console.error('Failed to parse metadata response:', content);
        throw new Error('Failed to parse AI response');
    }
}
