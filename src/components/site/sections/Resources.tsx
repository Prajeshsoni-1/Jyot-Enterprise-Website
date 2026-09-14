"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SectionHeading } from "../primitives";
import { getIcon } from "../icon-map";
import { RESOURCES } from "@/data/site";

export function Resources() {
  return (
    <section className="border-t border-border bg-background py-28 lg:py-36">
      <div className="container-x">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <SectionHeading
            eyebrow="Resources"
            title="Everything we know, written down and free to take."
            body="The same guides, formats and checklists our own consultants use on live mandates."
          />
          <Reveal>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-primary"
            >
              Browse the library <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCES.map((r, i) => {
            const Icon = getIcon(r.icon);
            return (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.07 }}
                className="group bg-background p-8 transition-colors hover:bg-surface"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/10 transition-transform duration-500 group-hover:scale-110">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <h3 className="font-display text-base font-bold text-ink">{r.name}</h3>
                  <span className="font-display text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground/60 uppercase">
                    {r.count}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
