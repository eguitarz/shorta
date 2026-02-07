import { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import {
    BarChart3,
    FileEdit,
    HelpCircle,
    TrendingDown,
    Zap,
    TrendingUp,
    MessageSquare,
    Sparkles,
    FileText,
    Search,
    Target,
    Users
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'YouTube Shorts Tools & Resources',
    description: 'Free tools and guides to improve your YouTube Shorts. Analyze hooks, fix retention issues, and get AI-powered feedback before you publish.',
    openGraph: {
        title: 'YouTube Shorts Tools & Resources',
        description: 'Free tools and guides to improve your YouTube Shorts.',
        url: 'https://shorta.ai/tools',
        type: 'website',
    },
    alternates: {
        canonical: 'https://shorta.ai/tools',
    },
};

const tools = [
    {
        slug: 'youtube-niche-analyzer',
        title: 'YouTube Niche Analyzer',
        description: 'Confidence-first scoring to validate a niche before you invest.',
        icon: Target,
        color: 'text-amber-500',
    },
    {
        slug: 'youtube-channel-analyzer',
        title: 'YouTube Channel Analyzer',
        description: 'Snapshot any channel with real cadence, views, and engagement.',
        icon: Users,
        color: 'text-blue-500',
    },
    {
        slug: 'youtube-shorts-analytics-tool',
        title: 'YouTube Shorts Analytics Tool',
        description: 'Get frame-by-frame retention data and hook analysis for your Shorts.',
        icon: BarChart3,
        color: 'text-blue-500',
    },
    {
        slug: 'grammarly-for-youtube-shorts',
        title: 'Grammarly for YouTube Shorts',
        description: 'Pre-publish checking for hooks, pacing, and clarity issues.',
        icon: FileEdit,
        color: 'text-green-500',
    },
    {
        slug: 'why-my-youtube-shorts-get-low-views',
        title: 'Why My Shorts Get Low Views',
        description: 'Diagnose the 4 real reasons your Shorts are failing.',
        icon: HelpCircle,
        color: 'text-red-500',
    },
    {
        slug: 'youtube-shorts-retention-analysis',
        title: 'Retention Analysis',
        description: 'See exactly where viewers drop off, second-by-second.',
        icon: TrendingDown,
        color: 'text-yellow-500',
    },
    {
        slug: 'youtube-shorts-hook-analysis',
        title: 'Hook Analysis',
        description: 'Find out if your first 2 seconds are killing your views.',
        icon: Zap,
        color: 'text-orange-500',
    },
    {
        slug: 'improve-youtube-shorts-retention',
        title: 'Improve Retention',
        description: 'Actionable fixes to stop viewers from swiping away.',
        icon: TrendingUp,
        color: 'text-emerald-500',
    },
    {
        slug: 'youtube-shorts-feedback-tool',
        title: 'Feedback Tool',
        description: 'Get producer-level notes on your Shorts instantly.',
        icon: MessageSquare,
        color: 'text-purple-500',
    },
    {
        slug: 'ai-tool-for-youtube-shorts',
        title: 'AI Tool for Shorts',
        description: 'AI-powered analysis of hooks, pacing, and retention.',
        icon: Sparkles,
        color: 'text-pink-500',
    },
    {
        slug: 'youtube-shorts-script-optimization',
        title: 'Script Optimization',
        description: 'Catch structure problems before you film.',
        icon: FileText,
        color: 'text-cyan-500',
    },
    {
        slug: 'analyze-youtube-shorts',
        title: 'Analyze YouTube Shorts',
        description: 'Full breakdown of hook, retention, pacing, and clarity.',
        icon: Search,
        color: 'text-indigo-500',
    },
];

export default function ToolsIndexPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-gray-800">
                <div className="container mx-auto px-8 py-4 max-w-6xl">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
                        <img src="/shorta-logo.png" alt="Shorta" className="h-10 w-10" />
                        <span className="text-lg font-semibold">Shorta AI</span>
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-8 py-16 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        YouTube Shorts Tools & Resources
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Free guides and tools to help you understand why your Shorts perform the way they do—and how to fix them.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                            <Link
                                key={tool.slug}
                                href={`/tools/${tool.slug}`}
                                className="group bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 hover:bg-[#222] transition-all"
                            >
                                <div className={`${tool.color} mb-4`}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <h2 className="text-lg font-semibold mb-2 group-hover:text-orange-400 transition-colors">
                                    {tool.title}
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    {tool.description}
                                </p>
                            </Link>
                        );
                    })}
                </div>

                {/* CTA Section */}
                <div className="mt-16 text-center bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-12">
                    <h2 className="text-2xl font-bold mb-4">
                        Ready to Analyze Your Shorts?
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        Upload your YouTube Short and get AI-powered feedback on hooks, pacing, retention, and clarity—before you publish.
                    </p>
                    <Link
                        href="/try"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                    >
                        Try Free Analysis
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <Footer
                items={[
                    { text: "© Shorta", variant: "muted" },
                    { text: "Blog", href: "/blog" },
                    { text: "Pricing", href: "/pricing" },
                    { text: "Privacy", href: "/privacy" },
                    { text: "Terms", href: "/terms" },
                    { text: "Contact", href: "mailto:support@shorta.ai" },
                ]}
            />
        </div>
    );
}
