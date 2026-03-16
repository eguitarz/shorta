import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { BarChart3, Zap, Target, Eye, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Video Retention Analysis – Find Where Viewers Drop Off',
    description: 'AI-powered retention analysis for any YouTube video. Find exactly where viewers stop watching and get specific fixes. Works for Shorts and long-form. Free to try.',
    keywords: [
        'youtube video retention analysis',
        'youtube retention analyzer',
        'youtube audience retention',
        'where do viewers drop off youtube',
        'improve youtube video retention',
        'youtube watch time analysis',
        'video retention drop off',
        'youtube retention rate',
        'youtube shorts retention analysis',
        'long form video retention',
    ],
    openGraph: {
        title: 'YouTube Video Retention Analysis – Find Where Viewers Drop Off',
        description: 'Find exactly where viewers stop watching your YouTube videos. AI retention analysis for any video length — Shorts or long-form.',
        url: 'https://shorta.ai/tools/youtube-video-retention-analysis',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-video-retention-analysis',
    },
};

export default function YouTubeVideoRetentionAnalysisPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'YouTube Video Retention Analyzer',
        description: 'AI-powered retention analysis for YouTube videos of any length. Identifies exactly where viewers drop off and provides specific, timestamped fixes.',
        url: 'https://shorta.ai/tools/youtube-video-retention-analysis',
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
                name: 'What is YouTube video retention analysis?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Retention analysis examines your video beat-by-beat to identify the specific moments where viewers stop watching. It explains why each drop-off happens — whether it\'s a slow hook, pacing issue, confusing content, or a weak transition — and gives you concrete fixes.',
                },
            },
            {
                '@type': 'Question',
                name: 'Does this work for both YouTube Shorts and long-form videos?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta analyzes retention for any YouTube video. Shorts get second-by-second hook and pacing analysis. Long-form videos get chapter-level and section-by-section retention mapping across the full runtime.',
                },
            },
            {
                '@type': 'Question',
                name: 'What causes retention drops on YouTube?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Common causes include: a weak hook that fails to establish value in the first few seconds, slow pacing or repetitive content, confusing explanations, unfulfilled promises from the title or thumbnail, and weak transitions between sections.',
                },
            },
            {
                '@type': 'Question',
                name: 'How is this different from YouTube Analytics?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'YouTube Analytics shows you the drop-off curve but doesn\'t explain why. Shorta\'s retention analysis tells you the specific reason for each drop-off and what to change in the edit. It works before you publish too, so you can fix problems before they hurt your channel.',
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
                    YouTube Video Retention Analysis: Know Why Viewers Leave
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    YouTube Analytics shows you the drop-off curve. Shorta explains why each drop happens — and tells you exactly what to change in the edit to fix it.
                </p>

                {/* The Retention Problem */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">The Problem With Standard Retention Data</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl mb-6">
                        <p className="text-gray-300 mb-4">
                            You can see that viewers drop off at 2:30 in your video. What you can't see is <em>why</em>. Was the pacing too slow? Did you lose the thread? Did viewers get what they needed and leave? Was there a confusing transition?
                        </p>
                        <p className="text-gray-300">
                            Shorta's AI watches your video the same way a viewer does — and flags the specific moments that break retention, with explanations and fixes. It works for Shorts, tutorials, vlogs, and any long-form content.
                        </p>
                    </div>
                </section>

                {/* What Retention Analysis Covers */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">What Retention Analysis Covers</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook Retention (0–30s)</h3>
                            <p className="text-gray-400 text-sm">The first 30 seconds determine whether viewers stay. Analysis scores your hook and flags exactly what's causing early drop-off.</p>
                        </div>
                        <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 p-5 rounded-xl">
                            <TrendingDown className="w-6 h-6 text-red-500 mb-3" />
                            <h3 className="font-semibold mb-2">Drop-Off Moment Identification</h3>
                            <p className="text-gray-400 text-sm">Every significant retention drop is flagged with a timestamp and a reason — slow pacing, weak transition, confusing content, or an unfulfilled promise.</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-blue-500 mb-3" />
                            <h3 className="font-semibold mb-2">Mid-Video Momentum Tracking</h3>
                            <p className="text-gray-400 text-sm">Long videos lose momentum in the middle. The analyzer maps engagement across every section so you know where to tighten the edit.</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-5 rounded-xl">
                            <Clock className="w-6 h-6 text-green-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing Analysis</h3>
                            <p className="text-gray-400 text-sm">Identifies segments that are too slow (causing boredom) or too dense (causing confusion) — two different pacing problems that need different fixes.</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-5 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-purple-500 mb-3" />
                            <h3 className="font-semibold mb-2">Weak Transition Detection</h3>
                            <p className="text-gray-400 text-sm">Abrupt or unclear transitions between sections break viewer immersion. The analyzer flags them and suggests how to bridge sections more smoothly.</p>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 p-5 rounded-xl">
                            <Target className="w-6 h-6 text-cyan-500 mb-3" />
                            <h3 className="font-semibold mb-2">CTA & Closing Analysis</h3>
                            <p className="text-gray-400 text-sm">Is your outro compelling enough to earn a subscribe? Analyzes whether your CTA is clear, well-timed, and effectively placed.</p>
                        </div>
                    </div>
                </section>

                {/* Shorts vs Long-Form */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Retention Analysis for Shorts vs. Long-Form</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-[#1a1a1a] p-6 rounded-xl">
                            <h3 className="font-semibold text-orange-400 mb-3">YouTube Shorts</h3>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li className="flex gap-2"><span className="text-orange-400">→</span> Second-by-second hook analysis</li>
                                <li className="flex gap-2"><span className="text-orange-400">→</span> First 2-second scroll-stop score</li>
                                <li className="flex gap-2"><span className="text-orange-400">→</span> Loop potential assessment</li>
                                <li className="flex gap-2"><span className="text-orange-400">→</span> Pacing and energy level feedback</li>
                            </ul>
                        </div>
                        <div className="bg-[#1a1a1a] p-6 rounded-xl">
                            <h3 className="font-semibold text-blue-400 mb-3">Long-Form Videos</h3>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li className="flex gap-2"><span className="text-blue-400">→</span> Chapter-level retention mapping</li>
                                <li className="flex gap-2"><span className="text-blue-400">→</span> Mid-video drop-off identification</li>
                                <li className="flex gap-2"><span className="text-blue-400">→</span> Content density analysis</li>
                                <li className="flex gap-2"><span className="text-blue-400">→</span> Promise vs. delivery audit</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Why It Matters */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Retention Is the Most Important YouTube Metric</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex gap-3">
                                <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <span><strong>The algorithm rewards watch time.</strong> Videos with high average view duration get distributed to more viewers. Even a 10% retention improvement can dramatically change your reach.</span>
                            </li>
                            <li className="flex gap-3">
                                <Eye className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Viewers who stay become subscribers.</strong> A viewer who watches 80% of your video is 5x more likely to subscribe than one who watches 30%. Retention drives channel growth.</span>
                            </li>
                            <li className="flex gap-3">
                                <Target className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Your CTA only lands if viewers stay.</strong> Every drop-off before your call-to-action is a missed opportunity. Better retention means your subscribe push, product pitch, or link in bio actually gets seen.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* How It Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How It Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Paste URL or Upload</h3>
                                <p className="text-gray-400">Drop a YouTube URL or upload your video file. Works for Shorts and long-form videos of any length.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">AI Maps Your Retention</h3>
                                <p className="text-gray-400">The analyzer watches your video beat-by-beat, flagging every moment that creates a retention risk and explaining the specific cause.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Timestamped Drop-Off Explanations</h3>
                                <p className="text-gray-400">See exactly which moments are likely to lose viewers, why, and what to change. No guessing.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Edit & Publish with Confidence</h3>
                                <p className="text-gray-400">Apply the specific fixes before publishing. Analyze again after re-editing to confirm the issues are resolved.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Video Retention Analysis FAQ</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">What is YouTube video retention analysis?</h3>
                            <p className="text-gray-400">Retention analysis examines your video beat-by-beat to identify the specific moments where viewers stop watching. It explains why each drop-off happens and gives you concrete fixes.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Does this work for both YouTube Shorts and long-form videos?</h3>
                            <p className="text-gray-400">Yes. Shorts get second-by-second hook and pacing analysis. Long-form videos get chapter-level and section-by-section retention mapping across the full runtime.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">What causes retention drops on YouTube?</h3>
                            <p className="text-gray-400">Common causes include a weak hook, slow pacing, repetitive content, confusing explanations, unfulfilled title promises, and weak transitions between sections.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">How is this different from YouTube Analytics?</h3>
                            <p className="text-gray-400">YouTube Analytics shows you the drop-off curve but doesn't explain why. Shorta tells you the specific reason for each drop-off and what to change in the edit. It also works before you publish — so you can fix problems before they hurt your channel.</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Analyze Your Video's Retention Free"
                    primaryHref="/try"
                    secondaryText="See a Sample Analysis"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-video-analyzer', text: 'YouTube Video Analyzer' },
                        { href: '/tools/youtube-long-form-video-analyzer', text: 'Long-Form Video Analyzer' },
                        { href: '/tools/youtube-tutorial-analyzer', text: 'Tutorial Video Analyzer' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Shorts Retention Analysis' },
                        { href: '/tools/improve-youtube-shorts-retention', text: 'Improve Video Retention' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Analysis' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
