import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

interface SEOPageCTAProps {
    primaryText: string;
    primaryHref: string;
    secondaryText: string;
    secondaryHref: string;
}

export function SEOPageCTA({
    primaryText,
    primaryHref,
    secondaryText,
    secondaryHref,
}: SEOPageCTAProps) {
    return (
        <section className="py-16 px-8 bg-gradient-to-b from-[#1a1a1a] to-black rounded-2xl my-12">
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-6">Ready to Improve Your Shorts?</h2>
                <p className="text-gray-400 mb-8">
                    Get AI-powered feedback on your YouTube Shorts before you publish.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={primaryHref}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                    >
                        {primaryText}
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    <Link
                        href={secondaryHref}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-lg transition-colors"
                    >
                        <Play className="w-5 h-5" />
                        {secondaryText}
                    </Link>
                </div>
            </div>
        </section>
    );
}
