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
  // Try .env.local and .dev.vars (local secrets)
  for (const envFile of ['.env.local', '.dev.vars']) {
    const envPath = join(ROOT, envFile);
    if (existsSync(envPath)) {
      const lines = readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const match = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
        }
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

// ─── 1. Discover Video from Curated Creators ─────────────────────────────
//
// Curated list of well-known, value-driven, talking-head YouTubers.
// These are established creators (500K+ subs) who teach, explain, or share
// expertise. No entertainment, music, gaming, or one-off viral channels.
//
// To add creators: append { channelId, name, niche } to this list.

const CURATED_CREATORS = [
  // Business & Entrepreneurship
  { channelId: 'UCGy2GclhUlHJBGnp7OzLEaQ', name: 'Ali Abdaal', niche: 'productivity' },
  { channelId: 'UCvKRFNawVcuz4b9ihUTFzmQ', name: 'Pat Flynn', niche: 'business' },
  { channelId: 'UCJ24N4O0bP7LGLBDvye7oC8', name: 'Matt D\'Avella', niche: 'self-improvement' },
  { channelId: 'UC7SeFWZYFmsm1tqWxfuT_1Q', name: 'Thomas Frank', niche: 'productivity' },
  // Tech & Education
  { channelId: 'UCsBjURrPoezykLs9EqgamOA', name: 'Fireship', niche: 'tech' },
  { channelId: 'UCXv1JCOwgl2SCbEI6ft7R9g', name: 'Marques Brownlee', niche: 'tech-review' },
  { channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA', name: 'Veritasium', niche: 'science' },
  { channelId: 'UCsooa4yRKGN_zEE8iknghZA', name: 'TED-Ed', niche: 'education' },
  { channelId: 'UCWX3yGbODkeMNsEhR2BZTFA', name: 'Linus Tech Tips', niche: 'tech' },
  // Finance & Investing
  { channelId: 'UCL8w_A8p8P1HWI3k6PR5Z6w', name: 'Graham Stephan', niche: 'finance' },
  { channelId: 'UCnMn36GP_NoBKkGNODadfbg', name: 'Andrei Jikh', niche: 'finance' },
  // Health & Self-improvement
  { channelId: 'UCIHdDJ0tjn_3j-FS7s_X1kQ', name: 'Andrew Huberman', niche: 'health-science' },
  { channelId: 'UCfQgsKhHjSyRLOp9mnffqVg', name: 'Jay Shetty', niche: 'self-improvement' },
  // Design & Creative
  { channelId: 'UCabq1UT_327kUnpJElzR0dQ', name: 'The Futur', niche: 'design-business' },
  // Marketing & Growth
  { channelId: 'UCl-Zrl0QhF66lu1aGXaTbfw', name: 'Think Media', niche: 'youtube-growth' },
  { channelId: 'UC3DkFux8Iv-aYnTRWzwaiBA', name: 'Peter McKinnon', niche: 'filmmaking' },
  { channelId: 'UCJ0-OtVpF0wOKEqT2Z1HEtA', name: 'Colin and Samir', niche: 'creator-economy' },
  // AI & Future
  { channelId: 'UCbfYPyITQ-7l4upoX8nvctg', name: 'Two Minute Papers', niche: 'ai-research' },
  { channelId: 'UCXUPKJO5MZQN11PqgIvyuvQ', name: 'Matt Wolfe', niche: 'ai-tools' },
  // Writing & Storytelling
  { channelId: 'UCJ-GIWeElBruZPbJBUFBcFg', name: 'Zach Star', niche: 'education' },
  { channelId: 'UC4a-Gbdw7vOaccHmFo40b9g', name: 'Khan Academy', niche: 'education' },
  // Fitness & Wellness
  { channelId: 'UCERm5yFZ1SptUcqRRvWiu1w', name: 'Jeff Nippard', niche: 'fitness' },
  { channelId: 'UCVQJZE_on7It_pEv6tn-jdA', name: 'Jeremy Ethier', niche: 'fitness' },
  // Career & Money
  { channelId: 'UCFhqdthbUD1hXkTvbcCFnCA', name: 'Mark Tilbury', niche: 'finance' },
  { channelId: 'UCGwu0nbY2wSkW8N-cghnLpA', name: 'Nate O\'Brien', niche: 'finance' },
  // Coding & Dev
  { channelId: 'UC8butISFwT-Wl7EV0hUK0BQ', name: 'freeCodeCamp', niche: 'coding' },
  { channelId: 'UCFbNIlppjAuEX4znoulh0Cw', name: 'Web Dev Simplified', niche: 'coding' },
  // Mindset & Personal Growth
  { channelId: 'UCpvg0uZH-oxmCagOWJo9p9g', name: 'Better Ideas', niche: 'self-improvement' },
  { channelId: 'UCIvzgLtSg1HtJFDHVSc340Q', name: 'Mark Manson', niche: 'self-improvement' },
  // Science & Curiosity
  { channelId: 'UCZYTClx2T1of7BRZ86-8fow', name: 'SciShow', niche: 'science' },
  { channelId: 'UC6107grRI4m0o2-emgoDnAA', name: 'Wendover Productions', niche: 'education' },
  // Creator Economy & YouTube Strategy
  { channelId: 'UC4Dqke-JvFumAqWmkEFNlQA', name: 'Roberto Blake', niche: 'creator-economy' },
  { channelId: 'UCEOHmSn17B9coGnpLmYFMOg', name: 'Nick Nimmin', niche: 'youtube-growth' },
  // Design & UX
  { channelId: 'UCddiUEpeqJcYeBxX1IVBKvQ', name: 'The Design Dad', niche: 'design' },
  { channelId: 'UCVhGmQMclFOjEGKXORXlGKA', name: 'Mike Locke', niche: 'design' },
  // Real Estate & Investing
  { channelId: 'UCTn-bKihnl7N78K4dMnZIVg', name: 'Meet Kevin', niche: 'finance' },
  { channelId: 'UCRQiAB2wu0CvT9cJkNgjetA', name: 'Ryan Pineda', niche: 'business' },
];

// Keywords that indicate news/politics/current-events content — Gemini refuses these with 403.
// Titles containing ANY of these (case-insensitive) will be skipped during discovery.
const BLOCKED_TITLE_KEYWORDS = [
  // Politics & government
  'trump', 'biden', 'harris', 'obama', 'congress', 'senate', 'republican', 'democrat',
  'election', 'vote', 'ballot', 'political', 'president', 'white house', 'supreme court',
  'rubio', 'pelosi', 'musk', 'elon',
  // News events
  'breaking', 'shooting', 'killed', 'arrested', 'indicted', 'lawsuit', 'banned', 'revokes',
  'war', 'invasion', 'protest', 'riot', 'crisis', 'scandal',
  // Immigration & policy
  'green card', 'deportation', 'immigration', 'border', 'visa',
];

function isTitleBlocked(title) {
  const lower = title.toLowerCase();
  return BLOCKED_TITLE_KEYWORDS.some(kw => lower.includes(kw));
}

async function discoverTrendingVideo() {
  if (SPECIFIC_URL) {
    const videoId = extractVideoId(SPECIFIC_URL);
    if (!videoId) throw new Error(`Could not extract video ID from: ${SPECIFIC_URL}`);
    const details = await getVideoDetails(videoId);
    return details;
  }

  // Get list of creators already featured in published posts
  const publishedCreators = getPublishedCreators();
  if (publishedCreators.size > 0) {
    console.log(`[Discover] Already published creators: ${[...publishedCreators].join(', ')}`);
  }

  // Shuffle creators and try each until we find a recent Short not yet analyzed
  const shuffled = [...CURATED_CREATORS].sort(() => Math.random() - 0.5);

  for (const creator of shuffled) {
    // Skip creators we've already featured
    if (publishedCreators.has(creator.name.toLowerCase())) {
      console.log(`[Discover] Skipping ${creator.name} — already featured in a post.`);
      continue;
    }

    console.log(`[Discover] Checking ${creator.name} (${creator.niche})...`);

    try {
      const video = await getLatestShort(creator);
      if (!video) continue;

      // Skip if this specific video already published
      if (isAlreadyPublished(video.videoId)) {
        console.log(`  Video already published, skipping.`);
        continue;
      }

      console.log(`  Found Short: "${video.title}" (${video.durationSeconds}s, ${video.viewCount.toLocaleString()} views)`);
      return { ...video, niche: creator.niche };
    } catch (err) {
      console.log(`  Error: ${err.message}, trying next creator...`);
      continue;
    }
  }

  throw new Error('No suitable Shorts found from any curated creator. All creators may have been featured already — consider adding more to CURATED_CREATORS.');
}

const MAX_SHORT_DURATION = 120; // seconds — only Shorts (<=2 min)
const MIN_VIEWS = 50_000;

async function getLatestShort(creator) {
  // Step 1: Get the channel's uploads playlist
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${creator.channelId}&key=${YOUTUBE_API_KEY}`;
  const channelRes = await fetch(channelUrl);
  if (!channelRes.ok) return null;
  const channelData = await channelRes.json();
  const uploadsPlaylist = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylist) return null;

  // Step 2: Get recent uploads (last 15 to have enough candidates after filtering)
  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylist}&maxResults=15&key=${YOUTUBE_API_KEY}`;
  const playlistRes = await fetch(playlistUrl);
  if (!playlistRes.ok) return null;
  const playlistData = await playlistRes.json();
  const recentVideos = playlistData.items || [];

  if (!recentVideos.length) return null;

  // Step 3: Check each video — find a Short with enough views
  for (const item of recentVideos) {
    const videoId = item.snippet.resourceId.videoId;
    const details = await getVideoDetails(videoId);

    // Must be a Short (<=2 min)
    if (details.durationSeconds > MAX_SHORT_DURATION) {
      continue;
    }

    // Must have enough views
    if (details.viewCount < MIN_VIEWS) {
      continue;
    }

    // Skip news/politics titles — Gemini refuses them with 403
    if (isTitleBlocked(details.title)) {
      console.log(`  Skipping "${details.title}" — blocked title keyword.`);
      continue;
    }

    return details;
  }

  // No Shorts found for this creator
  console.log(`  No recent Shorts with ${MIN_VIEWS.toLocaleString()}+ views found.`);
  return null;
}

// Parse ISO 8601 duration (PT1M30S) to seconds
function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) + (parseInt(match[2] || '0') * 60) + parseInt(match[3] || '0');
}

