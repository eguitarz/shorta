#!/usr/bin/env node
/**
 * generate-og.mjs — Pre-generate OG images for blog posts
 *
 * Usage: node scripts/generate-og.mjs --slug=mrbeast-viral-analysis --score=82 --title="Why I Built..." --creator="MrBeast" --video-id=dQw4w9WgXcQ
 *
 * Output: /public/blog/{slug}/og-report.png (1200x630px)
 *
 * Design: data-forward OG image per DESIGN.md
 *   - Dark bg (#0a0a0a), large score number (Space Grotesk), small thumbnail
 *   - Category scores in semantic colors
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Parse CLI args
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w[\w-]*)=(.+)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

// Fetch and convert image to base64 data URI
async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString('base64');
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function getScoreColor(score) {
  if (score >= 80) return '#4ade80'; // green-400
  if (score >= 60) return '#fb923c'; // orange-400
  return '#f87171'; // red-400
}

function getScoreBarColor(score) {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

async function generateOG(args) {
  const { slug, score: scoreStr, title, creator, 'video-id': videoId } = args;

  if (!slug) {
    console.error('Usage: node scripts/generate-og.mjs --slug=<slug> --score=<N> --title="..." --creator="..." --video-id=<youtube-id>');
    process.exit(1);
  }

  const score = parseInt(scoreStr || '0', 10);
  const hookScore = args.hook || '';
  const structureScore = args.structure || '';
  const clarityScore = args.clarity || '';
  const deliveryScore = args.delivery || '';

  // Load fonts — check both apps/web/node_modules and root node_modules (monorepo hoisting)
  const fontPaths = [
    join(ROOT, 'node_modules/@fontsource/space-grotesk/files'),
    join(ROOT, '../../node_modules/@fontsource/space-grotesk/files'),
  ];
  let fontDir = fontPaths.find(p => existsSync(join(p, 'space-grotesk-latin-700-normal.woff2')));
  if (!fontDir) throw new Error(`Space Grotesk font not found in: ${fontPaths.join(', ')}`);

  const spaceGroteskBold = readFileSync(join(fontDir, 'space-grotesk-latin-700-normal.woff2'));

  let systemFont;
  try {
    systemFont = readFileSync(join(fontDir, 'space-grotesk-latin-400-normal.woff2'));
  } catch {
    systemFont = spaceGroteskBold;
  }

  // Fetch YouTube thumbnail
  let thumbnailDataUri = null;
  if (videoId) {
    thumbnailDataUri = await fetchImageAsBase64(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
  }

  // Build the OG image as JSX
  const element = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        padding: '60px',
        fontFamily: 'SpaceGrotesk',
        position: 'relative',
      },
      children: [
        // Header label
        {
          type: 'div',
          props: {
            style: {
              fontSize: '14px',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '24px',
            },
            children: 'SHORTA AI ANALYSIS',
          },
        },
        // Main row: score + thumbnail
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'flex-start',
              gap: '40px',
              flex: '1',
            },
            children: [
              // Score + info column
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1',
                  },
                  children: [
                    // Score
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '8px',
                          marginBottom: '16px',
                        },
                        children: [
                          {
                            type: 'span',
                            props: {
                              style: {
                                fontSize: '120px',
                                fontWeight: '700',
                                color: getScoreColor(score),
                                lineHeight: '1',
                              },
                              children: String(score),
                            },
                          },
                          {
                            type: 'span',
                            props: {
                              style: { fontSize: '28px', color: '#6b7280' },
                              children: '/100',
                            },
                          },
                        ],
                      },
                    },
                    // Score bar
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '200px',
                          height: '6px',
                          backgroundColor: '#1f2937',
                          borderRadius: '3px',
                          marginBottom: '24px',
                          overflow: 'hidden',
                        },
                        children: {
                          type: 'div',
                          props: {
                            style: {
                              width: `${score}%`,
                              height: '100%',
                              backgroundColor: getScoreBarColor(score),
                              borderRadius: '3px',
                            },
                          },
                        },
                      },
                    },
                    // Title
                    title ? {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '28px',
                          color: '#e5e7eb',
                          marginBottom: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineClamp: 2,
                          maxWidth: '600px',
                        },
                        children: title,
                      },
                    } : null,
                    // Creator
                    creator ? {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '20px',
                          color: '#9ca3af',
                        },
                        children: creator,
                      },
                    } : null,
                  ].filter(Boolean),
                },
              },
              // Thumbnail
              thumbnailDataUri ? {
                type: 'img',
                props: {
                  src: thumbnailDataUri,
                  width: 280,
                  height: 158,
                  style: {
                    borderRadius: '8px',
                    objectFit: 'cover',
                    marginTop: '20px',
                  },
                },
              } : null,
            ].filter(Boolean),
          },
        },
        // Category scores row
        (hookScore || structureScore || clarityScore || deliveryScore) ? {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              gap: '32px',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #1f2937',
            },
            children: [
              hookScore && { type: 'span', props: { style: { fontSize: '16px', color: '#fb923c' }, children: `Hook ${hookScore}` } },
              structureScore && { type: 'span', props: { style: { fontSize: '16px', color: '#60a5fa' }, children: `Structure ${structureScore}` } },
              clarityScore && { type: 'span', props: { style: { fontSize: '16px', color: '#4ade80' }, children: `Clarity ${clarityScore}` } },
              deliveryScore && { type: 'span', props: { style: { fontSize: '16px', color: '#c084fc' }, children: `Delivery ${deliveryScore}` } },
            ].filter(Boolean),
          },
        } : null,
        // Branding
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: '30px',
              right: '60px',
              fontSize: '14px',
              color: '#6b7280',
            },
            children: 'shorta.ai',
          },
        },
      ].filter(Boolean),
    },
  };

  // Render with Satori
  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'SpaceGrotesk',
        data: spaceGroteskBold,
        weight: 700,
        style: 'normal',
      },
      {
        name: 'SpaceGrotesk',
        data: systemFont,
        weight: 400,
        style: 'normal',
      },
    ],
  });

  // Convert SVG to PNG
  const resvg = new Resvg(svg, {
    background: '#0a0a0a',
    fitTo: { mode: 'width', value: 1200 },
  });
  const png = resvg.render().asPng();

  // Write output
  const outDir = join(ROOT, 'public', 'blog', slug);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  const outPath = join(outDir, 'og-report.png');
  writeFileSync(outPath, png);

  console.log(`OG image generated: ${outPath} (${png.length} bytes)`);
}

const args = parseArgs();
generateOG(args).catch(err => {
  console.error('OG generation failed:', err.message);
  console.error('Falling back: copy /public/og-default.png manually');
  process.exit(1);
});
