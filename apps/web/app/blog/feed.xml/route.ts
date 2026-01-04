import { Feed } from 'feed';
import { getAllPosts } from '@/lib/blog';

export async function GET() {
  const baseUrl = 'https://shorta.ai';
  const posts = getAllPosts();

  const feed = new Feed({
    title: 'Shorta Blog',
    description: 'Expert insights on YouTube Shorts creation and viral content strategies',
    id: baseUrl,
    link: baseUrl,
    language: 'en',
    image: `${baseUrl}/shorta-logo.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Shorta`,
    feedLinks: {
      rss: `${baseUrl}/blog/feed.xml`,
    },
    author: {
      name: 'Dale Ma',
      email: 'support@shorta.ai',
      link: 'https://twitter.com/eguitarz',
    },
  });

  posts.forEach(post => {
    feed.addItem({
      title: post.frontmatter.title,
      id: `${baseUrl}/blog/${post.slug}`,
      link: `${baseUrl}/blog/${post.slug}`,
      description: post.frontmatter.description,
      content: post.content,
      author: [
        {
          name: post.frontmatter.author,
        },
      ],
      date: new Date(post.frontmatter.publishedAt),
      category: post.frontmatter.categories.map(cat => ({ name: cat })),
      image: post.frontmatter.coverImage ? `${baseUrl}${post.frontmatter.coverImage}` : undefined,
    });
  });

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
