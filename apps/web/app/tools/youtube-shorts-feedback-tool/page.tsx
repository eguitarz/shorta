import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { MessageSquare, Zap, Check, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Shorts Feedback Tool – Get Expert Notes Fast',
    description: 'Get instant, producer-level feedback on your YouTube Shorts. Shorta spots hook, pacing, and clarity issues—so you can fix them before posting.',
    openGraph: {
        title: 'YouTube Shorts Feedback Tool – Get Expert Notes Fast',
        description: 'Get instant, producer-level feedback on your YouTube Shorts.',
        url: 'https://shorta.ai/tools/youtube-shorts-feedback-tool',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-shorts-feedback-tool',
    },
};

export default function FeedbackToolPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'YouTube Shorts Feedback Tool',
        description: 'Get instant, producer-level feedback on your YouTube Shorts.',
        url: 'https://shorta.ai/tools/youtube-shorts-feedback-tool',
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <SEOPageLayout>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    YouTube Shorts Feedback Tool: Like a Producer Reviewing Your Cut
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    Most creators post Shorts in a vacuum—no feedback before publishing. Shorta gives you producer-level notes before you hit publish.
                </p>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Creators Are Posting Blind</h2>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex gap-3"><span className="text-red-500">✗</span> No feedback loop means every Short is a gamble</li>
                        <li className="flex gap-3"><span className="text-red-500">✗</span> Friends say "looks great!" but miss critical issues</li>
                        <li className="flex gap-3"><span className="text-red-500">✗</span> You can't hire a producer for every 30-second video</li>
                        <li className="flex gap-3"><span className="text-red-500">✗</span> YouTube Studio only tells you something was wrong <em>after</em> the flop</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">What Real Feedback Looks Like</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <p className="text-gray-400 mb-4">A producer watching your rough cut wouldn't say "looks good." They'd say:</p>
                        <div className="space-y-3">
                            <div className="border-l-4 border-orange-500 pl-4">
                                <p className="text-gray-300">"Hook buries the lead—move the payoff to second 1"</p>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-4">
                                <p className="text-gray-300">"Pacing sags at 0:08—cut or add movement here"</p>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-4">
                                <p className="text-gray-300">"Transition at 0:14 is confusing—add text overlay"</p>
                            </div>
                        </div>
                        <p className="text-gray-300 mt-4">That's what Shorta gives you—without the hiring, scheduling, or cost.</p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How Shorta Gives You Feedback</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook Analysis</h3>
                            <p className="text-gray-400 text-sm">Is it grabbing attention in the first 1.5 seconds?</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <Clock className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing Notes</h3>
                            <p className="text-gray-400 text-sm">Are there slow spots that invite swiping?</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <MessageSquare className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Clarity Check</h3>
                            <p className="text-gray-400 text-sm">Will first-time viewers understand immediately?</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <Check className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Retention Risks</h3>
                            <p className="text-gray-400 text-sm">Where are viewers most likely to leave?</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Feedback vs. Guessing: The Difference</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left py-3 px-4 text-gray-400">Without Shorta</th>
                                    <th className="text-left py-3 px-4 text-orange-400">With Shorta</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">Film → Post → Hope</td>
                                    <td className="py-3 px-4">Film → Upload → Get Feedback → Fix → Post</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">Learn from failure (after 200 views)</td>
                                    <td className="py-3 px-4">Learn before 1 view</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Re-film based on gut feeling</td>
                                    <td className="py-3 px-4">Re-film based on specific notes</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Shorta's Feedback Hits Different</h2>
                    <ul className="space-y-2 text-gray-300">
                        <li className="flex gap-3"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Not generic ("make your hook stronger")</li>
                        <li className="flex gap-3"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Timestamped ("0:03: hook is unclear—here's why")</li>
                        <li className="flex gap-3"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Actionable (storyboard shows what to re-film)</li>
                        <li className="flex gap-3"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Fast (instant feedback, no scheduling)</li>
                    </ul>
                </section>

                <SEOPageCTA
                    primaryText="Get Feedback on Your Short—Free"
                    primaryHref="/try"
                    secondaryText="See What Shorta's Feedback Looks Like"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-analyzer', text: 'YouTube Shorts Analyzer' },
                        { href: '/tools/youtube-storyboard-generator', text: 'Storyboard Generator' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Analysis' },
                        { href: '/tools/youtube-shorts-script-generator', text: 'Shorts Script Generator' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
