import { cn } from "@/lib/utils";

interface MonoSnippetProps {
  title?: string;
  text: string;
  className?: string;
}

export function MonoSnippet({ title, text, className }: MonoSnippetProps) {
  return (
    <div className={cn("rounded-lg bg-muted p-4", className)}>
      {title && (
        <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
      )}
      <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
        {text}
      </pre>
    </div>
  );
}
