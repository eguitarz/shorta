export interface BeatImageData {
  url: string;
  storagePath: string;
  prompt: string;
  generatedAt: string;
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
