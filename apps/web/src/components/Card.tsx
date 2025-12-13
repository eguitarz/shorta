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
        "bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm",
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
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
    <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-md">
      <div className="flex flex-wrap gap-2 mb-4">
        {badges.map((badge) => (
          <span
            key={badge}
            className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
          >
            {badge}
          </span>
        ))}
      </div>
      <h3 className="text-lg font-semibold text-card-foreground mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-bold text-foreground">{price}</span>
        <span className="text-muted-foreground">/ {period}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{finePrint}</p>
      <button
        onClick={onCtaClick}
        className="w-full bg-primary text-primary-foreground rounded-lg py-3 px-4 font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
