import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { TrendingUp, Clock, AlertCircle, Target } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Improve YouTube Shorts Retention – Stop the Swipe',
    description: 'Learn the real reasons viewers leave your Shorts—and how to fix them. Shorta shows you exactly what to change so viewers stay until the end.',
    openGraph: {
        title: 'Improve YouTube Shorts Retention – Stop the Swipe',
        description: 'Learn the real reasons viewers leave your Shorts—and how to fix them.',
        url: 'https://shorta.ai/tools/improve-youtube-shorts-retention',
        type: 'article',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/improve-youtube-shorts-retention',
    },
};

export default function ImproveRetentionPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'How to Improve YouTube Shorts Retention (What Actually Works)',
        description: 'Learn the real reasons viewers leave your Shorts—and how to fix them.',
        url: 'https://shorta.ai/tools/improve-youtube-shorts-retention',
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <SEOPageLayout>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    How to Improve YouTube Shorts Retention (What Actually Works)
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    10K impressions mean nothing if everyone swipes in 2 seconds. Here's how to actually fix retention—with data, not guesswork.
                </p>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Retention Matters More Than Views</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-[#1a1a1a] p-4 rounded-xl text-center">
                            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">High retention = more distribution</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-4 rounded-xl text-center">
                            <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Watch time signals quality to algorithm</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-4 rounded-xl text-center">
                            <Target className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Exponential view growth follows retention</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">The 4 Places Where Shorts Lose Viewers</h2>

                    <div className="space-y-6">
                        <div className="border-l-4 border-red-500 pl-6">
                            <h3 className="text-lg font-semibold mb-2">1. The First 2 Seconds (The Hook)</h3>
                            <p className="text-gray-400 mb-2">Decision point: stay or swipe. Most creators waste these on intro/context.</p>
                            <p className="text-gray-300 text-sm"><strong>Fix:</strong> Lead with conflict, intrigue, or a visual that stops the scroll.</p>
                        </div>

                        <div className="border-l-4 border-yellow-500 pl-6">
                            <h3 className="text-lg font-semibold mb-2">2. The Middle (Seconds 5–30)</h3>
                            <p className="text-gray-400 mb-2">Pacing drops here. Filler, slow transitions, or rambling.</p>
                            <p className="text-gray-300 text-sm"><strong>Fix:</strong> Tighten edits, use pattern interrupts, cut anything that doesn't advance the point.</p>
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-lg font-semibold mb-2">3. Unclear Moments</h3>
                            <p className="text-gray-400 mb-2">Confusion during transitions or when assuming context.</p>
                            <p className="text-gray-300 text-sm"><strong>Fix:</strong> State the obvious, use text overlays, show don't tell.</p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-6">
                            <h3 className="text-lg font-semibold mb-2">4. Weak Payoff</h3>
                            <p className="text-gray-400 mb-2">Ending doesn't deliver. Low engagement follows.</p>
                            <p className="text-gray-300 text-sm"><strong>Fix:</strong> Make sure the finale matches (or exceeds) the hook's promise.</p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">The Wrong Way to Improve Retention</h2>
                    <ul className="space-y-2 text-gray-400">
                        <li className="flex gap-2"><AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> Guessing at what's wrong and re-filming the whole thing</li>
                        <li className="flex gap-2"><AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> Applying generic tips that don't match your content style</li>
                        <li className="flex gap-2"><AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> Watching your own Short 50 times hoping to spot the issue</li>
                    </ul>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Retention Improvement Workflow with Shorta</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <p className="text-gray-300">Upload your Short to Shorta (published or draft)</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <p className="text-gray-300">Review the retention timeline: green (strong), yellow (risk), red (drop-off)</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <p className="text-gray-300">Read specific feedback for each flagged moment</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <p className="text-gray-300">Use the storyboard to re-film only the problem sections</p>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">5</div>
                            <p className="text-gray-300">Re-upload and verify improvement</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Upload Your Short and See What to Fix"
                    primaryHref="/try"
                    secondaryText="See an Example Retention Report"
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
