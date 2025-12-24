import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/QueryProvider";
import { PostHogProvider } from "@/components/PostHogProvider";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Shorta — Founding Member Pre-Sale",
  description: "Generate viral YouTube Shorts scripts based on what already works. Founding Member $199/year (grandfathered). Build starts at 5 members.",
  authors: [{ name: "Shorta" }],
  openGraph: {
    title: "Shorta — Founding Member Pre-Sale",
    description: "Generate viral YouTube Shorts scripts based on what already works. Founding Member $199/year (grandfathered).",
    type: "website",
    url: "https://shorta.ai",
    images: [{ url: "https://shorta.ai/og-image.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@eguitarz",
    images: ["https://shorta.ai/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <PostHogProvider>
          <QueryProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
