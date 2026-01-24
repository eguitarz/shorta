"use client";

import { HeroSection } from "@/components/HeroSection";
import { Section, SectionTitle } from "@/components/Section";
import { Callout } from "@/components/Callout";
import { Footer } from "@/components/Footer";
import { CTAForm } from "@/components/CTAForm";
import { QuestionButton } from "@/components/QuestionButton";
import { Button } from "@/components/ui/button";

const shortaLogo = "/shorta-logo.png";

export default function HomePage() {
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
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-center gap-1">
                  <a
                    href="/try"
                    className="border border-border bg-background text-foreground px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-medium hover:bg-surface transition-all duration-200 text-sm md:text-base whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Try Free</span>
                    <span className="sm:hidden">Try</span>
                  </a>
                  <p className="text-xs text-muted-foreground hidden sm:block">No credit card · No login</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <a
                    href="/pricing"
                    className="bg-primary text-primary-foreground px-3 py-2 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Join as a Founding Member</span>
                    <span className="sm:hidden">Join Now</span>
                  </a>
                  <p className="text-xs text-muted-foreground hidden sm:block">$99/year or $199 lifetime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero - Storytelling */}
      <HeroSection />

      {/* FAQ */}
      <Section id="faq" maxWidth="narrow">
        <SectionTitle>Frequently asked questions</SectionTitle>
        <div className="space-y-6 md:space-y-8 lg:space-y-10">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">How does the video storyboard generator work?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Our storyboard AI searches viral videos on YouTube and your personal library to find proven hooks and structures. It then generates beat-by-beat storyboards with hooks, content flow, and CTAs—helping you create videos based on patterns that actually perform.
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
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Will this replace my creativity?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              No. It removes uncertainty so you can focus on creative decisions that matter.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 mt-8 md:mt-10 lg:mt-12">
          <a href="/pricing">
            <Button variant="hero" size="lg">
              Join as a Founding Member
            </Button>
          </a>
          <p className="text-sm text-muted-foreground">$99/year or $199 lifetime · limited seats available</p>
        </div>
      </Section>

      {/* Plan */}
      <Section id="plan" maxWidth="narrow">
        <SectionTitle>Launch timeline</SectionTitle>
        <div className="space-y-3 md:space-y-4 text-base md:text-lg text-foreground mb-6 md:mb-8">
          <p>
            Development is <strong>underway</strong>.
          </p>
          <p>
            Launch: <strong>End of February 2026</strong>.
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
        <div className="max-w-md mx-auto">
          <CTAForm />
        </div>
      </Section>

      {/* Footer */}
      <Footer
        items={[
          { text: "© Shorta", variant: "muted" },
          { text: "Tools", href: "/tools" },
          { text: "Blog", href: "/blog" },
          { text: "Pricing", href: "/pricing" },
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
