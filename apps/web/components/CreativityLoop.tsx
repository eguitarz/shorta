// @ts-nocheck
"use client";

import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown, ArrowUp, RotateCw } from "lucide-react";

export function CreativityLoop() {
  return (
    <Section id="creativity-loop">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            The Shorts Creativity Loop
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Shorta turns every Short into input for the next one.
          </p>
        </div>

        {/* Flow 1: Primary Loop (Row 1) */}
        <div className="mb-16">
          <h3 className="text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-wide text-center">
            The Loop
          </h3>

          {/* Desktop: Horizontal Flow */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between gap-4">
              {/* Node 1: Video */}
              <div className="flex-1">
                <div className="bg-card border border-border rounded-lg p-6 text-center shadow-md">
                  <div className="text-4xl mb-2">📹</div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Video</h3>
                  <p className="text-sm text-muted-foreground">What you published</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-1">
                <div className="h-0.5 w-12 bg-primary"></div>
                <ArrowRight className="w-6 h-6 text-primary flex-shrink-0" />
              </div>

              {/* Node 2: Analysis */}
              <div className="flex-1">
                <div className="bg-card border border-primary/50 rounded-lg p-6 text-center shadow-md">
                  <div className="text-4xl mb-2">🔍</div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Analysis</h3>
                  <p className="text-sm text-muted-foreground">What worked, what failed</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-1">
                <div className="h-0.5 w-12 bg-primary"></div>
                <ArrowRight className="w-6 h-6 text-primary flex-shrink-0" />
              </div>

              {/* Node 3: Improved Storyboard */}
              <div className="flex-1">
                <div className="bg-card border border-border rounded-lg p-6 text-center shadow-md">
                  <div className="text-4xl mb-2">📋</div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Improved Storyboard</h3>
                  <p className="text-sm text-muted-foreground">Fixes applied</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-1">
                <div className="h-0.5 w-12 bg-primary"></div>
                <ArrowRight className="w-6 h-6 text-primary flex-shrink-0" />
              </div>

              {/* Node 4: Ship Again */}
              <div className="flex-1">
                <div className="bg-card border border-border rounded-lg p-6 text-center shadow-md">
                  <div className="text-4xl mb-2">🚀</div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Video</h3>
                  <p className="text-sm text-muted-foreground">Ship again</p>
                </div>
              </div>
            </div>

            {/* Loop back arrow with curves */}
            <div className="relative mt-8 mb-4">
              <svg className="w-full h-16" viewBox="0 0 800 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Right curve down */}
                <path
                  d="M 750 0 Q 750 32 720 32"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                  fill="none"
                />
                {/* Right horizontal line */}
                <line x1="720" y1="32" x2="520" y2="32" stroke="currentColor" strokeWidth="2" className="text-primary" />

                {/* Left arrow pointing left */}
                <path d="M 520 32 L 528 28 L 528 36 Z" fill="currentColor" className="text-primary" />

                {/* Left horizontal line */}
                <line x1="280" y1="32" x2="80" y2="32" stroke="currentColor" strokeWidth="2" className="text-primary" />

                {/* Left curve up */}
                <path
                  d="M 80 32 Q 50 32 50 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                  fill="none"
                />

                {/* Right arrow pointing left */}
                <path d="M 280 32 L 288 28 L 288 36 Z" fill="currentColor" className="text-primary" />
              </svg>

              {/* Text centered */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-3">
                <p className="text-sm text-muted-foreground whitespace-nowrap">Loop back to start</p>
              </div>
            </div>
          </div>

          {/* Mobile: Vertical Stack */}
          <div className="md:hidden space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 text-center shadow-md">
              <div className="text-4xl mb-2">📹</div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Video</h3>
              <p className="text-sm text-muted-foreground">What you published</p>
            </div>
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-0.5 h-8 bg-primary"></div>
                <ArrowDown className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="bg-card border border-primary/50 rounded-lg p-6 text-center shadow-md">
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Analysis</h3>
              <p className="text-sm text-muted-foreground">What worked, what failed</p>
            </div>
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-0.5 h-8 bg-primary"></div>
                <ArrowDown className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center shadow-md">
              <div className="text-4xl mb-2">📋</div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Improved Storyboard</h3>
              <p className="text-sm text-muted-foreground">Fixes applied</p>
            </div>
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-0.5 h-8 bg-primary"></div>
                <ArrowDown className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center shadow-md">
              <div className="text-4xl mb-2">🚀</div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Video</h3>
              <p className="text-sm text-muted-foreground">Ship again</p>
            </div>
            <div className="flex justify-center items-center gap-2">
              <RotateCw className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Loop back</p>
            </div>
          </div>
        </div>

        {/* Flow 2: Secondary Flow (Row 2) */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-wide text-center">
            First-time creation
          </h3>

          <div className="bg-card/30 rounded-lg p-8 border border-border/50">
            {/* Desktop: Horizontal with upward arrow */}
            <div className="hidden md:block">
              <div className="flex items-center justify-center gap-4 mb-8">
                {/* Idea */}
                <div className="text-center">
                  <div className="bg-card border border-border rounded-lg p-6 shadow-sm w-40">
                    <div className="text-3xl mb-1">💡</div>
                    <p className="text-sm font-semibold text-foreground">Idea</p>
                  </div>
                </div>

                {/* Arrow - Different Color */}
                <div className="flex items-center gap-1">
                  <div className="h-0.5 w-12 bg-muted-foreground"></div>
                  <ArrowRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                </div>

                {/* Storyboard */}
                <div className="text-center">
                  <div className="bg-card border border-border rounded-lg p-6 shadow-sm w-40">
                    <div className="text-3xl mb-1">📋</div>
                    <p className="text-sm font-semibold text-foreground">Storyboard</p>
                  </div>
                </div>

                {/* Arrow - Different Color */}
                <div className="flex items-center gap-1">
                  <div className="h-0.5 w-12 bg-muted-foreground"></div>
                  <ArrowRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                </div>

                {/* Video */}
                <div className="text-center relative">
                  <div className="bg-card border border-border rounded-lg p-6 shadow-sm w-40">
                    <div className="text-3xl mb-1">📹</div>
                    <p className="text-sm font-semibold text-foreground">Video</p>
                  </div>

                  {/* Upward arrow pointing to Flow 1 */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-24 flex flex-col items-center gap-1">
                    <ArrowUp className="w-6 h-6 text-blue-500" />
                    <div className="w-0.5 h-16 bg-blue-500"></div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Once published, every video enters the same analysis loop.
              </p>
            </div>

            {/* Mobile: Vertical */}
            <div className="md:hidden space-y-4">
              <div className="bg-card border border-border rounded-lg p-6 text-center shadow-sm">
                <div className="text-3xl mb-1">💡</div>
                <p className="text-sm font-semibold text-foreground">Idea</p>
              </div>
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-0.5 h-8 bg-muted-foreground"></div>
                  <ArrowDown className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center shadow-sm">
                <div className="text-3xl mb-1">📋</div>
                <p className="text-sm font-semibold text-foreground">Storyboard</p>
              </div>
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-0.5 h-8 bg-muted-foreground"></div>
                  <ArrowDown className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center shadow-sm">
                <div className="text-3xl mb-1">📹</div>
                <p className="text-sm font-semibold text-foreground">Video</p>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Once published, every video enters the same analysis loop.
              </p>
            </div>
          </div>
        </div>

        {/* Supporting Copy */}
        <div className="text-center mb-12">
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Most tools stop at generation.<br />
            Shorta closes the loop — from performance to better output.
          </p>
        </div>

        {/* CTA Row */}
        <div className="flex items-center justify-center mb-8">
          <Button variant="hero" size="lg" onClick={() => window.location.href = '#cta'}>
            Join as a Founding Member
          </Button>
        </div>

        {/* Micro-copy */}
        <p className="text-sm text-muted-foreground text-center">
          Shorta isn't a one-off generator. It's a system.
        </p>
      </div>
    </Section>
  );
}
