'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ShieldCheck,
    Target,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Verdict = {
    label: string;
    description: string;
    toneClass: string;
    badgeClass: string;
};

type EvidenceCard = {
    title: string;
    value: string;
    description: string;
    icon: ReactNode;
    accentClass: string;
};

type Report = {
    topic: string;
    score: number;
    verdict: Verdict;
    evidence: EvidenceCard[];
    risks: string[];
    actions: string[];
    updatedAt: string;
    sampleSize: number;
};

type ApiResponse = {
    topic: string;
    updatedAt: string;
    sampleSize: number;
    score: number;
    verdict: {
        label: string;
        description: string;
    };
    metrics: {
        demandGrowth: number;
        uploadsPerWeek: number;
        breakoutVelocity: number;
        audienceValue: 'Low' | 'Medium' | 'High';
        productionFit: 'Favorable' | 'Moderate' | 'Challenging';
        stickiness: number;
    };
    risks: string[];
    actions: string[];
};

function getVerdict(score: number): Verdict {
    if (score >= 75) {
        return {
            label: 'High Potential',
            description: 'Momentum is strong with clear room for new entrants.',
            toneClass: 'text-emerald-400',
            badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        };
    }
    if (score >= 60) {
        return {
            label: 'Promising',
            description: 'Good signals, but expect competition and refine your angle.',
            toneClass: 'text-blue-400',
            badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
        };
    }
    if (score >= 45) {
        return {
            label: 'Needs Validation',
            description: 'Mixed signals. Test narrowly before committing.',
            toneClass: 'text-yellow-400',
            badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
        };
    }
    return {
        label: 'High Risk',
        description: 'Low momentum and heavy competition right now.',
        toneClass: 'text-red-400',
        badgeClass: 'bg-red-500/15 text-red-300 border-red-500/40',
    };
}

function buildReport(data: ApiResponse): Report {
    const verdict = getVerdict(data.score);
    const evidence: EvidenceCard[] = [
        {
            title: 'Demand Growth',
            value: `${data.metrics.demandGrowth > 0 ? '+' : ''}${data.metrics.demandGrowth}%`,
            description: 'Recent interest lift vs. the previous 30 days.',
            icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
            accentClass: 'from-emerald-500/10 to-transparent border-emerald-500/20',
        },
        {
            title: 'Supply Pressure',
            value: `${data.metrics.uploadsPerWeek} uploads/week`,
            description: 'Estimated publishing velocity for the niche.',
            icon: <BarChart3 className="w-5 h-5 text-blue-400" />,
            accentClass: 'from-blue-500/10 to-transparent border-blue-500/20',
        },
        {
            title: 'Breakout Velocity',
            value: `${data.metrics.breakoutVelocity.toFixed(1)}x`,
            description: 'Outlier growth multiple in the last 30 days.',
            icon: <Zap className="w-5 h-5 text-orange-400" />,
            accentClass: 'from-orange-500/10 to-transparent border-orange-500/20',
        },
        {
            title: 'Audience Value',
            value: data.metrics.audienceValue,
            description: 'Advertiser demand proxy based on video economics.',
            icon: <Target className="w-5 h-5 text-purple-400" />,
            accentClass: 'from-purple-500/10 to-transparent border-purple-500/20',
        },
        {
            title: 'Production Fit',
            value: data.metrics.productionFit,
            description: 'Effort required to sustain weekly output.',
            icon: <ShieldCheck className="w-5 h-5 text-teal-400" />,
            accentClass: 'from-teal-500/10 to-transparent border-teal-500/20',
        },
        {
            title: 'Stickiness',
            value: `${data.metrics.stickiness.toFixed(1)}x likes`,
            description: 'Engagement intensity vs. baseline niches.',
            icon: <CheckCircle2 className="w-5 h-5 text-rose-400" />,
            accentClass: 'from-rose-500/10 to-transparent border-rose-500/20',
        },
    ];

    return {
        topic: data.topic,
        score: data.score,
        verdict,
        evidence,
        risks: data.risks,
        actions: data.actions,
        updatedAt: data.updatedAt,
        sampleSize: data.sampleSize,
    };
}

