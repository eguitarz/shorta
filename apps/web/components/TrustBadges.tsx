import { Shield, Lock, CreditCard } from "lucide-react";

export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" />
        <span>Secure SSL Encryption</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CreditCard className="w-3.5 h-3.5" />
        <span>Powered by Stripe</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5" />
        <span>7-Day Money-Back</span>
      </div>
    </div>
  );
}
