import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; path: string };

/** Visible breadcrumb trail. Pair with `breadcrumbSchema()` in the route head. */
export function Breadcrumbs({
  items,
  className,
  offset = true,
}: {
  items: Crumb[];
  className?: string;
  offset?: boolean;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("border-b border-border bg-surface", offset && "pt-[76px]", className)}
    >
      <ol className="container-x flex flex-wrap items-center gap-1.5 py-3 text-xs text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="font-semibold text-ink">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link to={item.path as "/"} className="transition-colors hover:text-primary">
                    {item.name}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
