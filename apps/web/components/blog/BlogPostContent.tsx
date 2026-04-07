import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ShortaReportEmbed } from './ShortaReportEmbed';

interface Props {
  content: string;
}

const PROSE_CLASSES = `prose prose-invert prose-lg max-w-none
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
  prose-li:marker:text-primary`;

// Match <!-- shorta-report:JOB_ID --> or <!-- shorta-report:JOB_ID creator="Name" title="Title" -->
const REPORT_PLACEHOLDER_REGEX = /<!--\s*shorta-report:(\S+?)(?:\s+creator="([^"]*)")?(?:\s+title="([^"]*)")?\s*-->/g;

interface ContentSegment {
  type: 'markdown' | 'report-embed';
  content?: string;
  jobId?: string;
  creatorName?: string;
  videoTitle?: string;
}

function parseContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  const regex = new RegExp(REPORT_PLACEHOLDER_REGEX.source, 'g');
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'markdown', content: content.slice(lastIndex, match.index) });
    }
    segments.push({
      type: 'report-embed',
      jobId: match[1],
      creatorName: match[2] || undefined,
      videoTitle: match[3] || undefined,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'markdown', content: content.slice(lastIndex) });
  }

  return segments;
}

export function BlogPostContent({ content }: Props) {
  const segments = parseContent(content);

  // Fast path: no placeholders, render as before
  if (segments.length === 1 && segments[0].type === 'markdown') {
    return (
      <div className={PROSE_CLASSES}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div>
      {segments.map((segment, i) => {
        if (segment.type === 'report-embed' && segment.jobId) {
          return (
            <ShortaReportEmbed
              key={`report-${segment.jobId}-${i}`}
              jobId={segment.jobId}
              creatorName={segment.creatorName}
              videoTitle={segment.videoTitle}
            />
          );
        }
        return (
          <div key={`md-${i}`} className={PROSE_CLASSES}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{segment.content || ''}</ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}
