import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { Check, TrendingDown, Clock, Eye } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Shorts Retention Analysis – Second-by-Second',
    description: "See exactly where viewers drop off in your YouTube Shorts. Shorta's retention analysis shows you the weak spots—and how to fix them before re-filming.",
    openGraph: {
        title: 'YouTube Shorts Retention Analysis – Second-by-Second',
        description: 'See exactly where viewers drop off in your YouTube Shorts. Get actionable fixes for retention issues.',
        url: 'https://shorta.ai/tools/youtube-shorts-retention-analysis',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-shorts-retention-analysis',
    },
};

export default function RetentionAnalysisPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'YouTube Shorts Retention Analysis',
        description: 'See exactly where viewers drop off in your YouTube Shorts.',
        url: 'https://shorta.ai/tools/youtube-shorts-retention-analysis',
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <SEOPageLayout>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    YouTube Shorts Retention Analysis: Find the Exact Second Viewers Leave
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    YouTube Studio tells you <em>that</em> viewers left. Shorta tells you <em>when</em> and <em>why</em>—with second-by-second breakdowns.
                </p>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Retention Is the Only Metric That Matters</h2>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-[#1a1a1a] p-4 rounded-xl text-center">
                            <Eye className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Views mean nothing if viewers leave in 2 seconds</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-4 rounded-xl text-center">
                            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Retention drives the algorithm: watch time = quality signal</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-4 rounded-xl text-center">
                            <TrendingDown className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">High retention → more impressions → exponential growth</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">The Problem: YouTube Doesn't Give You Real Retention Data</h2>
                    <p className="text-gray-400 mb-4">Long-form videos get detailed retention graphs. Shorts get almost nothing.</p>
                    <ul className="space-y-2 text-gray-300">
                        <li>• You know viewers left, but not <em>when</em> or <em>why</em></li>
                        <li>• No content-level analysis—just aggregate percentages</li>
                        <li>• Without this data, you're guessing at fixes</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How Shorta's Retention Analysis Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Upload Your Short</h3>
                                <p className="text-gray-400">Drag and drop your MP4 (under 60 seconds). Works for published or draft Shorts.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Frame-Level Retention Scoring</h3>
                                <p className="text-gray-400">Each second is analyzed for retention risk. Color-coded: green (strong), yellow (risk), red (drop-off).</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">See Why Viewers Leave</h3>
                                <p className="text-gray-400">Each flagged moment includes a specific reason: "0:07: Pacing slows—consider cutting."</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Use the Storyboard to Re-Film</h3>
                                <p className="text-gray-400">Shorta generates a revised storyboard based on retention issues.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Retention Analysis vs. Retention Guessing</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left py-3 px-4 text-gray-400">Traditional Approach</th>
                                    <th className="text-left py-3 px-4 text-orange-400">Shorta Retention Analysis</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">Watch your own video and guess</td>
                                    <td className="py-3 px-4">See a color-coded timeline with risk zones</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 px-4">"Something feels off around the middle"</td>
                                    <td className="py-3 px-4">"0:06–0:09 flagged for pacing issues"</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Re-film the whole thing</td>
                                    <td className="py-3 px-4">Re-film only the flagged sections</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Upload Your Short and See Your Retention Map"
                    primaryHref="/try"
                    secondaryText="View a Sample Retention Report"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Focus on Hook Analysis' },
                        { href: '/tools/youtube-shorts-script-optimization', text: 'Script Optimization' },
                        { href: '/tools/analyze-youtube-shorts', text: 'Full Shorts Analysis' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
