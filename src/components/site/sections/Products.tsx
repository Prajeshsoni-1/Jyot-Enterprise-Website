"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SectionHeading } from "../primitives";
import { PRODUCTS } from "@/data/site";
import { getIcon } from "../icon-map";
import type { ProductItem } from "@/lib/cms-content";

interface ProductsProps {
  items?: ProductItem[];
  eyebrow?: string;
  title?: string;
  body?: string;
}

export function Products({
  items,
  eyebrow = "Products",
  title = "Platforms we already own and operate.",
  body = "Productised builds with a known price, a known timeline and a live reference client.",
}: ProductsProps) {
  const list: ProductItem[] =
    items && items.length > 0
      ? items
      : PRODUCTS.map((p) => ({ ...p, ctaLabel: "Request a demo", ctaHref: "/contact" }));

  return (
    <section className="border-t border-border bg-background py-24 lg:py-32">
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} body={body} />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {list.map((p, i) => {
            const Icon = getIcon(p.icon);
            return (
              <Reveal key={p.name} delay={(i % 3) * 0.07}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft transition-shadow hover:shadow-lift lg:p-8"
                >
                  <div
                    className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 26%, transparent), transparent 70%)",
                    }}
                    aria-hidden="true"
                  />
                  <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-ink text-background transition-transform duration-500 group-hover:-rotate-6">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="relative mt-6 font-display text-xl font-bold text-ink">
                    {p.name}
                  </h3>
                  <p className="relative mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                  <div className="relative mt-6 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[0.68rem] font-semibold text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={p.ctaHref || "/contact"}
                    className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-primary"
                  >
                    {p.ctaLabel || "Request a demo"}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
