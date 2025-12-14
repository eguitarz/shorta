import { Section, SectionTitle } from "@/components/Section";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import shortaLogo from "@/assets/shorta-logo.png";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-6">
        <div className="container mx-auto px-2">
          <img
            src={shortaLogo}
            alt="Shorta"
            className="h-36 md:h-40 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
      </header>

      <Section maxWidth="narrow">
        <SectionTitle>Privacy Policy</SectionTitle>

        <div className="space-y-6 text-muted-foreground">
          <p className="text-sm text-muted-foreground">Last updated: December 14, 2024</p>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Information We Collect</h3>
            <p>
              We collect information you provide directly to us, including your email address, payment information, and channel data you choose to share with Shorta.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">How We Use Your Information</h3>
            <p>
              We use your information to provide and improve our services, analyze viral content patterns, and generate personalized scripts for your YouTube Shorts.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Data Storage</h3>
            <p>
              We store summarized channel data (not raw videos) to help our AI generate content specifically tailored to your audience and style. Your data is never shared with third parties.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Security</h3>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Contact Us</h3>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:support@shorta.ai" className="text-primary hover:underline">
                support@shorta.ai
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={() => navigate("/")} variant="outline">
            Return to Home
          </Button>
        </div>
      </Section>
    </div>
  );
}
