import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPostHeader } from '@/components/blog/BlogPostHeader';
import { BlogPostContent } from '@/components/blog/BlogPostContent';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map(post => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const { frontmatter } = post;
  const canonicalUrl = frontmatter.seo?.canonicalUrl || `https://shorta.ai/blog/${slug}`;
  const ogImage = frontmatter.seo?.ogImage || frontmatter.coverImage || 'https://shorta.ai/og-image.svg';

  return {
    title: `${frontmatter.title} | Shorta Blog`,
    description: frontmatter.description,
    authors: [{ name: frontmatter.author }],
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt,
      authors: [frontmatter.author],
      tags: frontmatter.tags,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.title,
      description: frontmatter.description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(post);

  // Generate JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    image: post.frontmatter.coverImage || 'https://shorta.ai/og-image.svg',
    datePublished: post.frontmatter.publishedAt,
    dateModified: post.frontmatter.updatedAt || post.frontmatter.publishedAt,
    author: {
      '@type': 'Person',
      name: post.frontmatter.author,
      url: 'https://twitter.com/eguitarz',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Shorta',
      logo: {
        '@type': 'ImageObject',
        url: 'https://shorta.ai/shorta-logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://shorta.ai/blog/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <article className="min-h-screen bg-background">
        <div className="container mx-auto px-8 py-16 max-w-4xl">
          {/* Back to Blog Link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <BlogPostHeader post={post} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
            <BlogPostContent content={post.content} />
            <aside className="hidden lg:block">
              <div className="sticky top-8">
                <TableOfContents content={post.content} />
              </div>
            </aside>
          </div>

          <RelatedPosts posts={relatedPosts} />
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
      </article>
    </>
  );
}
