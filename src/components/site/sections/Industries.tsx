"use client";

import { motion } from "motion/react";
import { Reveal, SectionHeading } from "../primitives";
import { INDUSTRIES } from "@/data/site";
import { getIcon } from "../icon-map";

export function Industries() {
  return (
    <section className="border-t border-border bg-surface py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="Industries"
          title="Sector fluency, not generic advice."
          body="We have delivered inside these industries long enough to know their regulators, margins and failure modes."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {INDUSTRIES.map((ind, i) => {
            const Icon = getIcon(ind.icon);
            return (
              <Reveal key={ind.name} delay={(i % 5) * 0.06}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="group h-full rounded-3xl border border-border bg-background p-6 shadow-soft transition-colors hover:border-primary/25"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-5 font-display text-base font-bold text-ink">{ind.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ind.body}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
