import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { BarChart3, Zap, MessageSquare, Target, Eye, TrendingUp, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Video Analyzer – AI-Powered Analysis for Any Video Length',
    description: 'Free YouTube video analyzer that works for Shorts and long-form content. Get beat-by-beat feedback on hooks, pacing, and retention. No login required.',
    keywords: [
        'youtube video analyzer',
        'youtube analyzer',
        'analyze youtube video',
        'youtube video analysis tool',
        'youtube retention analyzer',
        'youtube hook analyzer',
        'youtube pacing analysis',
        'youtube shorts analyzer',
        'long form video analyzer',
    ],
    openGraph: {
        title: 'YouTube Video Analyzer – AI-Powered Analysis for Any Video Length',
        description: 'Beat-by-beat AI feedback on hooks, pacing, and retention for any YouTube video. Free, no login required.',
        url: 'https://shorta.ai/tools/youtube-video-analyzer',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-video-analyzer',
    },
};

export default function YouTubeVideoAnalyzerPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'YouTube Video Analyzer',
        description: 'AI-powered YouTube video analyzer that provides beat-by-beat feedback on hook performance, retention, pacing, and content clarity — for Shorts and long-form videos.',
        url: 'https://shorta.ai/tools/youtube-video-analyzer',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free trial analysis — no login required',
        },
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is a YouTube video analyzer?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'A YouTube video analyzer is a tool that evaluates your video content to identify issues with hooks, retention, pacing, and clarity. Shorta\'s analyzer uses AI to break down each beat of your video and give specific, actionable feedback — for both Shorts and long-form videos.',
                },
            },
            {
                '@type': 'Question',
                name: 'Does it work for long-form YouTube videos?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta analyzes videos of any length. Long-form videos get chapter-level pacing analysis, section-by-section retention flags, and beat-by-beat feedback across the full runtime.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is the YouTube video analyzer free?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta offers a free trial analysis with no login and no credit card required. Paste a YouTube URL or upload your video file and get a complete AI analysis.',
                },
            },
            {
                '@type': 'Question',
                name: 'What does the YouTube video analyzer check?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The analyzer checks four key areas: Hook performance (do the first seconds stop the scroll?), Retention (where do viewers drop off?), Pacing (are there slow or rushed sections?), and Clarity (will viewers understand immediately?). Every issue comes with a timestamped fix.',
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
                    YouTube Video Analyzer: AI-Powered Feedback for Any Video Length
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    The AI analyzer that shows you exactly where viewers stop watching — whether it's a 30-second Short or a 30-minute tutorial. Beat-by-beat feedback, timestamped fixes, free to try.
                </p>

                {/* What the Analyzer Does */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">What the YouTube Video Analyzer Checks</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook Score</h3>
                            <p className="text-gray-400 text-sm">Are the first seconds compelling enough to keep viewers watching? The analyzer scores your hook and suggests stronger alternatives.</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-blue-500 mb-3" />
                            <h3 className="font-semibold mb-2">Retention Analysis</h3>
                            <p className="text-gray-400 text-sm">See where viewers drop off with a color-coded retention timeline. Every drop point gets a specific explanation and fix.</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-5 rounded-xl">
                            <MessageSquare className="w-6 h-6 text-green-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing Feedback</h3>
                            <p className="text-gray-400 text-sm">The analyzer flags slow spots, rushed transitions, and dead air that kills viewer attention — at any video length.</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-5 rounded-xl">
                            <Target className="w-6 h-6 text-purple-500 mb-3" />
                            <h3 className="font-semibold mb-2">Clarity Check</h3>
                            <p className="text-gray-400 text-sm">Will a new viewer understand your video immediately? The analyzer catches confusing moments and unclear messaging.</p>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 p-5 rounded-xl md:col-span-2">
                            <Clock className="w-6 h-6 text-cyan-500 mb-3" />
                            <h3 className="font-semibold mb-2">Chapter-Level Analysis for Long Videos</h3>
                            <p className="text-gray-400 text-sm">For long-form content, Shorta maps pacing and retention across chapters so you can identify which segments cause viewer drop-off and tighten your edit accordingly.</p>
                        </div>
                    </div>
                </section>

                {/* Shorts vs Long-form */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Works for Shorts and Long-Form Videos</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-[#1a1a1a] p-6 rounded-xl">
                            <h3 className="font-semibold text-orange-400 mb-3">YouTube Shorts</h3>
                            <ul className="space-y-2 text-gray-300 text-sm">
                                <li>→ Hook strength in the first 1-2 seconds</li>
                                <li>→ Retention through to the end</li>
                                <li>→ Pacing for fast-scroll audiences</li>
                                <li>→ CTA placement and clarity</li>
                            </ul>
                        </div>
                        <div className="bg-[#1a1a1a] p-6 rounded-xl">
                            <h3 className="font-semibold text-blue-400 mb-3">Long-Form Videos</h3>
                            <ul className="space-y-2 text-gray-300 text-sm">
                                <li>→ Chapter-by-chapter pacing analysis</li>
                                <li>→ Section retention drop identification</li>
                                <li>→ Content density and pacing rhythm</li>
                                <li>→ Hook, mid-video momentum, CTA</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How the Video Analyzer Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Paste URL or Upload Video</h3>
                                <p className="text-gray-400">Works with any YouTube URL or video file — Shorts, long-form, tutorials, vlogs. Drafts and rough cuts work too.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">AI Analyzes Every Beat</h3>
                                <p className="text-gray-400">The analyzer segments your video and evaluates each section for hook strength, retention risk, pacing, and clarity.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Timestamped Feedback</h3>
                                <p className="text-gray-400">Specific notes at every problem point. Not "improve your pacing" — but "0:45–1:10: This section buries the main point. Cut to the demo."</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Generate a Fix Plan</h3>
                                <p className="text-gray-400">Approve fixes and generate a re-filming or re-editing storyboard with scene reordering and hook alternatives.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Analyze */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Analyze Before Publishing?</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex gap-3">
                                <Eye className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <span><strong>First impressions are permanent.</strong> Once a video is published and gets low retention, you can't recover those views. Analyze before you publish.</span>
                            </li>
                            <li className="flex gap-3">
                                <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span><strong>YouTube's algorithm rewards retention.</strong> The analyzer maps exactly where viewers drop off so you can fix retention killers first.</span>
                            </li>
                            <li className="flex gap-3">
                                <Target className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Every issue has a fix.</strong> The analyzer doesn't just find problems — it gives you specific, actionable suggestions for every issue it finds.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">YouTube Video Analyzer FAQ</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">What is a YouTube video analyzer?</h3>
                            <p className="text-gray-400">A YouTube video analyzer is a tool that evaluates your video content to identify issues with hooks, retention, pacing, and clarity. Shorta's analyzer uses AI to break down each beat of your video and give specific, actionable feedback — for both Shorts and long-form videos.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Does it work for long-form YouTube videos?</h3>
                            <p className="text-gray-400">Yes. Shorta analyzes videos of any length. Long-form videos get chapter-level pacing analysis, section-by-section retention flags, and beat-by-beat feedback across the full runtime.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Is the YouTube video analyzer free?</h3>
                            <p className="text-gray-400">Yes. Shorta offers a free trial analysis with no login and no credit card required. Paste a YouTube URL or upload your video file and get a complete AI analysis.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">What does the YouTube video analyzer check?</h3>
                            <p className="text-gray-400">The analyzer checks four key areas: Hook performance (do the first seconds stop the scroll?), Retention (where do viewers drop off?), Pacing (are there slow or rushed sections?), and Clarity (will viewers understand immediately?). Every issue comes with a timestamped fix.</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Try the YouTube Video Analyzer Free"
                    primaryHref="/try"
                    secondaryText="See a Sample Analysis"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-analyzer', text: 'YouTube Shorts Analyzer' },
                        { href: '/tools/youtube-long-form-video-analyzer', text: 'Long-Form Video Analyzer' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Analysis' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Retention Analysis' },
                        { href: '/tools/youtube-shorts-feedback-tool', text: 'Video Feedback Tool' },
                        { href: '/tools/youtube-storyboard-generator', text: 'Storyboard Generator' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
