// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/TrustBadges";
import { redirectToCheckout } from "@/lib/stripe";

export function CTAForm() {
  const handleCheckout = () => {
    redirectToCheckout();
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleCheckout}
        variant="hero"
        size="lg"
        className="w-full"
      >
        Become a Founding Member — $199/year
      </Button>
      <TrustBadges />
      <p className="text-xs text-muted-foreground text-center">
        Charged today. Beta access before launch (Feb 2026).<br />
        Your 1-year membership starts on launch day.<br />
        7-day money-back guarantee after launch.
      </p>
    </div>
  );
}
