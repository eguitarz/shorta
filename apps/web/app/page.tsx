import { HeroSection } from "@/components/HeroSection";
import { Section, SectionTitle } from "@/components/Section";
import { Footer } from "@/components/Footer";
import { QuestionButton } from "@/components/QuestionButton";
import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/TrustBadges";
import { WaitlistForm } from "@/components/WaitlistForm";

const shortaLogo = "/shorta-logo.png";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header — simplified, single CTA */}
      <header className="pt-4 pb-3 md:pt-6 md:pb-4">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <img src={shortaLogo} alt="Shorta" className="h-12 w-12 md:h-16 md:w-16" />
              <span className="text-lg md:text-2xl font-semibold text-foreground">Shorta AI</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <a
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
              >
                Pricing
              </a>
              <a
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
              >
                Log in
              </a>
              <a
                href="/try"
                className="bg-primary text-primary-foreground px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 text-sm md:text-base"
              >
                Try Free
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 1. Hero — benefit-driven headline + product screenshot + single CTA */}
      <HeroSection />

      {/* 2. How It Works — 3 steps */}
      <Section id="how-it-works" maxWidth="narrow">
        <SectionTitle>How It Works</SectionTitle>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-lg">1</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Paste URL or Upload</h3>
            <p className="text-muted-foreground text-sm">
              Drop a YouTube Shorts link or upload your video file. Drafts and rough cuts work too.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-lg">2</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Get Beat-by-Beat Analysis</h3>
            <p className="text-muted-foreground text-sm">
              AI breaks down every second — hook score, retention drops, pacing issues, and clarity flags.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-lg">3</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Fix and Re-film</h3>
            <p className="text-muted-foreground text-sm">
              Approve suggested fixes and generate a new storyboard — ready to shoot with issues resolved.
            </p>
          </div>
        </div>
      </Section>

      {/* 3. Product Demo — two features side by side */}
      <Section id="features" maxWidth="narrow">
        <SectionTitle>What Shorta Does</SectionTitle>

        {/* Analyzer */}
        <div className="mb-16 md:mb-20">
          <div className="mb-4">
            <span className="text-xs font-mono text-violet-400 mb-2 block">ANALYZE</span>
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              Upload before you publish
            </h3>
            <p className="text-muted-foreground mb-4 max-w-2xl">
              The analyzer watches your Short like a viewer would — then tells you exactly where they'd lose interest and why.
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                Hook score with alternatives
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                Retention timeline
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                Timestamped fixes
              </li>
            </ul>
          </div>
          <div className="aspect-video bg-surface rounded-xl border border-border overflow-hidden shadow-lg">
            <video
              width="100%"
              height="100%"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="object-cover w-full h-full"
            >
              <source src="/analyzer.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Storyboard */}
        <div>
          <div className="mb-4">
            <span className="text-xs font-mono text-primary mb-2 block">GENERATE</span>
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
              Turn ideas into filmable storyboards
            </h3>
            <p className="text-muted-foreground mb-4 max-w-2xl">
              Describe your idea — the AI creates a beat-by-beat production plan with hooks, pacing, and director notes. Ready to shoot in minutes.
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                Beat-by-beat script with timing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                Director notes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span>
                Multiple hook options
              </li>
            </ul>
          </div>
          <div className="aspect-video bg-surface rounded-xl border border-border overflow-hidden shadow-lg">
            <video
              width="100%"
              height="100%"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="object-cover w-full h-full"
            >
              <source src="/storyboard-compressed.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <a href="/try">
            <Button variant="hero" size="lg">
              Try Free — No Login Required
            </Button>
          </a>
        </div>
      </Section>

      {/* 4. Who It's For */}
      <Section id="who" maxWidth="narrow">
        <SectionTitle>Built for Creators Who Want to Improve</SectionTitle>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-surface/50 rounded-xl p-5 border border-border/50">
            <p className="font-semibold text-foreground mb-2">New YouTubers</p>
            <p className="text-sm text-muted-foreground">
              Don't know why your Shorts get 50 views? The analyzer shows you exactly what to fix — hooks, pacing, structure.
            </p>
          </div>
          <div className="bg-surface/50 rounded-xl p-5 border border-border/50">
            <p className="font-semibold text-foreground mb-2">Creators stuck at low views</p>
            <p className="text-sm text-muted-foreground">
              You're posting consistently but nothing breaks through. Shorta finds the patterns holding you back.
            </p>
          </div>
          <div className="bg-surface/50 rounded-xl p-5 border border-border/50">
            <p className="font-semibold text-foreground mb-2">Solo creators without a team</p>
            <p className="text-sm text-muted-foreground">
              No editor, no producer, no feedback loop. Shorta is the second pair of eyes you don't have.
            </p>
          </div>
          <div className="bg-surface/50 rounded-xl p-5 border border-border/50">
            <p className="font-semibold text-foreground mb-2">Anyone planning before filming</p>
            <p className="text-sm text-muted-foreground">
              The storyboard generator creates a filmable plan so you stop winging it and start filming with structure.
            </p>
          </div>
        </div>
      </Section>

      {/* 5. Social Proof — founder credibility + product stats */}
      <Section id="proof" maxWidth="narrow">
        <div className="bg-surface/50 rounded-xl p-6 md:p-8 border border-border/50">
          <div className="md:flex md:items-start md:gap-8">
            <div className="md:flex-1 mb-6 md:mb-0">
              <h3 className="text-lg font-semibold text-foreground mb-3">Why Shorta Exists</h3>
              <p className="text-muted-foreground text-sm mb-4">
                I spent years at Meta improving developer productivity with AI. When I started creating YouTube Shorts, I realized the same problem existed — creators waste hours guessing what works instead of using data.
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Shorta is the tool I wished I had. It analyzes your Short like a producer would, then generates a better version with the issues fixed.
              </p>
              <p className="text-sm text-foreground font-medium">
                — Dale Ma, Founder
              </p>
              <p className="text-xs text-muted-foreground">
                Former Meta engineer · Building Shorta full-time
              </p>
            </div>
            <div className="md:flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-primary">4</p>
                  <p className="text-xs text-muted-foreground mt-1">Analysis dimensions per Short</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-primary">60s</p>
                  <p className="text-xs text-muted-foreground mt-1">Average analysis time</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-primary">Free</p>
                  <p className="text-xs text-muted-foreground mt-1">First analysis, no login</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-primary">AI</p>
                  <p className="text-xs text-muted-foreground mt-1">Director-level storyboards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 6. Pricing — below the fold */}
      <Section id="pricing" maxWidth="narrow">
        <SectionTitle>Simple Pricing</SectionTitle>
        <p className="text-center text-muted-foreground mb-8 md:mb-10">
          Try free first. Upgrade when you're ready.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Hobby */}
          <div className="bg-surface/50 rounded-xl p-6 border border-border/50">
            <h3 className="text-xl font-bold text-foreground mb-1">Hobby</h3>
            <p className="text-sm text-muted-foreground mb-4">For casual creators</p>
            <p className="text-3xl font-bold text-foreground mb-1">$6<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
            <p className="text-xs text-muted-foreground mb-4">billed yearly · $8/mo monthly</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>1,000 credits / month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>~10 storyboards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>Credits roll over (up to 1.5x cap)</span>
              </li>
            </ul>
            <a href="/pricing" className="block">
              <Button variant="outline" size="lg" className="w-full">
                Get Started
              </Button>
            </a>
          </div>

          {/* Pro */}
          <div className="bg-surface/50 rounded-xl p-6 border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-semibold">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">Pro</h3>
            <p className="text-sm text-muted-foreground mb-4">For weekly creators</p>
            <p className="text-3xl font-bold text-foreground mb-1">$15<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
            <p className="text-xs text-muted-foreground mb-4">billed yearly · $18/mo monthly</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>3,500 credits / month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>~35 storyboards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>Credits roll over (up to 1.5x cap)</span>
              </li>
            </ul>
            <a href="/pricing" className="block">
              <Button variant="hero" size="lg" className="w-full">
                Get Started
              </Button>
            </a>
            <TrustBadges />
          </div>

          {/* Producer */}
          <div className="bg-surface/50 rounded-xl p-6 border border-border/50">
            <h3 className="text-xl font-bold text-foreground mb-1">Producer</h3>
            <p className="text-sm text-muted-foreground mb-4">For daily creators & teams</p>
            <p className="text-3xl font-bold text-foreground mb-1">$45<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
            <p className="text-xs text-muted-foreground mb-4">billed yearly · $56/mo monthly</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>12,000 credits / month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>~120 storyboards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">&#10003;</span>
                <span>Priority processing</span>
              </li>
            </ul>
            <a href="/pricing" className="block">
              <Button variant="outline" size="lg" className="w-full">
                Get Started
              </Button>
            </a>
          </div>
        </div>

        {/* Waitlist */}
        <div className="max-w-sm mx-auto mt-8 bg-surface/30 p-5 rounded-xl border border-border/30">
          <p className="text-sm text-muted-foreground text-center mb-3">Not ready? Get notified when we launch.</p>
          <WaitlistForm />
        </div>
      </Section>

      {/* 7. FAQ */}
      <Section id="faq" maxWidth="narrow">
        <SectionTitle>YouTube Shorts FAQ</SectionTitle>
        <div className="space-y-6 md:space-y-8">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">Why are my YouTube Shorts not getting views?</h3>
            <p className="text-base text-muted-foreground">
              Most Shorts fail in the first 2 seconds — weak hooks, slow pacing, or unclear value. YouTube's algorithm measures retention, and if viewers swipe away early, your Short won't get pushed to more people. Shorta's analyzer shows you exactly where viewers drop off and why, so you can fix issues before publishing.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">How do I improve YouTube Shorts retention?</h3>
            <p className="text-base text-muted-foreground">
              Focus on your hook (first 1-2 seconds), maintain fast pacing, and deliver value quickly. Shorta analyzes your video beat-by-beat and flags retention killers like slow intros, weak transitions, or unclear messaging — then suggests specific fixes.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">How does the AI storyboard generator work?</h3>
            <p className="text-base text-muted-foreground">
              Describe your video idea — topic, format, target length. The AI creates a beat-by-beat storyboard with hooks, content flow, pacing, and CTAs. Each beat includes director notes for camera angles, energy, and delivery. It's a filmable plan, not just a script.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">Can I analyze my YouTube Shorts for free?</h3>
            <p className="text-base text-muted-foreground">
              Yes. Shorta offers a free analysis — no credit card, no login required. Upload your video and get AI-powered feedback on hooks, pacing, and retention instantly.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">Is this better than using ChatGPT for video scripts?</h3>
            <p className="text-base text-muted-foreground">
              ChatGPT gives generic scripts from old training data. Shorta creates production-ready storyboards with timed beats, hook options, and director notes — optimized for YouTube Shorts retention. It's the difference between a wall of text and a filming blueprint.
            </p>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">What does the YouTube video analyzer check?</h3>
            <p className="text-base text-muted-foreground">
              The analyzer checks four dimensions: hook strength (first 1-2 seconds), content structure, pacing and delivery, and overall clarity. Every issue found comes with a timestamped fix so you know exactly what to change.
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-8 md:mt-10">
          <a href="/try">
            <Button variant="hero" size="lg">
              Try Free — See It In Action
            </Button>
          </a>
        </div>
      </Section>

      {/* Footer */}
      <Footer
        items={[
          { text: "\u00A9 Shorta", variant: "muted" },
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
