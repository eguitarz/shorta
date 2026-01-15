import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface InternalLink {
    href: string;
    text: string;
}

interface SEOInternalLinksProps {
    links: InternalLink[];
    title?: string;
}

export function SEOInternalLinks({ links, title = 'Related Resources' }: SEOInternalLinksProps) {
    if (links.length === 0) return null;

    return (
        <section className="mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-2 p-4 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors group"
                    >
                        <span className="flex-1">{link.text}</span>
                        <ArrowRight className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                ))}
            </div>
        </section>
    );
}
