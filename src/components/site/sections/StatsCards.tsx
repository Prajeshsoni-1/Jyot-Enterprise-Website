"use client";

import { motion } from "motion/react";
import { Briefcase, Building2, CalendarDays, Headphones, Smile } from "lucide-react";
import { Reveal, Counter } from "../primitives";

const CARDS = [
  {
    icon: Briefcase,
    value: 65,
    suffix: "+",
    label: "Projects Completed",
    note: "Across four practices",
  },
  { icon: Building2, value: 100, suffix: "+", label: "Happy Clients", note: "SME to mid-market" },
  {
    icon: CalendarDays,
    value: 14,
    suffix: "",
    label: "Years of Experience",
    note: "Operating since 2012",
  },
  {
    icon: Headphones,
    value: 24,
    suffix: "/7",
    label: "Support",
    note: "Named relationship manager",
  },
  {
    icon: Smile,
    value: 99,
    suffix: "%",
    label: "Customer Satisfaction",
    note: "Verified post-delivery",
  },
];

export function StatsCards() {
  return (
    <section className="border-t border-border bg-background py-24">
      <div className="container-x">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {CARDS.map((c, i) => (
            <Reveal key={c.label} delay={(i % 5) * 0.07}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft transition-shadow hover:shadow-lift"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 -top-16 h-32 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 24%, transparent), transparent 70%)",
                  }}
                  aria-hidden="true"
                />
                <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10">
                  <c.icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <p className="relative mt-6 font-display text-4xl font-extrabold text-ink">
                  <Counter value={c.value} suffix={c.suffix} />
                </p>
                <p className="relative mt-2 font-display text-sm font-bold text-ink">{c.label}</p>
                <p className="relative mt-1 text-xs text-muted-foreground">{c.note}</p>
                <span className="relative mt-5 block h-0.5 w-8 bg-growth transition-all duration-500 group-hover:w-16" />
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
