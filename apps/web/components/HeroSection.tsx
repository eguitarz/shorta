"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="pt-6 pb-12 md:pt-10 md:pb-16 lg:pt-12 lg:pb-20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl"
        >
          {/* H1 - benefit-driven */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight font-heading">
            See Exactly Why Viewers
            <br />
            <span className="text-primary">Swipe Away</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mt-4 md:mt-6 max-w-2xl">
            AI-powered YouTube Shorts analyzer and storyboard generator. Get beat-by-beat feedback on hooks, pacing, and retention — then generate a better version.
          </p>

          {/* Single CTA */}
          <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-start gap-3">
            <a href="/try">
              <Button variant="hero" size="lg" className="text-base md:text-lg px-6 md:px-8 py-3 md:py-4">
                Try Free — Analyze Your Short
              </Button>
            </a>
            <p className="text-sm text-muted-foreground sm:self-center">
              No login · No credit card · See results in 60 seconds
            </p>
          </div>
        </motion.div>

        {/* Product Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-10 md:mt-14 max-w-5xl"
        >
          <div className="rounded-xl border border-border overflow-hidden shadow-2xl shadow-primary/5">
            <img
              src="/structure_score.png"
              alt="YouTube Shorts analysis showing hook, structure, content, and delivery scores with beat-by-beat breakdown"
              className="w-full"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-3 text-center">
            Real analysis output — every Short gets a score, retention map, and specific fixes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
