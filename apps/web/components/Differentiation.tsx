"use client";

export function Differentiation() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ChatGPT */}
      <div className="bg-surface rounded-lg p-8 border border-border">
        <h3 className="text-2xl font-semibold text-foreground mb-6">ChatGPT</h3>
        <ul className="space-y-4 text-lg text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="text-red-500 mt-1 text-xl">×</span>
            <span>One-shot script generation</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 mt-1 text-xl">×</span>
            <span>No understanding of what failed in real Shorts</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 mt-1 text-xl">×</span>
            <span>No memory of past Shorts</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 mt-1 text-xl">×</span>
            <span>Same advice every time unless you prompt better</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 mt-1 text-xl">×</span>
            <span>Can't directly watch Shorts</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 mt-1 text-xl">×</span>
            <span>Requires manual transcription & context</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-red-500 mt-1 text-xl">×</span>
            <span>Misses gestures, pacing, captions</span>
          </li>
        </ul>
      </div>

      {/* Shorta */}
      <div className="bg-primary/5 rounded-lg p-8 border border-primary/20">
        <h3 className="text-2xl font-semibold text-foreground mb-6">Shorta</h3>
        <ul className="space-y-4 text-lg text-foreground">
          <li className="flex items-start gap-3">
            <span className="text-green-500 mt-1 text-xl">✓</span>
            <span>Analyzes existing Shorts</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 mt-1 text-xl">✓</span>
            <span>Watches real YouTube Shorts directly</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 mt-1 text-xl">✓</span>
            <span>Understands gestures, pacing, captions</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 mt-1 text-xl">✓</span>
            <span>Tells you what broke and why</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 mt-1 text-xl">✓</span>
            <span>Rule-based linting (consistent, repeatable)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 mt-1 text-xl">✓</span>
            <span>Remembers past Shorts and patterns</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 mt-1 text-xl">✓</span>
            <span>Guides the next iteration</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 mt-1 text-xl">✓</span>
            <span>Turns feedback into next storyboard</span>
          </li>
        </ul>
      </div>

      <div className="pt-4 text-center">
        <p className="text-xl font-medium text-foreground mb-2">
          ChatGPT gives answers.
        </p>
        <p className="text-xl font-medium text-primary">
          Shorta gives feedback.
        </p>
      </div>
    </div>
  );
}
