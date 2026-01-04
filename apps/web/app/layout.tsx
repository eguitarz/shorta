import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL("https://shorta.ai"),
  title: {
    default: "Shorta — YouTube Shorts Analysis & Storyboard System",
    template: "%s | Shorta",
  },
  description: "Turn every Short into a learning loop. AI-powered analysis shows what fails, why it fails, and exactly how to fix it. A Shorts linting & iteration system for creators, founders, and marketers.",
  keywords: [
    "YouTube Shorts",
    "video analysis",
    "storyboard creator",
    "content creation",
    "AI feedback",
    "shorts optimization",
    "video retention",
    "YouTube analytics",
    "content strategy",
    "viral shorts",
    "short-form content",
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
    title: "Shorta — YouTube Shorts Analysis & Storyboard System",
    description: "Turn every Short into a learning loop. AI-powered analysis shows what fails, why it fails, and exactly how to fix it.",
    type: "website",
    locale: "en_US",
    url: "https://shorta.ai",
    siteName: "Shorta",
    images: [
      {
        url: "https://shorta.ai/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Shorta - YouTube Shorts Analysis System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shorta — YouTube Shorts Analysis & Storyboard System",
    description: "Turn every Short into a learning loop. AI-powered analysis for YouTube Shorts.",
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
        "name": "Shorta",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "AI-powered YouTube Shorts analysis and storyboard system that turns every Short into a learning loop.",
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
        "name": "Shorta",
        "url": "https://shorta.ai",
        "description": "Turn every Short into a learning loop with AI-powered analysis",
        "publisher": {
          "@type": "Organization",
          "name": "Shorta",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/shorta-logo.png" type="image/png" sizes="64x64" />
        <link rel="apple-touch-icon" href="/shorta-logo.png" />
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
