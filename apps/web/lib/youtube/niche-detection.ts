/**
 * AI-powered niche detection for YouTube channels.
 * Analyzes video titles and descriptions to determine channel niche,
 * content themes, target audience, and primary format.
 */

import { GoogleGenAI } from '@google/genai';
import { appendLanguageInstruction } from '@/lib/i18n-helpers';
import type { NicheDetectionResult } from './types';

const NICHE_DETECTION_PROMPT = `You are a YouTube Shorts channel analyst. Analyze the following video titles and descriptions from a single YouTube channel.

Determine:
1. The channel's primary niche
2. Any secondary niches
3. Recurring content themes
4. The target audience
5. The primary video format style

**Niche categories** (pick the most specific match):
Gaming, FPS Gaming, Mobile Gaming, RPG Gaming, Strategy Gaming, Minecraft, Roblox,
Comedy, Sketch Comedy, Memes, Pranks, Reactions,
Music, Covers, Original Music, Music Production, DJ,
Dance, Choreography,
Beauty, Makeup, Skincare, Nail Art,
Fashion, Outfit Ideas, Streetwear, Thrift Hauls,
Fitness, Gym, Yoga, Calisthenics, Martial Arts, Boxing,
Food, Cooking, Recipes, Mukbang, Food Reviews, Baking,
Tech, Tech Reviews, Programming, AI, Gadgets, PC Building,
Education, Science, History, Language Learning, Math, Study Tips,
Personal Finance, Investing, Crypto, Side Hustles,
Motivation, Self Improvement, Productivity, Mindset,
Pets, Dogs, Cats, Aquariums, Exotic Pets,
Sports, Basketball, Soccer, Football, MMA, Wrestling,
Cars, JDM, Supercars, Car Mods,
Art, Digital Art, Drawing, Animation, 3D Art, AI Art,
DIY, Crafts, Woodworking, Life Hacks,
Travel, Adventure, Backpacking,
ASMR, Satisfying, Oddly Satisfying,
Storytime, Commentary, Drama, Pop Culture,
Parenting, Family, Kids,
Real Estate, Entrepreneurship, Business,
Photography, Filmmaking, Cinematography,
Nature, Wildlife, Gardening,
Astrology, Spirituality, Tarot,
Books, Book Reviews,
Horror, True Crime, Mystery,
Anime, Manga, Cosplay

**Format styles** (pick the best match):
talking_head, gameplay, vlog, tutorial, how_to, reaction, skit, montage, slideshow, animation, voiceover, duet, challenge, unboxing, review, asmr, timelapse, pov, storytime, before_after, transition, other

Videos from this channel:
{videos}

Return a JSON object with these fields:
- primaryNiche: the most specific niche category that fits
- secondaryNiches: array of other relevant niches
- nicheConfidence: number between 0 and 1
- reasoning: brief explanation of why this niche was chosen
- targetAudience: description of the target viewer
- contentThemes: array of recurring topics
- primaryFormat: the dominant video format style from the list above`;

/**
 * Detect the niche of a YouTube channel based on video metadata.
 * Requires at least 3 videos for meaningful detection.
 */
export async function detectChannelNiche(
  videos: Array<{ title: string; description: string }>,
  locale?: string
): Promise<NicheDetectionResult | null> {
  if (videos.length < 3) {
    return null; // Not enough data for meaningful detection
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required for niche detection');
  }

  // Take up to 50 most recent videos
  const sampleVideos = videos.slice(0, 50);
  const videosText = sampleVideos
    .map((v, i) => `${i + 1}. Title: ${v.title}\n   Description: ${v.description?.slice(0, 200) || 'N/A'}`)
    .join('\n\n');

  const prompt = appendLanguageInstruction(
    NICHE_DETECTION_PROMPT.replace('{videos}', videosText),
    locale
  );

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonStr = response.text?.trim();
    console.log('[niche-detection] Raw response:', jsonStr?.slice(0, 500));
    if (!jsonStr) {
      console.error('[niche-detection] Empty response from Gemini');
      return null;
    }

    const result = JSON.parse(jsonStr) as NicheDetectionResult;

    // Validate required fields
    if (!result.primaryNiche || typeof result.nicheConfidence !== 'number') {
      console.error('[niche-detection] Invalid result:', result);
      return null;
    }

    return result;
  } catch (error) {
    console.error('[niche-detection] Failed:', error);
    return null;
  }
}
