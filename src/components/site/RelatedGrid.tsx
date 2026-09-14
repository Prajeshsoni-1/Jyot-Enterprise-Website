import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SectionHeading } from "./primitives";

export type RelatedItem = { title: string; meta: string; href: string; body?: string };

/** Reusable "Related X" grid used by service, blog, case-study and portfolio pages. */
export function RelatedGrid({
  items,
  eyebrow,
  title,
  tone = "light",
}: {
  items: RelatedItem[];
  eyebrow: string;
  title: string;
  tone?: "light" | "surface";
}) {
  if (items.length === 0) return null;
  return (
    <section
      className={`border-t border-border py-24 ${tone === "surface" ? "bg-surface" : "bg-background"}`}
    >
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.href + item.title} delay={(i % 3) * 0.06}>
              <Link
                to={item.href as "/"}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="w-fit rounded-full bg-primary/8 px-3 py-1 text-[0.68rem] font-bold tracking-wide text-primary uppercase">
                  {item.meta}
                </span>
                <h3 className="mt-5 flex-1 font-display text-base leading-snug font-bold text-ink">
                  {item.title}
                </h3>
                {item.body ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                ) : null}
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink group-hover:text-primary">
                  Read more
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
