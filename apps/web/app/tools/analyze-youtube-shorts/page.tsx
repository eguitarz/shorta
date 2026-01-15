import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { BarChart3, Zap, MessageSquare, Target, Check } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Analyze YouTube Shorts – Hook, Retention & Clarity',
    description: 'Upload your YouTube Short and get a full breakdown: hook strength, retention risks, pacing issues, clarity problems. See exactly what to fix.',
    openGraph: {
        title: 'Analyze YouTube Shorts – Hook, Retention & Clarity',
        description: 'Upload your YouTube Short and get a complete analysis.',
        url: 'https://shorta.ai/tools/analyze-youtube-shorts',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/analyze-youtube-shorts',
    },
};

export default function AnalyzeYouTubeShortsPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Analyze YouTube Shorts',
        description: 'Upload your YouTube Short and get a full breakdown of hook, retention, pacing, and clarity.',
        url: 'https://shorta.ai/tools/analyze-youtube-shorts',
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <SEOPageLayout>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Analyze YouTube Shorts: Full Breakdown of Hook, Retention & Clarity
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    Get a comprehensive analysis of your Short—hook, pacing, clarity, and retention—all in one place. See exactly what's working and what needs fixing.
                </p>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Analysis Matters More Than Publishing</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <ul className="space-y-3 text-gray-300">
                            <li>• Every failed Short teaches you something—if you know what to look for</li>
                            <li>• Most creators don't analyze; they just publish and hope</li>
                            <li>• Systematic analysis is what separates creators who grow from those who stay stuck</li>
                        </ul>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">What a Real Shorts Analysis Looks Like</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook Analysis</h3>
                            <p className="text-gray-400 text-sm">Is the first 1-2 seconds doing its job? What type of hook are you using?</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-blue-500 mb-3" />
                            <h3 className="font-semibold mb-2">Retention Mapping</h3>
                            <p className="text-gray-400 text-sm">Where do viewers drop off and why? Color-coded timeline.</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-5 rounded-xl">
                            <MessageSquare className="w-6 h-6 text-green-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing Review</h3>
                            <p className="text-gray-400 text-sm">Are there slow spots or rushed moments mid-video?</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-5 rounded-xl">
                            <Target className="w-6 h-6 text-purple-500 mb-3" />
                            <h3 className="font-semibold mb-2">Clarity Check</h3>
                            <p className="text-gray-400 text-sm">Will new viewers understand immediately?</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How Shorta Analyzes Your Shorts</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Upload Your Short</h3>
                                <p className="text-gray-400">Drag and drop your MP4. Works on published, draft, or even rough test footage.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get a Comprehensive Analysis</h3>
                                <p className="text-gray-400">Hook score, retention timeline, pacing flags, and clarity notes—all in one view.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Read Timestamped Feedback</h3>
                                <p className="text-gray-400">"0:00–0:02: Hook takes too long. The interesting element should be first."</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Use the Storyboard to Fix Issues</h3>
                                <p className="text-gray-400">Get a re-filming plan with suggested scene reordering and hook alternatives.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Analyze Before or After Publishing</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2 text-green-400">Before Publishing</h3>
                            <p className="text-gray-400 text-sm">Catch and fix issues before going live. Don't waste views on fixable mistakes.</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2 text-blue-400">After Publishing</h3>
                            <p className="text-gray-400 text-sm">Understand why a Short flopped and learn for next time.</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">From Analysis to Action</h2>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            Most analysis tools stop at data; Shorta gives you a next step
                        </li>
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            Every flagged issue comes with a suggested fix
                        </li>
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            The storyboard turns insights into a re-filming plan
                        </li>
                    </ul>
                </section>

                <SEOPageCTA
                    primaryText="Upload Your Short and Get the Full Analysis"
                    primaryHref="/try"
                    secondaryText="See What a Full Analysis Looks Like"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Focus on Hooks' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Focus on Retention' },
                        { href: '/tools/youtube-shorts-script-optimization', text: 'Analyze Drafts' },
                        { href: '/tools/grammarly-for-youtube-shorts', text: 'The Grammarly for Shorts' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
