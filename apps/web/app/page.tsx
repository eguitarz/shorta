"use client";

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
import { Button } from "@/components/ui/button";
import { redirectToCheckout } from "@/lib/stripe";
import { UseCases } from "@/components/UseCases";
import { Differentiation } from "@/components/Differentiation";
import { AIComparison } from "@/components/AIComparison";
import { CreativityLoop } from "@/components/CreativityLoop";

const shortaLogo = "/shorta-logo.png";
const daleHeadshot = "/dale-ma-headshot.jpg";

export default function HomePage() {
  const scrollToCta = () => {
    document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-6 pb-4">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={shortaLogo} alt="Shorta" className="h-16 w-16" />
              <span className="text-2xl font-semibold text-foreground">Shorta AI</span>
            </div>
            <button
              onClick={redirectToCheckout}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg text-base"
            >
              Join as a Founding Member
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <HeroSection />

      {/* AI Comparison */}
      <AIComparison />

      {/* Creativity Loop */}
      <CreativityLoop />

      {/* Use Cases */}
      <Section id="use-cases">
        <SectionTitle>Who uses Shorta</SectionTitle>
        <UseCases />
        <div className="flex justify-center mt-12">
          <Button variant="hero" size="lg" onClick={redirectToCheckout}>
            Join as a Founding Member
          </Button>
        </div>
      </Section>

      {/* Differentiation */}
      <Section id="differentiation">
        <SectionTitle>Shorta vs ChatGPT</SectionTitle>
        <Differentiation />
        <div className="flex justify-center mt-12">
          <Button variant="hero" size="lg" onClick={redirectToCheckout}>
            Join as a Founding Member
          </Button>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" maxWidth="narrow">
        <SectionTitle>Frequently asked questions</SectionTitle>
        <div className="space-y-10">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Is Shorta just another AI script generator?</h3>
            <p className="text-lg text-muted-foreground">
              No. Shorta focuses on analysis and feedback first. Generation is optional and guided by what actually needs fixing.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Why don't you offer a monthly plan?</h3>
            <p className="text-lg text-muted-foreground">
              Building a successful YouTube Shorts channel is a long-term business, not a quick experiment. Annual pricing ensures you're committed to the process and gives you enough runway to see real results. We're building for creators who are serious about growth.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Can't I just use ChatGPT?</h3>
            <div className="space-y-4 text-lg text-muted-foreground">
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
            <h3 className="text-xl font-semibold text-foreground mb-4">What if my niche isn't productivity or AI?</h3>
            <p className="text-lg text-muted-foreground">
              Shorta analyzes structure and viewer behavior patterns, not niche-specific buzzwords.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Will this replace my creativity?</h3>
            <p className="text-lg text-muted-foreground">
              No. It removes uncertainty so you can focus on creative decisions that matter.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">How long does it take to generate scripts?</h3>
            <p className="text-lg text-muted-foreground">
              Less than 5 minutes. Paste your references, enter your topic, and get high quality storyboard instantly.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Can I use this for TikTok or Instagram Reels?</h3>
            <p className="text-lg text-muted-foreground">
              You can — the principles of viral short-form content apply across platforms. However, our current focus is on YouTube Shorts, so the analysis and patterns are optimized for that platform.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Do you store my channel data?</h3>
            <p className="text-lg text-muted-foreground">
              We store summarized channel data (not raw videos) so the AI can generate the best content specifically for your audience and style. Your data is never shared with third parties.
            </p>
          </div>
        </div>
        <div className="flex justify-center mt-12">
          <Button variant="hero" size="lg" onClick={redirectToCheckout}>
            Join as a Founding Member
          </Button>
        </div>
      </Section>

      {/* Founder */}
      <Section id="founder" maxWidth="narrow">
        <SectionTitle>What Shorta changed in my workflow</SectionTitle>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <img
              src={daleHeadshot}
              alt="Dale Ma"
              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-2">Dale Ma</h3>
              <div className="flex gap-3 text-base">
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
          <div className="space-y-5 text-lg text-muted-foreground">
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

      {/* Pricing */}
      <Section id="pricing">
        <SectionGrid columns={2}>
          <div>
            <SectionTitle>Founding Member pricing</SectionTitle>
            <p className="text-lg text-muted-foreground mb-6">
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
            <div className="mt-6 p-5 bg-surface rounded-lg border border-border">
              <p className="text-base text-muted-foreground mb-3">Value breakdown:</p>
              <ul className="text-base text-muted-foreground space-y-2">
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
        <div className="space-y-4 text-lg text-foreground mb-8">
          <p>
            Development is <strong>underway</strong>.
          </p>
          <p>
            Launch: <strong>End of February 2026</strong>.
          </p>
          <p>
            After launch: <strong>7-day money-back guarantee</strong> if you're not satisfied.
          </p>
        </div>
        <Callout
          title="Development is underway. Join before launch."
          text="Try the beta before public release."
          variant="subtle"
        />
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
                Launches <strong>February 2026</strong>. <strong>7-day money-back guarantee</strong>
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
          { text: "Blog", href: "/blog" },
          { text: "Privacy", href: "/privacy" },
          { text: "Terms", href: "/terms" },
          { text: "Contact", href: "mailto:support@shorta.ai" },
        ]}
      />

      {/* Fixed Question Button */}
      <QuestionButton />
    </div>
  );
}
