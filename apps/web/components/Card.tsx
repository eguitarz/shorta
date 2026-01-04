import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border p-8 md:p-10 shadow-md",
        className
      )}
    >
      {title && (
        <h3 className="text-xl font-semibold text-card-foreground mb-6">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function PricingCard({
  title,
  price,
  period,
  badges,
  finePrint,
  ctaLabel,
  onCtaClick,
}: {
  title: string;
  price: string;
  period: string;
  badges: string[];
  finePrint: React.ReactNode;
  ctaLabel: string;
  onCtaClick: () => void;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-8 md:p-10 shadow-md">
      <div className="flex flex-wrap gap-2 mb-6">
        {badges.map((badge) => (
          <span
            key={badge}
            className="inline-flex items-center rounded-md bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            {badge}
          </span>
        ))}
      </div>
      <h3 className="text-xl font-semibold text-card-foreground mb-3">{title}</h3>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-5xl font-bold text-foreground">{price}</span>
        <span className="text-lg text-muted-foreground">/ {period}</span>
      </div>
      <p className="text-base text-muted-foreground mb-8">{finePrint}</p>
      <button
        onClick={onCtaClick}
        className="w-full bg-primary text-primary-foreground rounded-lg py-4 px-6 font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg text-lg"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
