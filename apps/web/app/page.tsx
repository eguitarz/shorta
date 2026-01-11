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
import { HookAnalysis } from "@/components/HookAnalysis";

const shortaLogo = "/shorta-logo.png";
const daleHeadshot = "/dale-ma-headshot.jpg";

export default function HomePage() {
  const scrollToCta = () => {
    document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-4 pb-3 md:pt-6 md:pb-4">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <img src={shortaLogo} alt="Shorta" className="h-12 w-12 md:h-16 md:w-16" />
              <span className="text-lg md:text-2xl font-semibold text-foreground">Shorta AI</span>
            </div>
            <button
              onClick={() => redirectToCheckout()}
              className="bg-primary text-primary-foreground px-3 py-2 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base whitespace-nowrap"
            >
              <span className="hidden sm:inline">Join as a Founding Member</span>
              <span className="sm:hidden">Join Now</span>
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

      {/* Hook Analysis */}
      <HookAnalysis />

      {/* Use Cases */}
      <Section id="use-cases">
        <SectionTitle>Who uses Shorta</SectionTitle>
        <UseCases />
        <div className="flex justify-center mt-12">
          <Button variant="hero" size="lg" onClick={() => redirectToCheckout()}>
            Join as a Founding Member
          </Button>
        </div>
      </Section>

      {/* Differentiation */}
      <Section id="differentiation">
        <SectionTitle>Shorta vs ChatGPT</SectionTitle>
        <Differentiation />
        <div className="flex justify-center mt-12">
          <Button variant="hero" size="lg" onClick={() => redirectToCheckout()}>
            Join as a Founding Member
          </Button>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" maxWidth="narrow">
        <SectionTitle>Frequently asked questions</SectionTitle>
        <div className="space-y-6 md:space-y-8 lg:space-y-10">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Is Shorta just another AI script generator?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              No. Shorta focuses on analysis and feedback first. Generation is optional and guided by what actually needs fixing.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Why don't you offer a monthly plan?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Building a successful YouTube Shorts channel is a long-term business, not a quick experiment. Annual pricing ensures you're committed to the process and gives you enough runway to see real results. We're building for creators who are serious about growth.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Can't I just use ChatGPT?</h3>
            <div className="space-y-3 md:space-y-4 text-base md:text-lg text-muted-foreground">
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
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">What if my niche isn't productivity or AI?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Shorta analyzes structure and viewer behavior patterns, not niche-specific buzzwords.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Will this replace my creativity?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              No. It removes uncertainty so you can focus on creative decisions that matter.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">How long does it take to generate scripts?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Less than 5 minutes. Paste your references, enter your topic, and get high quality storyboard instantly.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Can I use this for TikTok or Instagram Reels?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              You can — the principles of viral short-form content apply across platforms. However, our current focus is on YouTube Shorts, so the analysis and patterns are optimized for that platform.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Do you store my channel data?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              We store summarized channel data (not raw videos) so the AI can generate the best content specifically for your audience and style. Your data is never shared with third parties.
            </p>
          </div>
        </div>
        <div className="flex justify-center mt-8 md:mt-10 lg:mt-12">
          <Button variant="hero" size="lg" onClick={() => redirectToCheckout()}>
            Join as a Founding Member
          </Button>
        </div>
      </Section>

      {/* Founder */}
      <Section id="founder" maxWidth="narrow">
        <SectionTitle>What Shorta changed in my workflow</SectionTitle>
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-start gap-3 md:gap-4">
            <img
              src={daleHeadshot}
              alt="Dale Ma"
              className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">Dale Ma</h3>
              <div className="flex gap-2 md:gap-3 text-sm md:text-base">
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
          <div className="space-y-3 md:space-y-4 lg:space-y-5 text-base md:text-lg text-muted-foreground">
            <p>
              I used to work at Meta on improving developer productivity.
            </p>
            <p>
              Over the last few years, AI has dramatically boosted how efficient engineers can be. That made me think: what other industries could benefit from the same kind of productivity leap?
            </p>
            <p>
              A while ago, I tried making YouTube videos myself. I filmed consistently for some time, then slowly lost momentum. Not because I ran out of ideas—but because no one cared about the videos.
            </p>
            <p>
              That's when I realized the real problem wasn't effort or execution.
            </p>
            <p>
              It was about how ideas are translated into compelling content.
            </p>
            <p>
              Today, the creator space is flooded with low-quality script generators and AI slop. I don't believe this is the future. AI shouldn't replace human thinking or creativity—it should help people express their ideas better.
            </p>
            <p>
              That belief is why I decided to build something for creators.
            </p>
            <p>
              Shorta is not just a script generator. It's a system that bridges the gap between ideas and filming. You bring a strong idea, and Shorta turns it into a clear, actionable storyboard—covering structure, pacing, and attention design. Filming becomes low-friction, and producing high-quality videos becomes repeatable.
            </p>
            <p>
              In the past, YouTubers had to grind through hundreds of hours of trial and error to learn what works. With Shorta, those hours can be reinvested into ideation and filming instead.
            </p>
            <p>
              This is the productivity system I wanted to build.
            </p>
            <p>
              Not a faceless video generator.
            </p>
            <p>
              Not a cheap AI script tool.
            </p>
            <p>
              In the future, audiences will care more about creators with strong ideas—not AI-generated noise. And creators who use systems like Shorta will be able to move faster, learn faster, and win faster.
            </p>
          </div>
          <div className="aspect-video bg-surface rounded-lg border border-border overflow-hidden mt-6 md:mt-8">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/3N6lS0y75rw"
              title="What Shorta changed in my workflow"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing">
        <SectionGrid columns={2}>
          <div>
            <SectionTitle>Founding Member pricing</SectionTitle>
            <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
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
            <div className="mt-4 md:mt-6 p-4 md:p-5 bg-surface rounded-lg border border-border">
              <p className="text-sm md:text-base text-muted-foreground mb-2 md:mb-3">Value breakdown:</p>
              <ul className="text-sm md:text-base text-muted-foreground space-y-1 md:space-y-2">
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
            onCtaClick={() => redirectToCheckout()}
          />
        </SectionGrid>
      </Section>

      {/* Plan */}
      <Section id="plan" maxWidth="narrow">
        <SectionTitle>Kickoff, delivery, guarantee</SectionTitle>
        <div className="space-y-3 md:space-y-4 text-base md:text-lg text-foreground mb-6 md:mb-8">
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
      <Section id="cta" background="surface" className="my-6 md:my-8">
        <SectionGrid columns={2}>
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-3 md:mb-4 tracking-tight">
              Join as a Founding Member
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
              Only 50 Founding Member spots. Grandfathered price.
            </p>
            <div className="space-y-2 md:space-y-3 text-sm md:text-base text-foreground">
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
