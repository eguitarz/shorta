import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { YouTubeChannelAnalyzer } from '@/components/tools/YouTubeChannelAnalyzer';

export const metadata: Metadata = {
  title: 'YouTube Channel Analyzer – Real Metrics, Fast Snapshot',
  description: 'Free YouTube channel analyzer that pulls real data for views, cadence, engagement, and consistency. No AI, no login.',
  keywords: [
    'youtube channel analyzer',
    'youtube channel analysis',
    'channel analytics tool',
    'youtube growth metrics',
    'youtube channel audit',
  ],
  openGraph: {
    title: 'YouTube Channel Analyzer – Real Metrics, Fast Snapshot',
    description: 'Instant channel snapshot with real data for views, cadence, and engagement.',
    url: 'https://shorta.ai/tools/youtube-channel-analyzer',
    type: 'website',
  },
  alternates: {
    canonical: 'https://shorta.ai/tools/youtube-channel-analyzer',
  },
};

export default function YouTubeChannelAnalyzerPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'YouTube Channel Analyzer',
    description: 'Rule-based channel analyzer that pulls public YouTube data for cadence, engagement, and consistency.',
    url: 'https://shorta.ai/tools/youtube-channel-analyzer',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free channel snapshot — no login required',
    },
    publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
  };

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does the YouTube Channel Analyzer measure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It measures recent view performance, upload cadence, engagement per 1K views, Shorts share, and a consistency score based on real public data.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does this channel analyzer use AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. It uses deterministic calculations on public YouTube data for transparency.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I analyze a channel with a handle?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Paste a channel URL, channel ID, or @handle to get a snapshot.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is the analysis real?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Metrics are pulled from the YouTube Data API and computed on the most recent videos.',
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />

      <SEOPageLayout>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          YouTube Channel Analyzer: Real Metrics, Fast Snapshot
        </h1>
        <p className="text-xl text-gray-400 mb-10">
          Pull real public data on any channel and get a clear read on cadence, engagement, and consistency. No AI, no login.
        </p>

        <section className="mb-12">
          <YouTubeChannelAnalyzer />
        </section>

        <section className="py-12 px-8 bg-gradient-to-b from-[#1a1a1a] to-black rounded-2xl my-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Turn Insights Into Better Shorts</h2>
          <p className="text-gray-400 mb-8">
            Upgrade to Shorta to unlock storyboards, deeper analysis, and a repeatable improvement loop.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              Upgrade to Pro
            </a>
            <a
              href="/try"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Try Shorta Free
            </a>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">YouTube Channel Analyzer FAQ</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What does the YouTube Channel Analyzer measure?</h3>
              <p className="text-gray-400">Views, cadence, engagement per 1K views, Shorts share, and a consistency score based on recent uploads.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Does this tool use AI?</h3>
              <p className="text-gray-400">No. It uses deterministic calculations on public YouTube data.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I analyze a channel with a handle?</h3>
              <p className="text-gray-400">Yes. Paste a channel URL, channel ID, or @handle.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is the analysis real?</h3>
              <p className="text-gray-400">Yes. We query the YouTube Data API for recent videos and compute metrics.</p>
            </div>
          </div>
        </section>

        <SEOInternalLinks
          links={[
            { href: '/tools/youtube-niche-analyzer', text: 'YouTube Niche Analyzer' },
            { href: '/tools/youtube-shorts-analyzer', text: 'YouTube Shorts Analyzer' },
            { href: '/tools/youtube-shorts-analytics-tool', text: 'Shorts Analytics Tool' },
          ]}
        />
      </SEOPageLayout>
    </>
  );
}
