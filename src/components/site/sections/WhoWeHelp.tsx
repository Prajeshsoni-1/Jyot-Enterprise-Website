"use client";

import { motion } from "motion/react";
import { Reveal, SectionHeading } from "../primitives";
import { getIcon } from "../icon-map";
import { WHO_WE_HELP } from "@/data/site";

export function WhoWeHelp() {
  return (
    <section className="border-t border-border bg-surface py-28 lg:py-36">
      <div className="container-x">
        <SectionHeading
          eyebrow="Who We Help"
          title="Built for the businesses that keep India running."
          body="From a first-time borrower to a multi-plant enterprise — the depth changes, the accountability does not."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {WHO_WE_HELP.map((w, i) => {
            const Icon = getIcon(w.icon);
            return (
              <Reveal key={w.name} delay={(i % 4) * 0.06}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-background p-7 shadow-soft transition-all duration-500 hover:border-primary/25 hover:shadow-lift"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/10 transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-6 font-display text-base font-bold text-ink">{w.name}</h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {w.body}
                  </p>
                  <span className="mt-6 block h-0.5 w-8 bg-growth transition-all duration-500 group-hover:w-16" />
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
