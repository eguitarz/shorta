import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { Zap, MessageSquare, Eye } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Shorts Hook Analysis – Why Viewers Swipe',
    description: "Your first 2 seconds decide everything. Shorta's hook analysis tells you if viewers will stay or swipe—and shows you exactly how to fix it.",
    openGraph: {
        title: 'YouTube Shorts Hook Analysis – Why Viewers Swipe',
        description: 'Your first 2 seconds decide everything. Get specific feedback on your hooks.',
        url: 'https://shorta.ai/tools/youtube-shorts-hook-analysis',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-shorts-hook-analysis',
    },
};

export default function HookAnalysisPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'YouTube Shorts Hook Analysis',
        description: 'Analyze your YouTube Shorts hooks to understand why viewers swipe.',
        url: 'https://shorta.ai/tools/youtube-shorts-hook-analysis',
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <SEOPageLayout>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    YouTube Shorts Hook Analysis: Is Your First 2 Seconds Killing Your Views?
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    Viewers decide to stay or swipe in under 2 seconds. Even great Shorts die if the hook doesn't land. Get objective analysis of what's wrong.
                </p>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why the Hook Is the Most Important Part</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <ul className="space-y-3 text-gray-300">
                            <li>• Viewers decide to stay or swipe in <strong>under 2 seconds</strong></li>
                            <li>• A weak hook means the rest of your content never gets seen</li>
                            <li>• The algorithm measures early retention heavily</li>
                        </ul>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">The 3 Hook Types (And Which One Yours Is)</h2>

                    <div className="space-y-4">
                        <div className="border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <MessageSquare className="w-6 h-6 text-blue-500" />
                                <h3 className="text-lg font-semibold">1. Premise Hooks</h3>
                            </div>
                            <p className="text-gray-400 mb-2">"I tried X for 30 days—here's what happened"</p>
                            <p className="text-gray-300 text-sm"><strong>Works when:</strong> The premise is immediately intriguing</p>
                            <p className="text-gray-300 text-sm"><strong>Fails when:</strong> The premise buries the interesting part</p>
                        </div>

                        <div className="border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Eye className="w-6 h-6 text-green-500" />
                                <h3 className="text-lg font-semibold">2. Visual Hooks</h3>
                            </div>
                            <p className="text-gray-400 mb-2">Something visually arresting in the first frame</p>
                            <p className="text-gray-300 text-sm"><strong>Works when:</strong> Viewer immediately thinks "what is <em>that</em>?"</p>
                            <p className="text-gray-300 text-sm"><strong>Fails when:</strong> The visual is generic or expected</p>
                        </div>

                        <div className="border border-gray-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Zap className="w-6 h-6 text-orange-500" />
                                <h3 className="text-lg font-semibold">3. Conflict Hooks</h3>
                            </div>
                            <p className="text-gray-400 mb-2">Tension, disagreement, or surprise right away</p>
                            <p className="text-gray-300 text-sm"><strong>Works when:</strong> The stakes are clear and immediate</p>
                            <p className="text-gray-300 text-sm"><strong>Fails when:</strong> The conflict is too abstract or delayed</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why You Can't Analyze Your Own Hook Objectively</h2>
                    <ul className="space-y-2 text-gray-400">
                        <li>• You know what's coming—viewers don't</li>
                        <li>• Context curse: you understand your premise; they don't</li>
                        <li>• Watching it 50 times desensitizes you to the problems</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How Shorta Analyzes Your Hook</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Upload Your Short</h3>
                                <p className="text-gray-400">Published or draft—Shorta focuses on the first 0-3 seconds.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get a Hook Effectiveness Score</h3>
                                <p className="text-gray-400">Rated on clarity, intrigue, and timing. Identifies which hook type you're using.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">See Specific Feedback</h3>
                                <p className="text-gray-400">"0:00–0:01: Hook buries the lead. The interesting element appears at second 4."</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Hook Rewrite Suggestions</h3>
                                <p className="text-gray-400">2-3 alternative hook structures based on your content.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Hook Analysis in Action: Before and After</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                            <p className="text-sm text-red-400 mb-2">Before</p>
                            <p className="text-gray-300">"So today I want to talk about..." (2s of throat-clearing)</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                            <p className="text-sm text-green-400 mb-2">After (with Shorta)</p>
                            <p className="text-gray-300">"I lost $50K in 3 days. Here's how." (conflict + stakes in 1s)</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Upload Your Short and Analyze Your Hook"
                    primaryHref="/try"
                    secondaryText="See How Shorta Scores a Hook"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-analyzer', text: 'YouTube Shorts Analyzer' },
                        { href: '/tools/youtube-storyboard-generator', text: 'Storyboard Generator' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Retention Analysis' },
                        { href: '/tools/youtube-shorts-script-generator', text: 'Shorts Script Generator' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
