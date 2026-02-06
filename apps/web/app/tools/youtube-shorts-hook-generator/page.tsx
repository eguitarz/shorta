import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { Zap, BarChart3, LayoutList, Check, RefreshCw, Target } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Shorts Hook Generator – AI Hooks That Stop the Scroll',
    description: 'Free YouTube Shorts hook generator that creates scroll-stopping hooks for your videos. AI analyzes viral patterns and generates multiple hook options for any topic. No login required.',
    keywords: [
        'youtube shorts hook generator',
        'youtube shorts hook ideas',
        'hook generator for shorts',
        'youtube shorts first 3 seconds',
        'scroll stopping hooks',
        'youtube shorts hook examples',
        'ai hook generator youtube',
        'viral hooks youtube shorts',
    ],
    openGraph: {
        title: 'YouTube Shorts Hook Generator – AI Hooks That Stop the Scroll',
        description: 'Free AI hook generator for YouTube Shorts. Create scroll-stopping hooks based on viral patterns.',
        url: 'https://shorta.ai/tools/youtube-shorts-hook-generator',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-shorts-hook-generator',
    },
};

export default function YouTubeShortsHookGeneratorPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'YouTube Shorts Hook Generator',
        description: 'AI-powered hook generator for YouTube Shorts that creates scroll-stopping opening lines based on viral patterns and proven hook formulas.',
        url: 'https://shorta.ai/tools/youtube-shorts-hook-generator',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free hook generation included with analysis',
        },
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is a YouTube Shorts hook generator?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'A YouTube Shorts hook generator is an AI tool that creates compelling opening lines for the first 1-3 seconds of your Short. The hook is the most critical part of any Short — it determines whether viewers keep watching or swipe away. Shorta generates multiple hook options based on viral patterns.',
                },
            },
            {
                '@type': 'Question',
                name: 'Why are the first 3 seconds so important?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'YouTube\'s algorithm tracks whether viewers swipe away in the first few seconds. If most viewers leave early, the algorithm stops showing your Short to new people. A strong hook that stops the scroll is the single biggest factor in whether a Short goes viral or dies at 50 views.',
                },
            },
            {
                '@type': 'Question',
                name: 'How does the hook generator work?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Upload your Short or describe your video topic. Shorta\'s AI analyzes the content and generates multiple hook alternatives — each designed for a different hook type (question, bold claim, curiosity gap, pattern interrupt). You pick the best one for your style.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I test hooks on existing Shorts?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Upload an existing Short and the analyzer will score your current hook and generate better alternatives. You can see exactly how your hook compares to proven patterns and get specific suggestions for improvement.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is the hook generator free?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta includes hook analysis and generation in every free analysis. Upload your Short and get hook scoring plus alternative suggestions — no login or credit card required.',
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
                    YouTube Shorts Hook Generator: AI Hooks That Stop the Scroll
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    The first 1-3 seconds decide everything. The YouTube Shorts hook generator creates scroll-stopping hooks based on viral patterns — so viewers watch instead of swipe.
                </p>

                {/* Why Hooks Matter */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Your Hook Makes or Breaks the Short</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex gap-3">
                                <Zap className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <span><strong>70%+ intro retention is the target.</strong> If your first 3 seconds lose more than 30% of viewers, the algorithm buries your Short.</span>
                            </li>
                            <li className="flex gap-3">
                                <BarChart3 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Most hooks fail the same way.</strong> Slow intros, "Hey guys," unnecessary context — viewers are gone before you get to the point.</span>
                            </li>
                            <li className="flex gap-3">
                                <Target className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span><strong>The hook isn't the title.</strong> It's what viewers see and hear in the first 1-3 seconds of the video itself — visual + text + verbal, all at once.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Hook Types */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Hook Types the Generator Creates</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Bold Claim</h3>
                            <p className="text-gray-400 text-sm mb-2">Start with a surprising statement that makes viewers think "Wait, really?"</p>
                            <p className="text-orange-400 text-xs italic">"This one trick doubled my views overnight"</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Curiosity Gap</h3>
                            <p className="text-gray-400 text-sm mb-2">Open a loop that viewers need to watch to close.</p>
                            <p className="text-blue-400 text-xs italic">"I tested 50 hooks and only one type worked"</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Direct Question</h3>
                            <p className="text-gray-400 text-sm mb-2">Ask something the viewer already wonders about.</p>
                            <p className="text-green-400 text-xs italic">"Why do your Shorts die after 50 views?"</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Pattern Interrupt</h3>
                            <p className="text-gray-400 text-sm mb-2">Start mid-action or with something unexpected to break the scroll pattern.</p>
                            <p className="text-purple-400 text-xs italic">[Jump cut to result] "Here's what happened"</p>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How the Hook Generator Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Upload Your Short or Describe Your Topic</h3>
                                <p className="text-gray-400">The AI needs context — what's the Short about? Who's the audience? Upload a video or tell it your idea.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">AI Scores Your Current Hook</h3>
                                <p className="text-gray-400">If you uploaded a video, the analyzer grades your existing hook and explains what's working and what's not.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Multiple Hook Alternatives</h3>
                                <p className="text-gray-400">The generator creates several hook options — different types, different angles. Pick the one that fits your style.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Generate a Full Storyboard</h3>
                                <p className="text-gray-400">Approve a hook and generate a complete storyboard with the new opening — beat-by-beat, ready to film.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Analyze + Generate Loop */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Not Just Hooks — The Full Loop</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <LayoutList className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                <span className="text-gray-300"><strong>Analyze</strong> — score your current hook and identify issues</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <span className="text-gray-300"><strong>Generate</strong> — get multiple hook alternatives per Short</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <RefreshCw className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-gray-300"><strong>Rebuild</strong> — create a new storyboard with the improved hook baked in</span>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mt-4">Most hook tools give you a line of text. Shorta gives you a hook inside a complete filmable plan.</p>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">YouTube Shorts Hook Generator FAQ</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">What is a YouTube Shorts hook generator?</h3>
                            <p className="text-gray-400">A YouTube Shorts hook generator is an AI tool that creates compelling opening lines for the first 1-3 seconds of your Short. The hook is the most critical part of any Short — it determines whether viewers keep watching or swipe away. Shorta generates multiple hook options based on viral patterns.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Why are the first 3 seconds so important?</h3>
                            <p className="text-gray-400">YouTube's algorithm tracks whether viewers swipe away in the first few seconds. If most viewers leave early, the algorithm stops showing your Short to new people. A strong hook that stops the scroll is the single biggest factor in whether a Short goes viral or dies at 50 views.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">How does the hook generator work?</h3>
                            <p className="text-gray-400">Upload your Short or describe your video topic. Shorta's AI analyzes the content and generates multiple hook alternatives — each designed for a different hook type (question, bold claim, curiosity gap, pattern interrupt). You pick the best one for your style.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Can I test hooks on existing Shorts?</h3>
                            <p className="text-gray-400">Yes. Upload an existing Short and the analyzer will score your current hook and generate better alternatives. You can see exactly how your hook compares to proven patterns and get specific suggestions for improvement.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Is the hook generator free?</h3>
                            <p className="text-gray-400">Yes. Shorta includes hook analysis and generation in every free analysis. Upload your Short and get hook scoring plus alternative suggestions — no login or credit card required.</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Test Your Hook Free"
                    primaryHref="/try"
                    secondaryText="See a Hook Analysis Example"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-analyzer', text: 'YouTube Shorts Analyzer' },
                        { href: '/tools/youtube-storyboard-generator', text: 'Storyboard Generator' },
                        { href: '/tools/youtube-shorts-script-generator', text: 'Shorts Script Generator' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Analysis Deep Dive' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Retention Analysis' },
                        { href: '/tools/analyze-youtube-shorts', text: 'Analyze Your Shorts' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
