import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

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
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
