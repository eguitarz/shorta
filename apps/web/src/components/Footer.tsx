import { Link } from "react-router-dom";

interface FooterItem {
  text: string;
  href?: string;
  variant?: "muted" | "link";
}

interface FooterProps {
  items: FooterItem[];
}

export function Footer({ items }: FooterProps) {
  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {items.map((item, index) => {
              if (item.variant === "muted" || !item.href) {
                return (
                  <span key={index} className="text-sm text-muted-foreground">
                    {item.text}
                  </span>
                );
              }
              
              if (item.href.startsWith("mailto:")) {
                return (
                  <a
                    key={index}
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.text}
                  </a>
                );
              }

              return (
                <Link
                  key={index}
                  to={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.text}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