async function getVideoDetails(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  if (!data.items?.length) throw new Error(`Video not found: ${videoId}`);
  const v = data.items[0];
  const durationSeconds = parseDuration(v.contentDetails?.duration);
  return {
    videoId: v.id,
    title: v.snippet.title,
    channelTitle: v.snippet.channelTitle,
    channelId: v.snippet.channelId,
    viewCount: parseInt(v.statistics.viewCount || '0'),
    durationSeconds,
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

// Extract creator names from published posts to avoid repeating YouTubers
function getPublishedCreators() {
  const creators = new Set();
  if (!existsSync(POSTS_DIR)) return creators;
  const files = readdirSync(POSTS_DIR);
  for (const f of files) {
    const content = readFileSync(join(POSTS_DIR, f), 'utf-8');
    // Match creator="" in shorta-report placeholders
    const creatorMatch = content.match(/creator="([^"]+)"/);
    if (creatorMatch) creators.add(creatorMatch[1].toLowerCase());
    // Also check tags in frontmatter for creator names
    for (const c of CURATED_CREATORS) {
      if (content.toLowerCase().includes(c.name.toLowerCase())) {
        creators.add(c.name.toLowerCase());
      }
    }
  }
  return creators;
}

// ─── 3. Run Analysis ─────────────────────────────────────────────────────

async function runAnalysis(videoUrl) {
  const supabase = createSupabase();

  // Create job under the admin user, marked anonymous so the polling
  // endpoint skips ownership checks (script has no browser session).
  // user_id is set so the job shows up in the admin's dashboard.
  const ADMIN_USER_ID = '697ced55-4462-44e7-baf2-94ce15a9ebd6';
  const { data: job, error } = await supabase
    .from('analysis_jobs')
    .insert({
      video_url: videoUrl,
      user_id: ADMIN_USER_ID,
      status: 'pending',
      current_step: 0,
      total_steps: 3,
      is_anonymous: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create job: ${error.message}`);
  console.log(`[Analysis] Created job: ${job.id}`);

  // Poll the production API to trigger processing steps.
  // The analysis runs on Cloudflare Workers (Gemini video analysis).
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shorta.ai';
  const maxAttempts = 90; // 7.5 minutes at 5s intervals (storyboard step can take 90s+)

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5000);

    try {
      const pollRes = await fetch(`${APP_URL}/api/jobs/analysis/${job.id}`);
      if (!pollRes.ok) {
        const errText = await pollRes.text().catch(() => '');
        console.log(`[Analysis] Poll ${pollRes.status}: ${errText.slice(0, 100)}`);
        // 403 means auth issue, 500 might be transient
        if (pollRes.status === 403) {
          console.log('[Analysis] Auth error. Job was created with is_anonymous=true, this should work.');
        }
        continue;
      }

      const pollData = await pollRes.json();
      const step = pollData.current_step ?? '?';
      const total = pollData.total_steps ?? 3;
      console.log(`[Analysis] Step ${step}/${total} (${pollData.status})`);

      if (pollData.status === 'completed') {
        return { jobId: job.id, analysis: pollData };
      }
      if (pollData.status === 'failed') {
        throw new Error(`Analysis failed: ${pollData.error_message || 'Unknown error'}`);
      }
    } catch (err) {
      if (err.message?.includes('Analysis failed')) throw err;
      console.log(`[Analysis] Poll error: ${err.message}, retrying...`);
    }
  }

  throw new Error('Analysis timed out after 7.5 minutes');
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
7. Set the slug-appropriate coverImage path as: /blog/${generateSlug(video)}/og-report.png
8. Do NOT include any image references (![...](...)). No frame screenshots. Use text-only beat analysis.
9. Use the "Beat-by-Beat Breakdown" section heading, not "Frame-by-Frame Breakdown"
10. Do NOT put timestamps in headings (e.g., use "### The Hook" not "### The Hook (0:00-0:03)"). Mention timestamps in body text instead.`;

  console.log('[Draft] Generating blog post with Gemini...');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  let markdown = response.text;

  // Clean up: remove code fences if Gemini wraps it
  markdown = markdown.replace(/^```(?:markdown|md)?\n?/m, '').replace(/\n?```$/m, '');

  // Strip timestamps from headings (e.g., "### The Hook (0:00-0:12)" → "### The Hook")
  markdown = markdown.replace(/^(#{2,4}\s+.+?)\s*\(\d+:\d{2}[^)]*\)\s*$/gm, '$1');

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

  // Step 1b: Content filter check (also runs inside getLatestShort, but double-check here)
  if (isTitleBlocked(video.title)) {
    throw new Error(`Discovery returned a blocked-keyword title despite filtering: "${video.title}". Check BLOCKED_TITLE_KEYWORDS.`);
  }

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

  // Step 3: Analyze — retry with next candidate if Gemini rejects the video
  console.log('Step 3: Running Shorta analysis...');
  let jobId, analysis;
  const MAX_ANALYSIS_RETRIES = 3;
  let candidateVideo = video;
  const triedVideoIds = new Set([video.videoId]);

  for (let attempt = 1; attempt <= MAX_ANALYSIS_RETRIES; attempt++) {
    try {
      ({ jobId, analysis } = await runAnalysis(candidateVideo.url));
      break; // success
    } catch (err) {
      const isGeminiRefusal = err.message?.includes('PERMISSION_DENIED') ||
        err.message?.includes('403') ||
        err.message?.includes('permission');
      if (!isGeminiRefusal || attempt === MAX_ANALYSIS_RETRIES) throw err;

      console.log(`  Gemini refused video (attempt ${attempt}/${MAX_ANALYSIS_RETRIES}). Trying next candidate...`);

      // Find next candidate from the discovery pool, skipping already-tried videos
      const shuffled = [...CURATED_CREATORS].sort(() => Math.random() - 0.5);
      const publishedCreators = getPublishedCreators();
      let nextVideo = null;

      for (const creator of shuffled) {
        if (publishedCreators.has(creator.name.toLowerCase())) continue;
        try {
          const v = await getLatestShort(creator);
          if (!v || triedVideoIds.has(v.videoId) || isAlreadyPublished(v.videoId)) continue;
          nextVideo = { ...v, niche: creator.niche };
          break;
        } catch (_) {
          continue;
        }
      }

      if (!nextVideo) throw new Error('No fallback video found after Gemini refusal.');
      triedVideoIds.add(nextVideo.videoId);
      candidateVideo = nextVideo;
      console.log(`  Retrying with: "${candidateVideo.title}" by ${candidateVideo.channelTitle}\n`);
    }
  }
  console.log(`  Analysis complete. Score: ${analysis.lintSummary?.score || 'N/A'}\n`);

  // Use whichever video succeeded (may differ from original if we retried)
  const finalVideo = candidateVideo;

  // Step 4: Share
  console.log('Step 4: Creating share link...');
  const shareUrl = await markPublic(jobId);
  console.log(`  Share URL: ${shareUrl}\n`);

  // Step 5: Draft
  console.log('Step 5: Drafting blog post...');
  const slug = generateSlug(finalVideo);
  const markdown = await draftBlogPost(finalVideo, analysis, shareUrl, jobId);
  console.log(`  Draft generated (${markdown.length} chars)\n`);

  // Step 6: OG Image
  console.log('Step 6: Generating OG image...');
  generateOG(finalVideo, analysis, slug);
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
