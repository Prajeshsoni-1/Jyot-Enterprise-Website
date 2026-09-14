"use client";

import { motion } from "motion/react";
import { Reveal } from "../primitives";
import { SUCCESS_PROCESS } from "@/data/site";

export function SuccessProcess() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-ink py-28 text-background lg:py-36">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 0%, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="container-x relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Success Process</p>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl md:text-[2.75rem] md:leading-[1.08]">
            Seven stages. Every one of them written down.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-background/60">
            You always know which stage you are in, who owns it, and what has to be true before it
            closes.
          </p>
        </Reveal>

        <div className="relative mt-20">
          <div className="absolute top-0 bottom-0 left-[19px] w-px bg-background/15 lg:top-[19px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-full" />
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
            className="absolute top-0 bottom-0 left-[19px] w-px bg-primary lg:hidden"
            aria-hidden="true"
          />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
            className="absolute top-[19px] left-0 hidden h-px w-full bg-primary lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-7 lg:gap-6">
            {SUCCESS_PROCESS.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.09} className="relative pl-14 lg:pl-0">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.09 }}
                  className="absolute top-0 left-0 grid h-10 w-10 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground shadow-ember lg:relative lg:mb-7"
                >
                  {i + 1}
                </motion.span>
                <h3 className="font-display text-base font-bold">{p.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-background/60">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
