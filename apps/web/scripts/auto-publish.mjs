#!/usr/bin/env node
/**
 * auto-publish.mjs — Fully automated weekly creator analysis blog post pipeline
 *
 * Steps:
 * 1. Discover trending YouTube video
 * 2. Check for duplicates (already analyzed)
 * 3. Run Shorta analysis (create job, poll until complete)
 * 4. Mark analysis as public (shareable)
 * 5. Draft blog post using Gemini
 * 6. Generate OG image
 * 7. Write markdown file
 * 8. Regenerate posts-data, build, deploy
 * 9. Commit and push
 *
 * Usage:
 *   node scripts/auto-publish.mjs              # Full pipeline
 *   node scripts/auto-publish.mjs --dry-run    # Stop before deploy
 *   node scripts/auto-publish.mjs --url=URL    # Analyze specific video instead of trending
 *
 * Required env vars:
 *   YOUTUBE_API_KEY, GEMINI_API_KEY,
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'content/blog/posts');

// Parse CLI args
const DRY_RUN = process.argv.includes('--dry-run');
const SPECIFIC_URL = process.argv.find(a => a.startsWith('--url='))?.split('=')[1];

// Load env from wrangler.toml and .dev.vars
function loadEnv() {
  // Try .dev.vars first (local secrets)
  const devVarsPath = join(ROOT, '.dev.vars');
  if (existsSync(devVarsPath)) {
    const lines = readFileSync(devVarsPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }

  // Try wrangler.toml for non-secret vars
  const wranglerPath = join(ROOT, 'wrangler.toml');
  if (existsSync(wranglerPath)) {
    const toml = readFileSync(wranglerPath, 'utf-8');
    const varsMatch = toml.match(/\[vars\]([\s\S]*?)(?=\[|$)/);
    if (varsMatch) {
      const lines = varsMatch[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^(\w+)\s*=\s*"(.+)"$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2];
        }
      }
    }
  }
}

loadEnv();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function checkEnv() {
  const missing = [];
  if (!YOUTUBE_API_KEY) missing.push('YOUTUBE_API_KEY');
  if (!GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(', ')}`);
    console.error('Add them to apps/web/.dev.vars or set as environment variables.');
    process.exit(1);
  }
}

// ─── 1. Discover Trending Video ───────────────────────────────────────────

const YOUTUBE_CATEGORIES = [
  '24', // Entertainment
  '22', // People & Blogs
  '28', // Science & Technology
  '26', // Howto & Style
  '20', // Gaming
];

async function discoverTrendingVideo() {
  if (SPECIFIC_URL) {
    const videoId = extractVideoId(SPECIFIC_URL);
    if (!videoId) throw new Error(`Could not extract video ID from: ${SPECIFIC_URL}`);
    const details = await getVideoDetails(videoId);
    return details;
  }

  // Pick a random category to rotate weekly
  const weekOfYear = Math.floor((Date.now() - new Date(2026, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const categoryId = YOUTUBE_CATEGORIES[weekOfYear % YOUTUBE_CATEGORIES.length];

  console.log(`[Discover] Fetching trending videos in category ${categoryId}...`);

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&videoCategoryId=${categoryId}&maxResults=10&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${await res.text()}`);
  const data = await res.json();

  if (!data.items?.length) throw new Error('No trending videos found');

  // Filter: >100K views, not a live stream, has good metadata
  const candidates = data.items.filter(v => {
    const views = parseInt(v.statistics.viewCount || '0', 10);
    return views > 100_000 && v.snippet.liveBroadcastContent === 'none';
  });

  if (!candidates.length) throw new Error('No suitable trending videos after filtering');

  // Pick the top one (most views)
  candidates.sort((a, b) => parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount));
  const video = candidates[0];

  return {
    videoId: video.id,
    title: video.snippet.title,
    channelTitle: video.snippet.channelTitle,
    channelId: video.snippet.channelId,
    viewCount: parseInt(video.statistics.viewCount),
    url: `https://www.youtube.com/watch?v=${video.id}`,
    thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
    categoryId,
  };
}

async function getVideoDetails(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  if (!data.items?.length) throw new Error(`Video not found: ${videoId}`);
  const v = data.items[0];
  return {
    videoId: v.id,
    title: v.snippet.title,
    channelTitle: v.snippet.channelTitle,
    channelId: v.snippet.channelId,
    viewCount: parseInt(v.statistics.viewCount || '0'),
    url: `https://www.youtube.com/watch?v=${v.id}`,
    thumbnailUrl: v.snippet.thumbnails?.high?.url,
    categoryId: v.snippet.categoryId,
  };
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── 2. Deduplication Check ────────────────────────────────────────────────

function createSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function isAlreadyAnalyzed(videoId) {
  const supabase = createSupabase();
  const { data } = await supabase
    .from('analysis_jobs')
    .select('id')
    .eq('youtube_video_id', videoId)
    .eq('is_public', true)
    .limit(1);
  return data && data.length > 0;
}

function isAlreadyPublished(videoId) {
  if (!existsSync(POSTS_DIR)) return false;
  const files = readdirSync(POSTS_DIR);
  return files.some(f => {
    const content = readFileSync(join(POSTS_DIR, f), 'utf-8');
    return content.includes(videoId);
  });
}

// ─── 3. Run Analysis ─────────────────────────────────────────────────────

async function runAnalysis(videoUrl) {
  const supabase = createSupabase();

  // Create job directly in DB
  const { data: job, error } = await supabase
    .from('analysis_jobs')
    .insert({
      video_url: videoUrl,
      status: 'pending',
      current_step: 0,
      total_steps: 3,
      is_anonymous: false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create job: ${error.message}`);
  console.log(`[Analysis] Created job: ${job.id}`);

  // Poll the analysis API to trigger processing steps
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shorta.ai';
  const maxAttempts = 60; // 5 minutes at 5s intervals

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5000);

    const pollRes = await fetch(`${APP_URL}/api/jobs/analysis/${job.id}`);
    if (!pollRes.ok) {
      console.log(`[Analysis] Poll failed (${pollRes.status}), retrying...`);
      continue;
    }

    const pollData = await pollRes.json();
    console.log(`[Analysis] Step ${pollData.current_step}/${pollData.total_steps} (${pollData.status})`);

    if (pollData.status === 'completed') {
      return { jobId: job.id, analysis: pollData };
    }
    if (pollData.status === 'failed') {
      throw new Error(`Analysis failed: ${pollData.error_message || 'Unknown error'}`);
    }
  }

  throw new Error('Analysis timed out after 5 minutes');
}

// ─── 4. Mark as Public ──────────────────────────────────────────────────

async function markPublic(jobId) {
  const supabase = createSupabase();
  const { error } = await supabase
    .from('analysis_jobs')
    .update({ is_public: true })
    .eq('id', jobId);
  if (error) throw new Error(`Failed to mark public: ${error.message}`);
  console.log(`[Share] Job ${jobId} marked as public`);
  return `https://shorta.ai/shared/${jobId}`;
}

// ─── 5. Draft Blog Post ────────────────────────────────────────────────

async function draftBlogPost(video, analysis, shareUrl, jobId) {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const promptTemplate = readFileSync(join(ROOT, 'content/prompts/blog-draft-prompt.md'), 'utf-8');

  const analysisData = JSON.stringify({
    score: analysis.lintSummary?.score,
    classification: analysis.classification,
    performance: analysis.storyboard?.performance,
    overview: analysis.storyboard?.overview,
    beats: analysis.storyboard?.beats?.slice(0, 5), // First 5 beats for context
  }, null, 2);

  const prompt = `You are a blog writer for Shorta, an AI-powered YouTube video analysis tool.

Using the template and guidelines below, write a complete blog post analyzing this video.

## Video Details
- Title: ${video.title}
- Channel: ${video.channelTitle}
- Views: ${video.viewCount.toLocaleString()}
- URL: ${video.url}

## Analysis Data from Shorta
${analysisData}

## Share Report Job ID
${jobId}

## Template Reference
${promptTemplate}

## Important Rules
1. The blog post MUST include this exact placeholder for the Shorta report embed:
   <!-- shorta-report:${jobId} creator="${video.channelTitle}" title="${video.title}" -->
2. Use the actual analysis data (scores, insights, beat breakdown) in the post
3. The "Pattern" section should identify what makes this creator's approach unique
4. Keep it under 1500 words
5. Output ONLY the markdown content (starting with --- frontmatter)
6. Today's date is ${new Date().toISOString().split('T')[0]}
7. Set the slug-appropriate coverImage path as: /blog/${generateSlug(video)}/og-report.png`;

  console.log('[Draft] Generating blog post with Gemini...');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  let markdown = response.text;

  // Clean up: remove code fences if Gemini wraps it
  markdown = markdown.replace(/^```(?:markdown|md)?\n?/m, '').replace(/\n?```$/m, '');

  // Ensure frontmatter exists
  if (!markdown.startsWith('---')) {
    console.warn('[Draft] Gemini output missing frontmatter, adding default');
    markdown = `---
title: "Why ${video.channelTitle}'s Video Gets ${video.viewCount.toLocaleString()} Views: AI Frame Analysis"
description: "AI-powered frame-by-frame analysis of ${video.channelTitle}'s trending video reveals the patterns behind viral success."
publishedAt: "${new Date().toISOString().split('T')[0]}"
author: "Shorta AI"
categories: ["creator-analysis", "youtube-strategy"]
tags: ["${video.channelTitle.toLowerCase()}", "video analysis", "retention", "trending"]
coverImage: "/blog/${generateSlug(video)}/og-report.png"
featured: false
readingTime: "5 min read"
---

${markdown}`;
  }

  return markdown;
}

function generateSlug(video) {
  const date = new Date().toISOString().split('T')[0];
  const channelSlug = video.channelTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return `${date}-${channelSlug}-analysis`;
}

// ─── 6. Generate OG Image ──────────────────────────────────────────────

function generateOG(video, analysis, slug) {
  const score = analysis.lintSummary?.score || 0;
  const perf = analysis.storyboard?.performance;

  const args = [
    `--slug=${slug}`,
    `--score=${score}`,
    `--title="${video.title.replace(/"/g, '\\"')}"`,
    `--creator="${video.channelTitle.replace(/"/g, '\\"')}"`,
    `--video-id=${video.videoId}`,
  ];

  if (perf?.hookStrength) args.push(`--hook=${perf.hookStrength}`);
  if (perf?.structurePacing) args.push(`--structure=${perf.structurePacing}`);
  if (perf?.deliveryPerformance) args.push(`--delivery=${perf.deliveryPerformance}`);

  console.log(`[OG] Generating image for ${slug}...`);
  try {
    execSync(`node scripts/generate-og.mjs ${args.join(' ')}`, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.warn('[OG] Generation failed, continuing without OG image');
  }
}

// ─── 7. Publish ────────────────────────────────────────────────────────

function writePost(slug, markdown) {
  const filename = `${slug}.md`;
  const filepath = join(POSTS_DIR, filename);

  if (existsSync(filepath)) {
    console.warn(`[Publish] Post already exists: ${filename}, overwriting`);
  }

  writeFileSync(filepath, markdown, 'utf-8');
  console.log(`[Publish] Wrote ${filepath}`);
  return filepath;
}

function buildAndDeploy() {
  console.log('[Build] Regenerating posts data...');
  execSync('node scripts/generate-posts-data.mjs', { cwd: ROOT, stdio: 'inherit' });

  console.log('[Build] Building for Cloudflare...');
  execSync('npm run cf:build', { cwd: ROOT, stdio: 'inherit', timeout: 120_000 });

  console.log('[Deploy] Deploying to Cloudflare...');
  execSync('npx wrangler deploy', { cwd: ROOT, stdio: 'inherit', timeout: 60_000 });
}

function commitAndPush(slug) {
  console.log('[Git] Committing and pushing...');
  execSync('git add -A', { cwd: join(ROOT, '../..'), stdio: 'inherit' });
  execSync(
    `git commit -m "feat: auto-publish creator analysis — ${slug}"`,
    { cwd: join(ROOT, '../..'), stdio: 'inherit' }
  );
  execSync('git push', { cwd: join(ROOT, '../..'), stdio: 'inherit' });
}

// ─── Utilities ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main Pipeline ─────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Shorta Auto-Publish Pipeline');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('═══════════════════════════════════════════════\n');

  checkEnv();

  // Step 1: Discover
  console.log('Step 1: Discovering trending video...');
  const video = await discoverTrendingVideo();
  console.log(`  Found: "${video.title}" by ${video.channelTitle} (${video.viewCount.toLocaleString()} views)\n`);

  // Step 2: Dedup
  console.log('Step 2: Checking for duplicates...');
  if (isAlreadyPublished(video.videoId)) {
    console.log('  Already published. Skipping.');
    process.exit(0);
  }
  const dbDup = await isAlreadyAnalyzed(video.videoId);
  if (dbDup) {
    console.log('  Already analyzed in DB (but not published). Proceeding with existing analysis.');
    // TODO: reuse existing analysis instead of re-running
  }
  console.log('  No duplicates found.\n');

  // Step 3: Analyze
  console.log('Step 3: Running Shorta analysis...');
  const { jobId, analysis } = await runAnalysis(video.url);
  console.log(`  Analysis complete. Score: ${analysis.lintSummary?.score || 'N/A'}\n`);

  // Step 4: Share
  console.log('Step 4: Creating share link...');
  const shareUrl = await markPublic(jobId);
  console.log(`  Share URL: ${shareUrl}\n`);

  // Step 5: Draft
  console.log('Step 5: Drafting blog post...');
  const slug = generateSlug(video);
  const markdown = await draftBlogPost(video, analysis, shareUrl, jobId);
  console.log(`  Draft generated (${markdown.length} chars)\n`);

  // Step 6: OG Image
  console.log('Step 6: Generating OG image...');
  generateOG(video, analysis, slug);
  console.log();

  // Step 7: Write
  console.log('Step 7: Writing post file...');
  writePost(slug, markdown);
  console.log();

  if (DRY_RUN) {
    console.log('═══════════════════════════════════════════════');
    console.log('  DRY RUN COMPLETE — not deploying');
    console.log(`  Post: content/blog/posts/${slug}.md`);
    console.log(`  OG:   public/blog/${slug}/og-report.png`);
    console.log(`  Job:  ${jobId}`);
    console.log('═══════════════════════════════════════════════');
    process.exit(0);
  }

  // Step 8: Build & Deploy
  console.log('Step 8: Building and deploying...');
  buildAndDeploy();
  console.log();

  // Step 9: Commit
  console.log('Step 9: Committing to git...');
  commitAndPush(slug);

  console.log('\n═══════════════════════════════════════════════');
  console.log('  AUTO-PUBLISH COMPLETE');
  console.log(`  Post: https://shorta.ai/blog/${slug}`);
  console.log(`  Report: ${shareUrl}`);
  console.log('═══════════════════════════════════════════════');
}

main().catch(err => {
  console.error('\n[PIPELINE FAILED]', err.message);
  process.exit(1);
});
