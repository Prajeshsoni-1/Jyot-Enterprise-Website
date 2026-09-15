"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Magnetic } from "./primitives";
import { Ambient } from "./Ambient";
import { Ecosystem } from "./Ecosystem";

export type HeroOverrides = {
  title?: string;
  body?: string;
  ctaLabel?: string;
};

export function Hero({ title, body, ctaLabel }: HeroOverrides = {}) {
  return (
    <section className="relative overflow-hidden bg-surface pt-[76px]">
      <Ambient intensity="strong" />

      <div className="container-x relative grid min-h-[calc(100vh-76px)] items-center gap-10 sm:gap-14 lg:gap-16 py-12 sm:py-16 lg:py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card inline-flex items-center gap-2 rounded-full px-3.5 py-1 sm:px-4 sm:py-1.5 text-xs font-semibold text-muted-foreground"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-growth shrink-0" />
            <span>Trusted by 900+ Indian businesses since 2012</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 sm:mt-7 text-[2.2rem] xs:text-[2.6rem] leading-[1.05] sm:leading-[1.02] font-extrabold tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.25rem]"
          >
            {title ? (
              title
            ) : (
              <>
                Empowering Dreams.
                <br />
                <span className="text-gradient-ember">Enabling Growth.</span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18 }}
            className="mt-5 sm:mt-7 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground"
          >
            {body || "One trusted destination for Financial, IT, Legal and Engineering Solutions."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.26 }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 sm:px-7 sm:py-4 text-xs sm:text-sm font-semibold text-primary-foreground shadow-ember transition-colors hover:bg-primary-hover active:scale-[0.98]"
              >
                <span>{ctaLabel || "Book Free Consultation"}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <a
              href="#services"
              className="glass-card inline-flex items-center gap-2 rounded-full px-5 py-3 sm:px-7 sm:py-4 text-xs sm:text-sm font-semibold text-ink transition-all duration-300 hover:border-primary/30 hover:shadow-soft active:scale-[0.98]"
            >
              Explore Our Services
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 sm:mt-14 grid max-w-lg grid-cols-3 gap-3 xs:gap-4 sm:gap-6 border-t border-border pt-6 sm:pt-8"
          >
            {[
              { k: "1,450+", v: "Mandates delivered" },
              { k: "₹150 Cr", v: "Funding facilitated" },
              { k: "98%", v: "Retention rate" },
            ].map((s) => (
              <div key={s.v} className="min-w-0">
                <dt className="font-display text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
                  {s.k}
                </dt>
                <dd className="mt-1 text-[0.7rem] sm:text-xs leading-tight sm:leading-snug text-muted-foreground">
                  {s.v}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <Ecosystem />
      </div>
    </section>
  );
}
