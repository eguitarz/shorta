import type { HookCategory } from '../scoring/hook-types';

/**
 * Quick style presets for re-hook generation
 */
export type RehookPreset = 'emotional' | 'specific' | 'shorter' | 'question';

/**
 * Combined style - either preset or custom hook type
 */
export type RehookStyle = RehookPreset | 'custom';

/**
 * Configuration for re-hook generation
 */
export interface RehookConfig {
  preset?: RehookPreset;
  hookType?: HookCategory;
}

/**
 * Generated variant from the API
 */
export interface GeneratedVariant {
  text: string;
  explanation: string;
  style: string;
}

/**
 * Context about the video for better generation
 */
export interface VideoContext {
  nicheCategory: string;
  contentType: string;
  targetAudience: string;
  currentHookType: string;
}

/**
 * Request body for the generate-rehook API
 */
export interface GenerateRehookRequest {
  originalHook: string;
  desiredStyle: RehookStyle;
  hookType?: HookCategory;
  videoContext: VideoContext;
}

/**
 * Response from the generate-rehook API
 */
export interface GenerateRehookResponse {
  variant: GeneratedVariant;
}

/**
 * Preset display configuration
 */
export interface PresetConfig {
  id: RehookPreset;
  label: string;
  description: string;
}

/**
 * All available presets with their display info
 */
export const REHOOK_PRESETS: PresetConfig[] = [
  { id: 'emotional', label: 'More Emotional', description: 'Pain points & urgency' },
  { id: 'specific', label: 'More Specific', description: 'Numbers & data' },
  { id: 'shorter', label: 'Shorter', description: 'Cut the fluff' },
  { id: 'question', label: 'Question', description: 'Lead with curiosity' },
];
