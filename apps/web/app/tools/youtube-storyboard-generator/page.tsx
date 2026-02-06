import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { Film, Zap, LayoutList, Target, Check, Sparkles, ArrowRight, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Storyboard Generator – AI Storyboards for Shorts & Videos',
    description: 'Free YouTube storyboard generator that creates beat-by-beat production plans for Shorts. AI builds your hook, structure, pacing, and CTA — ready to film. No login required.',
    keywords: [
        'youtube storyboard generator',
        'youtube shorts storyboard generator',
        'ai storyboard generator youtube',
        'video storyboard generator',
        'storyboard generator for youtube shorts',
        'youtube video storyboard',
        'ai storyboard maker',
        'short form video storyboard',
    ],
    openGraph: {
        title: 'YouTube Storyboard Generator – AI Storyboards for Shorts & Videos',
        description: 'Free AI storyboard generator that creates beat-by-beat production plans for YouTube Shorts. Ready to film in minutes.',
        url: 'https://shorta.ai/tools/youtube-storyboard-generator',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-storyboard-generator',
    },
};

export default function YouTubeStoryboardGeneratorPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'YouTube Storyboard Generator',
        description: 'AI-powered YouTube storyboard generator that creates beat-by-beat production plans with hooks, pacing, and structure for Shorts and short-form videos.',
        url: 'https://shorta.ai/tools/youtube-storyboard-generator',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free storyboard generation — no login required',
        },
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is a YouTube storyboard generator?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'A YouTube storyboard generator is a tool that creates structured, beat-by-beat production plans for your videos. Instead of a vague script, you get a filmable plan with hook, content beats, pacing notes, and a call-to-action — each section timed and described so you know exactly what to shoot.',
                },
            },
            {
                '@type': 'Question',
                name: 'How is a storyboard different from a script?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'A script tells you what to say. A storyboard tells you what to shoot. Shorta\'s YouTube storyboard generator creates production-ready plans that include camera direction, pacing cues, visual notes, and beat timing — not just dialogue. It\'s a filming blueprint, not a wall of text.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I generate storyboards for YouTube Shorts?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta is built specifically for short-form video. The storyboard generator creates plans optimized for 15s, 30s, 60s, and 90s YouTube Shorts with attention to hook timing, retention pacing, and the compressed structure that Shorts demand.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is the YouTube storyboard generator free?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta offers free storyboard generation with no login required. Describe your video idea and get a complete, filmable storyboard with beats, pacing, and production notes.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I generate a storyboard from an existing video?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta can analyze an existing YouTube Short and generate an improved storyboard based on what worked and what didn\'t. The analyzer identifies retention drops and hook issues, then the storyboard generator creates a better version with those problems fixed.',
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
                    YouTube Storyboard Generator: AI-Powered Production Plans for Shorts
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    The YouTube storyboard generator that turns your idea into a filmable plan. Get beat-by-beat structure with hooks, pacing, and camera direction — ready to shoot in minutes.
                </p>

                {/* What You Get */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">What the Storyboard Generator Creates</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook Beat</h3>
                            <p className="text-gray-400 text-sm">The first 1-2 seconds that stop the scroll. The generator creates multiple hook options optimized for your content type.</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
                            <LayoutList className="w-6 h-6 text-blue-500 mb-3" />
                            <h3 className="font-semibold mb-2">Content Beats</h3>
                            <p className="text-gray-400 text-sm">Each section of your video, timed and described. Know exactly what to say, show, and when to transition.</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-5 rounded-xl">
                            <Clock className="w-6 h-6 text-green-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing & Timing</h3>
                            <p className="text-gray-400 text-sm">Each beat has a timestamp so your Short hits the right length. No more rambling or rushing through content.</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-5 rounded-xl">
                            <Film className="w-6 h-6 text-purple-500 mb-3" />
                            <h3 className="font-semibold mb-2">Director Notes</h3>
                            <p className="text-gray-400 text-sm">Camera angles, energy level, visual cues, and delivery notes for each beat. A filming blueprint, not just words on a page.</p>
                        </div>
                    </div>
                </section>

                {/* Storyboard vs Script */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why a Storyboard Beats a Script</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold mb-3 text-gray-500">Typical Script Generator</h3>
                                <ul className="space-y-2 text-gray-500 text-sm">
                                    <li>- Wall of text to memorize</li>
                                    <li>- No timing or pacing guidance</li>
                                    <li>- Generic structure</li>
                                    <li>- No visual direction</li>
                                    <li>- You figure out the rest</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-3 text-orange-400">Shorta Storyboard Generator</h3>
                                <ul className="space-y-2 text-gray-300 text-sm">
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Beat-by-beat production plan</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Timed sections with pacing cues</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Structure based on viral patterns</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Camera direction and energy notes</li>
                                    <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Ready to film immediately</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How the YouTube Storyboard Generator Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Describe Your Video Idea</h3>
                                <p className="text-gray-400">Tell the AI your topic, format, target length, and audience. It works with any Shorts format — talking head, tutorial, vlog, or b-roll.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">AI Builds Your Storyboard</h3>
                                <p className="text-gray-400">The generator creates a beat-by-beat plan with hook options, content structure, pacing, and a CTA — all timed to your target length.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Director-Level Notes</h3>
                                <p className="text-gray-400">Each beat includes filming instructions: camera angles, energy level, visual cues, and delivery guidance. Like having a director in your pocket.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Film with Confidence</h3>
                                <p className="text-gray-400">No more staring at a blank camera. Every second of your Short is planned. Hit record and follow the beats.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Two Ways to Generate */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Two Ways to Generate Storyboards</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <Sparkles className="w-6 h-6 text-orange-400 mb-3" />
                            <h3 className="font-semibold mb-2 text-orange-400">From Scratch</h3>
                            <p className="text-gray-400 text-sm">Describe your idea and the AI creates a complete storyboard. Great for planning new content before filming.</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <Target className="w-6 h-6 text-blue-400 mb-3" />
                            <h3 className="font-semibold mb-2 text-blue-400">From Analysis</h3>
                            <p className="text-gray-400 text-sm">Upload an existing Short, get it analyzed, then generate an improved storyboard with issues fixed. Great for iterating on published content.</p>
                        </div>
                    </div>
                </section>

                {/* Who It's For */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Who Uses the YouTube Storyboard Generator</h2>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span><strong>Solo creators</strong> who want to stop winging it and start filming with a plan</span>
                        </li>
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span><strong>Creators stuck in a rut</strong> who keep getting low views and want structured improvement</span>
                        </li>
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span><strong>Teams</strong> who need to hand off a clear production plan to editors or talent</span>
                        </li>
                        <li className="flex gap-3 text-gray-300">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span><strong>New YouTubers</strong> who don't know how to structure a Short for retention</span>
                        </li>
                    </ul>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">YouTube Storyboard Generator FAQ</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">What is a YouTube storyboard generator?</h3>
                            <p className="text-gray-400">A YouTube storyboard generator is a tool that creates structured, beat-by-beat production plans for your videos. Instead of a vague script, you get a filmable plan with hook, content beats, pacing notes, and a call-to-action — each section timed and described so you know exactly what to shoot.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">How is a storyboard different from a script?</h3>
                            <p className="text-gray-400">A script tells you what to say. A storyboard tells you what to shoot. Shorta's storyboard generator creates production-ready plans that include camera direction, pacing cues, visual notes, and beat timing — not just dialogue. It's a filming blueprint, not a wall of text.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Can I generate storyboards for YouTube Shorts?</h3>
                            <p className="text-gray-400">Yes. Shorta is built specifically for short-form video. The storyboard generator creates plans optimized for 15s, 30s, 60s, and 90s YouTube Shorts with attention to hook timing, retention pacing, and the compressed structure that Shorts demand.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Is the YouTube storyboard generator free?</h3>
                            <p className="text-gray-400">Yes. Shorta offers free storyboard generation with no login required. Describe your video idea and get a complete, filmable storyboard with beats, pacing, and production notes.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Can I generate a storyboard from an existing video?</h3>
                            <p className="text-gray-400">Yes. Shorta can analyze an existing YouTube Short and generate an improved storyboard based on what worked and what didn't. The analyzer identifies retention drops and hook issues, then the storyboard generator creates a better version with those problems fixed.</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Generate Your First Storyboard Free"
                    primaryHref="/try"
                    secondaryText="See a Sample Storyboard"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-analyzer', text: 'YouTube Shorts Analyzer' },
                        { href: '/tools/youtube-shorts-script-optimization', text: 'Script Optimization' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Analysis' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Retention Analysis' },
                        { href: '/tools/ai-tool-for-youtube-shorts', text: 'AI Tool for Shorts' },
                        { href: '/tools/youtube-shorts-script-generator', text: 'Shorts Script Generator' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
