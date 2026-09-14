"use client";

import { motion } from "motion/react";
import { Reveal, SectionHeading } from "../primitives";
import { getIcon } from "../icon-map";
import { STAY_REASONS } from "@/data/site";

export function WhyStay() {
  return (
    <section className="border-t border-border bg-surface py-28 lg:py-36">
      <div className="container-x">
        <SectionHeading
          eyebrow="Why Businesses Stay"
          title="The first project wins the contract. These six keep it."
          body="Nine out of ten clients return for a second mandate within a year. This is what they tell us made the difference."
        />

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STAY_REASONS.map((r, i) => {
            const Icon = getIcon(r.icon);
            return (
              <Reveal key={r.title} delay={(i % 3) * 0.07}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="group relative h-full overflow-hidden rounded-3xl border border-border bg-background p-8 shadow-soft transition-all duration-500 hover:border-primary/25 hover:shadow-lift"
                >
                  <div
                    className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 24%, transparent), transparent 70%)",
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/10 transition-transform duration-500 group-hover:scale-110">
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                    </span>
                    <h3 className="mt-6 text-lg font-bold text-ink">{r.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                    <p className="mt-6 inline-flex rounded-full bg-growth/15 px-3 py-1.5 font-display text-xs font-bold text-growth-foreground">
                      {r.metric}
                    </p>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
