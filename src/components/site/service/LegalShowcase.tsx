"use client";

import { motion } from "motion/react";
import { BadgeCheck, CalendarClock, FileCheck2, Stamp } from "lucide-react";
import { Reveal } from "../primitives";

const CERTS = [
  { name: "ISO 9001:2015", body: "Quality management certification support." },
  { name: "MSME / Udyam", body: "Registration and benefit linkage." },
  { name: "Trademark ®", body: "Search, filing and objection handling." },
  { name: "Digital Signature", body: "Class 3 DSC issuance for directors." },
];

const CALENDAR = [
  { when: "7th", what: "TDS payment" },
  { when: "11th", what: "GSTR-1 filing" },
  { when: "20th", what: "GSTR-3B filing" },
  { when: "30th", what: "ROC / annual returns" },
];

export function LegalShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-surface py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.97 0.015 250), transparent 40%), radial-gradient(60% 50% at 85% 15%, oklch(0.9 0.05 250 / 0.5), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="container-x relative">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Verified &amp; Filed</p>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            A compliance desk, not a filing service.
          </h2>
          <p className="mt-5 text-base text-muted-foreground">
            Every submission is verified against the registry first, acknowledged the same day and
            tracked on a live calendar you can see.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <div className="h-full rounded-3xl border border-border bg-background p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">
                <CalendarClock className="h-3.5 w-3.5" /> Compliance Calendar
              </span>
              <ul className="mt-7 space-y-3">
                {CALENDAR.map((c, i) => (
                  <motion.li
                    key={c.what}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.07 }}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink font-display text-sm font-extrabold text-background">
                      {c.when}
                    </span>
                    <span className="text-sm font-medium text-ink">{c.what}</span>
                    <BadgeCheck className="ml-auto h-4 w-4 text-growth-foreground" />
                  </motion.li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-muted-foreground">
                Reminders sent seven days before every due date.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="h-full rounded-3xl border border-border bg-background p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-growth/20 px-3 py-1.5 text-xs font-bold text-growth-foreground">
                <Stamp className="h-3.5 w-3.5" /> Certifications
              </span>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {CERTS.map((c) => (
                  <motion.div
                    key={c.name}
                    whileHover={{ y: -5 }}
                    className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/25"
                  >
                    <FileCheck2 className="h-5 w-5 text-primary" strokeWidth={1.6} />
                    <p className="mt-4 font-display text-sm font-bold text-ink">{c.name}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.body}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
