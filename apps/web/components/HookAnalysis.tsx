"use client";

import { Section, SectionTitle } from "@/components/Section";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HookAnalysis() {
  return (
    <Section id="hook-analysis">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <SectionTitle>See why it failed, and how to fix it</SectionTitle>
        <p className="text-lg md:text-xl text-muted-foreground text-center mb-16 max-w-3xl mx-auto">
          Most Shorts lose viewers in the first 2 seconds. Here's why.
        </p>

        {/* Example 1 */}
        <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto mb-24">
          {/* Left: Portrait Screenshot */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-[280px]">
              <img
                src="/ali.jpg"
                alt="YouTube Short screenshot"
                className="w-full h-auto rounded-2xl shadow-xl border border-border"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3">
                <p className="text-white text-sm font-medium leading-relaxed">
                  "Yo gang, um we have Black Friday coming up"
                </p>
              </div>
            </div>
          </div>

          {/* Right: Analysis */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
                Original hook:
              </h3>
              <p className="text-lg text-foreground">
                "Yo gang, um we have Black Friday coming up"
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
                Re-hook example:
              </h3>
              <p className="text-lg text-foreground font-medium">
                "I'm probably going to get in trouble for this..."
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
                Why this works:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Creates immediate curiosity through implied risk
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Uses a pattern-interrupt to stop the scroll
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Establishes an unscripted, genuine human moment
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Example 2 - Reversed Layout */}
        <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto mb-24">
          {/* Left: Analysis */}
          <div className="flex flex-col justify-center space-y-6 md:order-1">
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
                Original hook:
              </h3>
              <p className="text-lg text-foreground">
                "Roblox players have you seen this?"
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
                Re-hook example:
              </h3>
              <p className="text-lg text-foreground font-medium">
                "Roblox just quietly removed their most iconic shirt."
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
                Why this works:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Leverages nostalgia to trigger immediate emotional response
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Creates information gap by implying a secret change
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Uses urgent, definitive language to demand attention
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Portrait Screenshot */}
          <div className="flex justify-center md:order-2">
            <div className="relative w-full max-w-[280px]">
              <img
                src="/kreek.jpg"
                alt="YouTube Short screenshot"
                className="w-full h-auto rounded-2xl shadow-xl border border-border"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3">
                <p className="text-white text-sm font-medium leading-relaxed">
                  "Roblox players have you seen this?"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example 3 */}
        <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
          {/* Left: Portrait Screenshot */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-[280px]">
              <img
                src="/mel.jpg"
                alt="YouTube Short screenshot"
                className="w-full h-auto rounded-2xl shadow-xl border border-border"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3">
                <p className="text-white text-sm font-medium leading-relaxed">
                  "Their behavior is telling you the truth."
                </p>
              </div>
            </div>
          </div>

          {/* Right: Analysis */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
                Original hook:
              </h3>
              <p className="text-lg text-foreground">
                "Their behavior is telling you the truth."
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
                Re-hook example:
              </h3>
              <p className="text-lg text-foreground font-medium">
                "Stop ignoring what they're actually doing."
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
                Why this works:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Uses a direct command to interrupt scrolling
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Targets a universal relationship pain point
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Creates immediate tension between behavior and belief
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-12">
          <Button variant="hero" size="lg" asChild>
            <Link href="/pricing">View Plans</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
