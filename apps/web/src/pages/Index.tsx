import { HeroSection } from "@/components/HeroSection";
import { Section, SectionTitle, SectionGrid } from "@/components/Section";
import { Card, PricingCard } from "@/components/Card";
import { BulletList, CheckList, CrossList, NumberedSteps } from "@/components/Lists";
import { Callout } from "@/components/Callout";
import { Footer } from "@/components/Footer";
import { CTAForm } from "@/components/CTAForm";
import { QuestionButton } from "@/components/QuestionButton";
import { ComparisonExample } from "@/components/ComparisonExample";
import { TrustBadges } from "@/components/TrustBadges";
import { redirectToCheckout } from "@/lib/stripe";
import shortaLogo from "@/assets/shorta-logo.png";
import daleHeadshot from "@/assets/dale-ma-headshot.jpg";

const Index = () => {
  const scrollToCta = () => {
    document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-6">
        <div className="container mx-auto px-2">
          <img src={shortaLogo} alt="Shorta" className="h-36 md:h-40" />
        </div>
      </header>

      {/* Hero */}
      <HeroSection />

      {/* Problem */}
      <Section id="pain" maxWidth="narrow">
        <SectionTitle>The problem</SectionTitle>
        <p className="text-muted-foreground text-lg mb-6">
          Creating Shorts isn't hard. Creating Shorts that get watched is.
        </p>
        <BulletList
          items={[
            "Your hooks get skipped in the first 3 seconds — and you don't know why",
            "ChatGPT scripts sound like every other AI creator",
            "Competitors already went viral with YOUR idea — you're weeks behind",
            "Every failed Short costs you time, money, and algorithmic momentum",
          ]}
        />
      </Section>

      {/* Solution */}
      <Section id="solution">
        <SectionGrid columns={2}>
          <div>
            <SectionTitle>The Shorta solution</SectionTitle>
            <p className="text-muted-foreground mb-4">
              Shorta doesn't guess. It learns from real viral Shorts.
            </p>
            <p className="text-muted-foreground mb-6">
              Instead of asking you to write better prompts, Shorta studies what already works — hooks, structure, pacing, delivery — and generates storyboards with performance direction before you film.
            </p>
            <BulletList
              items={[
                "Fresh pattern analysis from recent viral Shorts",
                "Hook-to-content matching, not random viral hooks",
                "Ranked options so you pick fast",
              ]}
            />
          </div>
          <Card title="How it works">
            <NumberedSteps
              steps={[
                "Paste your channel or reference Shorts",
                "Shorta analyzes viral hooks and structure",
                "Enter a topic or angle",
                "Get 10–20 storyboards with performance notes",
                "Storyboards are auto-scored and ranked",
              ]}
            />
          </Card>
        </SectionGrid>
      </Section>

      {/* Your Shorts Library */}
      <Section id="library" maxWidth="narrow">
        <SectionTitle>Your Shorts Library</SectionTitle>
        <p className="text-muted-foreground text-lg mb-6">
          Save what works. Reuse it anytime.
        </p>
        <p className="text-muted-foreground mb-6">
          Shorta doesn't auto-dump everything you generate.
        </p>
        <p className="text-muted-foreground mb-8">
          You save the hooks and storyboards that matter — and those become your Shorts library.
        </p>
        
        <div className="mb-8">
          <p className="text-foreground font-medium text-lg mb-4">
            Most tools generate text and forget.
          </p>
          <p className="text-foreground font-medium text-lg mb-6">
            Shorta remembers.
          </p>
          <BulletList
            items={[
              "Save and organize winning hooks",
              "Reuse scripts instead of rewriting",
              "Compare and iterate, not guess",
            ]}
          />
        </div>

        <p className="text-muted-foreground mb-4">
          Over time, your library turns into a curated collection of:
        </p>
        <BulletList
          items={[
            "Proven hooks you want to reuse",
            "Ready-to-record storyboards with performance notes",
            "Variants you can compare and build on",
          ]}
          className="mb-6"
        />
        <p className="text-foreground font-medium">
          No clutter. No starting from scratch.
        </p>
        <p className="text-foreground font-medium">
          Just a system that compounds every good decision you make.
        </p>
      </Section>

      {/* Example */}
      <Section id="example">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3 text-center tracking-tight">ChatGPT vs Shorta</h2>
          <p className="text-center text-muted-foreground mb-8">
            Same prompt. Different results.
          </p>
          <ComparisonExample />
          <p className="text-center text-sm text-muted-foreground mt-6">
            <em>Note: This is a realistic mockup. Actual Shorta output will analyze your specific niche and channel data.</em>
          </p>
        </div>
      </Section>

      {/* What you get in V1 */}
      <Section id="v1">
        <SectionGrid columns={2}>
          <div>
            <SectionTitle>What Your AI Director Delivers</SectionTitle>
            <CheckList
              items={[
                "Storyboards with script + performance notes + visual direction",
                "Fresh viral hook analysis (trained on 10,000+ Shorts)",
                "Content-matched hook selection (hooks chosen for your topic)",
                "Delivery guidance (tone, pacing, emphasis, shot composition)",
                "Multiple variations per idea",
                "Automatic scoring & ranking",
              ]}
            />
          </div>
          <Card title="Not in V1 (yet)">
            <CrossList
              items={[
                "Full publishing automation",
                "Trend alerts",
                "Multi-platform posting",
              ]}
              className="mb-4"
            />
            <p className="text-sm text-muted-foreground">
              Clear scope. No surprises.
            </p>
          </Card>
        </SectionGrid>
      </Section>

      {/* Why this works */}
      <Section id="why" maxWidth="narrow">
        <SectionTitle>Why this works</SectionTitle>
        <p className="text-muted-foreground mb-4">
          Viral Shorts aren't random. They follow repeatable patterns: hook timing, narrative beats, emotional pacing.
        </p>
        <p className="text-muted-foreground">
          Shorta learns patterns from proven videos — and applies them systematically — so you can decide what to film before you hit record.
        </p>
      </Section>

      {/* Still skeptical */}
      <Section id="skeptical" maxWidth="narrow">
        <SectionTitle>Still skeptical? Here's why hooks matter.</SectionTitle>

        <p className="text-foreground font-medium mb-4">
          Short-form platforms don't guess what to promote — they measure it.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-foreground font-semibold mb-3">What the data consistently shows:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Platforms rank Shorts based on early retention and watch time</li>
              <li>• Videos that keep viewers past the first 3–5 seconds get wider distribution</li>
              <li>• Higher retention increases rewatches and loop cycles, compounding reach</li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-3">What platforms & creators agree on:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• YouTube explicitly teaches creators to optimize the first seconds to improve performance</li>
              <li>• Short-form growth guides show that improving the opening line alone can lift retention — even when the rest of the video stays the same</li>
              <li>• High-retention Shorts are more likely to be replayed, a strong signal for discovery</li>
            </ul>
          </div>

          <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
            <p className="text-foreground font-semibold text-lg">
              In short:
            </p>
            <p className="text-foreground mt-2">
              Better hooks → higher retention → more loops → more reach.
            </p>
            <p className="text-muted-foreground mt-4">
              That's exactly the layer Shorta focuses on.
            </p>
          </div>

          <p className="text-xs text-muted-foreground italic text-center">
            Based on public platform guidance and creator analytics — not guesswork.
          </p>
        </div>
      </Section>

      {/* FAQ Lite */}
      <Section id="faq-lite" maxWidth="narrow">
        <SectionTitle>Frequently asked questions</SectionTitle>
        <div className="space-y-8">
          <div>
            <h3 className="text-foreground font-semibold mb-3">Can't I just use ChatGPT?</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>
                You can — but ChatGPT is trained on old data and gives you generic hooks.
              </p>
              <p>
                Shorta analyzes recent viral Shorts, extracts what's working now, and matches the best hook to your specific content — not just random viral patterns.
              </p>
              <p>
                It's like having a researcher who watches trending Shorts daily and tells you exactly which hook will work for your topic.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-3">How long does it take to generate scripts?</h3>
            <p className="text-muted-foreground">
              Less than 5 minutes. Paste your references, enter your topic, and get 10-20 ranked scripts instantly.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-3">Can I use this for TikTok or Instagram Reels?</h3>
            <p className="text-muted-foreground">
              You can — the principles of viral short-form content apply across platforms. However, our current focus is on YouTube Shorts, so the analysis and patterns are optimized for that platform.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-3">Do you store my channel data?</h3>
            <p className="text-muted-foreground">
              We store summarized channel data (not raw videos) so the AI can generate the best content specifically for your audience and style. Your data is never shared with third parties.
            </p>
          </div>
        </div>
      </Section>

      {/* Audience */}
      <Section id="audience">
        <SectionGrid columns={2}>
          <div>
            <SectionTitle>Who it's for</SectionTitle>
            <CheckList
              items={[
                "YouTube Shorts creators",
                "Creators repurposing long-form content",
                "Solo creators & small teams",
              ]}
            />
          </div>
          <div>
            <SectionTitle>Who it's not for</SectionTitle>
            <CrossList
              items={[
                "Long-form-only channels",
                "Fully automated spam content",
              ]}
            />
          </div>
        </SectionGrid>
      </Section>

      {/* Pricing */}
      <Section id="pricing">
        <SectionGrid columns={2}>
          <div>
            <SectionTitle>Founding Member pricing</SectionTitle>
            <p className="text-muted-foreground mb-6">
              One plan. One price. Keep it forever.
            </p>
            <BulletList
              items={[
                "Full access to Shorta V1",
                "Grandfathered pricing (keep this price after launch)",
                "Priority feedback & roadmap influence",
                "Direct access to the founder",
              ]}
            />
            <div className="mt-6 p-4 bg-surface rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">Value breakdown:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• $199/year = $16.58/month</li>
                <li>• Less than one freelance script ($50-200 each)</li>
                <li>• Replaces hours of manual research per video</li>
              </ul>
            </div>
          </div>
          <PricingCard
            title="Founding Member"
            price="$199"
            period="year"
            badges={["Grandfathered", "Only 50 spots"]}
            finePrint={<>Public launch price: <strong>$399 / year</strong></>}
            ctaLabel="Join as a Founding Member"
            onCtaClick={redirectToCheckout}
          />
        </SectionGrid>
      </Section>

      {/* Plan */}
      <Section id="plan" maxWidth="narrow">
        <SectionTitle>Kickoff, delivery, guarantee</SectionTitle>
        <div className="space-y-3 text-foreground mb-8">
          <p>
            Development starts immediately once <strong>5 Founding Members</strong> join.
          </p>
          <p>
            If we don't reach 5 members by <strong>January 31, 2026</strong>, you'll receive a full refund.
          </p>
          <p>
            Target ship window: within <strong>60 days</strong> after kickoff.
          </p>
          <p>
            If we miss the ship window: <strong>full refund</strong>, no questions asked.
          </p>
          <p>
            After launch: <strong>14-day money-back guarantee</strong> if you're not satisfied.
          </p>
        </div>
        <Callout
          title="You're not buying hype."
          text="You're triggering the build."
          variant="subtle"
        />
      </Section>

      {/* Founder */}
      <Section id="founder" maxWidth="narrow">
        <SectionTitle>About the founder</SectionTitle>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <img
              src={daleHeadshot}
              alt="Dale Ma"
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <h3 className="text-foreground font-semibold mb-1">Dale Ma</h3>
              <div className="flex gap-3 text-sm">
                <a
                  href="https://x.com/eguitarz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Twitter
                </a>
                <a
                  href="https://www.linkedin.com/in/dalema/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Hi, I'm Dale Ma. I built productivity tools and infra for developers at Meta, where speed and clarity matter. The best results didn't come from better prompts — they came from having the right context.
            </p>
            <p>
              Context switching — jumping between examples, references, and half-formed ideas — was always the real cost. Content creation turned out to be the same problem.
            </p>
            <p>
              Shorta is my attempt to solve that by bringing the right examples together, extracting patterns automatically, and turning context into decisions you can act on before hitting record.
            </p>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section id="cta" background="surface" className="my-8">
        <SectionGrid columns={2}>
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
              Join as a Founding Member
            </h2>
            <p className="text-muted-foreground mb-8">
              Only 50 Founding Member spots. Grandfathered price.
            </p>
            <div className="space-y-3 text-foreground">
              <p>
                <strong>$199 / year</strong> (grandfathered)
              </p>
              <p>
                Public launch: <strong>$399 / year</strong>
              </p>
              <p>
                Ships within <strong>60 days</strong> after kickoff or <strong>full refund</strong>
              </p>
            </div>
          </div>
          <div>
            <CTAForm />
          </div>
        </SectionGrid>
      </Section>

      {/* Footer */}
      <Footer
        items={[
          { text: "© Shorta", variant: "muted" },
          { text: "Privacy", href: "/privacy" },
          { text: "Terms", href: "/terms" },
          { text: "Contact", href: "mailto:support@shorta.ai" },
        ]}
      />

      {/* Fixed Question Button */}
      <QuestionButton />
    </div>
  );
};

export default Index;
