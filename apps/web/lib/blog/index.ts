import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

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
    readingTime?: number;
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

const postsDirectory = path.join(process.cwd(), 'content/blog/posts');
const categoriesPath = path.join(process.cwd(), 'content/blog/categories/categories.json');

export function getAllPosts(): BlogPost[] {
  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      return getPostBySlug(slug);
    })
    .filter(Boolean) as BlogPost[];

  // Sort by publishedAt descending
  return posts.sort((a, b) =>
    new Date(b.frontmatter.publishedAt).getTime() -
    new Date(a.frontmatter.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const stats = readingTime(content);

    return {
      slug,
      frontmatter: {
        ...data,
        readingTime: Math.ceil(stats.minutes),
      } as BlogPost['frontmatter'],
      content,
      readingTime: stats.text,
    };
  } catch {
    return null;
  }
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
  const allPosts = getAllPosts().filter(p => p.slug !== post.slug);

  // Score posts by category/tag overlap
  const scored = allPosts.map(p => {
    let score = 0;
    p.frontmatter.categories.forEach(cat => {
      if (post.frontmatter.categories.includes(cat)) score += 3;
    });
    p.frontmatter.tags.forEach(tag => {
      if (post.frontmatter.tags.includes(tag)) score += 1;
    });
    return { post: p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.post);
}

export function getAllCategories(): Category[] {
  try {
    if (!fs.existsSync(categoriesPath)) {
      return [];
    }
    const data = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    return Object.values(data);
  } catch {
    return [];
  }
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach(post => {
    post.frontmatter.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}
