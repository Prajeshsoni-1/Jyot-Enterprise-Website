"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowDown, ArrowUpRight, Sparkles, TriangleAlert } from "lucide-react";
import { Reveal } from "../primitives";
import { Ambient } from "../Ambient";
import { FRAGMENTED_CHAIN, FRAGMENTED_COST } from "@/data/site";
import { Logo } from "../Logo";

function ChainItem({ label, i, tone }: { label: string; i: number; tone: "vendor" | "cost" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: i * 0.08 }}
      className="flex flex-col items-center"
    >
      <div
        className={
          tone === "vendor"
            ? "w-full rounded-2xl border border-border bg-background px-5 py-3.5 text-center font-display text-sm font-bold text-ink shadow-soft"
            : "flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/[0.04] px-5 py-3 text-center text-sm font-semibold text-destructive"
        }
      >
        {tone === "cost" ? <TriangleAlert className="h-3.5 w-3.5 shrink-0" /> : null}
        {label}
      </div>
      <ArrowDown className="my-2 h-4 w-4 text-muted-foreground/50" />
    </motion.div>
  );
}

export function OneSolution() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-surface py-28">
      <Ambient intensity="medium" />
      <div className="container-x relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">The Jyot Argument</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] text-ink sm:text-4xl md:text-[2.9rem]">
            Why choose four different companies
            <br className="hidden sm:block" />{" "}
            <span className="text-gradient-ember">when one enterprise can do it all?</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Fragmented vendors multiply cost, contracts and confusion. Here is what that actually
            looks like — and what replaces it.
          </p>
        </Reveal>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          {/* fragmented column */}
          <div className="rounded-3xl border border-border bg-background/60 p-8 backdrop-blur-sm">
            <p className="font-display text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              The usual way
            </p>
            <div className="mt-7">
              {FRAGMENTED_CHAIN.map((c, i) => (
                <ChainItem key={c} label={c} i={i} tone="vendor" />
              ))}
              {FRAGMENTED_COST.map((c, i) => (
                <ChainItem key={c} label={c} i={i + FRAGMENTED_CHAIN.length} tone="cost" />
              ))}
              <p className="text-center text-xs text-muted-foreground">
                Four contracts. Four invoices. Nobody accountable.
              </p>
            </div>
          </div>

          {/* connector */}
          <div className="flex flex-col items-center gap-3 lg:h-full lg:justify-center">
            <div className="hidden h-24 w-px bg-gradient-to-b from-transparent to-primary/40 lg:block" />
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-ember"
            >
              <Sparkles className="h-6 w-6" />
            </motion.span>
            <span className="font-display text-xs font-bold tracking-[0.2em] text-primary uppercase">
              One Solution
            </span>
            <div className="hidden h-24 w-px bg-gradient-to-t from-transparent to-primary/40 lg:block" />
          </div>

          {/* consolidated column */}
          <Reveal delay={0.15}>
            <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-background sm:p-8 md:p-10">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(110% 90% at 80% 0%, color-mix(in oklab, var(--color-primary) 32%, transparent), transparent 62%)",
                }}
                aria-hidden="true"
              />
              <div className="relative">
                <p className="font-display text-xs font-bold tracking-[0.2em] text-background/50 uppercase">
                  The Jyot way
                </p>
                <div className="mt-7">
                  <Logo invert />
                </div>
                <p className="mt-6 text-sm leading-relaxed text-background/70">
                  One contract, one relationship manager, one invoice — covering finance, software,
                  compliance and engineering with a single accountable owner.
                </p>
                <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-background/10">
                  {[
                    { k: "1", v: "Point of contact" },
                    { k: "1", v: "Consolidated invoice" },
                    { k: "-38%", v: "Typical vendor cost" },
                    { k: "0", v: "Handover gaps" },
                  ].map((row) => (
                    <li key={row.v} className="flex items-baseline gap-4 bg-ink px-5 py-4">
                      <span className="font-display text-xl font-extrabold text-growth">
                        {row.k}
                      </span>
                      <span className="text-sm text-background/70">{row.v}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Consolidate with Jyot
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
