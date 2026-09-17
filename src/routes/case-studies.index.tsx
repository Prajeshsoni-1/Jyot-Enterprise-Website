import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { CASE_DETAILS } from "@/data/case-studies";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";
import { loadCaseStudies } from "@/lib/cms-loaders";

export const Route = createFileRoute("/case-studies/")({
  head: () => ({
    meta: pageMeta({
      title: "Case Studies — Measured Business Outcomes | Jyot Enterprise",
      description:
        "Long-form case studies covering the problem, research, execution, challenges and measured ROI of mandates across finance, IT, legal and engineering.",
      path: "/case-studies",
      type: "website",
    }),
    links: [canonical("/case-studies")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Case Studies", path: "/case-studies" },
        ]),
      ),
    ],
  }),
  loader: async () => ({ studies: await loadCaseStudies() }),
  component: CaseStudiesIndex,
});

function CaseStudiesIndex() {
  const data = Route.useLoaderData();
  const studies = Array.isArray(data?.studies) ? data.studies : [];
  return (
    <>
      <PageHero
        eyebrow="Case studies"
        title="The whole story, including the parts that were hard."
        body="Problem, research, execution, challenges and the return — documented the way we report it internally."
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Case Studies", path: "/case-studies" },
        ]}
      />

      <section className="bg-background py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Selected mandates" title="Read the full engagements." />
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {studies.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 2) * 0.07}>
                <Link
                  to="/case-studies/$slug"
                  params={{ slug: c.slug }}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft transition-shadow hover:shadow-lift"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/8 px-3 py-1 text-[0.65rem] font-bold tracking-wide text-primary uppercase">
                      {c.practice}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.industry}</span>
                  </span>
                  <h2 className="mt-5 font-display text-xl leading-snug font-bold text-ink">
                    {c.client} — {c.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {c.summary}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-6">
                    {c.roi.slice(0, 3).map((m) => (
                      <span key={m.v}>
                        <span className="block font-display text-lg font-extrabold text-growth">
                          {m.k}
                        </span>
                        <span className="block text-xs text-muted-foreground">{m.v}</span>
                      </span>
                    ))}
                    <ArrowUpRight className="ml-auto h-5 w-5 self-center text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
