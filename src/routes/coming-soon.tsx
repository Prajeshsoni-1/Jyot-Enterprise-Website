import { createFileRoute, Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { canonical, pageMeta } from "@/lib/seo";
import { CONTACT } from "@/data/site";

export const Route = createFileRoute("/coming-soon")({
  head: () => ({
    meta: pageMeta({
      title: "Coming Soon — Jyot Enterprise",
      description: "This part of the Jyot Enterprise platform is being built and launches shortly.",
      path: "/coming-soon",
      noindex: true,
    }),
    links: [canonical("/coming-soon")],
  }),
  component: ComingSoon,
});

function ComingSoon() {
  return (
    <section className="grid min-h-[70vh] place-items-center bg-surface px-4 pt-[76px]">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
          <Rocket className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-ink sm:text-4xl">
          Coming soon.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          We are building this section properly rather than quickly. In the meantime, the team is
          available on {CONTACT.phone} and every existing service is live.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Back to home
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink"
          >
            Talk to us
          </Link>
        </div>
      </div>
    </section>
  );
}
