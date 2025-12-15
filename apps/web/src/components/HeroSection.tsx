import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/Card";
import { FlowList } from "@/components/Lists";
import { TrustBadges } from "@/components/TrustBadges";
import { WaitlistForm } from "@/components/WaitlistForm";
import { redirectToCheckout } from "@/lib/stripe";
import { motion } from "framer-motion";

const workflowSteps = [
  "Paste channel or reference Shorts",
  "Analyze viral hooks & structure",
  "Generate 10–20 scripts",
  "Auto-score and rank the best",
];

export function HeroSection() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="pt-3 pb-10 md:pt-4 md:pb-16">
      <div className="container mx-auto px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="outline">Founding seats limited</Badge>
              <Badge variant="outline">Build starts at 5 members</Badge>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Every script starts with a proven hook.
            </h1>

            <p className="text-lg md:text-xl text-foreground mb-4">
              Built specifically for Shorts performance — not general content generation.
            </p>

            <p className="text-muted-foreground text-lg mb-8 max-w-xl">
              Shorta analyzes recent viral Shorts and matches proven hooks to your specific content — not generic AI guesses.
            </p>

            <div className="bg-surface rounded-xl p-5 mb-8 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                  ✓ 14-Day Money-Back Guarantee
                </span>
              </div>
              <p className="text-2xl md:text-3xl text-foreground mb-1">
                <strong>$199 / year</strong> — Founding Member (grandfathered)
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Public launch price: <strong>$399 / year</strong>
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <Button
                variant="hero"
                size="xl"
                onClick={redirectToCheckout}
              >
                Join as a Founding Member
              </Button>
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Not ready? Join the waitlist
                </p>
                <WaitlistForm />
              </div>
              <button
                onClick={() => scrollToSection("example")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              >
                View Example
              </button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1 mb-6">
              <p>Only 50 Founding Member spots</p>
              <p>Development kicks off at <strong>5 members</strong></p>
              <p>Ships within <strong>60 days</strong> or full refund</p>
            </div>

            <TrustBadges />
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <Card title="How Shorta works">
              <FlowList steps={workflowSteps} />
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
