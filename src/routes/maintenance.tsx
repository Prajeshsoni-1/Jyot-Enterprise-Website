import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { canonical, pageMeta } from "@/lib/seo";
import { CONTACT } from "@/data/site";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: pageMeta({
      title: "Scheduled Maintenance — Jyot Enterprise",
      description: "The Jyot Enterprise platform is briefly offline for scheduled maintenance.",
      path: "/maintenance",
      noindex: true,
    }),
    links: [canonical("/maintenance")],
  }),
  component: Maintenance,
});

function Maintenance() {
  return (
    <section className="grid min-h-[70vh] place-items-center bg-surface px-4 pt-[76px]">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
          <Wrench className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-ink sm:text-4xl">
          Down for scheduled maintenance.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          We are performing planned upgrades and will be back shortly. Client work continues as
          normal — reach your practice lead on {CONTACT.phone} or email {CONTACT.email}.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={CONTACT.phoneHref}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Call {CONTACT.phone}
          </a>
          <a
            href={`mailto:${CONTACT.email}`}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink"
          >
            Email us
          </a>
        </div>
      </div>
    </section>
  );
}
