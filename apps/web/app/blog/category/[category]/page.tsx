import { getAllCategories, getPostsByCategory } from '@/lib/blog';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogCard } from '@/components/blog/BlogCard';
import { Footer } from '@/components/Footer';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map(cat => ({
    category: cat.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const categories = getAllCategories();
  const category = categories.find(c => c.slug === categorySlug);
  if (!category) return {};

  return {
    title: `${category.name} - Shorta Blog`,
    description: category.description,
    openGraph: {
      title: `${category.name} Articles`,
      description: category.description,
      url: `https://shorta.ai/blog/category/${categorySlug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const categories = getAllCategories();
  const category = categories.find(c => c.slug === categorySlug);
  const posts = getPostsByCategory(categorySlug);

  if (!category || posts.length === 0) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            {category.name}
          </h1>
          <p className="text-xl text-muted-foreground">
            {category.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer
        items={[
          { text: "© Shorta", variant: "muted" },
          { text: "Blog", href: "/blog" },
          { text: "Privacy", href: "/privacy" },
          { text: "Terms", href: "/terms" },
          { text: "Contact", href: "mailto:support@shorta.ai" },
        ]}
      />
    </div>
  );
}
