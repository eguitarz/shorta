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
import { zip, strToU8 } from 'fflate';
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

		// Characters: text descriptions + sheet images (parallel download)
		await Promise.all(
			meta.characters.map(async (char) => {
				// Text description always available
				const charText = [
					`Character: ${char.name}`,
					`ID: ${char.id}`,
					`Traits: ${char.traits.join(', ')}`,
					`Personality: ${char.personality}`,
					'',
					'Full description (inject as identity anchor):',
					char.sheetPrompt || '(no AI-generated description — use traits + personality)',
				].join('\n');
				files[`characters/${char.id}.txt`] = strToU8(charText);

				// Sheet image — download from private bucket if available
				if (char.sheetStoragePath) {
					try {
						const { data: blob, error: dlErr } = await supabase.storage
							.from('character-sheets')
							.download(char.sheetStoragePath);
						if (!dlErr && blob) {
							const buf = new Uint8Array(await blob.arrayBuffer());
							files[`characters/${char.id}.png`] = buf;
						}
					} catch (err) {
						console.warn(`[Pack] char ${char.id} sheet download failed:`, err);
					}
				}
			})
		);

		// Beats: per-platform prompts + generated beat images
		await Promise.all(
			beats.map(async (beat) => {
				const num = String(beat.beatNumber).padStart(2, '0');

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
				// via the URL recorded in beat_images. Cheaper than another
				// Supabase download call since these URLs are already public.
				const imgMeta = beatImages[String(beat.beatNumber)];
				if (imgMeta?.url) {
					try {
						// Strip cache-busting query param if present
						const cleanUrl = imgMeta.url.split('?')[0];
						const imgRes = await fetch(cleanUrl);
						if (imgRes.ok) {
							const buf = new Uint8Array(await imgRes.arrayBuffer());
							files[`beats/beat-${num}.png`] = buf;
						}
					} catch (err) {
						console.warn(`[Pack] beat ${beat.beatNumber} image fetch failed:`, err);
					}
				}
			})
		);

		// Zip it. fflate.zip is callback-based; wrap in Promise.
		const zipped: Uint8Array = await new Promise((resolve, reject) => {
			zip(files, { level: 6 }, (err, data) => {
				if (err) reject(err);
				else resolve(data);
			});
		});

		const filename = safeFilename(sb.title || 'storyboard');

		return new NextResponse(zipped as unknown as BodyInit, {
			status: 200,
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${filename}.zip"`,
				'Content-Length': String(zipped.length),
				'Cache-Control': 'no-store',
			},
		});
	} catch (err) {
		console.error('[Pack] export failed:', err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Internal server error' },
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
