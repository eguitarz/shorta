import { createServiceClient } from '@/lib/supabase-service';
import { createDefaultLLMClient } from '@/lib/llm';
import type { LLMEnv } from '@/lib/llm';
import { VideoLinter } from '@/lib/linter/engine';
import type { VideoFormat } from '@/lib/linter/types';

/**
 * Step 2: Lint the video based on format-specific rules
 * Duration: ~30-45 seconds
 * Updates job status to 'linting', runs linter, then advances to step 2
 */
export async function processLinting(jobId: string) {
  const supabase = createServiceClient();

  try {
    console.log(`[Linting] Starting for job ${jobId}`);

    // Update status to 'linting'
    await supabase
      .from('analysis_jobs')
      .update({ status: 'linting' })
      .eq('id', jobId);

    // Fetch job with classification result
    const { data: job, error: fetchError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      throw new Error(`Failed to fetch job: ${fetchError?.message || 'Job not found'}`);
    }

    if (!job.classification_result) {
      throw new Error('Classification result not found. Run classification first.');
    }

    // Use video_url for YouTube, or file_uri for uploaded files
    const videoSource = job.video_url || job.file_uri;

    if (!videoSource) {
      throw new Error('No video source available (neither video_url nor file_uri)');
    }

    console.log(`[Linting] Processing video: ${videoSource}`);
    console.log(`[Linting] Format: ${job.classification_result.format}`);

    // Create LLM client
    const env: LLMEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      LLM_MODEL: process.env.LLM_MODEL,
    };

    const client = createDefaultLLMClient(env);

    // Run linter (30-45s)
    const linter = new VideoLinter(client);
    const lintResult = await linter.lint(
      videoSource,
      job.classification_result.format as VideoFormat
    );

    console.log(`[Linting] Found ${lintResult.violations.length} violations`);

    // Store result and advance to step 2
    const { error: updateError } = await supabase
      .from('analysis_jobs')
      .update({
        status: 'pending',
        current_step: 2,
        lint_result: lintResult,
      })
      .eq('id', jobId);

    if (updateError) {
      throw new Error(`Failed to update job: ${updateError.message}`);
    }

    console.log(`[Linting] Completed for job ${jobId}`);

    return { success: true, lintResult };
  } catch (error) {
    console.error(`[Linting] Error for job ${jobId}:`, error);

    // Update job with error status
    const errorMessage = error instanceof Error ? error.message : 'Linting failed';

    await supabase
      .from('analysis_jobs')
      .update({
        status: 'failed',
        error_message: `Linting failed: ${errorMessage}`,
      })
      .eq('id', jobId);

    throw error;
  }
}
