"use client";

import { motion } from "motion/react";
import {
  Handshake,
  Award,
  Eye,
  Rocket,
  Cpu,
  Wallet,
  LifeBuoy,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Reveal, SectionHeading } from "../primitives";

const REASONS = [
  {
    icon: Handshake,
    title: "One Business Partner",
    body: "Finance, technology, legal and engineering under a single accountable contract.",
  },
  {
    icon: Award,
    title: "Experienced Experts",
    body: "Chartered advisors, senior engineers and product designers on every engagement.",
  },
  {
    icon: Eye,
    title: "Transparent Process",
    body: "Fixed scope, published milestones and no invoice you did not approve first.",
  },
  {
    icon: Rocket,
    title: "Fast Delivery",
    body: "Two-week delivery cycles with weekly written progress reviews.",
  },
  {
    icon: Cpu,
    title: "Latest Technology",
    body: "Modern cloud, applied AI and automation as default infrastructure.",
  },
  {
    icon: Wallet,
    title: "Affordable Solutions",
    body: "Enterprise rigour priced for growing Indian businesses.",
  },
  {
    icon: LifeBuoy,
    title: "Dedicated Support",
    body: "A named relationship manager reachable on phone and WhatsApp.",
  },
  {
    icon: InfinityIcon,
    title: "Long Term Partnership",
    body: "Advice we would take ourselves, even when it shrinks the invoice.",
  },
];

export function WhyJyot() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-surface py-28">
      <div className="container-x relative">
        <SectionHeading
          eyebrow="Why Jyot"
          title="Built on judgement, not headcount."
          body="Eight commitments we hold ourselves to on every mandate — measured, reviewed and reported."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((item, i) => (
            <Reveal key={item.title} delay={(i % 4) * 0.07}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group relative h-full overflow-hidden rounded-3xl border border-border bg-background p-7 shadow-soft transition-all duration-500 hover:border-primary/25 hover:shadow-lift"
              >
                <div
                  className="pointer-events-none absolute -right-16 -bottom-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in oklab, var(--color-growth) 26%, transparent), transparent 70%)",
                  }}
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between">
                  <motion.span
                    whileHover={{ rotate: 8 }}
                    className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/10 transition-transform duration-500 group-hover:scale-110"
                  >
                    <item.icon className="h-5 w-5" strokeWidth={1.6} />
                  </motion.span>
                  <span className="font-display text-xs font-bold tracking-[0.2em] text-muted-foreground/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="relative mt-6 text-lg leading-snug font-bold text-ink">
                  {item.title}
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                <span className="relative mt-6 block h-0.5 w-8 bg-growth transition-all duration-500 group-hover:w-16" />
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
