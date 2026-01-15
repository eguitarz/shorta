import { createServiceClient } from '@/lib/supabase-service';
import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';

/**
 * Step 1: Classify the video format
 * Duration: ~5-10 seconds
 * Updates job status to 'classifying', runs classification, then advances to step 1
 */
export async function processClassification(jobId: string) {
  const supabase = createServiceClient();

  try {
    console.log(`[Classification] Starting for job ${jobId}`);

    // Update status to 'classifying'
    await supabase
      .from('analysis_jobs')
      .update({ status: 'classifying' })
      .eq('id', jobId);

    // Fetch job
    const { data: job, error: fetchError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      throw new Error(`Failed to fetch job: ${fetchError?.message || 'Job not found'}`);
    }

    // Use video_url for YouTube, or file_uri for uploaded files
    const videoSource = job.video_url || job.file_uri;

    if (!videoSource) {
      throw new Error('No video source available (neither video_url nor file_uri)');
    }

    console.log(`[Classification] Processing video: ${videoSource}`);

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    if (!client.classifyVideo) {
      throw new Error('Client does not support video classification');
    }

    // Run classification (5-10s)
    let classification;
    try {
      classification = await client.classifyVideo(videoSource);
      console.log(`[Classification] Result:`, JSON.stringify(classification, null, 2));

      if (!classification || !classification.format) {
        throw new Error('Invalid classification result: missing format');
      }
    } catch (error) {
      console.error(`[Classification] Classification failed for job ${jobId}, using fallback:`, error);
      
      // Fallback to 'other' format with generic rules - don't block analysis
      classification = {
        format: 'other' as const,
        confidence: 0,
        evidence: ['Classification failed - using generic rules'],
        fallback: {
          format: 'other' as const,
          confidence: 0,
        },
      };
      
      console.log(`[Classification] Using fallback classification:`, JSON.stringify(classification, null, 2));
    }

    // Store result and advance to step 1
    const { error: updateError } = await supabase
      .from('analysis_jobs')
      .update({
        status: 'pending',
        current_step: 1,
        classification_result: classification,
      })
      .eq('id', jobId);

    if (updateError) {
      throw new Error(`Failed to update job: ${updateError.message}`);
    }

    console.log(`[Classification] Completed for job ${jobId}`);

    return { success: true, classification };
  } catch (error) {
    console.error(`[Classification] Error for job ${jobId}:`, error);

    // Only fail if it's not a classification error (e.g., database error)
    // Classification errors should have been handled above with fallback
    const errorMessage = error instanceof Error ? error.message : 'Classification failed';

    await supabase
      .from('analysis_jobs')
      .update({
        status: 'failed',
        error_message: `Classification failed: ${errorMessage}`,
      })
      .eq('id', jobId);

    throw error;
  }
}
