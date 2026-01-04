// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const shortaLogo = "/shorta-logo.png";

export default function LaunchingSoonPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="mb-8">
        <img src={shortaLogo} alt="Shorta" className="h-16 w-16" />
      </header>

      {/* Main Card */}
      <Card className="w-full max-w-2xl p-8 md:p-12">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Rocket className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            We're Launching Soon!
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            Shorta is currently in final development. We'll notify you as soon as we launch!
          </p>

          {/* Launch Timeline */}
          <div className="bg-surface rounded-xl p-6 mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              What's Happening
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Development Underway</p>
                  <p className="text-sm text-muted-foreground">
                    Building the viral hook analysis engine and storyboard generator
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Founding Members Confirmed</p>
                  <p className="text-sm text-muted-foreground">
                    Early supporters are locked in with grandfathered pricing
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-foreground font-medium">Launch Coming Soon</p>
                  <p className="text-sm text-muted-foreground">
                    You'll get early access as soon as we're ready
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What You'll Get */}
          <div className="bg-primary/5 rounded-xl p-6 border border-primary/20 mb-8">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              When We Launch, You'll Get
            </h2>
            <div className="grid md:grid-cols-2 gap-3 text-left text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">AI-powered viral hook analysis</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">Storyboard generation with performance notes</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">Content-matched hook selection</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">Your personal Shorts library</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/")}
              variant="default"
              size="lg"
              className="w-full md:w-auto px-8"
            >
              Return to Homepage
            </Button>
            <div>
              <button
                onClick={handleSignOut}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Questions?{" "}
          <a
            href="mailto:support@shorta.ai"
            className="text-primary hover:underline"
          >
            support@shorta.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
