/**
 * GET /api/storyboard-pack/[id]
 *
 * Exports an animation storyboard as a ZIP pack ready to feed into Google
 * Flow (or Sora / Runway / Kling / Veo). The pack contains everything the
 * user needs in one file:
 *
 *   storyboard-<title>.zip
 *   ├── README.txt             ← how-to-use-with-flow instructions
 *   ├── characters/
 *   │   ├── <char_id>.png      ← character sheet image (identity reference)
 *   │   └── <char_id>.txt      ← text description for tools that don't do ingredients
 *   ├── beats/
 *   │   ├── beat-01-flow.txt   ← Flow/Veo prompt with @mention ingredient syntax
 *   │   ├── beat-01-universal.txt ← platform-agnostic prompt
 *   │   ├── beat-01.png        ← pre-generated beat frame (if image gen completed)
 *   │   ├── beat-02-flow.txt
 *   │   └── ...
 *   └── storyboard.json        ← full structured beats (animation_meta + beats)
 *
 * Auth required — only the storyboard owner can download.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { zipSync, strToU8 } from 'fflate';
import { renderExportPrompt } from '@/lib/animation/render-export';
import type { AnimationBeat, AnimationMeta } from '@/lib/types/beat';
import type { BeatImageMap } from '@/lib/image-generation/types';

export const dynamic = 'force-dynamic';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const user = await getAuthenticatedUser(request);
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { id } = await params;

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

		const { data: sb, error } = await supabase
			.from('generated_storyboards')
			.select('id, user_id, title, animation_meta, generated_beats, beat_images')
			.eq('id', id)
			.single();

		if (error || !sb) {
			return NextResponse.json({ error: 'Storyboard not found' }, { status: 404 });
		}

		if (sb.user_id !== user.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
		}

		if (!sb.animation_meta) {
			return NextResponse.json(
				{ error: 'Pack export is only available for animation storyboards' },
				{ status: 400 }
			);
		}

		const meta = sb.animation_meta as AnimationMeta;
		const beats = (sb.generated_beats as AnimationBeat[]) ?? [];
		const beatImages = (sb.beat_images as BeatImageMap) ?? {};

		// Defensive shape checks — surface meaningful errors instead of 500ing
		// deep inside parallel Promise.all chains.
		if (!Array.isArray(meta.characters)) {
			return NextResponse.json(
				{ error: 'Storyboard animation_meta is missing characters[]' },
				{ status: 422 }
			);
		}
		if (!Array.isArray(beats) || beats.length === 0) {
			return NextResponse.json(
				{
					error:
						'Storyboard has no beats yet. Wait for generation to reach beats_complete, then try again.',
				},
				{ status: 422 }
			);
		}

		console.log(
			`[Pack] exporting storyboard=${id} chars=${meta.characters.length} beats=${beats.length} images=${Object.keys(beatImages).length}`
		);

		// Build the zip contents in parallel where possible.
		const files: Record<string, Uint8Array> = {};

		// README
		files['README.txt'] = strToU8(buildReadme(sb.title, meta, beats));

		// storyboard.json — full structured data for programmatic consumers
		files['storyboard.json'] = strToU8(
			JSON.stringify(
				{
					title: sb.title,
					animation_meta: meta,
					beats,
					exported_at: new Date().toISOString(),
				},
				null,
				2
			)
		);

		// Characters: text descriptions + sheet images (parallel download).
		// Each character is wrapped — one bad character never blocks the pack.
		await Promise.all(
			meta.characters.map(async (char) => {
				try {
					// Text description always available
					const traits = Array.isArray(char.traits) ? char.traits : [];
					const charText = [
						`Character: ${char.name ?? '(unnamed)'}`,
						`ID: ${char.id ?? '(no id)'}`,
						`Traits: ${traits.join(', ') || '(none)'}`,
						`Personality: ${char.personality ?? '(unspecified)'}`,
						'',
						'Full description (inject as identity anchor):',
						char.sheetPrompt || '(no AI-generated description — use traits + personality)',
					].join('\n');
					files[`characters/${char.id ?? 'unknown'}.txt`] = strToU8(charText);

					// Sheet image — fetch via signed URL from private bucket.
					// Using createSignedUrl + fetch() instead of storage.download()
					// because Supabase's download() returns a Blob stream that can
					// hang in Cloudflare Workers runtime (same class of bug as
					// fflate async zip). Signed URL + plain fetch() is guaranteed
					// to terminate.
					if (char.sheetStoragePath) {
						const { data: signed, error: sErr } = await supabase.storage
							.from('character-sheets')
							.createSignedUrl(char.sheetStoragePath, 60); // 60s TTL
						if (sErr || !signed?.signedUrl) {
							console.warn(
								`[Pack] char ${char.id} signed URL failed: ${sErr?.message ?? 'unknown'}`
							);
						} else {
							const imgRes = await fetch(signed.signedUrl);
							if (imgRes.ok) {
								const buf = new Uint8Array(await imgRes.arrayBuffer());
								files[`characters/${char.id}.png`] = buf;
							} else {
								console.warn(
									`[Pack] char ${char.id} fetch failed: HTTP ${imgRes.status}`
								);
							}
						}
					}
				} catch (err) {
					console.error(`[Pack] char ${char?.id} failed:`, err);
				}
			})
		);

		// Beats: per-platform prompts + generated beat images
		await Promise.all(
			beats.map(async (beat) => {
				try {
					const num = String(beat.beatNumber ?? 0).padStart(2, '0');

					// Flow (Veo 3.1 ingredients) variant
					const flowPrompt = renderExportPrompt({ meta, beat, platform: 'flow' });
					files[`beats/beat-${num}-flow.txt`] = strToU8(
						buildBeatHeader(beat) + flowPrompt + '\n'
					);

					// Universal variant (works in any tool)
					const universalPrompt = renderExportPrompt({ meta, beat, platform: 'universal' });
					files[`beats/beat-${num}-universal.txt`] = strToU8(
						buildBeatHeader(beat) + universalPrompt + '\n'
					);

					// Beat image — download from the public storyboard-images bucket
					// via the URL recorded in beat_images.
					const imgMeta = beatImages[String(beat.beatNumber)];
					if (imgMeta?.url) {
						try {
							const cleanUrl = imgMeta.url.split('?')[0];
							const imgRes = await fetch(cleanUrl);
							if (imgRes.ok) {
								const buf = new Uint8Array(await imgRes.arrayBuffer());
								files[`beats/beat-${num}.png`] = buf;
							} else {
								console.warn(`[Pack] beat ${beat.beatNumber} image fetch: HTTP ${imgRes.status}`);
							}
						} catch (err) {
							console.warn(`[Pack] beat ${beat.beatNumber} image fetch failed:`, err);
						}
					}
				} catch (err) {
					console.error(`[Pack] beat ${beat?.beatNumber} failed:`, err);
				}
			})
		);

		console.log(`[Pack] assembled ${Object.keys(files).length} files, zipping…`);

		// Use zipSync, NOT async zip(). fflate's async zip() tries to spawn
		// Web Workers for parallel compression. Cloudflare Workers runtime
		// doesn't have Web Workers, so the callback never fires and the
		// request hangs until the runtime kills it (~30s). zipSync does
		// everything on the main thread — slower for massive payloads but
		// our packs are ~10MB max, fine to do synchronously.
		const zipped: Uint8Array = zipSync(files, { level: 6 });

		console.log(`[Pack] zipped: ${zipped.byteLength} bytes`);

		const filename = safeFilename(sb.title || 'storyboard');

		// Copy into a fresh ArrayBuffer. Some runtimes (including certain
		// Cloudflare Worker + Next adapter combos) reject SharedArrayBuffer-
		// backed Uint8Arrays or typed arrays from pooled memory. Taking a
		// clean ArrayBuffer avoids BodyInit edge cases.
		const ab = new ArrayBuffer(zipped.byteLength);
		new Uint8Array(ab).set(zipped);

		return new NextResponse(ab, {
			status: 200,
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${filename}.zip"`,
				'Content-Length': String(ab.byteLength),
				'Cache-Control': 'no-store',
			},
		});
	} catch (err) {
		// Surface the actual error to the client response body so we can
		// diagnose without needing log access. Include stack in production
		// since this endpoint is auth-gated (owner only) — not a public leak.
		const message = err instanceof Error ? err.message : String(err);
		const stack = err instanceof Error ? err.stack : undefined;
		console.error('[Pack] export failed:', message, stack);
		return NextResponse.json(
			{
				error: 'Export pack failed',
				message,
				stack: stack?.split('\n').slice(0, 5).join('\n'),
			},
			{ status: 500 }
		);
	}
}

/** Sanitize title for filename usage. */
function safeFilename(s: string): string {
	return (
		s
			.slice(0, 80)
			.replace(/[^a-zA-Z0-9._-]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'storyboard'
	);
}

function buildBeatHeader(beat: AnimationBeat): string {
	const duration = beat.endTime - beat.startTime;
	return [
		`=== Beat ${beat.beatNumber}: ${beat.title} ===`,
		`Narrative role: ${beat.narrativeRole ?? '(unspecified)'}`,
		`Timing: ${beat.startTime}s–${beat.endTime}s (${duration.toFixed(1)}s duration)`,
		'',
	].join('\n');
}

function buildReadme(
	title: string,
	meta: AnimationMeta,
	beats: AnimationBeat[]
): string {
	const charList = meta.characters
		.map(
			(c) =>
				`  - ${c.name} (id: ${c.id}) — upload characters/${c.id}.png to Flow as ingredient "${c.id}"`
		)
		.join('\n');

	const beatList = beats
		.map(
			(b) =>
				`  Beat ${b.beatNumber}: ${b.title} (${b.endTime - b.startTime}s) — beats/beat-${String(
					b.beatNumber
				).padStart(2, '0')}-flow.txt`
		)
		.join('\n');

	return `# ${title}

Exported from Shorta AI Animation Storyboard mode.
Logline: ${meta.logline}
Style: ${meta.styleAnchor}
Setting: ${meta.sceneAnchor}

────────────────────────────────────────────────────────────────────────────
HOW TO USE WITH GOOGLE FLOW (Veo 3.1)
────────────────────────────────────────────────────────────────────────────

1. Open https://labs.google/fx/tools/flow and create a new project.

2. UPLOAD CHARACTER INGREDIENTS (critical for character consistency)

   Flow's "Ingredients to Video" feature is what keeps your characters
   looking the same across every beat. Upload each character sheet:

${charList}

   For each character, in Flow:
     - Click "Ingredients" → "Add ingredient" → upload the .png file
     - Name the ingredient EXACTLY as shown (e.g. "char_1")
     - The prompts reference it via @char_1, @char_2, etc.

3. GENERATE EACH BEAT

   The beats/ folder has TWO prompt variants per beat:
     - *-flow.txt        Use this with Flow (uses @character_id syntax)
     - *-universal.txt   Use this with Sora / Runway / Kling / any tool

   For each beat in Flow:
     - Click "New scene" or "+" in the timeline
     - Paste the *-flow.txt contents into the scene prompt
     - Set aspect ratio: 9:16 (vertical)
     - Set duration: match the beat's timing in the filename header
     - Click Generate

${beatList}

4. STITCH IN FLOW

   Flow's timeline view auto-stitches your generated scenes. Review and
   export as a single video.

────────────────────────────────────────────────────────────────────────────
HOW TO USE WITH OTHER TOOLS (Sora, Runway, Kling)
────────────────────────────────────────────────────────────────────────────

These tools don't have Flow's @ingredient syntax. Use the *-universal.txt
prompt variants instead — character descriptions are inlined so the tool
can render from text alone. For best consistency:

  - Sora:   upload a character sheet image and use "Cameo" mode
  - Runway: use Gen-4.5's Reference feature and attach the sheet
  - Kling:  upload character as Reference Image

────────────────────────────────────────────────────────────────────────────
FILES
────────────────────────────────────────────────────────────────────────────

  README.txt                this file
  storyboard.json           full structured data (for programmatic use)
  characters/<id>.png       character sheet (upload as Flow ingredient)
  characters/<id>.txt       character description (for tools without ingredient systems)
  beats/beat-NN-flow.txt    Flow-specific prompt with @mention syntax
  beats/beat-NN-universal.txt  platform-agnostic prompt
  beats/beat-NN.png         Shorta's pre-visualization frame (optional reference)

Generated ${new Date().toISOString()}
`;
}
