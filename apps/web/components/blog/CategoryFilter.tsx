import Link from 'next/link';
import { Category } from '@/lib/blog';

interface Props {
  categories: Category[];
}

export function CategoryFilter({ categories }: Props) {
  if (categories.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Browse by Category</h2>
      <div className="flex gap-3 flex-wrap">
        {categories.map(cat => (
          <Link
            key={cat.slug}
            href={`/blog/category/${cat.slug}`}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:border-primary transition-colors text-sm font-medium"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
