import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { AlertCircle, Clock, MessageCircle, Target } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Why My YouTube Shorts Get Low Views (Real Causes)',
    description: "Your Shorts aren't failing because of the algorithm. Weak hooks, bad pacing, and unclear messaging kill views. Learn how to diagnose and fix your videos.",
    openGraph: {
        title: 'Why My YouTube Shorts Get Low Views (Real Causes)',
        description: "Your Shorts aren't failing because of the algorithm. Weak hooks, bad pacing, and unclear messaging kill views.",
        url: 'https://shorta.ai/tools/why-my-youtube-shorts-get-low-views',
        type: 'article',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/why-my-youtube-shorts-get-low-views',
    },
};

export default function WhyMyShortsGetLowViewsPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Why My YouTube Shorts Get Low Views: The 4 Hidden Problems',
        description: "Your Shorts aren't failing because of the algorithm. Learn the real causes and how to fix them.",
        url: 'https://shorta.ai/tools/why-my-youtube-shorts-get-low-views',
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
                    Why My YouTube Shorts Get Low Views: The 4 Hidden Problems
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    You're posting consistently, following "best practices," and still stuck at 200-500 views. Here's what's actually going wrong—and it's not the algorithm.
                </p>

                {/* Not the Algorithm */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">It's Not the Algorithm—It's Your Content</h2>
                    <p className="text-gray-300 mb-4">
                        YouTube <em>wants</em> to show your Shorts to people. Low views mean viewers are swiping away too fast. The algorithm isn't hiding you; it's responding to viewer behavior.
                    </p>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                        <p className="text-gray-400">
                            <strong className="text-white">The uncomfortable truth:</strong> When your Short gets 200 views, YouTube showed it to thousands. Those thousands swiped away in the first 2 seconds.
                        </p>
                    </div>
                </section>

                {/* The 4 Reasons */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">The 4 Real Reasons Your Shorts Fail</h2>

                    <div className="space-y-8">
                        <div className="border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-xl font-semibold">1. Your Hook Doesn't Land in Time</h3>
                            </div>
                            <p className="text-gray-400 mb-3">You have 1-2 seconds before the swipe. Most creators waste these seconds on:</p>
                            <ul className="text-gray-400 space-y-1 ml-4">
                                <li>• Intro music or logos</li>
                                <li>• "Hey guys, so today..."</li>
                                <li>• Context before conflict</li>
                            </ul>
                            <p className="text-gray-300 mt-3"><strong>Fix:</strong> Lead with conflict, intrigue, or the payoff. Context comes after.</p>
                        </div>

                        <div className="border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <Clock className="w-6 h-6 text-yellow-500" />
                                </div>
                                <h3 className="text-xl font-semibold">2. Your Pacing Loses Viewers Mid-Video</h3>
                            </div>
                            <p className="text-gray-400 mb-3">Retention isn't just about the hook—it's about every second. Common mid-video killers:</p>
                            <ul className="text-gray-400 space-y-1 ml-4">
                                <li>• Dead air or pauses</li>
                                <li>• Slow transitions</li>
                                <li>• Rambling explanations</li>
                            </ul>
                            <p className="text-gray-300 mt-3"><strong>Fix:</strong> Tighten every edit. Use pattern interrupts. Cut anything that doesn't advance the point.</p>
                        </div>

                        <div className="border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <MessageCircle className="w-6 h-6 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-semibold">3. Your Message Isn't Clear Enough</h3>
                            </div>
                            <p className="text-gray-400 mb-3">Viewers don't rewatch to understand; they swipe. Confusion killers:</p>
                            <ul className="text-gray-400 space-y-1 ml-4">
                                <li>• Jargon or acronyms</li>
                                <li>• Assuming viewer context</li>
                                <li>• Inside jokes</li>
                            </ul>
                            <p className="text-gray-300 mt-3"><strong>Fix:</strong> Every second must advance a single, obvious point. State the obvious.</p>
                        </div>

                        <div className="border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Target className="w-6 h-6 text-purple-500" />
                                </div>
                                <h3 className="text-xl font-semibold">4. Your Payoff Doesn't Deliver</h3>
                            </div>
                            <p className="text-gray-400 mb-3">Strong hooks create expectations. If the ending disappoints:</p>
                            <ul className="text-gray-400 space-y-1 ml-4">
                                <li>• Viewers don't engage (likes, comments, shares)</li>
                                <li>• Low engagement = algorithm deprioritizes</li>
                                <li>• Future Shorts get less initial reach</li>
                            </ul>
                            <p className="text-gray-300 mt-3"><strong>Fix:</strong> Make sure the finale matches (or exceeds) the hook's promise.</p>
                        </div>
                    </div>
                </section>

                {/* How to Diagnose */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">How to Actually Diagnose These Problems</h2>
                    <p className="text-gray-400 mb-6">Stop guessing. Here's how to find what's wrong:</p>

                    <ul className="space-y-3 text-gray-300">
                        <li className="flex gap-3">
                            <span className="text-orange-500 font-bold">1.</span>
                            Watch analytics for <em>when</em> viewers leave, not just <em>how many</em>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-orange-500 font-bold">2.</span>
                            Self-review with fresh eyes after 24 hours
                        </li>
                        <li className="flex gap-3">
                            <span className="text-orange-500 font-bold">3.</span>
                            Or: Upload to Shorta and get frame-by-frame feedback in 60 seconds
                        </li>
                    </ul>
                </section>

                {/* How Shorta Helps */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">How Shorta Diagnoses Your Low-View Shorts</h2>

                    <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-6 rounded-xl border border-orange-500/20">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold mb-3">Upload Your Short</h3>
                                <p className="text-gray-400 text-sm">Published or draft—Shorta doesn't need access to your YouTube account.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-3">Get Specific Timestamps</h3>
                                <p className="text-gray-400 text-sm">"Hook is unclear until second 3" not "improve your hook."</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-3">See the 4 Problem Areas</h3>
                                <p className="text-gray-400 text-sm">Hook, pacing, clarity, and retention risks—all analyzed.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-3">Get a Re-Filming Plan</h3>
                                <p className="text-gray-400 text-sm">Storyboard suggestions for exactly what to fix.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <SEOPageCTA
                    primaryText="Upload Your Short and Find Out Why Views Are Low"
                    primaryHref="/try"
                    secondaryText="See a Sample Diagnosis"
                    secondaryHref="/try"
                />

                {/* Internal Links */}
                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-analytics-tool', text: 'Get Full Analytics' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Focus on Hook Issues' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Deep Dive on Retention' },
                        { href: '/tools/grammarly-for-youtube-shorts', text: 'Pre-Publish Checking' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
