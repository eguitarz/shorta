import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/PostHogProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://shorta.ai"),
  title: {
    default: "Shorts Analyzer — AI-Powered YouTube Shorts Analysis Tool | Shorta",
    template: "%s | Shorta",
  },
  description: "The best shorts analyzer for YouTube creators. Analyze shorts for retention issues, hook performance, and viral potential. AI-powered shorts analyzer with beat-by-beat feedback and optimization suggestions.",
  keywords: [
    "shorts analyzer",
    "YouTube shorts analyzer",
    "shorts analysis tool",
    "analyze shorts",
    "short form video analyzer",
    "YouTube Shorts",
    "video analysis",
    "shorts optimization",
    "video retention analyzer",
    "YouTube analytics",
    "viral shorts analyzer",
    "shorts performance analyzer",
    "content analysis tool",
    "creator tools",
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
    title: "Shorts Analyzer — AI-Powered YouTube Shorts Analysis Tool",
    description: "The best shorts analyzer for YouTube creators. Analyze shorts for retention issues, hook performance, and viral potential with AI-powered beat-by-beat feedback.",
    type: "website",
    locale: "en_US",
    url: "https://shorta.ai",
    siteName: "Shorta - Shorts Analyzer",
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
    title: "Shorts Analyzer — AI-Powered YouTube Shorts Analysis Tool",
    description: "The best shorts analyzer for YouTube creators. Analyze shorts for retention, hook performance, and viral potential.",
    site: "@eguitarz",
    creator: "@eguitarz",
    images: ["https://shorta.ai/og-image.svg"],
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
    // Add your verification codes here when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Shorta - Shorts Analyzer",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "AI-powered shorts analyzer for YouTube creators. Analyze shorts for retention issues, hook performance, and viral potential with beat-by-beat feedback and optimization suggestions.",
        "featureList": [
          "Shorts analyzer with AI-powered insights",
          "Beat-by-beat retention analysis",
          "Hook performance analyzer",
          "Viral potential scoring",
          "Automated shorts optimization suggestions",
          "Real-time shorts analysis"
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
        "name": "Shorta",
        "url": "https://shorta.ai",
        "logo": "https://shorta.ai/shorta-logo.png",
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
        "name": "Shorta - Shorts Analyzer",
        "url": "https://shorta.ai",
        "description": "AI-powered shorts analyzer tool for YouTube creators",
        "publisher": {
          "@type": "Organization",
          "name": "Shorta",
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
              "text": "Shorta offers 1 free trial analysis without login. To unlock unlimited shorts analysis and premium features, upgrade to Pro for $99/year with pricing locked forever."
            }
          },
          {
            "@type": "Question",
            "name": "Can I analyze any YouTube Short?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, the shorts analyzer works with any public YouTube Short. Simply paste the URL and get instant AI-powered analysis with retention insights, hook scoring, and optimization suggestions."
            }
          }
        ]
      }
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon-48x48.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/icon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="icon" href="/icon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://shorta.ai" />
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
      </head>
      <body>
        <PostHogProvider>
          {children}
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
