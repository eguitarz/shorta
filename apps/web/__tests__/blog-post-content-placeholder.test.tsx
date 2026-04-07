import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlogPostContent } from '../components/blog/BlogPostContent';

// Mock ShortaReportEmbed to avoid API calls in tests
vi.mock('../components/blog/ShortaReportEmbed', () => ({
  ShortaReportEmbed: ({ jobId, creatorName, videoTitle }: any) => (
    <div data-testid="shorta-embed" data-job-id={jobId} data-creator={creatorName} data-title={videoTitle}>
      Shorta Report Embed: {jobId}
    </div>
  ),
}));

describe('BlogPostContent placeholder parsing', () => {
  it('renders pure markdown unchanged when no placeholders exist', () => {
    const content = '# Hello World\n\nSome **bold** text and a [link](https://example.com).';
    render(<BlogPostContent content={content} />);
    expect(screen.getByText('Hello World')).toBeTruthy();
    expect(screen.getByText(/bold/)).toBeTruthy();
    // Should NOT render any embeds
    expect(screen.queryByTestId('shorta-embed')).toBeNull();
  });

  it('parses a single <!-- shorta-report:JOB_ID --> placeholder and renders the embed', () => {
    const content = '# Analysis\n\nSome text before.\n\n<!-- shorta-report:abc-123 -->\n\nSome text after.';
    render(<BlogPostContent content={content} />);
    expect(screen.getByText('Analysis')).toBeTruthy();
    expect(screen.getByText(/text before/)).toBeTruthy();
    expect(screen.getByText(/text after/)).toBeTruthy();
    const embed = screen.getByTestId('shorta-embed');
    expect(embed.getAttribute('data-job-id')).toBe('abc-123');
  });

  it('parses placeholder with creator and title attributes', () => {
    const content = '<!-- shorta-report:job-456 creator="MrBeast" title="Why I Built..." -->';
    render(<BlogPostContent content={content} />);
    const embed = screen.getByTestId('shorta-embed');
    expect(embed.getAttribute('data-job-id')).toBe('job-456');
    expect(embed.getAttribute('data-creator')).toBe('MrBeast');
    expect(embed.getAttribute('data-title')).toBe('Why I Built...');
  });

  it('handles multiple placeholders in one post', () => {
    const content = [
      '# Comparison',
      '<!-- shorta-report:job-1 creator="Creator A" -->',
      'Some analysis text.',
      '<!-- shorta-report:job-2 creator="Creator B" -->',
    ].join('\n\n');
    render(<BlogPostContent content={content} />);
    const embeds = screen.getAllByTestId('shorta-embed');
    expect(embeds).toHaveLength(2);
    expect(embeds[0].getAttribute('data-job-id')).toBe('job-1');
    expect(embeds[1].getAttribute('data-job-id')).toBe('job-2');
  });

  it('treats malformed placeholders as invisible HTML comments', () => {
    // Missing the shorta-report prefix — just a regular HTML comment
    const content = '# Post\n\n<!-- some random comment -->\n\nContent here.';
    render(<BlogPostContent content={content} />);
    expect(screen.queryByTestId('shorta-embed')).toBeNull();
    expect(screen.getByText('Content here.')).toBeTruthy();
  });
});
