import { Section, SectionTitle } from "@/components/Section";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import shortaLogo from "@/assets/shorta-logo.png";

export default function Terms() {
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
        <SectionTitle>Terms of Service</SectionTitle>

        <div className="space-y-6 text-muted-foreground">
          <p className="text-sm text-muted-foreground">Last updated: December 14, 2024</p>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Founding Member Program</h3>
            <p>
              By joining as a Founding Member, you agree to support the development of Shorta V1. Development begins when we reach 5 Founding Members. If we don't reach 5 members by January 31, 2026, you'll receive a full refund.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Delivery Guarantee</h3>
            <p>
              We aim to ship Shorta V1 within 60 days after development kicks off. If we miss this window, you'll receive a full refund, no questions asked.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Money-Back Guarantee</h3>
            <p>
              After launch, you have 14 days to try Shorta. If you're not satisfied, contact us for a full refund.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Acceptable Use</h3>
            <p>
              You agree to use Shorta only for creating legitimate content. You may not use Shorta to generate spam, misleading content, or content that violates YouTube's Terms of Service.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Grandfathered Pricing</h3>
            <p>
              Founding Members lock in the $199/year price forever. This rate will not increase, even as we add new features and raise prices for new users.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-2">Contact Us</h3>
            <p>
              If you have questions about these Terms, please contact us at{" "}
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
