import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ShortaReportEmbed } from '../components/blog/ShortaReportEmbed';

// Mock posthog
vi.mock('../lib/posthog', () => ({
  trackEvent: vi.fn(),
  default: { capture: vi.fn() },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockSuccessResponse(overrides = {}) {
  return {
    ok: true,
    json: async () => ({
      analysis: {
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        lintSummary: { score: 82, totalRules: 10, passed: 8, critical: 0, moderate: 1, minor: 1 },
        storyboard: {
          performance: {
            hookEffectiveness: '90%',
            structureScore: '78/100',
            clarityScore: '85',
            deliveryScore: '74 points',
          },
        },
        ...overrides,
      },
    }),
  };
}

describe('ShortaReportEmbed', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('shows loading skeleton initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ShortaReportEmbed jobId="test-123" />);
    // Skeleton has animate-pulse class
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  it('renders success state with score, title, and creator', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse());
    render(
      <ShortaReportEmbed jobId="test-123" creatorName="MrBeast" videoTitle="Test Video" />
    );
    await waitFor(() => {
      expect(screen.getByText('82')).toBeTruthy();
    });
    expect(screen.getByText('MrBeast')).toBeTruthy();
    expect(screen.getByText('Test Video')).toBeTruthy();
    expect(screen.getByText('View Full Analysis Report')).toBeTruthy();
  });

  it('renders error state for 404 response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    render(<ShortaReportEmbed jobId="nonexistent" />);
    await waitFor(() => {
      expect(screen.getByText('Analysis report unavailable')).toBeTruthy();
    });
  });

  it('renders error state for network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    render(<ShortaReportEmbed jobId="test-123" />);
    await waitFor(() => {
      expect(screen.getByText('Analysis report unavailable')).toBeTruthy();
    });
  });

  it('applies green color for score >= 80', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse());
    render(<ShortaReportEmbed jobId="test-123" />);
    await waitFor(() => {
      const scoreEl = screen.getByText('82');
      expect(scoreEl.className).toContain('text-green-400');
    });
  });

  it('applies orange color for score 60-79', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({
      lintSummary: { score: 65, totalRules: 10, passed: 6, critical: 0, moderate: 2, minor: 2 },
    }));
    render(<ShortaReportEmbed jobId="test-123" />);
    await waitFor(() => {
      const scoreEl = screen.getByText('65');
      expect(scoreEl.className).toContain('text-orange-400');
    });
  });

  it('applies red color for score < 60', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({
      lintSummary: { score: 42, totalRules: 10, passed: 4, critical: 2, moderate: 2, minor: 2 },
    }));
    render(<ShortaReportEmbed jobId="test-123" />);
    await waitFor(() => {
      const scoreEl = screen.getByText('42');
      expect(scoreEl.className).toContain('text-red-400');
    });
  });

  it('renders YouTube thumbnail from video URL', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse());
    render(<ShortaReportEmbed jobId="test-123" videoTitle="Test" />);
    await waitFor(() => {
      const img = document.querySelector('img') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toContain('i.ytimg.com/vi/dQw4w9WgXcQ');
    });
  });

  it('renders category scores from performance data', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse());
    render(<ShortaReportEmbed jobId="test-123" />);
    await waitFor(() => {
      expect(screen.getByText('Hook')).toBeTruthy();
      expect(screen.getByText('90')).toBeTruthy();
      expect(screen.getByText('Structure')).toBeTruthy();
      expect(screen.getByText('78')).toBeTruthy();
    });
  });

  it('has correct CTA link to shared report', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse());
    render(<ShortaReportEmbed jobId="test-123" />);
    await waitFor(() => {
      const link = screen.getByText('View Full Analysis Report').closest('a');
      expect(link?.getAttribute('href')).toBe('/shared/test-123');
    });
  });
});
