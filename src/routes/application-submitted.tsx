import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2 } from "lucide-react";
import { canonical, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/application-submitted")({
  head: () => ({
    meta: pageMeta({
      title: "Application Submitted — Jyot Enterprise Careers",
      description: "Your application has been received by the Jyot Enterprise hiring team.",
      path: "/application-submitted",
      noindex: true,
    }),
    links: [canonical("/application-submitted")],
  }),
  component: ApplicationSubmitted,
});

function ApplicationSubmitted() {
  return (
    <section className="grid min-h-[70vh] place-items-center bg-surface px-4 pt-[76px]">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
          <FileCheck2 className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-ink sm:text-4xl">
          Application submitted.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Thank you for applying. Our hiring team reviews every application personally and replies
          within five working days — whichever way the decision goes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/careers"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            See other roles
          </Link>
          <Link
            to="/about"
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink"
          >
            Learn about us
          </Link>
        </div>
      </div>
    </section>
  );
}
