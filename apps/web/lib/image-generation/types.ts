export interface BeatImageData {
  url: string;
  storagePath: string;
  prompt: string;
  generatedAt: string;
  /**
   * End-frame image for this beat (optional). Populated when Pass 2 provided
   * an endFrameIntent and Pass 4 successfully generated the second frame.
   * Used for "first + last frame" mode in Veo 3, Runway Gen-4, and similar
   * video models. Downstream export packs should ship both frames together.
   */
  endUrl?: string;
  endStoragePath?: string;
  endPrompt?: string;
  endGeneratedAt?: string;
}

export interface BeatImageMap {
  [beatNumber: string]: BeatImageData;
}

export interface StoryboardOverviewForImage {
  title: string;
  contentType: string;
  nicheCategory: string;
  targetAudience: string;
}

// BeatForImage is now derived from the canonical Beat type in `@/lib/types/beat`.
// Imported (for local use in GenerateImageRequest) and re-exported (so existing
// import sites keep working without path changes).
import type { BeatForImage } from '@/lib/types/beat';
export type { BeatForImage };

export interface ReferenceImage {
  mimeType: string;
  data: string; // base64 encoded
  name: string;
}

export interface GenerateImageRequest {
  storyboardId: string;
  overview: StoryboardOverviewForImage;
  beats: BeatForImage[];
  referenceImage?: ReferenceImage;
  locale?: string;
}

export interface GenerateImageResult {
  beatNumber: number;
  imageUrl: string;
  prompt: string;
}

export interface GenerateImagesResponse {
  images: GenerateImageResult[];
  creditsCharged: number;
}

export interface GeneratedImageData {
  base64: string;
  mimeType: string;
}
