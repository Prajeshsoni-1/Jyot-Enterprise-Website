"use client";

import { motion } from "motion/react";
import { Quote, TrendingUp } from "lucide-react";
import { Reveal, SectionHeading } from "../primitives";
import { CASE_STUDIES } from "@/data/site";

export function CaseStudies() {
  return (
    <section className="border-t border-border bg-surface py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="Case Studies"
          title="Problem. Solution. Result. Return."
          body="Three mandates documented in full, with numbers our clients agreed to publish."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {CASE_STUDIES.map((c, i) => (
            <Reveal key={c.client} delay={i * 0.08}>
              <motion.article
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="flex items-center justify-between gap-4 border-b border-border px-7 py-5">
                  <span className="font-display text-sm font-bold text-ink">{c.client}</span>
                  <span className="rounded-full bg-primary/8 px-3 py-1 text-[0.68rem] font-bold tracking-wide text-primary uppercase">
                    {c.practice}
                  </span>
                </div>

                <div className="flex-1 space-y-5 px-7 py-7">
                  {[
                    { label: "Problem", value: c.problem },
                    { label: "Solution", value: c.solution },
                    { label: "Result", value: c.result },
                  ].map((row) => (
                    <div key={row.label}>
                      <p className="font-display text-[0.68rem] font-bold tracking-[0.18em] text-muted-foreground/70 uppercase">
                        {row.label}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/85">{row.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mx-7 flex items-center gap-2 rounded-2xl bg-growth/15 px-5 py-3.5">
                  <TrendingUp className="h-4 w-4 text-growth-foreground" />
                  <span className="font-display text-sm font-extrabold text-growth-foreground">
                    ROI {c.roi}
                  </span>
                </div>

                <figure className="mt-6 border-t border-border px-7 py-6">
                  <Quote className="h-4 w-4 text-primary" />
                  <blockquote className="mt-3 text-sm leading-relaxed text-ink italic">
                    “{c.feedback}”
                  </blockquote>
                  <figcaption className="mt-3 text-xs text-muted-foreground">{c.person}</figcaption>
                </figure>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
