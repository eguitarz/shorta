import { cn } from "@/lib/utils";

interface CalloutProps {
  title: string;
  text: string;
  variant?: "default" | "subtle";
  className?: string;
}

export function Callout({
  title,
  text,
  variant = "default",
  className,
}: CalloutProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6 mt-6",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "subtle" && "bg-muted border border-border",
        className
      )}
    >
      <p
        className={cn(
          "text-lg font-semibold mb-1",
          variant === "subtle" && "text-foreground"
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "text-sm",
          variant === "default" && "text-primary-foreground/80",
          variant === "subtle" && "text-muted-foreground"
        )}
      >
        {text}
      </p>
    </div>
  );
}
