import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/PostHogProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  metadataBase: new URL("https://shorta.ai"),
  title: {
    default: "YouTube Shorts Storyboard Generator | Plan Before Filming | Shorta",
    template: "%s | Shorta",
  },
  description: "Generate beat-by-beat storyboards for YouTube Shorts. Plan your hook, pacing, and structure before filming. Free analyzer to review your drafts — no login required.",
  keywords: [
    // Low KD long-tail keywords
    "why my youtube shorts get low views",
    "youtube shorts not getting views",
    "how to improve youtube shorts retention",
    "analyze youtube shorts free",
    "youtube shorts feedback tool",
    // Primary target keywords
    "youtube shorts storyboard generator",
    "ai storyboard generator",
    "short form video script",
    "youtube shorts analyzer",
    "video storyboard ai",
    // Video analyzer keywords
    "video analyzer",
    "video quality",
    "youtube video quality",
    "youtube analyzer",
    "youtube analyser",
    "video analysis",
    // AI director keywords
    "ai director",
    "ai video director",
    "youtube shorts director",
    // Supporting keywords
    "shorts hook generator",
    "youtube shorts retention",
    "fix youtube shorts",
    "short form video planning",
    "video retention analysis",
  ],
  authors: [{ name: "Dale Ma", url: "https://twitter.com/eguitarz" }],
  creator: "Dale Ma",
  publisher: "Shorta",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "YouTube Shorts Storyboard Generator | Plan Before Filming",
    description: "Generate beat-by-beat storyboards for YouTube Shorts. Plan your hook, pacing, and structure before filming. Free analyzer included.",
    type: "website",
    locale: "en_US",
    url: "https://shorta.ai",
    siteName: "Shorta - Storyboard Generator",
    images: [
      {
        url: "https://shorta.ai/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Shorts Analyzer - YouTube Shorts Analysis Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Shorts Storyboard Generator | Plan Before Filming",
    description: "Generate beat-by-beat storyboards for YouTube Shorts. Plan your hook, pacing, and structure before filming. Free analyzer included.",
    site: "@eguitarz",
    creator: "@eguitarz",
    images: ["https://shorta.ai/og-image.svg"],
  },
  alternates: {
    canonical: "https://shorta.ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Already verified via DNS (domain name provider)
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Shorta - Shorts Analyzer",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "Free AI script generator and YouTube video analyzer for creators. Generate video storyboards, analyze shorts for retention, and grow your YouTube channel with AI-powered insights.",
        "featureList": [
          "Free AI script generator for YouTube Shorts",
          "YouTube Shorts storyboard generator",
          "Video storyboard AI tool",
          "YouTube video analyzer",
          "Shorts analyzer with AI-powered insights",
          "Beat-by-beat retention analysis",
          "Hook performance analyzer",
          "Viral potential scoring",
          "Tools to grow your YouTube channel"
        ],
        "offers": {
          "@type": "Offer",
          "price": "199",
          "priceCurrency": "USD",
          "priceValidUntil": "2026-02-28",
          "availability": "https://schema.org/InStock",
          "description": "Founding Member - Annual Subscription (Grandfathered)",
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5",
          "ratingCount": "1",
        },
        "author": {
          "@type": "Person",
          "name": "Dale Ma",
          "url": "https://twitter.com/eguitarz",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://shorta.ai/#organization",
        "name": "Shorta",
        "url": "https://shorta.ai",
        "logo": {
          "@type": "ImageObject",
          "url": "https://shorta.ai/icon-512x512.png",
          "width": 512,
          "height": 512,
          "contentUrl": "https://shorta.ai/icon-512x512.png"
        },
        "image": "https://shorta.ai/icon-512x512.png",
        "description": "YouTube Shorts analysis and storyboard system for content creators",
        "founder": {
          "@type": "Person",
          "name": "Dale Ma",
        },
        "sameAs": [
          "https://twitter.com/eguitarz",
          "https://www.linkedin.com/in/dalema/",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://shorta.ai/#website",
        "name": "Shorta - Shorts Analyzer",
        "url": "https://shorta.ai",
        "description": "AI-powered shorts analyzer tool for YouTube creators",
        "publisher": {
          "@id": "https://shorta.ai/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://shorta.ai/?s={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is a shorts analyzer?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A shorts analyzer is an AI-powered tool that analyzes YouTube Shorts videos to identify retention issues, hook performance, content structure, and viral potential. Shorta's shorts analyzer provides beat-by-beat feedback showing exactly what works and what doesn't in your shorts."
            }
          },
          {
            "@type": "Question",
            "name": "How does the shorts analyzer work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The shorts analyzer uses AI to break down your YouTube Shorts into beats (segments), analyzing each section for retention drops, hook effectiveness, content clarity, and delivery performance. It provides specific, actionable feedback on how to improve each part of your short."
            }
          },
          {
            "@type": "Question",
            "name": "Is Shorta free to use?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Shorta offers 1 free trial analysis without login. To unlock premium features including video uploads and advanced analysis, upgrade to Pro for $99/year with pricing locked forever."
            }
          },
          {
            "@type": "Question",
            "name": "Can I analyze any YouTube Short?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, the shorts analyzer works with any public YouTube Short. Simply paste the URL and get instant AI-powered analysis with retention insights, hook scoring, and optimization suggestions."
            }
          },
          {
            "@type": "Question",
            "name": "Is there a free AI script generator?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Shorta offers a free AI script generator for YouTube Shorts. Our storyboard AI helps you generate video scripts by analyzing viral patterns and creating beat-by-beat storyboards optimized for retention."
            }
          },
          {
            "@type": "Question",
            "name": "What is a video storyboard generator?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A video storyboard generator is an AI tool that creates structured scripts for short form videos. Shorta's YouTube Shorts storyboard generator analyzes successful videos and generates beat-by-beat plans including hooks, content flow, and calls-to-action to help you grow your YouTube channel."
            }
          }
        ]
      }
    ],
  };

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" type="image/png" />
        <link rel="icon" href="/icon-48x48.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/icon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="icon" href="/icon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512x512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* canonical is set per-page via metadata.alternates.canonical */}
        {/*
          SECURITY NOTE: dangerouslySetInnerHTML is safe here because:
          1. structuredData is a hardcoded object literal (not user input)
          2. JSON.stringify() automatically escapes any dangerous characters
          3. This is the standard way to add JSON-LD structured data for SEO
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="3jIjAxKJqlI/m7xMcGkFLg"
          async
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>
            {children}
            <Toaster />
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
