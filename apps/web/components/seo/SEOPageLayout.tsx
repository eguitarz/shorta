import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface SEOPageLayoutProps {
    children: React.ReactNode;
    backText?: string;
    backHref?: string;
}

export function SEOPageLayout({
    children,
    backText = 'Back to Home',
    backHref = '/',
}: SEOPageLayoutProps) {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-8 py-16 max-w-4xl">
                {/* Back Link */}
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {backText}
                </Link>

                {/* Content */}
                <article className="prose prose-invert prose-lg max-w-none">
                    {children}
                </article>
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
