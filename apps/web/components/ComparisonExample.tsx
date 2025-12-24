import { Card } from "@/components/Card";
import { CheckCircle, XCircle } from "lucide-react";

export function ComparisonExample() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* ChatGPT Example */}
      <Card className="relative">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-foreground">ChatGPT Output</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm font-mono text-muted-foreground mb-2">Prompt: Write a YouTube Shorts script about productivity tips</p>
            <div className="text-sm space-y-2 text-foreground">
              <p className="font-semibold">Hook:</p>
              <p>"Want to be more productive? Here are 3 tips that will change your life."</p>

              <p className="font-semibold mt-3">Body:</p>
              <p>1. Wake up early<br/>
              2. Use a to-do list<br/>
              3. Take breaks</p>

              <p className="font-semibold mt-3">CTA:</p>
              <p>"Try these tips and let me know how it goes!"</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span className="text-muted-foreground">Generic hook - no pattern matching</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span className="text-muted-foreground">No data on what actually works</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span className="text-muted-foreground">Sounds like everyone else</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span className="text-muted-foreground">No scoring or ranking</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Shorta Example */}
      <Card className="relative border-primary/50">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-foreground">Shorta Storyboard</h3>
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Score: 8.7/10</span>
        </div>

        <div className="space-y-4">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-mono text-muted-foreground mb-3">Analyzed 47 viral productivity Shorts</p>
            <div className="text-sm space-y-3 text-foreground">
              <div className="border-l-2 border-primary pl-3">
                <p className="font-semibold">HOOK (0-3s) <span className="text-xs text-primary ml-1">Pattern: "Confession + Outcome"</span></p>
                <p className="mt-1">💬 "I used to waste 4 hours a day on my phone. Here's the one trick that got me those 4 hours back."</p>
                <p className="text-xs text-muted-foreground mt-2">📸 Direct to camera, lean forward slightly</p>
                <p className="text-xs text-muted-foreground">🎭 Lower voice on "4 hours", pause after "back"</p>
                <p className="text-xs text-primary mt-1">✅ Why: Specific loss + confession creates immediate relatability</p>
              </div>

              <div className="border-l-2 border-primary/50 pl-3">
                <p className="font-semibold">SETUP (3-8s)</p>
                <p className="mt-1">💬 "Delete social apps from home screen. Set limits with real consequences."</p>
                <p className="text-xs text-muted-foreground mt-2">📸 Cut to phone screen recording or B-roll</p>
                <p className="text-xs text-muted-foreground">🎭 Maintain energy, emphasize "real consequences"</p>
              </div>

              <div className="border-l-2 border-primary/30 pl-3">
                <p className="font-semibold">PAYOFF (8-12s)</p>
                <p className="mt-1">💬 "Replace scroll time with ONE task. Try for 3 days—comment if you got your time back."</p>
                <p className="text-xs text-muted-foreground mt-2">📸 Back to face, slight smile</p>
                <p className="text-xs text-muted-foreground">🎭 Emphasize "ONE" and "3 days" for specificity</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-muted-foreground">Storyboard with performance + visual direction</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-muted-foreground">Hook matches viral pattern from recent data</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-muted-foreground">Specific delivery notes (tone, pacing, emphasis)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-muted-foreground">Ranked #1 out of 12 generated variations</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
