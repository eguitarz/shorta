import { Metadata } from 'next';
import Link from 'next/link';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { SEOInternalLinks } from '@/components/seo/SEOInternalLinks';
import { NicheConfidenceAnalyzer } from '@/components/tools/NicheConfidenceAnalyzer';
import { CheckCircle2, Lock, ShieldCheck, Target } from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Niche Analyzer – Confidence-First Niche Scoring',
    description: 'Free YouTube niche analyzer that delivers fast, explainable confidence signals. No AI, no login. Get a clear go/no-go verdict and a simple action plan.',
    keywords: [
        'youtube niche analyzer',
        'youtube niche analysis',
        'niche confidence score',
        'profitable youtube niche',
        'youtube niche research tool',
        'niche validation',
        'youtube market analysis',
    ],
    openGraph: {
        title: 'YouTube Niche Analyzer – Confidence-First Niche Scoring',
        description: 'Fast, rule-based niche confidence signals. Decide whether a niche is worth testing in 60 seconds.',
        url: 'https://shorta.ai/tools/youtube-niche-analyzer',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools/youtube-niche-analyzer',
    },
};

export default function YouTubeNicheAnalyzerPage() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'YouTube Niche Analyzer',
        description: 'Rule-based YouTube niche analyzer that outputs a confidence score, risks, and next actions. No AI required.',
        url: 'https://shorta.ai/tools/youtube-niche-analyzer',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free niche confidence analysis — no login required',
        },
        publisher: { '@type': 'Organization', name: 'Shorta', url: 'https://shorta.ai' },
    };

    const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is a YouTube niche analyzer?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'A YouTube niche analyzer evaluates public signals like demand growth, competition pressure, and engagement intensity to estimate whether a niche is worth testing.',
                },
            },
            {
                '@type': 'Question',
                name: 'Does this niche analyzer use AI?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. It uses a rule-based confidence model with explainable signals so you can understand the verdict.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is the niche analysis accurate?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'It is a directional estimate, not a guarantee. Use it to decide whether to run small tests before investing heavily.',
                },
            },
            {
                '@type': 'Question',
                name: 'What should I do after I pick a niche?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Build a storyboard-first plan and analyze your first Shorts to refine hooks, pacing, and clarity.',
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
                    YouTube Niche Analyzer: Confidence-First Niche Scoring
                </h1>
                <p className="text-xl text-gray-400 mb-10">
                    Fast, explainable signals pulled from public YouTube data. No AI, no login. Just a clear verdict, risks, and next steps.
                </p>

                <section id="niche-analyzer" className="mb-12">
                    <NicheConfidenceAnalyzer />
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">How This Niche Analyzer Works</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <div>
                                <h3 className="font-semibold mb-1">Enter a niche keyword</h3>
                                <p className="text-gray-400">We generate a confidence snapshot using demand, supply, and engagement proxies.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <div>
                                <h3 className="font-semibold mb-1">Review the evidence signals</h3>
                                <p className="text-gray-400">See the 6 signals that explain the score, plus risk flags to keep you honest.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <div>
                                <h3 className="font-semibold mb-1">Run a tight validation plan</h3>
                                <p className="text-gray-400">Get concrete next actions so you can test the niche without over-investing.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-12 grid md:grid-cols-3 gap-4">
                    <div className="bg-[#141414] border border-gray-800 rounded-xl p-5">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 mb-3" />
                        <h3 className="font-semibold mb-2">Confidence-first</h3>
                        <p className="text-gray-400 text-sm">Clear signals and risks so you can invest with conviction.</p>
                    </div>
                    <div className="bg-[#141414] border border-gray-800 rounded-xl p-5">
                        <Target className="w-5 h-5 text-orange-400 mb-3" />
                        <h3 className="font-semibold mb-2">Actionable plan</h3>
                        <p className="text-gray-400 text-sm">Get a tight validation playbook instead of generic advice.</p>
                    </div>
                    <div className="bg-[#141414] border border-gray-800 rounded-xl p-5">
                        <Lock className="w-5 h-5 text-blue-400 mb-3" />
                        <h3 className="font-semibold mb-2">No AI required</h3>
                        <p className="text-gray-400 text-sm">Rule-based model with transparent, explainable scoring.</p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">YouTube Niche Analyzer FAQ</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">What is a YouTube niche analyzer?</h3>
                            <p className="text-gray-400">It evaluates demand, competition, and engagement signals to help you decide whether to test a niche.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Does this tool use AI?</h3>
                            <p className="text-gray-400">No. It uses a rule-based confidence model with transparent signals.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Is the score a revenue guarantee?</h3>
                            <p className="text-gray-400">No. It’s a directional estimate designed to reduce risk before you invest time and budget.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">What should I do after I pick a niche?</h3>
                            <p className="text-gray-400">Build a storyboard-first plan and analyze your first Shorts to refine hooks and pacing.</p>
                        </div>
                    </div>
                </section>

                <section className="py-12 px-8 bg-gradient-to-b from-[#1a1a1a] to-black rounded-2xl my-12 text-center">
                    <h2 className="text-3xl font-bold mb-4">Turn Your Niche Into a Real Plan</h2>
                    <p className="text-gray-400 mb-8">
                        Move from validation to execution with a storyboard-first workflow and retention analysis.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/tools/youtube-storyboard-generator"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                        >
                            Generate a Storyboard
                            <CheckCircle2 className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/tools/youtube-shorts-analyzer"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-lg transition-colors"
                        >
                            Analyze a Short
                        </Link>
                    </div>
                </section>

                <SEOInternalLinks
                    links={[
                        { href: '/tools/youtube-shorts-analyzer', text: 'YouTube Shorts Analyzer' },
                        { href: '/tools/youtube-shorts-analytics-tool', text: 'Shorts Analytics Tool' },
                        { href: '/tools/youtube-shorts-hook-analysis', text: 'Hook Analysis Tool' },
                        { href: '/tools/youtube-shorts-retention-analysis', text: 'Retention Analysis Tool' },
                    ]}
                />
            </SEOPageLayout>
        </>
    );
}
