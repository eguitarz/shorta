import { BlogPost } from '@/lib/blog';
import { BlogCard } from './BlogCard';

interface Props {
  posts: BlogPost[];
}

export function RelatedPosts({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 pt-16 border-t border-border">
      <h2 className="text-3xl font-semibold text-foreground mb-8">
        Related Posts
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {posts.map(post => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
