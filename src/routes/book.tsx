"use client";

import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Clock, ShieldCheck, Video, Phone, Building2 } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { BookingWizard } from "@/components/site/BookingWizard";
import { SERVICES, CONTACT } from "@/data/site";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: pageMeta({
      title: "Book a Consultation — Jyot Enterprise",
      description:
        "Choose a department, meeting type and time. A senior Jyot Enterprise consultant will confirm your slot within one working day.",
      path: "/book",
      type: "website",
    }),
    links: [canonical("/book")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Book a Consultation", path: "/book" },
        ]),
      ),
    ],
  }),
  component: BookPage,
});

const MEETINGS = [
  {
    icon: Video,
    title: "Google Meet",
    body: "A 45-minute video call with the department lead and, where relevant, a specialist.",
  },
  {
    icon: Phone,
    title: "Phone or WhatsApp",
    body: "Quicker scoping calls when you already know what you need.",
  },
  {
    icon: Building2,
    title: "Office visit",
    body: "Meet us at our Gandhinagar or Palanpur office. Best for document-heavy mandates.",
  },
];

const STEPS = [
  "Submit the form with your department, budget band and preferred slot.",
  "We confirm the exact time by phone or email within one working day.",
  "You receive an agenda and the list of anything worth having to hand.",
  "After the call you get a written summary, scope and indicative fee.",
];

function BookPage() {
  return (
    <>
      <PageHero
        eyebrow="Book Consultation"
        title="45 minutes with the people who will do the work."
        body="No sales desk in between. You speak directly to the department that would run your mandate."
        variant="saas"
      />

      <section className="border-b border-border bg-background">
        <div className="container-x grid gap-px overflow-hidden bg-border sm:grid-cols-3">
          {[
            { icon: CalendarCheck, k: "Free", v: "No fee, no obligation" },
            { icon: Clock, k: "45 min", v: "Typical consultation length" },
            { icon: ShieldCheck, k: "24 hrs", v: "Confirmation turnaround" },
          ].map((s, i) => (
            <Reveal key={s.k} delay={i * 0.06}>
              <div className="flex h-full items-center gap-4 bg-background px-6 py-8">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/10">
                  <s.icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-2xl font-extrabold text-ink">{s.k}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-surface py-24">
        <div className="container-x grid min-w-0 gap-14 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div>
            <SectionHeading eyebrow="Departments" title="Who you will be speaking to." />
            <div className="mt-10 grid gap-3">
              {SERVICES.map((s) => (
                <div
                  key={s.slug}
                  className="rounded-2xl border border-border bg-background px-6 py-5"
                >
                  <p className="font-display text-base font-bold text-ink">{s.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-14 font-display text-xl font-extrabold text-ink">Meeting types</h2>
            <div className="mt-6 grid gap-3">
              {MEETINGS.map((m) => (
                <div
                  key={m.title}
                  className="flex gap-4 rounded-2xl border border-border bg-background px-6 py-5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                    <m.icon className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-ink">{m.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="mt-14 font-display text-xl font-extrabold text-ink">
              What happens next
            </h2>
            <ol className="mt-6 grid gap-4">
              {STEPS.map((step, i) => (
                <li key={step} className="flex gap-4 text-sm text-muted-foreground">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-display text-xs font-bold text-background">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-border bg-background p-5 sm:p-8 md:p-10 shadow-soft">
              <h2 className="text-2xl font-extrabold text-ink">Request your slot</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fill this once — we route it to the right department automatically.
              </p>
              <div className="mt-8">
                <BookingWizard />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
