import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { Check, BarChart3, Zap, Target } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Shorts Analytics Tool – Retention & Hook Data',
    description: 'Get frame-by-frame retention data and hook analysis for your YouTube Shorts. Upload your video, get actionable feedback, and re-film with confidence.',
    openGraph: {
        title: 'YouTube Shorts Analytics Tool – Retention & Hook Data',
        description: 'Get frame-by-frame retention data and hook analysis for your YouTube Shorts. Upload your video, get actionable feedback, and re-film with confidence.',
        url: 'https://shorta.ai/tools/youtube-shorts-analytics-tool',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-shorts-analytics-tool',
    },
};

export default function YouTubeShortsAnalyticsToolPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'YouTube Shorts Analytics Tool',
        description: 'Get frame-by-frame retention data and hook analysis for your YouTube Shorts.',
        url: 'https://shorta.ai/tools/youtube-shorts-analytics-tool',
        publisher: {
            '@type': 'Organization',
            name: 'Shorta',
            url: 'https://shorta.ai',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <SEOPageLayout>
                {/* Hero */}
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    YouTube Shorts Analytics Tool That Shows Why Viewers Leave
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    Shorta gives you the retention data YouTube Studio doesn't—frame-by-frame analysis of where viewers drop off and exactly why.
                </p>

                {/* Problem Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Your Shorts Analytics Don't Tell the Full Story</h2>
                    <p className="text-gray-300 mb-4">
                        YouTube Studio shows <em>what</em> happened, not <em>why</em>. You see a retention graph that dips, but no explanation of which second killed your video.
                    </p>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex gap-3">
                            <span className="text-red-500">✗</span>
                            Retention graphs for Shorts are vague or missing
                        </li>
                        <li className="flex gap-3">
                            <span className="text-red-500">✗</span>
                            Third-party tools focus on SEO, not content quality
                        </li>
                        <li className="flex gap-3">
                            <span className="text-red-500">✗</span>
                            You're left guessing which second lost viewers
                        </li>
                    </ul>
                </section>

                {/* Root Causes */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">The Real Reasons Shorts Fail (That No Dashboard Shows)</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-[#1a1a1a] p-6 rounded-xl">
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-orange-500" />
                                Weak Hook
                            </h3>
                            <p className="text-gray-400 text-sm">First 1-2 seconds don't grab attention. Viewers swipe before your content starts.</p>
                        </div>

                        <div className="bg-[#1a1a1a] p-6 rounded-xl">
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-orange-500" />
                                Pacing Issues
                            </h3>
                            <p className="text-gray-400 text-sm">Too slow in the middle. Viewers lose interest and swipe away mid-video.</p>
                        </div>

                        <div className="bg-[#1a1a1a] p-6 rounded-xl">
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <Target className="w-5 h-5 text-orange-500" />
                                Unclear Premise
                            </h3>
                            <p className="text-gray-400 text-sm">Viewers don't understand what they're watching. Confusion kills retention.</p>
                        </div>

                        <div className="bg-[#1a1a1a] p-6 rounded-xl">
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <Check className="w-5 h-5 text-orange-500" />
                                Poor Payoff
                            </h3>
                            <p className="text-gray-400 text-sm">Ending doesn't deliver on the hook's promise. Low engagement, low distribution.</p>
                        </div>
                    </div>
                </section>

                {/* How Shorta Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How Shorta Analyzes Your Shorts (Step-by-Step)</h2>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Upload Your Short</h3>
                                <p className="text-gray-400">Drag and drop your MP4. Shorta accepts any Short under 60 seconds.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">Automatic Issue Detection</h3>
                                <p className="text-gray-400">Shorta scans for hook strength, pacing problems, clarity issues, and retention risks.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Timestamped Feedback</h3>
                                <p className="text-gray-400">See exactly which second has issues: "0:00–0:02: Hook is unclear. Viewers may swipe before the payoff."</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get a Storyboard Fix</h3>
                                <p className="text-gray-400">Shorta generates a revised storyboard showing exactly how to re-film for better retention.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What Shorta Detects */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">What Shorta Detects (That YouTube Can't)</h2>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Hook effectiveness score with frame-level feedback</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Pacing analysis: where the video drags or rushes</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Clarity check: is your message landing?</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Retention risk zones: exactly where viewers would swipe</span>
                        </li>
                    </ul>
                </section>

                {/* CTA */}
                <SEOPageCTA
                    primaryText="Upload Your Short and Get Your Retention Report"
                    primaryHref="/try"
                    secondaryText="See a Sample Analysis"
                    secondaryHref="/try"
                />

                {/* Internal Links */}
                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Deep Dive: Retention Analysis' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Focus on Hook Analysis' },
                        { href: '/tools/youtube-shorts-feedback-tool', text: 'Get Pre-Publish Feedback' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
