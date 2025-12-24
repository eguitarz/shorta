import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        variant === "default" && "bg-muted text-muted-foreground",
        variant === "outline" && "border border-border text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
