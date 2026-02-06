import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { PenTool, Zap, LayoutList, Target, Check, Sparkles, Clock, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Shorts Script Generator – AI Scripts Built for Retention',
    description: 'Free YouTube Shorts script generator that creates retention-optimized scripts with hooks, pacing, and structure. AI-powered scripts based on viral patterns. No login required.',
    keywords: [
        'youtube shorts script generator',
        'youtube short script generator',
        'shorts script generator',
        'ai script generator youtube shorts',
        'youtube shorts script writer',
        'short form video script generator',
        'youtube shorts script template',
        'ai script generator for shorts',
    ],
    openGraph: {
        title: 'YouTube Shorts Script Generator – AI Scripts Built for Retention',
        description: 'Free AI script generator for YouTube Shorts. Creates retention-optimized scripts with hooks, pacing, and beat-by-beat structure.',
        url: 'https://shorta.ai/tools/youtube-shorts-script-generator',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-shorts-script-generator',
    },
};

export default function YouTubeShortsScriptGeneratorPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'YouTube Shorts Script Generator',
        description: 'AI-powered YouTube Shorts script generator that creates retention-optimized scripts with hooks, beat-by-beat structure, pacing, and filming direction.',
        url: 'https://shorta.ai/tools/youtube-shorts-script-generator',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free script generation — no login required',
        },
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is a YouTube Shorts script generator?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'A YouTube Shorts script generator is an AI tool that creates structured scripts specifically for short-form video. Unlike generic script generators, Shorta creates beat-by-beat production plans with hooks, pacing cues, and director notes optimized for YouTube Shorts retention.',
                },
            },
            {
                '@type': 'Question',
                name: 'How is this different from ChatGPT for scripts?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'ChatGPT writes generic scripts from old training data. Shorta\'s script generator analyzes what\'s working on YouTube right now and creates scripts structured for retention — with timed beats, hook options, and pacing designed for Shorts. It\'s the difference between a generic paragraph and a filmable production plan.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is the YouTube Shorts script generator free?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta offers free script generation with no login and no credit card required. Describe your video idea and get a complete script with hooks, beats, and production notes.',
                },
            },
            {
                '@type': 'Question',
                name: 'What formats does the script generator support?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The generator supports all YouTube Shorts formats: talking head, tutorial, vlog, b-roll, and more. It creates scripts for 15s, 30s, 60s, and 90s lengths, each with pacing optimized for that duration.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I improve a script for an existing Short?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Upload an existing YouTube Short to the analyzer, get feedback on what\'s working and what isn\'t, then generate an improved script with the issues fixed. This analysis-to-script loop is what separates Shorta from generic script generators.',
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
                    YouTube Shorts Script Generator: AI Scripts Built for Retention
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    The YouTube Shorts script generator that creates filmable, retention-optimized scripts — not generic text. Get hooks, beat-by-beat structure, and pacing built for the Shorts algorithm.
                </p>

                {/* The Problem */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Most YouTube Shorts Scripts Fail</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <ul className="space-y-3 text-gray-300">
                            <li>• Generic script generators write for blog posts, not for 60-second videos with 2-second attention windows</li>
                            <li>• Scripts without timing and pacing lead to rambling, rushed, or dead-air Shorts</li>
                            <li>• A wall of text isn't a production plan — you still don't know what to film</li>
                            <li>• Copy-pasting ChatGPT output sounds robotic and kills authenticity</li>
                        </ul>
                    </div>
                </section>

                {/* What You Get */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">What the Shorts Script Generator Creates</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Scroll-Stopping Hooks</h3>
                            <p className="text-gray-400 text-sm">Multiple hook options for the first 1-2 seconds. Each one designed to stop the scroll for your specific content type.</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
                            <LayoutList className="w-6 h-6 text-blue-500 mb-3" />
                            <h3 className="font-semibold mb-2">Beat-by-Beat Structure</h3>
                            <p className="text-gray-400 text-sm">Your script broken into timed beats. Each beat has what to say, what to show, and how long it should take.</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-5 rounded-xl">
                            <Clock className="w-6 h-6 text-green-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing That Holds Attention</h3>
                            <p className="text-gray-400 text-sm">Every beat is timed so your Short doesn't ramble or rush. Hit the right energy at the right moment.</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-5 rounded-xl">
                            <PenTool className="w-6 h-6 text-purple-500 mb-3" />
                            <h3 className="font-semibold mb-2">Director Notes</h3>
                            <p className="text-gray-400 text-sm">Camera angles, energy cues, and visual direction for each beat. A complete filming plan, not just words.</p>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How the Script Generator Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Tell It Your Idea</h3>
                                <p className="text-gray-400">Topic, format (talking head, tutorial, vlog), target length, and key points. The AI asks follow-up questions to nail the direction.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">AI Generates the Script</h3>
                                <p className="text-gray-400">You get a beat-by-beat script with hooks, content structure, pacing notes, and a call-to-action — all timed for your target length.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Review Director Notes</h3>
                                <p className="text-gray-400">Each beat includes how to deliver it: camera setup, energy level, visual cues, and transitions.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Film and Iterate</h3>
                                <p className="text-gray-400">After publishing, run the Short through the analyzer. See what worked, what didn't, and generate an improved script for next time.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Comparison */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Shorta vs. Generic Script Generators</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="py-3 pr-4 text-gray-400 font-medium">Feature</th>
                                    <th className="py-3 px-4 text-orange-500 font-medium">Shorta</th>
                                    <th className="py-3 pl-4 text-gray-400 font-medium">ChatGPT / Others</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 pr-4">Shorts-specific structure</td>
                                    <td className="py-3 px-4 text-green-400">Built for Shorts</td>
                                    <td className="py-3 pl-4 text-gray-500">Generic format</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 pr-4">Beat timing</td>
                                    <td className="py-3 px-4 text-green-400">Every beat timed</td>
                                    <td className="py-3 pl-4 text-gray-500">No timing</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 pr-4">Hook optimization</td>
                                    <td className="py-3 px-4 text-green-400">Multiple hook options</td>
                                    <td className="py-3 pl-4 text-gray-500">Single intro</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 pr-4">Director notes</td>
                                    <td className="py-3 px-4 text-green-400">Camera, energy, visuals</td>
                                    <td className="py-3 pl-4 text-gray-500">Text only</td>
                                </tr>
                                <tr>
                                    <td className="py-3 pr-4">Analyze → improve loop</td>
                                    <td className="py-3 px-4 text-green-400">Built-in analyzer</td>
                                    <td className="py-3 pl-4 text-gray-500">Not available</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* The Loop */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">The Script → Film → Analyze → Improve Loop</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                <span className="text-gray-300"><strong>Generate</strong> a script with hooks, structure, and pacing</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <PenTool className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <span className="text-gray-300"><strong>Film</strong> using the beat-by-beat production plan</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-gray-300"><strong>Analyze</strong> the published Short for retention and hook performance</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Target className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                <span className="text-gray-300"><strong>Improve</strong> — generate a better script with issues fixed</span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mt-4">Most tools stop at generation. Shorta closes the loop.</p>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">YouTube Shorts Script Generator FAQ</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">What is a YouTube Shorts script generator?</h3>
                            <p className="text-gray-400">A YouTube Shorts script generator is an AI tool that creates structured scripts specifically for short-form video. Unlike generic script generators, Shorta creates beat-by-beat production plans with hooks, pacing cues, and director notes optimized for YouTube Shorts retention.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">How is this different from ChatGPT for scripts?</h3>
                            <p className="text-gray-400">ChatGPT writes generic scripts from old training data. Shorta's script generator analyzes what's working on YouTube right now and creates scripts structured for retention — with timed beats, hook options, and pacing designed for Shorts. It's the difference between a generic paragraph and a filmable production plan.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Is the YouTube Shorts script generator free?</h3>
                            <p className="text-gray-400">Yes. Shorta offers free script generation with no login and no credit card required. Describe your video idea and get a complete script with hooks, beats, and production notes.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">What formats does the script generator support?</h3>
                            <p className="text-gray-400">The generator supports all YouTube Shorts formats: talking head, tutorial, vlog, b-roll, and more. It creates scripts for 15s, 30s, 60s, and 90s lengths, each with pacing optimized for that duration.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Can I improve a script for an existing Short?</h3>
                            <p className="text-gray-400">Yes. Upload an existing YouTube Short to the analyzer, get feedback on what's working and what isn't, then generate an improved script with the issues fixed. This analysis-to-script loop is what separates Shorta from generic script generators.</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Generate Your First Shorts Script Free"
                    primaryHref="/try"
                    secondaryText="See a Sample Script"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-storyboard-generator', text: 'Storyboard Generator' },
                        { href: '/tools/youtube-shorts-analyzer', text: 'YouTube Shorts Analyzer' },
                        { href: '/tools/youtube-shorts-script-optimization', text: 'Script Optimization' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Analysis' },
                        { href: '/tools/analyze-youtube-shorts', text: 'Analyze Your Shorts' },
                        { href: '/tools/ai-tool-for-youtube-shorts', text: 'AI Tool for Shorts' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
