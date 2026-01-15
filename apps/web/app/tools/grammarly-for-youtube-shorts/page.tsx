import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { Check, FileEdit, Video, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Grammarly for YouTube Shorts – Fix Before You Post',
    description: "Shorta is like Grammarly for your Shorts. Get instant feedback on hooks, pacing, and clarity before you publish—so you don't waste views on fixable mistakes.",
    openGraph: {
        title: 'Grammarly for YouTube Shorts – Fix Before You Post',
        description: 'Shorta is like Grammarly for your Shorts. Get instant feedback on hooks, pacing, and clarity before you publish.',
        url: 'https://shorta.ai/tools/grammarly-for-youtube-shorts',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/grammarly-for-youtube-shorts',
    },
};

export default function GrammarlyForYouTubeShortsPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Grammarly for YouTube Shorts',
        description: 'Shorta is like Grammarly for your Shorts. Get instant feedback on hooks, pacing, and clarity before you publish.',
        url: 'https://shorta.ai/tools/grammarly-for-youtube-shorts',
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
                    The Grammarly for YouTube Shorts: Catch Mistakes Before You Post
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    Writers don't publish without spell-check. Why do creators post Shorts without feedback? Shorta catches hook, pacing, and clarity issues before you hit publish.
                </p>

                {/* Problem Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why You Need a "Spell-Check" for Your Shorts</h2>
                    <p className="text-gray-300 mb-6">
                        Shorts are unforgiving—one weak hook and viewers are gone. The difference between 1K and 100K views is often one <strong>fixable mistake</strong>.
                    </p>

                    <div className="bg-[#1a1a1a] p-6 rounded-xl mb-6">
                        <h3 className="font-semibold mb-4">What Grammarly Does for Writing:</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li className="flex gap-2"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Catches grammar mistakes</li>
                            <li className="flex gap-2"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Flags tone issues</li>
                            <li className="flex gap-2"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Improves clarity</li>
                            <li className="flex gap-2"><Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Suggests better phrasing</li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500/20 to-transparent p-6 rounded-xl border border-orange-500/30">
                        <h3 className="font-semibold mb-4 text-orange-400">What Shorta Does for Video:</h3>
                        <ul className="space-y-2 text-gray-300">
                            <li className="flex gap-2"><Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0" /> Catches weak hooks</li>
                            <li className="flex gap-2"><Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0" /> Flags pacing problems</li>
                            <li className="flex gap-2"><Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0" /> Improves message clarity</li>
                            <li className="flex gap-2"><Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0" /> Suggests re-filming fixes</li>
                        </ul>
                    </div>
                </section>

                {/* Comparison Table */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Posting Blind vs. Posting with Shorta</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Without Shorta</th>
                                    <th className="text-left py-3 px-4 text-orange-400 font-medium">With Shorta</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">Upload and hope</td>
                                    <td className="py-3 px-4">Upload, analyze, fix, then publish</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">Discover weak hook after 200 views</td>
                                    <td className="py-3 px-4">Catch weak hook before 1 view</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">Guess why retention dropped</td>
                                    <td className="py-3 px-4">Know exactly which second lost viewers</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Re-film based on intuition</td>
                                    <td className="py-3 px-4">Re-film based on storyboard</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* How It Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">The Pre-Publish Workflow That Saves Your Shorts</h2>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Film Your Short as Usual</h3>
                                <p className="text-gray-400">Use your normal filming and editing workflow.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">Upload to Shorta Before Publishing</h3>
                                <p className="text-gray-400">Think of this as running spell-check before hitting "send."</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Review the Feedback</h3>
                                <p className="text-gray-400">See hook, pacing, clarity, and retention risk analysis with specific timestamps.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Re-Film Problem Sections</h3>
                                <p className="text-gray-400">Use the storyboard suggestions to fix only what needs fixing.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">5</div>
                            <div>
                                <h3 className="font-semibold mb-1">Publish Confidently</h3>
                                <p className="text-gray-400">Know you've fixed the preventable mistakes before going live.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sample Feedback */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">What Shorta's Feedback Looks Like</h2>
                    <p className="text-gray-400 mb-6">Not generic advice—specific, timestamped notes:</p>

                    <div className="space-y-4">
                        <div className="bg-[#1a1a1a] p-4 rounded-lg border-l-4 border-orange-500">
                            <p className="text-sm text-gray-400 mb-1">0:00–0:02</p>
                            <p className="text-gray-200">"Hook buries the lead. The interesting element ($10K result) should be the first thing viewers hear, not second 5."</p>
                        </div>

                        <div className="bg-[#1a1a1a] p-4 rounded-lg border-l-4 border-yellow-500">
                            <p className="text-sm text-gray-400 mb-1">0:07–0:10</p>
                            <p className="text-gray-200">"Pacing lags here. Consider cutting the pause or adding a visual pattern interrupt."</p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <SEOPageCTA
                    primaryText="Run Your Pre-Publish Check—Free"
                    primaryHref="/try"
                    secondaryText="See What Shorta Catches"
                    secondaryHref="/try"
                />

                {/* Internal Links */}
                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-analytics-tool', text: 'Post-Publish Analytics' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Focus on Hook Analysis' },
                        { href: '/tools/youtube-shorts-script-optimization', text: 'Script Optimization' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
