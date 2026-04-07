'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/posthog';

interface BlogPostTrackerProps {
  slug: string;
  creatorName?: string;
  category?: string;
}

export function BlogPostTracker({ slug, creatorName, category }: BlogPostTrackerProps) {
  useEffect(() => {
    trackEvent('blog_post_viewed', {
      post_slug: slug,
      creator_name: creatorName,
      category,
    });
  }, [slug, creatorName, category]);

  return null;
}