export function NicheConfidenceAnalyzer() {
    const [topic, setTopic] = useState('');
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const example = useMemo(() => 'Home workouts for busy parents', []);

    const runAnalysis = async (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            setError('Enter a niche keyword to analyze.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/niche-analyzer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: trimmed }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Unable to analyze this niche.');
            }
            setReport(buildReport(data as ApiResponse));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        await runAnalysis(topic);
    };

    const handleExample = async () => {
        setTopic(example);
        await runAnalysis(example);
    };

    return (
        <div className="not-prose">
            <div className="bg-gradient-to-r from-orange-500/10 via-transparent to-transparent border border-orange-500/20 rounded-2xl p-6 md:p-8 mb-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xs uppercase tracking-[0.2em] text-orange-400 font-semibold">YouTube Data API</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-400">No AI</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Realtime snapshot</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Analyze a YouTube Niche in 60 Seconds</h2>
                <p className="text-gray-400 mb-6">
                    Fast, explainable signals that help you decide whether a niche is worth testing.
                    This is a confidence model, not a revenue guarantee.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                    <input
                        value={topic}
                        onChange={(event) => setTopic(event.target.value)}
                        placeholder="Enter a niche keyword (e.g. minimalist productivity)"
                        className="flex-1 rounded-lg border border-gray-700 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none"
                        aria-label="Niche keyword"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                    >
                        {loading ? 'Analyzing...' : 'Analyze'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
                {error && (
                    <div className="mt-4 text-sm text-red-400">
                        {error}
                    </div>
                )}
                <button
                    type="button"
                    onClick={handleExample}
                    className="mt-4 text-sm text-orange-300 hover:text-orange-200 transition-colors"
                >
                    Try an example niche
                </button>
            </div>

            {report && (
                <div className="space-y-10">
                    <section className="bg-[#141414] border border-gray-800 rounded-2xl p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mb-2">Confidence Score</p>
                                <p className="text-sm text-gray-500 mb-4">
                                    Niche: <span className="text-gray-200 font-semibold">{report.topic}</span>
                                </p>
                                <div className="flex items-end gap-4">
                                    <span className="text-5xl font-bold">{report.score}</span>
                                    <span className="text-lg text-gray-400">/ 100</span>
                                </div>
                                <div className="mt-4">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-semibold',
                                            report.verdict.badgeClass,
                                        )}
                                    >
                                        {report.verdict.label}
                                    </span>
                                </div>
                                <p className={cn('mt-3 text-sm md:text-base', report.verdict.toneClass)}>
                                    {report.verdict.description}
                                </p>
                            </div>
                            <div className="flex-1">
                                <div className="text-sm text-gray-400 mb-2">Score breakdown</div>
                                <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden">
                                    <div
                                        className="h-3 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400"
                                        style={{ width: `${report.score}%` }}
                                    />
                                </div>
                                <div className="mt-3 text-xs text-gray-500 space-y-1">
                                    <p>Sample size: {report.sampleSize} recent videos.</p>
                                    <p>Updated: {new Date(report.updatedAt).toLocaleString()}</p>
                                    <p>Use to guide testing, not to predict revenue.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold mb-4">Evidence Signals</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {report.evidence.map((item) => (
                                <div
                                    key={item.title}
                                    className={cn(
                                        'bg-gradient-to-r border p-5 rounded-xl',
                                        item.accentClass,
                                    )}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        {item.icon}
                                        <h4 className="font-semibold">{item.title}</h4>
                                    </div>
                                    <p className="text-2xl font-bold mb-1">{item.value}</p>
                                    <p className="text-sm text-gray-400">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="grid md:grid-cols-2 gap-6">
                        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                <h3 className="text-lg font-semibold">Risks to Watch</h3>
                            </div>
                            <ul className="space-y-3 text-gray-300">
                                {report.risks.map((risk) => (
                                    <li key={risk} className="flex gap-3">
                                        <span className="text-yellow-400 mt-1">•</span>
                                        <span>{risk}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-semibold">Next Actions</h3>
                            </div>
                            <ul className="space-y-3 text-gray-300">
                                {report.actions.map((action) => (
                                    <li key={action} className="flex gap-3">
                                        <span className="text-emerald-400 mt-1">•</span>
                                        <span>{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
