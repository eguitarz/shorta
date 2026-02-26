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

export interface BeatForImage {
  beatNumber: number;
  title: string;
  type: string;
  visual: string;
  script: string;
  directorNotes: string | string[];
  shotType?: string;
  cameraMovement?: string;
  bRollSuggestions?: string[];
}

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
