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
        <SectionTitle>YouTube Shorts FAQ</SectionTitle>
        <div className="space-y-6 md:space-y-8 lg:space-y-10">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Why are my YouTube Shorts not getting views?</h3>
            <div className="space-y-3 md:space-y-4 text-base md:text-lg text-muted-foreground">
              <p>
                Most Shorts fail in the first 2 seconds — weak hooks, slow pacing, or unclear value. YouTube's algorithm measures retention, and if viewers swipe away early, your Short won't get pushed to more people.
              </p>
              <p>
                Shorta's analyzer shows you exactly where viewers drop off and why, so you can fix issues before publishing.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">How do I improve YouTube Shorts retention?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Focus on your hook (first 1-2 seconds), maintain fast pacing, and deliver value quickly. Shorta analyzes your video beat-by-beat and flags retention killers like slow intros, weak transitions, or unclear messaging — then suggests specific fixes.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">How does the AI storyboard generator work?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Our storyboard AI searches viral videos on YouTube and your personal library to find proven hooks and structures. It then generates beat-by-beat storyboards with hooks, content flow, and CTAs—helping you create short-form video scripts based on patterns that actually perform.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Can I analyze my YouTube Shorts for free?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Yes. Shorta offers a free trial to analyze your YouTube Shorts — no credit card, no login required. Upload your video and get AI-powered feedback on hooks, pacing, and retention issues instantly.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Is this better than using ChatGPT for video scripts?</h3>
            <div className="space-y-3 md:space-y-4 text-base md:text-lg text-muted-foreground">
              <p>
                ChatGPT gives generic scripts from old training data. Shorta analyzes what's working <em>now</em> on YouTube and generates storyboards optimized for retention.
              </p>
              <p>
                It's the difference between a generic template and a data-driven production plan.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">Will this replace my creativity?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              No. Shorta removes the guesswork around structure and pacing so you can focus on your ideas and delivery — the parts that actually make your content unique.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">What does the YouTube video analyzer check?</h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Our video analyzer performs a complete video analysis covering hook strength, pacing, content structure, and delivery quality. It identifies exactly where viewers might drop off and gives you specific fixes to improve video quality before publishing.
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
