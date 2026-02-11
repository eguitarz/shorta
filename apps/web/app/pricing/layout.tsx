import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – YouTube Shorts Analyzer from $99/year",
  description: "Shorta pricing: Free trial, Pro at $99/year (locked forever), or $199 lifetime. Analyze YouTube Shorts, generate storyboards, and fix retention issues before publishing.",
  openGraph: {
    title: "Pricing – YouTube Shorts Analyzer from $99/year",
    description: "Shorta pricing: Free trial, Pro at $99/year (locked forever), or $199 lifetime. Analyze YouTube Shorts and fix retention issues.",
    url: "https://shorta.ai/pricing",
    type: "website",
  },
  alternates: {
    canonical: "https://shorta.ai/pricing",
    languages: {
      en: "https://shorta.ai/pricing",
      ko: "https://shorta.ai/ko/pricing",
    },
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
