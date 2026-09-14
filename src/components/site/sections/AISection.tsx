"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Reveal } from "../primitives";
import { AI_FEATURES } from "@/data/site";
import { getIcon } from "../icon-map";

export function AISection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-ink py-28 text-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="animate-drift absolute -top-40 left-1/4 h-[34rem] w-[34rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 34%, transparent), transparent 68%)",
          }}
        />
        <div
          className="animate-drift-alt absolute -bottom-52 right-0 h-[30rem] w-[30rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-growth) 22%, transparent), transparent 68%)",
          }}
        />
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]">
          <defs>
            <pattern id="ai-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ai-grid)" />
        </svg>
      </div>

      <div className="container-x relative">
        <Reveal className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/5 px-4 py-1.5 text-xs font-semibold text-background/80 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Applied AI
          </span>
          <h2 className="mt-6 text-3xl font-extrabold leading-[1.1] sm:text-4xl md:text-[2.9rem]">
            AI that answers the phone, files the ticket and books the meeting.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-background/60">
            Not demos. Production agents already handling live customer traffic for Indian
            businesses — in Hindi, Gujarati and English.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AI_FEATURES.map((f, i) => {
            const Icon = getIcon(f.icon);
            return (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
                whileHover={{ y: -6 }}
                className="group rounded-3xl border border-background/10 bg-background/[0.04] p-7 backdrop-blur-xl transition-colors hover:border-primary/40"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25 transition-transform duration-500 group-hover:scale-110">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <h3 className="mt-6 font-display text-lg font-bold">{f.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-background/60">{f.body}</p>
              </motion.div>
            );
          })}
        </div>

        <Reveal className="mt-12">
          <Link
            to="/services/$slug"
            params={{ slug: "it" }}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-ember transition-colors hover:bg-primary-hover"
          >
            Explore AI capabilities
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
