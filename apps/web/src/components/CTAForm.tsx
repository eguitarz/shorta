import { Button } from "@/components/ui/button";

export function CTAForm() {
  const handleCheckout = () => {
    // TODO: Integrate with Stripe checkout
    console.log("Redirecting to Stripe checkout...");
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
      <p className="text-xs text-muted-foreground text-center">
        You'll be charged today to support the development.<br />
        If we don't reach 5 founding members, you'll receive a full refund immediately.<br />
        Your 1-year membership starts on launch day.
      </p>
    </div>
  );
}
