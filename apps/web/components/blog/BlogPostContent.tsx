import { MDXRemote } from 'next-mdx-remote/rsc';

interface Props {
  content: string;
  mdxOptions: any;
}

export function BlogPostContent({ content, mdxOptions }: Props) {
  return (
    <div className="prose prose-invert prose-lg max-w-none
      prose-headings:font-heading prose-headings:text-foreground
      prose-p:text-muted-foreground prose-p:leading-relaxed
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-strong:text-foreground prose-strong:font-semibold
      prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
      prose-pre:bg-muted prose-pre:border prose-pre:border-border
      prose-img:rounded-lg prose-img:shadow-lg
      prose-hr:border-border
      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
      prose-ul:text-muted-foreground prose-ol:text-muted-foreground
      prose-li:marker:text-primary
    ">
      <MDXRemote source={content} options={mdxOptions} />
    </div>
  );
}
