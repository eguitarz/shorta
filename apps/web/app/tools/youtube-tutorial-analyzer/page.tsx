import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { BarChart3, Zap, MessageSquare, Target, Eye, TrendingUp, Clock, BookOpen, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Tutorial Analyzer – AI Feedback for Educational Videos',
    description: 'Analyze your YouTube tutorials for pacing, clarity, and retention. Find where learners stop watching and how to keep them engaged. Free, no login required.',
    keywords: [
        'youtube tutorial analyzer',
        'youtube educational video analyzer',
        'analyze youtube tutorial',
        'tutorial video pacing analysis',
        'youtube how-to video analyzer',
        'educational content analysis',
        'youtube tutorial retention',
        'improve youtube tutorial',
        'online course video analyzer',
    ],
    openGraph: {
        title: 'YouTube Tutorial Analyzer – AI Feedback for Educational Videos',
        description: 'Beat-by-beat AI feedback on pacing, clarity, and retention for YouTube tutorials and educational content. Free, no login required.',
        url: 'https://shorta.ai/tools/youtube-tutorial-analyzer',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-tutorial-analyzer',
    },
};

export default function YouTubeTutorialAnalyzerPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'YouTube Tutorial Analyzer',
        description: 'AI-powered analyzer for YouTube tutorial and educational videos. Get pacing analysis, clarity feedback, and retention insights to keep learners engaged.',
        url: 'https://shorta.ai/tools/youtube-tutorial-analyzer',
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
                name: 'Can Shorta analyze YouTube tutorial videos?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta analyzes tutorial and educational YouTube videos of any length. It provides beat-by-beat feedback on pacing, clarity, and retention — identifying exactly where learners disengage and why.',
                },
            },
            {
                '@type': 'Question',
                name: 'What does tutorial video analysis check for?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'For tutorials, the analysis focuses on pacing (too fast or too slow), clarity (are explanations clear?), content density (overloading learners), transitions between concepts, and whether the video delivers on its promised learning outcome.',
                },
            },
            {
                '@type': 'Question',
                name: 'How long can my tutorial video be?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Shorta handles videos of any length. It uses adaptive sampling to cover key moments across the full runtime, so a 45-minute tutorial gets comprehensive feedback across all sections.',
                },
            },
            {
                '@type': 'Question',
                name: 'Does this work for how-to and explainer videos too?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. The analyzer works for tutorials, how-to videos, explainers, walkthroughs, coding videos, course previews, and any educational YouTube content. The AI adapts its analysis to the content type.',
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
                    YouTube Tutorial Analyzer: Keep Learners Watching
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    Tutorial viewers drop off the moment the pacing slows or the explanation gets muddy. Shorta finds exactly where your tutorial loses learners — and tells you how to fix it.
                </p>

                {/* The Tutorial Problem */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Tutorial Retention Is Different</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl mb-6">
                        <p className="text-gray-300 mb-4">
                            Entertainment viewers leave when they're bored. Tutorial viewers leave when they're confused or overwhelmed. That's a different problem — and it needs different analysis.
                        </p>
                        <p className="text-gray-300">
                            Shorta's tutorial analyzer looks at pacing, concept clarity, and information density across your entire video. It identifies segments where learners stop watching and explains the likely reason: too fast, too slow, too much at once, or a concept that wasn't clearly introduced.
                        </p>
                    </div>
                </section>

                {/* What the Analyzer Checks */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">What the Tutorial Analyzer Checks</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook & Value Promise</h3>
                            <p className="text-gray-400 text-sm">Does the opening clearly state what the viewer will learn and why it matters? The analyzer flags weak intros that fail to earn continued attention.</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
                            <Clock className="w-6 h-6 text-blue-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing & Density</h3>
                            <p className="text-gray-400 text-sm">Identifies segments that move too fast (viewers can't follow) or too slow (viewers get bored and skip). Finds the sweet spot for each section.</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-5 rounded-xl">
                            <BookOpen className="w-6 h-6 text-green-500 mb-3" />
                            <h3 className="font-semibold mb-2">Concept Clarity</h3>
                            <p className="text-gray-400 text-sm">Flags explanations that assume too much prior knowledge or skip important context. Catches spots where learners would get lost.</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-5 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-purple-500 mb-3" />
                            <h3 className="font-semibold mb-2">Section-by-Section Retention</h3>
                            <p className="text-gray-400 text-sm">Maps engagement across every chapter and concept block. Shows which sections hold attention and which cause learners to drop off.</p>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 p-5 rounded-xl">
                            <Target className="w-6 h-6 text-cyan-500 mb-3" />
                            <h3 className="font-semibold mb-2">Promise vs. Delivery</h3>
                            <p className="text-gray-400 text-sm">Checks whether the video actually delivers what the title and thumbnail promised. Mismatched expectations tank completion rates.</p>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 p-5 rounded-xl">
                            <MessageSquare className="w-6 h-6 text-yellow-500 mb-3" />
                            <h3 className="font-semibold mb-2">Actionable Timestamped Fixes</h3>
                            <p className="text-gray-400 text-sm">Every issue comes with a specific suggestion tied to a timestamp. You know exactly where to edit and what to change.</p>
                        </div>
                    </div>
                </section>

                {/* Who It's For */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Who It's For</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Software & Tech Educators</h3>
                            <p className="text-gray-400 text-sm">Coding tutorials, dev tools, and software walkthroughs. Find where viewers get lost in technical explanations and how to tighten your demos.</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Online Course Creators</h3>
                            <p className="text-gray-400 text-sm">Whether it's a free YouTube series or a paid course preview, understand how to structure lessons that learners actually complete.</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">How-To & DIY Creators</h3>
                            <p className="text-gray-400 text-sm">Step-by-step guides live or die by clarity. The analyzer finds steps that confuse viewers and moments where you need better visual support.</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl">
                            <h3 className="font-semibold mb-2">Finance, Health & Lifestyle Educators</h3>
                            <p className="text-gray-400 text-sm">Explains complex topics? The analyzer checks whether your explanations land and whether you're losing viewers before the most important part.</p>
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
                                <p className="text-gray-400">Drop a YouTube URL or upload your video file. Works for tutorials of any length.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">AI Analyzes Every Section</h3>
                                <p className="text-gray-400">Adaptive sampling covers the full runtime — pacing, clarity, concept flow, and retention are analyzed across the entire tutorial.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Beat-by-Beat Feedback</h3>
                                <p className="text-gray-400">See a breakdown by section — which concepts land clearly, which ones lose viewers, and what to change in each segment.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Edit with Confidence</h3>
                                <p className="text-gray-400">Apply the timestamped suggestions before publishing. No guessing — just specific edits that move the needle on retention.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Analyze Before Publishing */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why Analyze Your Tutorial Before Publishing?</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Completion rate drives algorithm ranking.</strong> Tutorials with high completion rates get promoted. Losing viewers at 40% means fewer recommendations.</span>
                            </li>
                            <li className="flex gap-3">
                                <Eye className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Confused viewers don't subscribe.</strong> A viewer who got lost mid-tutorial won't come back. Clarity problems hurt long-term channel growth.</span>
                            </li>
                            <li className="flex gap-3">
                                <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Tutorials take the most work to produce.</strong> Screen recording, editing, voiceover — tutorials are expensive to make. Analyze before publishing to protect that investment.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">YouTube Tutorial Analyzer FAQ</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Can Shorta analyze YouTube tutorial videos?</h3>
                            <p className="text-gray-400">Yes. Shorta analyzes tutorial and educational YouTube videos of any length. It provides beat-by-beat feedback on pacing, clarity, and retention — identifying exactly where learners disengage and why.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">What does tutorial video analysis check for?</h3>
                            <p className="text-gray-400">For tutorials, the analysis focuses on pacing, clarity, content density, transitions between concepts, and whether the video delivers on its promised learning outcome.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">How long can my tutorial video be?</h3>
                            <p className="text-gray-400">Shorta handles videos of any length. It uses adaptive sampling to cover key moments across the full runtime, so a 45-minute tutorial gets comprehensive feedback across all sections.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Does this work for how-to and explainer videos too?</h3>
                            <p className="text-gray-400">Yes. The analyzer works for tutorials, how-to videos, explainers, walkthroughs, coding videos, course previews, and any educational YouTube content.</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Try the Tutorial Analyzer Free"
                    primaryHref="/try"
                    secondaryText="See a Sample Analysis"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-video-analyzer', text: 'YouTube Video Analyzer' },
                        { href: '/tools/youtube-long-form-video-analyzer', text: 'Long-Form Video Analyzer' },
                        { href: '/tools/youtube-video-retention-analysis', text: 'Video Retention Analysis' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Shorts Retention Analysis' },
                        { href: '/tools/youtube-storyboard-generator', text: 'Storyboard Generator' },
                        { href: '/tools/improve-youtube-shorts-retention', text: 'Improve Video Retention' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
