import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { BarChart3, Zap, MessageSquare, Target, Eye, TrendingUp, Clock, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Long-Form Video Analyzer – AI Pacing & Retention Analysis',
    description: 'Analyze long YouTube videos for pacing issues, retention drops, and chapter-level engagement problems. Get timestamped AI feedback. Free to try, no login.',
    keywords: [
        'youtube long form video analyzer',
        'long form video analysis',
        'youtube video retention analyzer',
        'youtube pacing analysis',
        'youtube tutorial analyzer',
        'analyze long youtube video',
        'youtube video engagement analysis',
        'youtube chapter analysis',
        'improve youtube video retention',
    ],
    openGraph: {
        title: 'YouTube Long-Form Video Analyzer – AI Pacing & Retention Analysis',
        description: 'Chapter-level pacing and retention analysis for long YouTube videos. Find exactly where viewers stop watching and why.',
        url: 'https://shorta.ai/tools/youtube-long-form-video-analyzer',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-long-form-video-analyzer',
    },
};

export default function YouTubeLongFormVideoAnalyzerPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'YouTube Long-Form Video Analyzer',
        description: 'AI-powered analyzer for long YouTube videos. Get chapter-level pacing analysis, retention drop identification, and timestamped feedback for tutorials, vlogs, and long-form content.',
        url: 'https://shorta.ai/tools/youtube-long-form-video-analyzer',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free trial analysis — no login required',
        },
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'Can Shorta analyze long-form YouTube videos?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta analyzes YouTube videos of any length — from 60-second Shorts to hour-long tutorials. Long-form videos get chapter-level pacing analysis, section-by-section retention flags, and beat-by-beat feedback across the full runtime.',
                },
            },
            {
                '@type': 'Question',
                name: 'What makes long-form video analysis different from Shorts analysis?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Long-form videos have different retention patterns. Instead of just hook and ending, you need to maintain momentum across chapters, manage content density, and prevent mid-video drop-off. Shorta\'s long-form analysis tracks pacing and engagement at the chapter level, not just the beginning and end.',
                },
            },
            {
                '@type': 'Question',
                name: 'How long can videos be for analysis?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Shorta handles videos of any length. Longer videos use adaptive sampling that covers key moments across the full runtime, so you get comprehensive feedback without extremely long wait times.',
                },
            },
            {
                '@type': 'Question',
                name: 'What types of long-form videos does this work for?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Shorta works for any long-form YouTube content: tutorials, educational videos, vlogs, product reviews, interviews, documentaries, gaming content, and more. The AI adapts its analysis to the content type.',
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
                    YouTube Long-Form Video Analyzer: Chapter-Level Pacing & Retention
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    Long videos lose viewers chapter by chapter, not just in the first 30 seconds. Shorta maps your retention and pacing across the full runtime — so you know exactly where to cut, tighten, or restructure.
                </p>

                {/* The Long-Form Problem */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Long-Form Videos Need Different Analysis</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl mb-6">
                        <p className="text-gray-300 mb-4">
                            A short video either hooks viewers or it doesn't. A long video can hook viewers perfectly — and still lose them 8 minutes in when the pacing slows or the content loses momentum.
                        </p>
                        <p className="text-gray-300">
                            Long-form retention analysis requires looking at the full arc: the hook, mid-video momentum, chapter transitions, and whether the video delivers on its opening promise. Generic tools don't do this. Shorta does.
                        </p>
                    </div>
                </section>

                {/* What the Analyzer Does */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">What the Long-Form Analyzer Checks</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook & Opening Momentum</h3>
                            <p className="text-gray-400 text-sm">Does the first minute establish clear value and keep viewers watching? The analyzer scores your opening and flags slow intros.</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-blue-500 mb-3" />
                            <h3 className="font-semibold mb-2">Chapter-Level Retention</h3>
                            <p className="text-gray-400 text-sm">Track engagement across every section. The analyzer identifies which chapters cause the biggest drop-offs and why.</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-5 rounded-xl">
                            <Clock className="w-6 h-6 text-green-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing & Content Density</h3>
                            <p className="text-gray-400 text-sm">Identifies segments that drag — too much repetition, over-explanation, or filler content that makes viewers reach for the skip button.</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-5 rounded-xl">
                            <BookOpen className="w-6 h-6 text-purple-500 mb-3" />
                            <h3 className="font-semibold mb-2">Structure & Promise Delivery</h3>
                            <p className="text-gray-400 text-sm">Does the video deliver on what the title and intro promised? Mismatched expectations are a top cause of mid-video abandonment.</p>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 p-5 rounded-xl">
                            <MessageSquare className="w-6 h-6 text-cyan-500 mb-3" />
                            <h3 className="font-semibold mb-2">Timestamped Fixes</h3>
                            <p className="text-gray-400 text-sm">Every problem comes with a specific, timestamped suggestion — so you know exactly what to cut or restructure in the edit.</p>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 p-5 rounded-xl">
                            <Target className="w-6 h-6 text-yellow-500 mb-3" />
                            <h3 className="font-semibold mb-2">CTA & Closing Effectiveness</h3>
                            <p className="text-gray-400 text-sm">Is your outro worth watching? The analyzer checks whether your closing lands and whether your CTA is clear and compelling.</p>
                        </div>
                    </div>
                </section>

                {/* Use Cases */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Who It's For</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Tutorial & Educational Creators</h3>
                            <p className="text-gray-400 text-sm">Long tutorials lose viewers when explanations drag. The analyzer finds where you over-explain or lose momentum, so you can tighten your edit and keep students engaged.</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Vloggers & Lifestyle Creators</h3>
                            <p className="text-gray-400 text-sm">Story-driven content lives or dies on pacing. Shorta maps your retention beat-by-beat so you know exactly where the narrative loses momentum.</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Product Review Creators</h3>
                            <p className="text-gray-400 text-sm">Reviews need to move. The analyzer flags where you linger too long on features viewers don't care about and where you need to get to the verdict faster.</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Gaming & Entertainment Channels</h3>
                            <p className="text-gray-400 text-sm">Long gaming videos need constant energy. Shorta identifies the slow chapters and down moments that cause viewers to click away mid-video.</p>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How It Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Paste URL or Upload</h3>
                                <p className="text-gray-400">Drop a YouTube URL or upload your video file. Works for any video length.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">AI Analyzes the Full Runtime</h3>
                                <p className="text-gray-400">Using adaptive sampling, the analyzer covers the entire video — not just the first minute. Chapter-level pacing and retention are mapped across the full runtime.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Chapter-Level Feedback</h3>
                                <p className="text-gray-400">See a breakdown by section — which chapters hold attention, which ones drag, and exactly what to change in each.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Apply Fixes & Re-edit</h3>
                                <p className="text-gray-400">Use the timestamped suggestions to edit your video before publishing. No guessing — just specific cuts and changes.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Analyze Long-Form */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Analyze Long Videos Before Publishing?</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex gap-3">
                                <Eye className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Retention problems compound over time.</strong> A chapter that drags at 8 minutes means viewers don't make it to 12 minutes — and miss your CTA entirely.</span>
                            </li>
                            <li className="flex gap-3">
                                <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span><strong>YouTube rewards watch time.</strong> The algorithm promotes videos where viewers watch most of the runtime. Even small retention improvements can dramatically boost distribution.</span>
                            </li>
                            <li className="flex gap-3">
                                <Target className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Long videos are harder to fix after publishing.</strong> Unlike Shorts that can be remade quickly, long videos represent hours of work. Analyze before publishing to protect that investment.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Long-Form Video Analyzer FAQ</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Can Shorta analyze long-form YouTube videos?</h3>
                            <p className="text-gray-400">Yes. Shorta analyzes videos of any length — from 60-second Shorts to hour-long tutorials. Long-form videos get chapter-level pacing analysis, section-by-section retention flags, and beat-by-beat feedback across the full runtime.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">What makes long-form video analysis different?</h3>
                            <p className="text-gray-400">Long-form videos have different retention patterns. Instead of just hook and ending, you need to maintain momentum across chapters and prevent mid-video drop-off. Shorta's long-form analysis tracks pacing and engagement at the chapter level.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">How long can videos be?</h3>
                            <p className="text-gray-400">Shorta handles videos of any length. Longer videos use adaptive sampling that covers key moments across the full runtime, so you get comprehensive feedback without extremely long wait times.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">What types of long-form videos does this work for?</h3>
                            <p className="text-gray-400">Shorta works for any long-form YouTube content: tutorials, educational videos, vlogs, product reviews, interviews, documentaries, gaming content, and more.</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Try the Long-Form Video Analyzer Free"
                    primaryHref="/try"
                    secondaryText="See a Sample Analysis"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-video-analyzer', text: 'YouTube Video Analyzer' },
                        { href: '/tools/youtube-shorts-analyzer', text: 'YouTube Shorts Analyzer' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Retention Analysis' },
                        { href: '/tools/improve-youtube-shorts-retention', text: 'Improve Video Retention' },
                        { href: '/tools/youtube-storyboard-generator', text: 'Storyboard Generator' },
                        { href: '/tools/youtube-shorts-feedback-tool', text: 'Video Feedback Tool' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
