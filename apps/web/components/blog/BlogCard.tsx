import Link from 'next/link';
import { BlogPost } from '@/lib/blog';
import { Calendar, Clock } from 'lucide-react';

interface Props {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured }: Props) {
  const { slug, frontmatter, readingTime } = post;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors"
    >
      {frontmatter.coverImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={frontmatter.coverImage}
            alt={frontmatter.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex gap-2 mb-3 flex-wrap">
          {frontmatter.categories.map(cat => (
            <span
              key={cat}
              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md"
            >
              {cat}
            </span>
          ))}
        </div>
        <h3 className={`font-semibold text-foreground mb-2 group-hover:text-primary transition-colors ${featured ? 'text-2xl' : 'text-xl'}`}>
          {frontmatter.title}
        </h3>
        <p className="text-muted-foreground mb-4 line-clamp-2">
          {frontmatter.description}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(frontmatter.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {readingTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
