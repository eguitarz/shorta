import { describe, it, expect } from 'vitest';
import { parseStoryboardSpec, getFrameAtTimestamp, parseTimestamp } from '../lib/youtube/storyboard';

describe('parseStoryboardSpec', () => {
  const SAMPLE_SPEC = 'https://i.ytimg.com/sb/VIDEO_ID/storyboard3_L$L/$N.jpg?sqp=-oaymwENSDfyq4qpAwVwAcABBqLzl_8DBgjf0_y2BQ==&sigh=$M|160#90#100#10#10#2000#M$M#abc123|80#45#100#10#10#2000#M$M#def456';

  it('parses a valid spec string', () => {
    const result = parseStoryboardSpec(SAMPLE_SPEC);
    expect(result).not.toBeNull();
    expect(result!.baseUrl).toContain('ytimg.com');
    expect(result!.sizes).toHaveLength(2);
  });

  it('extracts correct dimensions for first size', () => {
    const result = parseStoryboardSpec(SAMPLE_SPEC);
    expect(result!.sizes[0].width).toBe(160);
    expect(result!.sizes[0].height).toBe(90);
    expect(result!.sizes[0].cols).toBe(10);
    expect(result!.sizes[0].rows).toBe(10);
    expect(result!.sizes[0].intervalMs).toBe(2000);
  });

  it('returns null for empty string', () => {
    expect(parseStoryboardSpec('')).toBeNull();
  });

  it('returns null for string without pipes', () => {
    expect(parseStoryboardSpec('just-a-url')).toBeNull();
  });

  it('returns null for malformed sections', () => {
    expect(parseStoryboardSpec('url|bad')).toBeNull();
  });
});

describe('getFrameAtTimestamp', () => {
  const spec = parseStoryboardSpec(
    'https://i.ytimg.com/sb/TEST/storyboard3_L$L/$N.jpg?sigh=$M|160#90#100#10#10#2000#M$M#sig'
  )!;

  it('returns frame at timestamp 0', () => {
    const frame = getFrameAtTimestamp(spec, 0);
    expect(frame).not.toBeNull();
    expect(frame!.x).toBe(0);
    expect(frame!.y).toBe(0);
    expect(frame!.width).toBe(160);
    expect(frame!.height).toBe(90);
  });

  it('returns correct position for timestamp 4s (3rd frame at 2s intervals)', () => {
    // 2s interval → frame 0 at 0s, frame 1 at 2s, frame 2 at 4s
    const frame = getFrameAtTimestamp(spec, 4);
    expect(frame).not.toBeNull();
    // Frame 2: col=2, row=0 in a 10-col grid
    expect(frame!.x).toBe(2 * 160); // 320
    expect(frame!.y).toBe(0);
  });

  it('wraps to next row after cols frames', () => {
    // 10 cols × 2s interval = frame 10 starts at 20s → first frame of row 1
    const frame = getFrameAtTimestamp(spec, 20);
    expect(frame).not.toBeNull();
    expect(frame!.x).toBe(0); // col 0
    expect(frame!.y).toBe(90); // row 1
  });

  it('wraps to next sprite sheet after cols*rows frames', () => {
    // 10×10 grid = 100 frames per sheet, 2s interval = 200s per sheet
    // Frame at 200s should be on sheet 1, position (0,0)
    const frame = getFrameAtTimestamp(spec, 200);
    expect(frame).not.toBeNull();
    expect(frame!.url).toContain('M1'); // sheet number 1
    expect(frame!.x).toBe(0);
    expect(frame!.y).toBe(0);
  });

  it('handles mid-interval timestamps correctly', () => {
    // At 3s (between frame 1 at 2s and frame 2 at 4s) → should snap to frame 1
    const frame = getFrameAtTimestamp(spec, 3);
    expect(frame).not.toBeNull();
    expect(frame!.x).toBe(160); // frame 1 = col 1
  });
});

describe('parseTimestamp', () => {
  it('parses MM:SS format', () => {
    expect(parseTimestamp('0:03')).toBe(3);
    expect(parseTimestamp('2:30')).toBe(150);
    expect(parseTimestamp('10:00')).toBe(600);
  });

  it('parses HH:MM:SS format', () => {
    expect(parseTimestamp('1:05:30')).toBe(3930);
  });

  it('parses single number as seconds', () => {
    expect(parseTimestamp('45')).toBe(45);
  });

  it('handles zero', () => {
    expect(parseTimestamp('0:00')).toBe(0);
  });
});
