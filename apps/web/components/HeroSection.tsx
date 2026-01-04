// @ts-nocheck
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
    <section className="pt-3 pb-10 md:pt-4 md:pb-16">
      <div className="container mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="mb-10 max-w-7xl space-y-6 font-heading">
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2]">
              <span className="text-foreground">Stop guessing why your Shorts </span>
              <span className="text-primary">lose viewers.</span>
            </p>
            <div className="aspect-video bg-surface rounded-lg border border-border overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/3N6lS0y75rw"
                title="What Shorta changed in my workflow"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2]">
              <span className="text-foreground">Get actionable feedback on your YouTube Shorts — see what </span>
              <span className="text-primary">fails</span>
              <span className="text-foreground">, why it fails, and exactly how to </span>
              <span className="text-primary">fix it</span>
              <span className="text-foreground">.</span>
            </p>
            <img src="/hero.png" alt="Shorta Hero" className="w-full rounded-lg" />
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2] text-muted-foreground -mt-2">
              A Shorts linting & iteration system — not another AI writer.
            </p>
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2] text-muted-foreground">
              Built for <span className="bg-yellow-300 text-black px-2 py-1 rounded">creators</span>, <span className="bg-pink-300 text-black px-2 py-1 rounded">founders</span>, and <span className="bg-blue-400 text-black px-2 py-1 rounded">marketers</span> who already publish.<br />
              Signals over hype.
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 mb-8 border border-border shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center rounded-md bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-400">
                ✓ Development in progress
              </span>
              <span className="inline-flex items-center rounded-md bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary">
                ✓ 7-Day Money-Back Guarantee
              </span>
            </div>
            <p className="text-3xl md:text-4xl text-foreground mb-2">
              <strong>$199 / year</strong> — Founding Member (grandfathered)
            </p>
            <p className="text-base text-muted-foreground mt-3">
              Public launch price: <strong>$399 / year</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-4">
              <Button
                variant="hero"
                size="lg"
                onClick={redirectToCheckout}
              >
                Join as a Founding Member
              </Button>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Limited Founding Member spots remaining</p>
                <p>Ships by <strong>February 28, 2026</strong> or full refund</p>
              </div>
              <TrustBadges />
            </div>
            <div className="flex flex-col gap-3 bg-card/30 p-6 rounded-lg border border-border/50">
              <p className="text-base text-muted-foreground font-semibold">
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
