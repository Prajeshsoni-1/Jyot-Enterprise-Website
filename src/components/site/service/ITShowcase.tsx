"use client";

import { motion } from "motion/react";
import { Cloud, Layers, Smartphone } from "lucide-react";
import { Reveal } from "../primitives";

const STACK = [
  "React",
  "Next.js",
  "TypeScript",
  "Node",
  "Python",
  "PostgreSQL",
  "AWS",
  "Cloudflare",
  "OpenAI",
  "React Native",
  "Tailwind",
  "Docker",
  "Odoo",
  "Zoho",
  "Tally",
];

function Bar({ h, delay }: { h: number; delay: number }) {
  return (
    <motion.span
      initial={{ height: 0 }}
      whileInView={{ height: `${h}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className="w-full rounded-t-sm bg-primary/70"
    />
  );
}

export function ITShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-ink py-24 text-background">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 15% 0%, color-mix(in oklab, var(--color-primary) 26%, transparent), transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="container-x relative">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Product Showcase</p>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Dashboards, apps and platforms already in production.
          </h2>
          <p className="mt-5 text-base text-background/60">
            ERP, CRM, hosting consoles and AI copilots — shipped, monitored and supported by the
            same team that designed them.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          {/* laptop / dashboard mockup */}
          <Reveal>
            <div className="rounded-3xl border border-background/10 bg-background/[0.04] p-4 backdrop-blur-xl sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-background/10 bg-ink">
                <div className="flex items-center gap-1.5 border-b border-background/10 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-background/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-background/25" />
                  <span className="ml-4 rounded-md bg-background/[0.06] px-3 py-1 text-[0.65rem] text-background/50">
                    app.jyot-erp.com / dashboard
                  </span>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="grid gap-3">
                    {[
                      { k: "₹4.82 Cr", v: "Revenue MTD", tone: "primary" },
                      { k: "1,204", v: "Open work orders", tone: "muted" },
                      { k: "98.4%", v: "On-time dispatch", tone: "growth" },
                    ].map((c) => (
                      <div
                        key={c.v}
                        className="rounded-xl border border-background/10 bg-background/[0.03] p-4"
                      >
                        <p
                          className={
                            "font-display text-xl font-extrabold " +
                            (c.tone === "primary"
                              ? "text-primary"
                              : c.tone === "growth"
                                ? "text-growth"
                                : "text-background")
                          }
                        >
                          {c.k}
                        </p>
                        <p className="mt-1 text-[0.68rem] text-background/50">{c.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-background/10 bg-background/[0.03] p-4">
                    <p className="text-[0.68rem] text-background/50">
                      Production output · last 12 weeks
                    </p>
                    <div className="mt-4 flex h-40 items-end gap-1.5">
                      {[38, 52, 44, 61, 57, 72, 66, 80, 74, 88, 82, 95].map((h, i) => (
                        <Bar key={i} h={h} delay={i * 0.05} />
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-[0.62rem] text-background/40">
                      <span>Cloud: AWS ap-south-1</span>
                      <span>Uptime: 99.97%</span>
                      <span>p95: 180ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* mobile mockup */}
          <Reveal delay={0.12}>
            <div className="flex h-full items-center justify-center rounded-3xl border border-background/10 bg-background/[0.04] p-8 backdrop-blur-xl">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="w-[13rem] rounded-[2rem] border border-background/15 bg-ink p-3 shadow-lift"
              >
                <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-background/20" />
                <div className="rounded-2xl bg-background/[0.04] p-4">
                  <p className="font-display text-xs font-bold text-background/70">Jyot CRM</p>
                  <p className="mt-3 font-display text-2xl font-extrabold text-primary">42</p>
                  <p className="text-[0.65rem] text-background/45">Qualified leads today</p>
                  <div className="mt-4 space-y-2">
                    {["AI agent · 3 calls", "WhatsApp · 12 replies", "Quote #4821 sent"].map(
                      (r) => (
                        <div
                          key={r}
                          className="rounded-lg bg-background/[0.05] px-3 py-2 text-[0.62rem] text-background/60"
                        >
                          {r}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Layers,
              title: "Development lifecycle",
              body: "Discovery → design → build → QA → launch → SLA support, in two-week increments.",
            },
            {
              icon: Cloud,
              title: "Cloud architecture",
              body: "Managed AWS and Cloudflare with IaC, autoscaling and cost guardrails.",
            },
            {
              icon: Smartphone,
              title: "Mobile & web apps",
              body: "React Native and modern web delivered from one shared codebase where sensible.",
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div className="h-full rounded-3xl border border-background/10 bg-background/[0.04] p-7 backdrop-blur-xl transition-colors hover:border-primary/35">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  <c.icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <h3 className="mt-5 font-display text-base font-bold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-background/60">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8">
          <div className="flex flex-wrap gap-2 rounded-3xl border border-background/10 bg-background/[0.04] p-6">
            {STACK.map((s) => (
              <span
                key={s}
                className="rounded-full border border-background/12 px-3.5 py-1.5 text-xs font-semibold text-background/70 transition-colors hover:border-primary/40 hover:text-background"
              >
                {s}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
