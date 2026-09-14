"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal, SectionHeading } from "../primitives";
import { SOLUTION_PACKAGES } from "@/data/site";

export function BusinessSolutions() {
  return (
    <section className="border-t border-border bg-background py-28 lg:py-36">
      <div className="container-x">
        <SectionHeading
          eyebrow="Business Solutions"
          title="Complete outcomes, not a menu of services."
          body="Pick the objective. Every service required to reach it is already packaged, scoped and priced."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SOLUTION_PACKAGES.map((p, i) => (
            <Reveal key={p.name} delay={(i % 3) * 0.07}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-soft transition-all duration-500 hover:border-primary/25 hover:shadow-lift"
              >
                <span className="font-display text-[0.65rem] font-bold tracking-[0.18em] text-muted-foreground/60 uppercase">
                  Package {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-xl leading-snug font-extrabold text-ink">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.outcome}</p>

                <ul className="mt-6 grid flex-1 gap-2">
                  {p.includes.map((inc) => (
                    <li key={inc} className="flex items-center gap-2.5 text-sm text-ink">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-growth/20 text-growth-foreground">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      {inc}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/contact"
                  className="mt-7 inline-flex items-center gap-2 border-t border-border pt-5 text-sm font-semibold text-ink transition-colors hover:text-primary"
                >
                  Get this package
                  <ArrowUpRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
