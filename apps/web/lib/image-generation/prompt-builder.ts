import type { StoryboardOverviewForImage, BeatForImage } from './types';

const contentTypeStyles: Record<string, string> = {
  talking_head:
    'Single person speaking directly to camera, portrait orientation, soft studio lighting, shallow depth of field, professional vlog aesthetic',
  demo:
    'Screen recording or product close-up, clean modern workspace, tech-minimalist aesthetic, well-lit setup',
  b_roll:
    'Cinematic B-roll footage, dramatic lighting, shallow depth of field, film-like color grading',
  vlog:
    'Casual handheld camera, natural daylight, authentic candid moments, warm color tones',
  tutorial:
    'Clear instructional setup, well-organized workspace, bright even lighting, educational context',
  gameplay:
    'Gaming setup with RGB lighting, screen glow illumination, dark background, neon accent colors',
};

/**
 * Builds a subject consistency block by scanning beat content.
 * Works for any video type — people, pets, products, environments, etc.
 * Detects the main subjects and enforces visual consistency across all beats.
 */
export function buildCharacterContext(
  overview: StoryboardOverviewForImage,
  beats: BeatForImage[]
): string {
  const allVisuals = beats.map((b) => b.visual).join(' ').toLowerCase();
  const allScripts = beats.map((b) => b.script).join(' ').toLowerCase();
  const combined = `${allVisuals} ${allScripts}`;

  // Detect subject types from content
  const personKeywords = /\b(person|face|speaker|host|creator|presenter|man|woman|guy|girl|talk|speaking|camera)\b/;
  const animalKeywords = /\b(pet|dog|cat|puppy|kitten|animal|bird|fish|hamster|rabbit|turtle|parrot|horse)\b/;
  const foodKeywords = /\b(cook|recipe|food|dish|kitchen|ingredient|meal|bake|chef)\b/;
  const productKeywords = /\b(product|item|device|gadget|tool|unbox|review|setup|desk|screen)\b/;

  const hasPerson =
    ['talking_head', 'vlog', 'tutorial'].includes(overview.contentType) ||
    personKeywords.test(combined);
  const hasAnimal = animalKeywords.test(combined);
  const hasFood = foodKeywords.test(combined);
  const hasProduct = productKeywords.test(combined);

  const lines: string[] = [
    'SUBJECT CONSISTENCY (CRITICAL - apply to EVERY image):',
    'All images are frames from the SAME video. Maintain a consistent visual identity throughout.',
  ];

  if (hasPerson) {
    lines.push(
      'PERSON: Depict the SAME single person across all beats. Maintain identical face structure, hairstyle, hair color, skin tone, body type, age, and clothing.',
      `The person is a ${overview.nicheCategory} content creator.`
    );
  }

  if (hasAnimal) {
    lines.push(
      'ANIMAL/PET: Depict the SAME animal across all beats. Maintain identical breed, fur/feather color, markings, size, and distinguishing features.'
    );
  }

  if (hasFood) {
    lines.push(
      'FOOD/KITCHEN: Maintain the same kitchen setting, countertop, utensils, and ingredients throughout. Progressive cooking stages should show the same dish evolving.'
    );
  }

  if (hasProduct) {
    lines.push(
      'PRODUCT: Show the same product model, color, and branding across all beats. Keep the desk/environment setup consistent.'
    );
  }

  lines.push(
    'ENVIRONMENT: Keep the background, lighting, color temperature, and setting consistent across all beats.',
    'Do NOT change the appearance of any recurring subject between beats.'
  );

  return lines.join('\n');
}

const shotFraming: Record<string, string> = {
  CU: 'Close-up shot, face fills most of frame',
  MCU: 'Medium close-up, head and shoulders visible',
  MS: 'Medium shot, waist-up framing',
  MLS: 'Medium long shot, knees-up framing',
  WS: 'Wide shot, full body and environment visible',
  OTS: 'Over-the-shoulder perspective',
  POV: 'First-person point of view',
  INSERT: 'Detail insert shot of a specific object or action',
};

const beatTypeGuidance: Record<string, string> = {
  hook: 'Opening frame that immediately grabs attention. High energy, intriguing composition.',
  setup: 'Establishing context. Show the situation or problem clearly.',
  main_content:
    'Core content delivery. Clear, engaging, informative composition.',
  payoff:
    'Climactic or satisfying moment. Emotional peak of the scene.',
  cta: 'Call to action moment. Inviting, approachable, direct engagement with viewer.',
};

export function buildStyleContext(
  overview: StoryboardOverviewForImage
): string {
  const style =
    contentTypeStyles[overview.contentType] || contentTypeStyles.talking_head;

  return `VISUAL STYLE (apply consistently to ALL images):
Art style: Photorealistic digital illustration, 9:16 vertical composition for short-form video
Content type: ${style}
Niche: ${overview.nicheCategory}
Audience: ${overview.targetAudience}
Mood: Professional yet approachable, modern social media creator aesthetic
Color palette: Consistent warm/neutral tones with accent colors matching the "${overview.nicheCategory}" niche
DO NOT include any text, watermarks, or UI elements in the image.
DO NOT render any written words within the image.`;
}

export function buildImagePrompt(
  overview: StoryboardOverviewForImage,
  beat: BeatForImage,
  options?: { styleContext?: string; characterContext?: string; hasReferenceImage?: boolean }
): string {
  const style = options?.styleContext || buildStyleContext(overview);
  const character = options?.characterContext || '';

  const framingLine = beat.shotType
    ? `Camera framing: ${shotFraming[beat.shotType] || beat.shotType}`
    : '';

  const movementLine =
    beat.cameraMovement && beat.cameraMovement !== 'static'
      ? `Camera movement suggests: ${beat.cameraMovement} (show the starting position)`
      : '';

  const bRollLine =
    beat.bRollSuggestions?.length
      ? `B-roll context: ${beat.bRollSuggestions[0]}`
      : '';

  const scriptExcerpt = beat.script.substring(0, 200);

  const referenceImageLine = options?.hasReferenceImage
    ? `\nREFERENCE IMAGE: An image is attached as a visual reference. Use it to match the visual style, color palette, mood, setting, and overall aesthetic. Any people, animals, or key subjects shown in the reference MUST appear identical in the generated image — same face, features, coloring, clothing, breed, markings, etc. Generate images that look like they belong in the same video.`
    : '';

  const characterBlock = character ? `\n${character}` : '';

  return `Generate one image representing the opening frame of this video beat.

${style}${referenceImageLine}${characterBlock}

SCENE DETAILS FOR THIS BEAT:
Beat type: ${beat.type} - ${beatTypeGuidance[beat.type] || ''}
Title: ${beat.title}
${framingLine}
${movementLine}
Visual direction: ${beat.visual}
Scene context from script: ${scriptExcerpt}
${bRollLine}

IMPORTANT: This is the FIRST FRAME the viewer sees for this beat. Capture the visual essence in a single still image.
No text overlays, no UI elements, no watermarks.`.trim();
}
