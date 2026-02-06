import { MetadataRoute } from 'next'
import { getAllPosts, getAllCategories } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://shorta.ai'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
  ]

  // SEO landing pages under /tools
  const seoPages = [
    'youtube-shorts-analyzer',
    'youtube-storyboard-generator',
    'youtube-shorts-script-generator',
    'youtube-shorts-analytics-tool',
    'grammarly-for-youtube-shorts',
    'why-my-youtube-shorts-get-low-views',
    'youtube-shorts-retention-analysis',
    'youtube-shorts-hook-generator',
    'youtube-shorts-hook-analysis',
    'improve-youtube-shorts-retention',
    'youtube-shorts-feedback-tool',
    'ai-tool-for-youtube-shorts',
    'youtube-shorts-script-optimization',
    'analyze-youtube-shorts',
  ].map(slug => ({
    url: `${baseUrl}/tools/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Blog posts
  const posts = getAllPosts()
  const blogPosts = posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.frontmatter.updatedAt || post.frontmatter.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Category pages
  const categories = getAllCategories()
  const categoryPages = categories.map(cat => ({
    url: `${baseUrl}/blog/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...seoPages, ...blogPosts, ...categoryPages]
}
