"use client";

import { Button } from "@/components/ui/button";
import { Section, SectionTitle } from "@/components/Section";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { CheckCircle } from "lucide-react";
import { trackEvent } from "@/lib/posthog";

const shortaLogo = "/shorta-logo.png";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract Stripe session information if available
    const sessionId = searchParams.get('session_id');

    // Track successful purchase
    trackEvent('purchase_completed', {
      product: 'founding_member',
      price: 199,
      currency: 'USD',
      ...(sessionId && { session_id: sessionId }),
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-6">
        <div className="container mx-auto px-2">
          <img src={shortaLogo} alt="Shorta" className="h-16 w-16" />
        </div>
      </header>

      <Section maxWidth="narrow">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-600" />
          </div>

          <SectionTitle>Welcome to Shorta, Founding Member!</SectionTitle>

          <div className="space-y-4 text-muted-foreground">
            <p className="text-lg">
              Thank you for joining as a Founding Member. Your support makes this possible.
            </p>

            <div className="bg-surface rounded-xl p-6 border border-border my-8">
              <h3 className="text-foreground font-semibold mb-4">What happens next?</h3>
              <div className="space-y-3 text-left">
                <p>✓ You'll receive a confirmation email shortly</p>
                <p>✓ Development starts when we reach 5 Founding Members</p>
                <p>✓ You'll get updates on development progress</p>
                <p>✓ Shorta V1 launches within 60 days of kickoff</p>
                <p>✓ Your grandfathered price of $199/year is locked in forever</p>
              </div>
            </div>

            <p>
              Questions? Email us at{" "}
              <a
                href="mailto:support@shorta.ai"
                className="text-primary hover:underline"
              >
                support@shorta.ai
              </a>
            </p>
          </div>

          <div className="mt-8">
            <Button onClick={() => router.push("/")} variant="outline">
              Return to Home
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SuccessContent />
    </Suspense>
  );
}
