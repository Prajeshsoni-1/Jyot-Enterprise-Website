"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import { canonical, pageMeta } from "@/lib/seo";
import { CONTACT } from "@/data/site";
import { DownloadCenter } from "@/components/site/DownloadCenter";

type Search = {
  ref?: string | undefined;
  score?: string | undefined;
  dept?: string | undefined;
  name?: string | undefined;
};

export const Route = createFileRoute("/thank-you")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ref: typeof search["ref"] === "string" ? search["ref"].slice(0, 40) : undefined,
    score: typeof search["score"] === "string" ? search["score"].slice(0, 10) : undefined,
    dept: typeof search["dept"] === "string" ? search["dept"].slice(0, 60) : undefined,
    name: typeof search["name"] === "string" ? search["name"].slice(0, 60) : undefined,
  }),
  head: () => ({
    meta: pageMeta({
      title: "Thank You — Jyot Enterprise",
      description: "Your enquiry has reached the right desk. We respond within one working day.",
      path: "/thank-you",
      noindex: true,
    }),
    links: [canonical("/thank-you")],
  }),
  component: ThankYou,
});

function ThankYou() {
  const { ref, dept, name, score } = Route.useSearch();
  const priority = score === "High";

  const waMessage = encodeURIComponent(
    `Hi Jyot Enterprise, I just submitted an enquiry${ref ? ` (reference ${ref})` : ""}${name ? ` under the name ${name}` : ""}. Please acknowledge.`,
  );
  const waHref = `${CONTACT.whatsapp}?text=${waMessage}`;

  return (
    <>
      <section className="bg-surface px-4 pt-[116px] pb-16">
        <div className="container-x max-w-3xl text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-growth/15 text-growth-foreground">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            {name ? `Thank you, ${name.split(" ")[0]} — we have it.` : "Thank you — we have it."}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Your enquiry is logged and routed. Expect a reply within one working day, or call{" "}
            {CONTACT.phone} if it is urgent.
          </p>

          <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-3">
            {ref && (
              <div className="rounded-2xl border border-border bg-background px-5 py-4">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Reference
                </p>
                <p className="mt-1 font-display text-sm font-extrabold text-ink">{ref}</p>
              </div>
            )}
            {dept && (
              <div className="rounded-2xl border border-border bg-background px-5 py-4">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Routed to
                </p>
                <p className="mt-1 font-display text-sm font-extrabold text-ink">{dept}</p>
              </div>
            )}
            <div className="rounded-2xl border border-border bg-background px-5 py-4">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Response
              </p>
              <p className="mt-1 font-display text-sm font-extrabold text-ink">
                {priority ? "Within 4 hours" : "Within 1 working day"}
              </p>
            </div>
          </div>

          {priority && (
            <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-2 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Flagged as a priority enquiry — a senior
              consultant will call you first.
            </p>
          )}

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-growth px-6 py-3 text-sm font-semibold text-growth-foreground"
            >
              <MessageCircle className="h-4 w-4" /> Confirm on WhatsApp
            </a>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              <CalendarClock className="h-4 w-4" /> Book the meeting now
            </Link>
            <a
              href={CONTACT.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink"
            >
              <Phone className="h-4 w-4" /> Call {CONTACT.phone}
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-20">
        <div className="container-x">
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
            <Download className="h-5 w-5 text-primary" /> While you wait
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Brochures, checklists and process guides from every practice — useful preparation for
            the call.
          </p>
          <div className="mt-8">
            <DownloadCenter />
          </div>
        </div>
      </section>
    </>
  );
}
