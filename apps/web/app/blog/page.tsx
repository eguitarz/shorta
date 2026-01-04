import { getAllPosts, getAllCategories } from '@/lib/blog';
import { Metadata } from 'next';
import { BlogCard } from '@/components/blog/BlogCard';
import { CategoryFilter } from '@/components/blog/CategoryFilter';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Blog - YouTube Shorts Strategy & Content Creation Tips | Shorta',
  description: 'Expert insights on YouTube Shorts creation, viral content strategies, and AI-powered analysis. Learn from real examples and data-driven tactics.',
  openGraph: {
    title: 'Shorta Blog - YouTube Shorts & Content Creation',
    description: 'Expert insights on viral content creation and YouTube Shorts optimization',
    url: 'https://shorta.ai/blog',
    type: 'website',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const featuredPosts = posts.filter(p => p.frontmatter.featured).slice(0, 3);
  const recentPosts = posts.slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Shorta Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert insights on YouTube Shorts creation, viral content strategies, and AI-powered analysis
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-semibold mb-8">Featured</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredPosts.map(post => (
                <BlogCard key={post.slug} post={post} featured />
              ))}
            </div>
          </section>
        )}

        {/* Category Filter */}
        <CategoryFilter categories={categories} />

        {/* Recent Posts */}
        <section>
          <h2 className="text-3xl font-semibold mb-8">
            {recentPosts.length > 0 ? 'Recent Posts' : 'No posts yet'}
          </h2>
          {recentPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map(post => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              Blog posts coming soon! Check back later for expert insights on YouTube Shorts and viral content creation.
            </p>
          )}
        </section>
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
