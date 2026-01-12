"use client";

import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/TrustBadges";

export function CTAForm() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <a href="/pricing" className="w-full">
          <Button
            variant="hero"
            size="lg"
            className="w-full"
          >
            Join as a Founding Member
          </Button>
        </a>
        <p className="text-sm text-muted-foreground text-center">$99/year or $199 lifetime · limited seats available</p>
      </div>
      <TrustBadges />
      <p className="text-xs text-muted-foreground text-center">
        Charged today. Beta access before launch (Feb 2026).<br />
        Your membership starts on launch day.<br />
        7-day money-back guarantee after launch.
      </p>
    </div>
  );
}
