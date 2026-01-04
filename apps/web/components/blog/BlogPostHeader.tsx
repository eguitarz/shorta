import { BlogPost } from '@/lib/blog';
import { Calendar, Clock, User } from 'lucide-react';

interface Props {
  post: BlogPost;
}

export function BlogPostHeader({ post }: Props) {
  const { frontmatter, readingTime } = post;

  return (
    <header className="mb-12">
      {frontmatter.coverImage && (
        <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
          <img
            src={frontmatter.coverImage}
            alt={frontmatter.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {frontmatter.categories.map(cat => (
          <span
            key={cat}
            className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-md"
          >
            {cat}
          </span>
        ))}
      </div>

      <h1 className="text-5xl font-bold text-foreground mb-6">
        {frontmatter.title}
      </h1>

      <p className="text-xl text-muted-foreground mb-6">
        {frontmatter.description}
      </p>

      <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
        <span className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {frontmatter.author}
        </span>
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date(frontmatter.publishedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {readingTime}
        </span>
      </div>
    </header>
  );
}
