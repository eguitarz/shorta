import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { Sparkles, Check, X } from 'lucide-react';

export const metadata: Metadata = {
    title: 'AI Tool for YouTube Shorts – Analyze Hooks & Retention',
    description: 'Shorta is an AI that reviews your Shorts like a producer would. Get instant feedback on hooks, pacing, and retention—then fix issues before you post.',
    openGraph: {
        title: 'AI Tool for YouTube Shorts – Analyze Hooks & Retention',
        description: 'Shorta is an AI that reviews your Shorts like a producer would.',
        url: 'https://shorta.ai/tools/ai-tool-for-youtube-shorts',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/ai-tool-for-youtube-shorts',
    },
};

export default function AIToolPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Shorta - AI Tool for YouTube Shorts',
        applicationCategory: 'MultimediaApplication',
        description: 'AI-powered YouTube Shorts analysis tool for hooks, retention, and content optimization.',
        url: 'https://shorta.ai/tools/ai-tool-for-youtube-shorts',
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <SEOPageLayout>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    AI Tool for YouTube Shorts: Get Producer-Level Feedback Instantly
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    AI writes scripts, edits videos, designs thumbnails. But most AI doesn't analyze your <em>finished</em> content for quality. Shorta does.
                </p>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">How AI Is Changing the Shorts Game</h2>
                    <p className="text-gray-400 mb-4">AI tools are everywhere in content creation:</p>
                    <ul className="text-gray-300 space-y-2 mb-6">
                        <li>• Script AI writes your words</li>
                        <li>• Editing AI cuts your clips</li>
                        <li>• Thumbnail AI designs your covers</li>
                    </ul>
                    <p className="text-gray-300">
                        <strong>What's missing?</strong> AI that watches your finished Short and tells you what to fix.
                    </p>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">AI Tools That DON'T Help with Shorts Performance</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left py-3 px-4 text-gray-400">Tool Type</th>
                                    <th className="text-left py-3 px-4 text-gray-400">What It Does</th>
                                    <th className="text-left py-3 px-4 text-gray-400">What It Misses</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">Script AI</td>
                                    <td className="py-3 px-4">Writes scripts</td>
                                    <td className="py-3 px-4 text-red-400">Doesn't analyze final video</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">Editing AI</td>
                                    <td className="py-3 px-4">Cuts clips</td>
                                    <td className="py-3 px-4 text-red-400">No feedback on content quality</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">Thumbnail AI</td>
                                    <td className="py-3 px-4">Designs thumbnails</td>
                                    <td className="py-3 px-4 text-red-400">Doesn't help after the click</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">SEO tools</td>
                                    <td className="py-3 px-4">Optimizes metadata</td>
                                    <td className="py-3 px-4 text-red-400">Doesn't analyze video itself</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-gray-300 mt-4">
                        <strong>Shorta fills the gap:</strong> AI that analyzes your video content and gives you actionable feedback.
                    </p>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">What Shorta's AI Analyzes</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <Sparkles className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook Effectiveness</h3>
                            <p className="text-gray-400 text-sm">Does the first 2 seconds grab attention before viewers swipe?</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <Sparkles className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing Analysis</h3>
                            <p className="text-gray-400 text-sm">Are there slow or confusing moments mid-video?</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <Sparkles className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Clarity Check</h3>
                            <p className="text-gray-400 text-sm">Will first-time viewers understand immediately?</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <Sparkles className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Retention Prediction</h3>
                            <p className="text-gray-400 text-sm">Where are viewers most likely to swipe away?</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Shorta's AI Is Different</h2>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>It's not generating content—it's <strong>analyzing yours</strong></span>
                        </li>
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>It's not vague—it gives <strong>timestamped, specific notes</strong></span>
                        </li>
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>It's fast—<strong>instant feedback</strong> vs. waiting for flops</span>
                        </li>
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>It's actionable—<strong>storyboard tells you what to re-film</strong></span>
                        </li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Sample AI Feedback</h2>
                    <div className="space-y-4">
                        <div className="bg-[#1a1a1a] p-4 rounded-lg border-l-4 border-orange-500">
                            <p className="text-sm text-gray-400 mb-1">0:00–0:02</p>
                            <p className="text-gray-200">"Hook buries the interesting element. Front-load the tension ('I almost quit') before the context."</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-4 rounded-lg border-l-4 border-yellow-500">
                            <p className="text-sm text-gray-400 mb-1">0:06–0:09</p>
                            <p className="text-gray-200">"Pacing slows. Consider cutting the pause or adding a visual pattern interrupt."</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Upload Your Short and Get AI Feedback"
                    primaryHref="/try"
                    secondaryText="See How Shorta's AI Works"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-storyboard-generator', text: 'Storyboard Generator' },
                        { href: '/tools/youtube-shorts-script-generator', text: 'Shorts Script Generator' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Analysis' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Retention Analysis' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
