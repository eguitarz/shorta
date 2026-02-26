import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  hasSufficientCreditsForImageGeneration,
  chargeUserForImageGeneration,
  IMAGE_GENERATION_COST_PER_IMAGE,
} from '@/lib/storyboard-usage';
import { NanaBananaClient } from '@/lib/image-generation/nana-banana-client';
import { buildStyleContext, buildCharacterContext, buildImagePrompt } from '@/lib/image-generation/prompt-builder';
import type {
  GenerateImageRequest,
  GenerateImageResult,
  ReferenceImage,
} from '@/lib/image-generation/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for image generation

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const input: GenerateImageRequest = await request.json();

    if (!input.storyboardId || !input.beats?.length || !input.overview) {
      return NextResponse.json(
        { error: 'Missing required fields: storyboardId, beats, overview' },
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

    // Check credits for all images
    const imageCount = input.beats.length;
    const hasCredits = await hasSufficientCreditsForImageGeneration(supabase, user.id, imageCount);
    if (!hasCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          creditsRequired: IMAGE_GENERATION_COST_PER_IMAGE * imageCount,
        },
        { status: 403 }
      );
    }

    // Initialize image generation client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Image generation service not configured' },
        { status: 500 }
      );
    }

    const imageClient = new NanaBananaClient(apiKey);
    const styleContext = buildStyleContext(input.overview);
    const characterContext = buildCharacterContext(input.overview, input.beats);
    const hasRef = !!input.referenceImage;
    const results: GenerateImageResult[] = [];
    const errors: { beatNumber: number; error: string }[] = [];

    console.log(`[Image Gen] Starting generation for ${input.beats.length} beats, storyboard: ${input.storyboardId}`);

    // Track the first generated image to use as character reference for subsequent beats
    let firstGeneratedImage: ReferenceImage | undefined;

    // Generate images sequentially for consistency
    for (const beat of input.beats) {
      console.log(`[Image Gen] Processing beat ${beat.beatNumber}...`);
      try {
        // Use user's reference if provided, otherwise use first generated image
        // to maintain character consistency across beats
        const referenceForBeat = input.referenceImage
          ? input.referenceImage
          : firstGeneratedImage;
        const isUsingRef = !!referenceForBeat;

        const prompt = buildImagePrompt(input.overview, beat, {
          styleContext,
          characterContext,
          hasReferenceImage: isUsingRef,
        });
        const imageData = await imageClient.generateImage(
          prompt,
          referenceForBeat
        );

        // Store first image as reference for subsequent beats
        if (!firstGeneratedImage) {
          firstGeneratedImage = {
            mimeType: imageData.mimeType,
            data: imageData.base64,
            name: 'beat-1-reference',
          };
        }
        console.log(`[Image Gen] Beat ${beat.beatNumber} - Gemini returned image, size: ${imageData.base64.length}, mimeType: ${imageData.mimeType}`);

        // Return as data URL for now (storage upload requires migration)
        const imageUrl = `data:${imageData.mimeType};base64,${imageData.base64}`;

        // Try to upload to Supabase Storage if bucket exists
        const storagePath = `${user.id}/${input.storyboardId}/beat_${beat.beatNumber}.png`;
        try {
          const buffer = Buffer.from(imageData.base64, 'base64');
          const { error: uploadError } = await supabase.storage
            .from('storyboard-images')
            .upload(storagePath, buffer, {
              contentType: imageData.mimeType,
              upsert: true,
            });

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from('storyboard-images').getPublicUrl(storagePath);

            // Add cache-busting param so browser doesn't show stale images on regenerate
            const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

            // Use public URL instead of data URL if upload succeeded
            results.push({
              beatNumber: beat.beatNumber,
              imageUrl: cacheBustedUrl,
              prompt,
            });

            // Persist to DB
            const { error: rpcError } = await supabase.rpc('update_beat_image', {
              p_storyboard_id: input.storyboardId,
              p_beat_number: beat.beatNumber.toString(),
              p_image_data: {
                url: cacheBustedUrl,
                storagePath,
                prompt,
                generatedAt: new Date().toISOString(),
              },
            });
            if (rpcError) {
              console.error(`[Image Gen] Failed to persist beat ${beat.beatNumber} to DB:`, rpcError);
            }
          } else {
            // Storage bucket not available, use data URL
            console.log(`[Image Gen] Storage not available for beat ${beat.beatNumber}, using data URL`);
            results.push({
              beatNumber: beat.beatNumber,
              imageUrl,
              prompt,
            });
          }
        } catch {
          // Storage not available, use data URL
          results.push({
            beatNumber: beat.beatNumber,
            imageUrl,
            prompt,
          });
        }

        // Charge credits for this image
        const { error: chargeError } = await chargeUserForImageGeneration(supabase, user.id);
        if (chargeError) {
          console.error(`[Image Gen] Failed to charge credits for beat ${beat.beatNumber}:`, chargeError);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(
          `[Image Gen] Failed to generate image for beat ${beat.beatNumber}:`,
          error
        );
        errors.push({ beatNumber: beat.beatNumber, error: errMsg });
        // Continue with other beats on failure
      }
    }

    return NextResponse.json({
      images: results,
      creditsCharged: results.length * IMAGE_GENERATION_COST_PER_IMAGE,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    console.error('[Image Gen] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
