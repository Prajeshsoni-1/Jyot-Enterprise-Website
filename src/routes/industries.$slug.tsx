import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { RelatedGrid } from "@/components/site/RelatedGrid";
import { INDUSTRY_PAGES, type IndustryPage } from "@/data/industries";
import { CASE_DETAILS } from "@/data/case-studies";
import { canonical, breadcrumbSchema, jsonLd, pageMeta, serviceSchema, SITE_NAME } from "@/lib/seo";
import { loadIndustries } from "@/lib/cms-loaders";

export const Route = createFileRoute("/industries/$slug")({
  loader: async ({ params }) => {
    const industries = await loadIndustries();
    const industry = industries.find((i) => i.slug === params.slug);
    if (!industry) throw notFound();
    return { industry };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Industry not found" }, { name: "robots", content: "noindex" }] };
    }
    const ind = loaderData.industry as IndustryPage;
    const path = `/industries/${params.slug}`;
    return {
      meta: pageMeta({
        title: `${ind.name} Services — Finance, IT, Legal & Engineering | ${SITE_NAME}`,
        description: ind.intro.slice(0, 155),
        path,
      }),
      links: [canonical(path)],
      scripts: [
        jsonLd(
          serviceSchema({
            name: `${ind.name} business services`,
            description: ind.headline,
            path,
            serviceType: ind.name,
          }),
        ),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Industries", path: "/industries" },
            { name: ind.name, path },
          ]),
        ),
      ],
    };
  },
  component: IndustryDetail,
  notFoundComponent: () => (
    <section className="container-x py-32 text-center">
      <h1 className="font-display text-3xl font-extrabold text-ink">Industry not found</h1>
      <Link to="/industries" className="mt-6 inline-block font-semibold text-primary">
        See all industries
      </Link>
    </section>
  ),
});

function IndustryDetail() {
  const { industry } = Route.useLoaderData() as { industry: IndustryPage };
  const path = `/industries/${industry.slug}`;
  const related = INDUSTRY_PAGES.filter((i) => i.slug !== industry.slug)
    .slice(0, 3)
    .map((i) => ({
      title: i.name,
      meta: "Industry",
      href: `/industries/${i.slug}`,
      body: i.headline,
    }));
  const caseStudy = industry.caseSlug
    ? CASE_DETAILS.find((c) => c.slug === industry.caseSlug)
    : undefined;

  return (
    <>
      <PageHero
        eyebrow={`${industry.name} sector`}
        title={industry.headline}
        body={industry.intro}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
          { name: industry.name, path },
        ]}
      />

      <section className="bg-background py-24">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Pain points" title="What we usually find." />
            <ul className="mt-10 grid gap-4">
              {industry.painPoints.map((p) => (
                <li key={p} className="flex gap-3 rounded-2xl border border-border bg-card p-5">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-sm leading-relaxed text-muted-foreground">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Solutions" title="What we put in place." />
            <div className="mt-10 grid gap-4">
              {industry.solutions.map((s) => (
                <Reveal key={s.title}>
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <p className="flex items-center gap-2 font-display text-base font-bold text-ink">
                      <CheckCircle2 className="h-4 w-4 text-growth" aria-hidden="true" /> {s.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Where to start" title="Services this sector uses most." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {industry.services.map((s) => (
              <Link
                key={s.name}
                to={(s.sub ? `/service/${s.sub}` : `/services/${s.parent}`) as "/"}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-5 py-4 transition-colors hover:border-primary/40"
              >
                <span className="min-w-0 truncate text-sm font-semibold text-ink group-hover:text-primary">
                  {s.name}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" />
              </Link>
            ))}
          </div>

          <div className="mt-12 grid gap-6 rounded-3xl border border-border bg-background p-8 sm:grid-cols-[auto_1fr] sm:items-center">
            <p className="font-display text-4xl font-extrabold text-growth">{industry.stat.k}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{industry.stat.v}</p>
          </div>

          {caseStudy ? (
            <Link
              to="/case-studies/$slug"
              params={{ slug: caseStudy.slug }}
              className="group mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-background p-8 transition-colors hover:border-primary/40"
            >
              <span>
                <span className="eyebrow text-primary">Case study</span>
                <span className="mt-2 block font-display text-lg font-bold text-ink">
                  {caseStudy.client} — {caseStudy.title}
                </span>
              </span>
              <ArrowUpRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          ) : null}
        </div>
      </section>

      <RelatedGrid items={related} eyebrow="Other sectors" title="Related industries." />
      <CtaBand />
    </>
  );
}
