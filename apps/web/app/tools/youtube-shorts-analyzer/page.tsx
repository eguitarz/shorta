import { Metadata } from 'next';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOPageCTA } from '@/components/seo/SEOPageCTA';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { BarChart3, Zap, MessageSquare, Target, Check, ArrowRight, Eye, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Shorts Analyzer – AI-Powered Shorts Analysis Tool',
    description: 'Free YouTube Shorts analyzer that breaks down your video beat-by-beat. Get hook scores, retention analysis, pacing feedback, and actionable fixes. No login required.',
    keywords: [
        'youtube shorts analyzer',
        'youtube short analyzer',
        'shorts analyzer',
        'youtube shorts analysis tool',
        'analyze youtube shorts',
        'youtube shorts feedback',
        'shorts retention analyzer',
        'youtube shorts hook analyzer',
    ],
    openGraph: {
        title: 'YouTube Shorts Analyzer – AI-Powered Shorts Analysis Tool',
        description: 'Free YouTube Shorts analyzer with beat-by-beat breakdown. Hook scores, retention analysis, and actionable fixes.',
        url: 'https://shorta.ai/tools/youtube-shorts-analyzer',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-shorts-analyzer',
    },
};

export default function YouTubeShortsAnalyzerPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'YouTube Shorts Analyzer',
        description: 'AI-powered YouTube Shorts analyzer that provides beat-by-beat feedback on hook performance, retention, pacing, and content clarity.',
        url: 'https://shorta.ai/tools/youtube-shorts-analyzer',
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
                name: 'What is a YouTube Shorts analyzer?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'A YouTube Shorts analyzer is a tool that evaluates your short-form video content to identify issues with hooks, retention, pacing, and clarity. Shorta\'s analyzer uses AI to break down each beat of your Short and give specific, actionable feedback on what to fix.',
                },
            },
            {
                '@type': 'Question',
                name: 'How does the YouTube Shorts analyzer work?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Paste a YouTube Shorts URL or upload your video file. The analyzer processes it through AI to score your hook (first 1-2 seconds), map retention drops, flag pacing issues, and check content clarity. You get a beat-by-beat breakdown with timestamped suggestions.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is the YouTube Shorts analyzer free?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Shorta offers a free trial analysis with no login and no credit card required. Upload your Short and get a complete AI analysis including hook score, retention timeline, and actionable fixes.',
                },
            },
            {
                '@type': 'Question',
                name: 'What does the Shorts analyzer check?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The analyzer checks four key areas: Hook performance (are the first 1-2 seconds compelling?), Retention (where do viewers drop off?), Pacing (are there slow or rushed sections?), and Clarity (will new viewers understand immediately?). Each issue comes with a specific fix.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I analyze Shorts before publishing?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. You can upload draft footage or rough cuts before publishing. The analyzer works on any video file, not just published Shorts. This lets you catch and fix problems before wasting views on fixable mistakes.',
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
                    YouTube Shorts Analyzer: AI-Powered Beat-by-Beat Analysis
                </h1>
                <p className="text-xl text-gray-400 mb-12">
                    The YouTube Shorts analyzer that shows you exactly why viewers swipe away. Get hook scores, retention breakdowns, and timestamped fixes — free, no login required.
                </p>

                {/* What the Analyzer Does */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">What the YouTube Shorts Analyzer Checks</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 p-5 rounded-xl">
                            <Zap className="w-6 h-6 text-orange-500 mb-3" />
                            <h3 className="font-semibold mb-2">Hook Score</h3>
                            <p className="text-gray-400 text-sm">Are the first 1-2 seconds stopping the scroll? The analyzer scores your hook and suggests stronger alternatives.</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 p-5 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-blue-500 mb-3" />
                            <h3 className="font-semibold mb-2">Retention Analysis</h3>
                            <p className="text-gray-400 text-sm">See where viewers drop off with a color-coded retention timeline. Every drop point gets a specific explanation.</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-5 rounded-xl">
                            <MessageSquare className="w-6 h-6 text-green-500 mb-3" />
                            <h3 className="font-semibold mb-2">Pacing Feedback</h3>
                            <p className="text-gray-400 text-sm">The analyzer flags slow spots, rushed transitions, and dead air that kills viewer attention.</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-5 rounded-xl">
                            <Target className="w-6 h-6 text-purple-500 mb-3" />
                            <h3 className="font-semibold mb-2">Clarity Check</h3>
                            <p className="text-gray-400 text-sm">Will a new viewer understand your Short immediately? The analyzer catches confusing moments.</p>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How the Shorts Analyzer Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Paste URL or Upload Video</h3>
                                <p className="text-gray-400">Works with any YouTube Short URL or video file. Drafts and rough cuts work too.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">AI Breaks Down Every Beat</h3>
                                <p className="text-gray-400">The analyzer segments your Short into beats and evaluates each one for hook, retention, pacing, and clarity.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Get Timestamped Feedback</h3>
                                <p className="text-gray-400">"0:00-0:02: Hook is too slow. Lead with the result, not the setup." — specific, actionable notes for every issue.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <div>
                                <h3 className="font-semibold mb-1">Generate a Fix Plan</h3>
                                <p className="text-gray-400">Approve fixes and generate a re-filming storyboard with scene reordering and hook alternatives.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Use a Shorts Analyzer */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Why You Need a YouTube Shorts Analyzer</h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl">
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex gap-3">
                                <Eye className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Most Shorts fail in the first 2 seconds.</strong> The analyzer scores your hook and shows if it's strong enough to stop the scroll.</span>
                            </li>
                            <li className="flex gap-3">
                                <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span><strong>YouTube's algorithm rewards retention.</strong> The analyzer maps exactly where viewers drop off so you can fix retention killers before publishing.</span>
                            </li>
                            <li className="flex gap-3">
                                <Target className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span><strong>Publishing without analysis is guessing.</strong> Creators who analyze their Shorts systematically improve faster than those who just publish and hope.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Analyzer vs Other Tools */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Shorta Analyzer vs. Other YouTube Shorts Tools</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="py-3 pr-4 text-gray-400 font-medium">Feature</th>
                                    <th className="py-3 px-4 text-orange-500 font-medium">Shorta Analyzer</th>
                                    <th className="py-3 pl-4 text-gray-400 font-medium">Generic Tools</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 pr-4">Beat-by-beat analysis</td>
                                    <td className="py-3 px-4 text-green-400">Yes</td>
                                    <td className="py-3 pl-4 text-gray-500">No</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 pr-4">Hook scoring</td>
                                    <td className="py-3 px-4 text-green-400">AI-scored with alternatives</td>
                                    <td className="py-3 pl-4 text-gray-500">Basic or none</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 pr-4">Timestamped feedback</td>
                                    <td className="py-3 px-4 text-green-400">Every beat</td>
                                    <td className="py-3 pl-4 text-gray-500">Summary only</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                    <td className="py-3 pr-4">Actionable fixes</td>
                                    <td className="py-3 px-4 text-green-400">Specific per issue</td>
                                    <td className="py-3 pl-4 text-gray-500">Generic tips</td>
                                </tr>
                                <tr>
                                    <td className="py-3 pr-4">Storyboard generation</td>
                                    <td className="py-3 px-4 text-green-400">Auto-generated fix plan</td>
                                    <td className="py-3 pl-4 text-gray-500">Not available</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">YouTube Shorts Analyzer FAQ</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">What is a YouTube Shorts analyzer?</h3>
                            <p className="text-gray-400">A YouTube Shorts analyzer is a tool that evaluates your short-form video content to identify issues with hooks, retention, pacing, and clarity. Shorta's analyzer uses AI to break down each beat of your Short and give specific, actionable feedback on what to fix.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">How does the YouTube Shorts analyzer work?</h3>
                            <p className="text-gray-400">Paste a YouTube Shorts URL or upload your video file. The analyzer processes it through AI to score your hook (first 1-2 seconds), map retention drops, flag pacing issues, and check content clarity. You get a beat-by-beat breakdown with timestamped suggestions.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Is the YouTube Shorts analyzer free?</h3>
                            <p className="text-gray-400">Yes. Shorta offers a free trial analysis with no login and no credit card required. Upload your Short and get a complete AI analysis including hook score, retention timeline, and actionable fixes.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">What does the Shorts analyzer check?</h3>
                            <p className="text-gray-400">The analyzer checks four key areas: Hook performance (are the first 1-2 seconds compelling?), Retention (where do viewers drop off?), Pacing (are there slow or rushed sections?), and Clarity (will new viewers understand immediately?). Each issue comes with a specific fix.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Can I analyze Shorts before publishing?</h3>
                            <p className="text-gray-400">Yes. You can upload draft footage or rough cuts before publishing. The analyzer works on any video file, not just published Shorts. This lets you catch and fix problems before wasting views on fixable mistakes.</p>
                        </div>
                    </div>
                </section>

                <SEOPageCTA
                    primaryText="Try the YouTube Shorts Analyzer Free"
                    primaryHref="/try"
                    secondaryText="See a Sample Analysis"
                    secondaryHref="/try"
                />

                <SEOInternalLinks
                    links={[
                        { href: '/tools/analyze-youtube-shorts', text: 'Analyze YouTube Shorts' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Analysis' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Retention Analysis' },
                        { href: '/tools/youtube-shorts-analytics-tool', text: 'Shorts Analytics Tool' },
                        { href: '/tools/youtube-shorts-feedback-tool', text: 'Shorts Feedback Tool' },
                        { href: '/tools/youtube-shorts-script-optimization', text: 'Script Optimization' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
