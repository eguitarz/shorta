import { Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function BulletList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-muted-foreground">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CheckList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-foreground">
          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success flex-shrink-0">
            <Check className="h-3 w-3" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CrossList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-muted-foreground">
          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground flex-shrink-0">
            <X className="h-3 w-3" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function NumberedSteps({
  steps,
  className,
}: {
  steps: string[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-foreground pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function FlowList({
  steps,
  className,
}: {
  steps: string[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs font-medium flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-foreground text-sm">{step}</span>
          {index < steps.length - 1 && (
            <ArrowRight className="h-3 w-3 text-muted-foreground/50 hidden md:block" />
          )}
        </div>
      ))}
    </div>
  );
}
