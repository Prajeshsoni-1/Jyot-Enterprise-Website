"use client";

import { motion } from "motion/react";
import { Ruler, Wrench, Factory } from "lucide-react";
import { Reveal } from "../primitives";

const WORKFLOW = [
  { title: "Requirement study", body: "On-site capture of loads, duty cycle and constraints." },
  { title: "Concept & CAD", body: "Modelled options weighed on cost and manufacturability." },
  { title: "Validation", body: "FEA, stack-up analysis and prototype trials." },
  { title: "Production release", body: "Drawings, BOM and process sheets to your vendors." },
];

export function EngineeringShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-ink py-24 text-background">
      <div
        className="blueprint-grid pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 80% 10%, color-mix(in oklab, var(--color-primary) 20%, transparent), transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div className="container-x relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <p className="eyebrow">Drawing Board</p>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Concepts that survive the shop floor.
          </h2>
          <p className="mt-5 text-base text-background/60">
            Mechanical design, jigs and fixtures, plant layout and automation — released with fully
            dimensioned drawings your vendors can quote from immediately.
          </p>

          <div className="mt-10 space-y-4">
            {WORKFLOW.map((w, i) => (
              <motion.div
                key={w.title}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex gap-4 rounded-2xl border border-background/10 bg-background/[0.04] p-5 backdrop-blur-sm"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/40 font-display text-xs font-extrabold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-display text-sm font-bold">{w.title}</p>
                  <p className="mt-1 text-sm text-background/55">{w.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Ruler, label: "GD&T drawings" },
              { icon: Wrench, label: "Jigs & fixtures" },
              { icon: Factory, label: "Plant layout" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-background/10 bg-background/[0.04] p-4 text-center"
              >
                <c.icon className="mx-auto h-5 w-5 text-primary" strokeWidth={1.6} />
                <p className="mt-2 text-[0.7rem] text-background/60">{c.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* technical drawing */}
        <Reveal delay={0.12}>
          <div className="relative rounded-3xl border border-background/10 bg-background/[0.03] p-6 backdrop-blur-sm">
            <svg
              viewBox="0 0 400 400"
              className="h-auto w-full text-primary"
              role="img"
              aria-label="Technical drawing of a mechanical flange assembly"
            >
              <g stroke="currentColor" fill="none" strokeWidth="1.2" opacity="0.9">
                <motion.circle
                  cx="200"
                  cy="200"
                  r="130"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="200"
                  cy="200"
                  r="72"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, delay: 0.2, ease: "easeInOut" }}
                />
                <circle cx="200" cy="200" r="44" strokeDasharray="4 4" />
                {[...Array(8)].map((_, i) => {
                  const a = (i * Math.PI) / 4;
                  return (
                    <motion.circle
                      key={i}
                      cx={200 + 101 * Math.cos(a)}
                      cy={200 + 101 * Math.sin(a)}
                      r="12"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.07 }}
                    />
                  );
                })}
                <line x1="30" y1="200" x2="370" y2="200" strokeDasharray="10 5 3 5" opacity="0.4" />
                <line x1="200" y1="30" x2="200" y2="370" strokeDasharray="10 5 3 5" opacity="0.4" />
                <path d="M200 330 L330 330" strokeWidth="0.8" opacity="0.6" />
              </g>
              <g fill="currentColor" opacity="0.75" fontSize="11" fontFamily="monospace">
                <text x="248" y="325">
                  Ø 260 h7
                </text>
                <text x="300" y="118">
                  M12 × 8
                </text>
                <text x="40" y="60">
                  FLANGE ASSY · REV C
                </text>
              </g>
            </svg>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-background/10 pt-4 text-[0.62rem] text-background/45">
              <span>SCALE 1:2</span>
              <span>MATERIAL EN8</span>
              <span>TOL ±0.05</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
