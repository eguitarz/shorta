import { HeroSection } from "@/components/HeroSection";
import { Section, SectionTitle, SectionGrid } from "@/components/Section";
import { Card, PricingCard } from "@/components/Card";
import { BulletList, CheckList, CrossList, NumberedSteps } from "@/components/Lists";
import { Callout } from "@/components/Callout";
import { Footer } from "@/components/Footer";
import { CTAForm } from "@/components/CTAForm";
import { QuestionButton } from "@/components/QuestionButton";
import shortaLogo from "@/assets/shorta-logo.png";

const Index = () => {
  const scrollToCta = () => {
    document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-6 px-6">
        <div className="container mx-auto max-w-[1080px]">
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
            "You don't know which hook will work",
            "AI scripts sound generic and flat",
            "Competitors already went viral — you're guessing",
            "Testing ideas costs time, focus, and momentum",
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
              Instead of asking you to write better prompts, Shorta studies what already works — hooks, structure, pacing — and generates scripts before you film.
            </p>
            <BulletList
              items={[
                "Pattern-driven, not vibes",
                "Reference-informed outputs",
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
                "Get 10–20 scripts generated",
                "Scripts are auto-scored and ranked",
              ]}
            />
          </Card>
        </SectionGrid>
      </Section>

      {/* What you get in V1 */}
      <Section id="v1">
        <SectionGrid columns={2}>
          <div>
            <SectionTitle>What you get in V1</SectionTitle>
            <CheckList
              items={[
                "Viral hook & structure analysis",
                "Talking-head friendly short scripts",
                "Multiple variations per idea",
                "Automatic scoring & ranking",
                "Reference-driven output (no generic AI tone)",
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

      {/* FAQ Lite */}
      <Section id="faq-lite" maxWidth="narrow">
        <SectionTitle>Can't I just use ChatGPT?</SectionTitle>
        <p className="text-muted-foreground">
          You can — but it doesn't study your niche's viral patterns, compare options, or score ideas. Shorta is built specifically for Shorts performance, not general writing.
        </p>
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
          </div>
          <PricingCard
            title="Founding Member"
            price="$199"
            period="year"
            badges={["Grandfathered", "Limited seats"]}
            finePrint={<>Public launch price: <strong>$399+ / year</strong></>}
            ctaLabel="Join as a Founding Member"
            onCtaClick={scrollToCta}
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
            Target ship window: within <strong>60 days</strong> after kickoff.
          </p>
          <p>
            If we miss the ship window: <strong>full refund</strong>, no questions asked.
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
        <div className="space-y-4 text-muted-foreground">
          <p>
            Hi, I'm Dale. I spent years building internal tools at Meta, where speed and clarity matter. The best results didn't come from better prompts — they came from having the right context.
          </p>
          <p>
            Context switching — jumping between examples, references, and half-formed ideas — was always the real cost. Content creation turned out to be the same problem.
          </p>
          <p>
            Shorta is my attempt to solve that by bringing the right examples together, extracting patterns automatically, and turning context into decisions you can act on before hitting record.
          </p>
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
              Limited seats. Grandfathered price.
            </p>
            <div className="space-y-3 text-foreground">
              <p>
                <strong>$199 / year</strong> (grandfathered)
              </p>
              <p>
                Public launch: <strong>$399+ / year</strong>
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
