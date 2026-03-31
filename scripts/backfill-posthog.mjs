/**
 * PostHog backfill script
 * Sends historical analyzer + storyboard usage events from Supabase into PostHog.
 *
 * Usage:
 *   node scripts/backfill-posthog.mjs
 *
 * Reads credentials from apps/web/.env.local
 */

import { createClient } from '@supabase/supabase-js';
import { PostHog } from 'posthog-node';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load env ────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../apps/web/.env.local');
const envContent = readFileSync(envPath, 'utf-8');

const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL          = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;
const POSTHOG_KEY           = env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST          = env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !POSTHOG_KEY) {
  console.error('Missing env vars — check apps/web/.env.local');
  process.exit(1);
}

// ── Clients ─────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const posthog  = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, flushAt: 50, flushInterval: 0 });

// ── Helpers ──────────────────────────────────────────────────────────────────

function distinctId(userId) {
  // PostHog needs a stable distinct_id; use the Supabase user UUID
  return userId;
}

function capture(event, userId, properties, timestamp) {
  posthog.capture({
    distinctId: distinctId(userId),
    event,
    properties: { ...properties, backfilled: true },
    timestamp: new Date(timestamp),
  });
}

// ── 1. Backfill analyzer_started from analysis_jobs ─────────────────────────

console.log('\n📊 Fetching analysis_jobs...');

const { data: jobs, error: jobsError } = await supabase
  .from('analysis_jobs')
  .select('id, user_id, video_url, file_uri, status, created_at')
  .order('created_at', { ascending: true });

if (jobsError) {
  console.error('Error fetching analysis_jobs:', jobsError.message);
  process.exit(1);
}

console.log(`   Found ${jobs.length} analysis jobs`);

let analyzerCount = 0;
for (const job of jobs) {
  const source = job.file_uri ? 'upload' : 'url';
  capture('analyzer_started', job.user_id, {
    source,
    entry_point: 'backfill',
    job_id: job.id,
    status: job.status,
  }, job.created_at);
  analyzerCount++;
}

console.log(`   ✅ Queued ${analyzerCount} analyzer_started events`);

// ── 2. Backfill storyboard_generated from generated_storyboards ───────────────

console.log('\n📝 Fetching generated_storyboards...');

const { data: storyboards, error: sbError } = await supabase
  .from('generated_storyboards')
  .select('id, user_id, source, content_type, niche_category, created_at, generated_overview')
  .order('created_at', { ascending: true });

if (sbError) {
  console.error('Error fetching generated_storyboards:', sbError.message);
  process.exit(1);
}

console.log(`   Found ${storyboards.length} storyboards`);

// Separate analyzer-generated vs standalone-created storyboards
const analyzerStoryboards  = storyboards.filter(s => s.source === 'analyzed');
const createdStoryboards   = storyboards.filter(s => s.source !== 'analyzed');

let sbAnalyzerCount = 0;
for (const sb of analyzerStoryboards) {
  capture('storyboard_generated', sb.user_id, {
    entry_point: 'analyzer',
    content_type: sb.content_type,
    niche_category: sb.niche_category,
    storyboard_id: sb.id,
    backfill_source: 'analyzed',
  }, sb.created_at);
  sbAnalyzerCount++;
}

let sbCreatedCount = 0;
for (const sb of createdStoryboards) {
  capture('storyboard_generated', sb.user_id, {
    entry_point: 'create_page',
    content_type: sb.content_type,
    niche_category: sb.niche_category,
    storyboard_id: sb.id,
    backfill_source: 'created',
  }, sb.created_at);

  // Also emit storyboard_started (we know the page was visited)
  capture('storyboard_started', sb.user_id, {
    entry_point: 'backfill',
    has_topic: true,
    storyboard_id: sb.id,
  }, sb.created_at);

  sbCreatedCount++;
}

console.log(`   ✅ Queued ${sbAnalyzerCount} storyboard_generated events (from analyzer)`);
console.log(`   ✅ Queued ${sbCreatedCount} storyboard_generated + storyboard_started events (standalone)`);

// ── Flush ─────────────────────────────────────────────────────────────────────

console.log('\n⬆️  Flushing to PostHog...');
await posthog.shutdown();
console.log('\n✅ Backfill complete!');
console.log(`   analyzer_started:      ${analyzerCount}`);
console.log(`   storyboard_generated:  ${sbAnalyzerCount + sbCreatedCount}`);
console.log(`   storyboard_started:    ${sbCreatedCount}`);
console.log('\nEvents will appear in PostHog within a few minutes.');
