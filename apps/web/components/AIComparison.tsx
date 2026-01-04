// @ts-nocheck
"use client";

import { useState } from "react";
import { Section, SectionTitle } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function AIComparison() {
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  return (
    <Section id="ai-comparison" background="surface">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Even AI agrees: storyboards beat scripts
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Same prompt. Same task. Independent AI judges.
          </p>
        </div>

        {/* Row 1 - Input (Full width) */}
        <div className="mb-12">
          <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Identical input
          </p>
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="bg-background/50 rounded p-6 font-mono text-base text-foreground leading-relaxed">
              Write AI model trend for 2025.<br />
              Talking head. 15s.
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3 text-center">
            Exact same prompt used for all outputs and judges.
          </p>
        </div>

        {/* Row 2 - Outputs (2 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Column Left - ChatGPT Output */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">ChatGPT</h3>
              <span className="text-xs bg-muted px-3 py-1.5 rounded-full font-semibold">
                Script output
              </span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              <li>• Text-only talking-head script</li>
              <li>• Linear structure</li>
              <li>• No pacing, visuals, or retention cues</li>
            </ul>
            <img
              src="/chatgpt_output.png"
              alt="ChatGPT script output"
              className="w-full rounded-lg border border-border shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setViewerImage("/chatgpt_output.png")}
            />
          </div>

          {/* Column Right - Shorta Output */}
          <div className="bg-card rounded-lg p-6 border border-primary/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">Shorta</h3>
              <span className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-full font-semibold">
                Shorts-native storyboard
              </span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              <li>• Visual beats & pacing</li>
              <li>• Director notes</li>
              <li>• Built for attention and retention</li>
            </ul>
            <img
              src="/storyboard_example.png"
              alt="Shorta storyboard UI"
              className="w-full rounded-lg border border-border shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setViewerImage("/storyboard_example.png")}
            />
          </div>
        </div>

        {/* Row 3 - Judges (3 columns with styling) */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Column 1 - Grok (rotated left, offset down) */}
            <div className="transform md:-rotate-2 md:translate-y-2">
              <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Grok verdict</p>
                <p className="text-lg font-bold text-foreground mb-4">
                  Winner: <span className="text-primary">Shorta storyboard</span>
                </p>
                <img
                  src="/grok_judge.png"
                  alt="Grok judge response"
                  className="w-full rounded border border-border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setViewerImage("/grok_judge.png")}
                />
              </div>
            </div>

            {/* Column 2 - Gemini (no rotation, larger, centered) */}
            <div className="md:scale-105">
              <div className="bg-card rounded-lg p-4 border border-border shadow-xl">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Gemini verdict</p>
                <p className="text-lg font-bold text-foreground mb-4">
                  Winner: <span className="text-primary">Shorta storyboard</span>
                </p>
                <img
                  src="/gemini_judge.png"
                  alt="Gemini judge response"
                  className="w-full rounded border border-border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setViewerImage("/gemini_judge.png")}
                />
              </div>
            </div>

            {/* Column 3 - ChatGPT (rotated right, offset up) */}
            <div className="transform md:rotate-3 md:-translate-y-2">
              <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
                <p className="text-sm font-semibold text-muted-foreground mb-2">ChatGPT verdict</p>
                <p className="text-lg font-bold text-foreground mb-4">
                  Winner: <span className="text-primary">Shorta storyboard</span>
                </p>
                <img
                  src="/chatgot_judge.png"
                  alt="ChatGPT judge response"
                  className="w-full rounded border border-border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setViewerImage("/chatgot_judge.png")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Verdict Strip */}
        <div className="mb-12 text-center">
          <div className="inline-block bg-primary/10 border border-primary/30 rounded-lg px-8 py-4 mb-3">
            <p className="text-xl md:text-2xl font-bold text-foreground">
              ChatGPT · Gemini · Grok → <span className="text-primary">Winner: Shorta Storyboard</span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Judged independently. No leading. "Just tell me who won."
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
          ChatGPT gives you words. Shorta gives you a system built for retention.
        </p>
      </div>

      {/* Image Viewer Modal */}
      {viewerImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewerImage(null)}
          onKeyDown={(e) => e.key === "Escape" && setViewerImage(null)}
        >
          <button
            onClick={() => setViewerImage(null)}
            className="absolute top-4 right-4 p-2 bg-background/90 rounded-full hover:bg-background transition-colors"
            aria-label="Close image viewer"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
          <img
            src={viewerImage}
            alt="Full size view"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Section>
  );
}
