"use client";

import { motion } from "motion/react";
import { ArrowRight, Check, X } from "lucide-react";
import { Reveal, SectionHeading } from "../primitives";
import { OVERVIEW_FRAGMENTS, OVERVIEW_UNIFIED } from "@/data/site";

export function BusinessOverview() {
  return (
    <section className="border-t border-border bg-background py-28 lg:py-36">
      <div className="container-x">
        <SectionHeading
          eyebrow="Business Overview"
          title="An integrated business solutions company — not four vendors in a trench coat."
          body="Jyot Enterprise brings finance, technology, legal and engineering into a single accountable partnership. Instead of hiring four firms who never speak to each other, you get one team that already shares your context."
        />

        <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-[1fr_auto_1fr]">
          <Reveal>
            <div className="h-full rounded-3xl border border-border bg-surface p-8">
              <p className="font-display text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Without Jyot
              </p>
              <ul className="mt-7 grid gap-3">
                {OVERVIEW_FRAGMENTS.map((f, i) => (
                  <motion.li
                    key={f.title}
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: i * 0.09 }}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-background px-5 py-4"
                  >
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <span className="block font-display text-sm font-bold text-ink">
                        {f.title}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {f.body}
                      </span>
                    </span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-7 text-xs text-muted-foreground">
                Four relationships. Four price lists. Zero shared accountability.
              </p>
            </div>
          </Reveal>

          <div className="flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-ember"
            >
              <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" />
            </motion.span>
          </div>

          <Reveal delay={0.15}>
            <div className="relative h-full overflow-hidden rounded-3xl bg-ink p-8 text-background">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(110% 90% at 85% 0%, color-mix(in oklab, var(--color-primary) 30%, transparent), transparent 62%)",
                }}
                aria-hidden="true"
              />
              <div className="relative">
                <p className="font-display text-xs font-bold tracking-[0.2em] text-background/50 uppercase">
                  With Jyot Enterprise
                </p>
                <ul className="mt-7 grid gap-3">
                  {OVERVIEW_UNIFIED.map((u, i) => (
                    <motion.li
                      key={u}
                      initial={{ opacity: 0, x: 18 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.09 }}
                      className="flex items-start gap-3 rounded-2xl bg-background/[0.06] px-5 py-4 text-sm leading-relaxed text-background/80"
                    >
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-growth text-growth-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {u}
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-7 text-xs text-background/50">
                  Everything under one roof — with one person answerable for all of it.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
