import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Shorts Script Optimization – Nail It Pre-Film',
    description: 'Stop filming Shorts that flop. Shorta analyzes your video draft and shows you what to rewrite—hook, pacing, clarity—before you waste time filming.',
    openGraph: {
        title: 'YouTube Shorts Script Optimization – Nail It Pre-Film',
        description: 'Stop filming Shorts that flop. Get script-level feedback before production.',
        url: 'https://shorta.ai/tools/youtube-shorts-script-optimization',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-shorts-script-optimization',
    },
};

export default function ScriptOptimizationPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'YouTube Shorts Script Optimization',
        description: 'Optimize your YouTube Shorts scripts before filming.',
        url: 'https://shorta.ai/tools/youtube-shorts-script-optimization',
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <SEOPageLayout>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    YouTube Shorts Script Optimization: Catch Problems Before You Film
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    Why spend hours filming a concept that's doomed from the start? Test your structure with a rough draft, get feedback, then film the real version.
                </p>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Most Shorts Fail at the Script Level</h2>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                            Bad hooks, weak pacing, and unclear messages are baked in <strong>before filming</strong>
                        </li>
                        <li className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                            Editing can only do so much—structure problems persist
                        </li>
                        <li className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                            If the script doesn't work, the Short won't work
                        </li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">The Expensive Mistake: Filming First, Fixing Later</h2>
                    <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl">
                        <p className="text-gray-300 mb-3">Hours spent filming a concept that was doomed from the start:</p>
                        <ul className="text-gray-400 space-y-2">
                            <li>• Editing can't fix a hook that's fundamentally unclear</li>
                            <li>• By the time you discover the problem, you've sunk the time</li>
                            <li>• Re-filming means starting over from scratch</li>
                        </ul>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How to Optimize Your Script Before You Film</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Film a Rough Draft (Don't Overthink It)</h3>
                                <p className="text-gray-400">Quick, low-effort version of your concept. Focus on structure, not production quality.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">Upload the Draft to Shorta</h3>
                                <p className="text-gray-400">Shorta analyzes even rough, unpolished footage. Hook, pacing, and clarity issues are visible in drafts.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">See What Needs to Change</h3>
                                <p className="text-gray-400">"Hook is too slow" or "Middle section drags—cut or restructure."</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Revise and Re-Film with Confidence</h3>
                                <p className="text-gray-400">Use the storyboard to guide your real production. No more wasted filming days.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">What Shorta Catches at the Script Level</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <FileText className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook Structure</h3>
                            <p className="text-gray-400 text-sm">Is the attention-grabbing element front-loaded?</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <FileText className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing Flow</h3>
                            <p className="text-gray-400 text-sm">Does the script maintain momentum or sag in the middle?</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <FileText className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Clarity of Premise</h3>
                            <p className="text-gray-400 text-sm">Will viewers understand the point immediately?</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <FileText className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Payoff Alignment</h3>
                            <p className="text-gray-400 text-sm">Does the ending deliver on the hook's promise?</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Old Workflow vs. Optimized Workflow</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                            <p className="text-sm text-red-400 mb-2 font-semibold">Old Approach</p>
                            <p className="text-gray-300">Script → Film → Edit → Publish → Flop → Learn</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                            <p className="text-sm text-green-400 mb-2 font-semibold">Shorta Approach</p>
                            <p className="text-gray-300">Script → Draft → Shorta → Revise → Film → Publish</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Upload Your Draft and Optimize Before Filming"
                    primaryHref="/try"
                    secondaryText="See How a Draft Gets Optimized"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Optimization' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Analyze Finished Shorts' },
                        { href: '/tools/grammarly-for-youtube-shorts', text: 'Pre-Publish Checking' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
