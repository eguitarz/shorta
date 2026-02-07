import { postsData } from './posts-data';
import categoriesData from '../../content/blog/categories/categories.json';

export interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    publishedAt: string;
    updatedAt?: string;
    author: string;
    categories: string[];
    tags: string[];
    featured?: boolean;
    coverImage?: string;
    readingTime?: string; // Changed from number to string to match generated data
    seo?: {
      canonicalUrl?: string;
      ogImage?: string;
    };
  };
  content: string;
  readingTime: string;
}

export interface Category {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

// Use pre-generated posts data for Cloudflare Workers compatibility
const allPosts = postsData;
const PINNED_RELATED_SLUGS = ['2026-02-07-start-youtube-channel-hands-on-guide'];

export function getAllPosts(): BlogPost[] {
  return allPosts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  return allPosts.find(post => post.slug === slug) || null;
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter(post =>
    post.frontmatter.categories.includes(category)
  );
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter(post =>
    post.frontmatter.tags.includes(tag)
  );
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const filtered = getAllPosts().filter(p => p.slug !== post.slug);

  // Score posts by category/tag overlap
  const scored = filtered.map(p => {
    let score = 0;
    p.frontmatter.categories.forEach(cat => {
      if (post.frontmatter.categories.includes(cat)) score += 3;
    });
    p.frontmatter.tags.forEach(tag => {
      if (post.frontmatter.tags.includes(tag)) score += 1;
    });
    return { post: p, score };
  });

  const pinnedPosts = PINNED_RELATED_SLUGS
    .filter(slug => slug !== post.slug)
    .map(slug => filtered.find(p => p.slug === slug))
    .filter((p): p is BlogPost => Boolean(p));

  const scoredWithoutPinned = scored
    .filter(item => !PINNED_RELATED_SLUGS.includes(item.post.slug))
    .sort((a, b) => b.score - a.score)
    .map(item => item.post);

  const combined = [...pinnedPosts, ...scoredWithoutPinned];
  const unique: BlogPost[] = [];
  const seen = new Set<string>();

  for (const item of combined) {
    if (seen.has(item.slug)) continue;
    unique.push(item);
    seen.add(item.slug);
    if (unique.length >= limit) break;
  }

  return unique;
}

export function getAllCategories(): Category[] {
  return Object.values(categoriesData);
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach(post => {
    post.frontmatter.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}
