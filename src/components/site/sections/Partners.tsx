"use client";

import { Reveal } from "../primitives";
import { PARTNERS } from "@/data/site";

export function Partners() {
  return (
    <section className="border-t border-border bg-background py-24">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Ecosystem</p>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
            Trusted Technologies &amp; Partners
          </h2>
          <p className="mt-5 text-base text-muted-foreground">
            We build on platforms your auditors, bankers and CTOs already trust.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PARTNERS.map((p, i) => (
            <Reveal key={p.name} delay={(i % 6) * 0.05}>
              <div
                className="group relative grid h-24 place-items-center overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift"
                style={{ ["--tint" as string]: p.tint }}
              >
                <span
                  className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(140deg, ${p.tint}18, transparent 70%)` }}
                  aria-hidden="true"
                />
                <span className="relative font-display text-sm font-bold tracking-tight text-muted-foreground/70 grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:[color:var(--tint)]">
                  {p.name}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
