"use client";

import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/TrustBadges";
import { WaitlistForm } from "@/components/WaitlistForm";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="pt-2 pb-8 md:pt-3 md:pb-10 lg:pt-4 lg:pb-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* H1 - SEO optimized */}
          <div className="mb-8 md:mb-12 max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight font-heading">
              YouTube Shorts Storyboard & Analyzer
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground mt-3 font-semibold">
              Plan before filming. Analyze before publishing.
            </p>
          </div>

          {/* Story 1: The Idea */}
          <div className="mb-12 md:mb-16">
            <h2 className="text-lg md:text-xl font-semibold text-primary mb-3">AI Storyboard Generator for YouTube Shorts</h2>
            <div className="mb-4 md:mb-6">
              <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground leading-tight">
                You have a crazy Short idea.
              </p>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mt-2">
                But no time to plan every detail. You just want to film it.
              </p>
            </div>
            <div className="aspect-video bg-surface rounded-lg border border-border overflow-hidden max-w-4xl">
              <video
                width="100%"
                height="100%"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="object-cover w-full h-full"
              >
                <source src="/storyboard-compressed.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-base md:text-lg text-muted-foreground mt-4 max-w-2xl">
              Shorta turns your idea into a clear, filmable storyboard — structure, hooks, and pacing included.
            </p>
          </div>

          {/* Story 2: The Problem */}
          <div className="mb-12 md:mb-16">
            <h2 className="text-lg md:text-xl font-semibold text-primary mb-3">YouTube Shorts Analyzer — Fix Before You Publish</h2>
            <div className="mb-4 md:mb-6">
              <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground leading-tight">
                You filmed your Short. Something feels off.
              </p>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mt-2">
                But you can't pinpoint what's wrong.
              </p>
            </div>
            <div className="aspect-video bg-surface rounded-lg border border-border overflow-hidden max-w-4xl">
              <video
                width="100%"
                height="100%"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="object-cover w-full h-full"
              >
                <source src="/analyzer.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-base md:text-lg text-muted-foreground mt-4 max-w-2xl">
              Upload before you publish. Shorta analyzes your Short and tells you exactly what to fix — hook, pacing, delivery.
            </p>
          </div>

          {/* Solution Summary */}
          <div className="mb-8 md:mb-12 max-w-3xl">
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">
              Stop guessing. Start improving.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              Shorta is a production system for YouTube Shorts — not another script generator.
            </p>

            {/* What Shorta Does - Keyword rich section */}
            <div className="bg-surface/50 rounded-lg p-4 md:p-6 border border-border/50">
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">What Shorta Does</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Storyboard feature */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm md:text-base text-muted-foreground">
                    <span className="text-primary mt-1">→</span>
                    <span><strong>Generate video storyboards</strong> with AI-optimized hooks, pacing, and structure</span>
                  </div>
                  <img
                    src="/beat.png"
                    alt="AI-generated storyboard beat showing script, visual direction, and pacing"
                    className="rounded-lg border border-border shadow-sm w-full"
                  />
                </div>
                {/* Analyzer feature */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm md:text-base text-muted-foreground">
                    <span className="text-primary mt-1">→</span>
                    <span><strong>Analyze YouTube Shorts</strong> to find retention issues before publishing</span>
                  </div>
                  <img
                    src="/structure_score.png"
                    alt="YouTube Shorts analysis score showing hook, structure, content, and delivery ratings"
                    className="rounded-lg border border-border shadow-sm w-full"
                  />
                </div>
              </div>
              <ul className="space-y-2 text-sm md:text-base text-muted-foreground mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">→</span>
                  <span><strong>Fix low-performing hooks</strong> with data-driven suggestions from viral patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">→</span>
                  <span><strong>Improve short-form video scripts</strong> beat by beat for better engagement</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border border-border shadow-md max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
              <span className="inline-flex items-center rounded-md bg-green-500/20 px-2 py-1 md:px-3 md:py-1.5 text-xs font-semibold text-green-400">
                ✓ Development in progress
              </span>
              <span className="inline-flex items-center rounded-md bg-primary/20 px-2 py-1 md:px-3 md:py-1.5 text-xs font-semibold text-primary">
                ✓ 7-Day Money-Back Guarantee
              </span>
            </div>
            <p className="text-2xl md:text-3xl lg:text-4xl text-foreground mb-2">
              <strong>$99/year</strong> or <strong>$199 lifetime</strong>
            </p>
            <p className="text-sm md:text-base text-muted-foreground mt-2 md:mt-3">
              Limited seats available — join as a Founding Member
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 max-w-2xl">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex flex-col gap-2">
                <a href="/pricing">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                  >
                    Join as a Founding Member
                  </Button>
                </a>
                <p className="text-sm text-muted-foreground text-center">$99/year or $199 lifetime · limited seats available</p>
              </div>
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
