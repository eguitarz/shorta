"use client";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/TrustBadges";
import { WaitlistForm } from "@/components/WaitlistForm";
import { redirectToCheckout } from "@/lib/stripe";
import { motion } from "framer-motion";

export function HeroSection() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="pt-2 pb-8 md:pt-3 md:pb-10 lg:pt-4 lg:pb-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="mb-10 max-w-7xl space-y-6 font-heading">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2]">
              <span className="text-foreground">AI-Powered </span>
              <span className="text-primary">Shorts Analyzer</span>
              <span className="text-foreground"> for YouTube Creators</span>
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight leading-[1.3] text-muted-foreground">
              <span className="text-foreground">Stop guessing why your Shorts </span>
              <span className="text-primary">lose viewers.</span>
            </p>
            <div className="aspect-video bg-surface rounded-lg border border-border overflow-hidden">
              <video
                width="100%"
                height="100%"
                autoPlay
                loop
                muted
                playsInline
                className="object-cover"
              >
                <source src="/Shorta analyzer demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2]">
              <span className="text-foreground">Analyze shorts with AI-powered insights — see what </span>
              <span className="text-primary">fails</span>
              <span className="text-foreground">, why it fails, and exactly how to </span>
              <span className="text-primary">fix it</span>
              <span className="text-foreground">.</span>
            </p>
            <img src="/hero.png" alt="Shorts Analyzer Dashboard - Analyze YouTube Shorts" className="w-full rounded-lg" />
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2] text-muted-foreground -mt-2">
              The most powerful shorts analyzer for creators — not another AI writer.
            </p>
            <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight leading-[1.2] text-muted-foreground">
              Built for <span className="bg-yellow-300 text-black px-1.5 py-0.5 md:px-2 md:py-1 rounded text-base md:text-lg lg:text-xl xl:text-2xl">creators</span>, <span className="bg-pink-300 text-black px-1.5 py-0.5 md:px-2 md:py-1 rounded text-base md:text-lg lg:text-xl xl:text-2xl">founders</span>, and <span className="bg-blue-400 text-black px-1.5 py-0.5 md:px-2 md:py-1 rounded text-base md:text-lg lg:text-xl xl:text-2xl">marketers</span> who already publish.<br />
              Signals over hype.
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border border-border shadow-md">
            <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
              <span className="inline-flex items-center rounded-md bg-green-500/20 px-2 py-1 md:px-3 md:py-1.5 text-xs font-semibold text-green-400">
                ✓ Development in progress
              </span>
              <span className="inline-flex items-center rounded-md bg-primary/20 px-2 py-1 md:px-3 md:py-1.5 text-xs font-semibold text-primary">
                ✓ 7-Day Money-Back Guarantee
              </span>
            </div>
            <p className="text-2xl md:text-3xl lg:text-4xl text-foreground mb-2">
              <strong>$199 / year</strong> — Founding Member (grandfathered)
            </p>
            <p className="text-sm md:text-base text-muted-foreground mt-2 md:mt-3">
              Public launch price: <strong>$399 / year</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="flex flex-col gap-3 md:gap-4">
              <Button
                variant="hero"
                size="lg"
                onClick={() => redirectToCheckout()}
              >
                Join as a Founding Member
              </Button>
              <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                <p>Limited Founding Member spots remaining</p>
                <p>Ships by <strong>February 28, 2026</strong> or full refund</p>
              </div>
              <TrustBadges />
            </div>
            <div className="flex flex-col gap-2 md:gap-3 bg-card/30 p-4 md:p-6 rounded-lg border border-border/50">
              <p className="text-sm md:text-base text-muted-foreground font-semibold">
                Not ready? Join the waitlist
              </p>
              <WaitlistForm />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
