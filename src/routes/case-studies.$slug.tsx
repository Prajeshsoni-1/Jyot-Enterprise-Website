import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { RelatedGrid } from "@/components/site/RelatedGrid";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { CASE_DETAILS, type CaseStudy } from "@/data/case-studies";
import { canonical, breadcrumbSchema, jsonLd, pageMeta, SITE_NAME } from "@/lib/seo";
import { loadCaseStudies } from "@/lib/cms-loaders";

export const Route = createFileRoute("/case-studies/$slug")({
  loader: async ({ params }) => {
    const studies = await loadCaseStudies();
    const study = studies.find((c) => c.slug === params.slug);
    if (!study) throw notFound();
    return { study };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Case study not found" }, { name: "robots", content: "noindex" }] };
    }
    const c = loaderData.study as CaseStudy;
    const path = `/case-studies/${params.slug}`;
    return {
      meta: pageMeta({
        title: `${c.client} case study — ${c.title} | ${SITE_NAME}`,
        description: c.summary,
        path,
        type: "article",
      }),
      links: [canonical(path)],
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${c.client} — ${c.title}`,
          description: c.summary,
          about: c.industry,
          publisher: { "@type": "Organization", name: SITE_NAME },
          mainEntityOfPage: path,
        }),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Case Studies", path: "/case-studies" },
            { name: c.client, path },
          ]),
        ),
      ],
    };
  },
  component: CaseStudyPage,
  notFoundComponent: () => (
    <section className="container-x py-32 text-center">
      <h1 className="font-display text-3xl font-extrabold text-ink">Case study not found</h1>
      <Link to="/case-studies" className="mt-6 inline-block font-semibold text-primary">
        See all case studies
      </Link>
    </section>
  ),
});

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal className="mb-12">
      <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </Reveal>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          {i}
        </li>
      ))}
    </ul>
  );
}

function CaseStudyPage() {
  const { study } = Route.useLoaderData() as { study: CaseStudy };
  const path = `/case-studies/${study.slug}`;
  const related = CASE_DETAILS.filter((c) => c.slug !== study.slug)
    .slice(0, 3)
    .map((c) => ({
      title: `${c.client} — ${c.title}`,
      meta: c.practice,
      href: `/case-studies/${c.slug}`,
      body: c.summary,
    }));

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Case Studies", path: "/case-studies" },
          { name: study.client, path },
        ]}
      />

      <header
        className="relative overflow-hidden border-b border-border py-20"
        style={{
          background: `linear-gradient(140deg, oklch(0.96 0.04 ${study.hue}), var(--color-surface) 60%)`,
        }}
      >
        <div className="container-x relative max-w-3xl">
          <p className="eyebrow text-primary">
            {study.practice} · {study.industry}
          </p>
          <h1 className="mt-4 text-3xl leading-[1.1] font-extrabold tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl">
            {study.client} — {study.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{study.summary}</p>
        </div>
      </header>

      <section className="bg-background py-20">
        <div className="container-x max-w-3xl">
          <Block title="Client overview">
            <p className="text-base leading-relaxed text-muted-foreground">
              {study.client} operates in {study.industry.toLowerCase()}. The engagement ran across
              our {study.practice} practice{study.practice.includes("·") ? "s" : ""}.
            </p>
          </Block>

          <Block title="Problem statement">
            <p className="text-base leading-relaxed text-muted-foreground">{study.problem}</p>
          </Block>

          <Block title="Research">
            <List items={study.research} />
          </Block>

          <Block title="Planning and approach">
            <List items={study.solution} />
          </Block>

          <Block title="Execution">
            <div className="grid gap-4">
              {study.implementation.map((p) => (
                <div key={p.phase} className="rounded-2xl border border-border bg-card p-6">
                  <p className="font-display text-sm font-bold text-primary">{p.phase}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block title="Timeline">
            <ol className="relative grid gap-6 border-l border-border pl-6">
              {study.timeline.map((t) => (
                <li key={t.label}>
                  <span
                    className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <p className="font-display text-sm font-bold text-ink">{t.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
                </li>
              ))}
            </ol>
          </Block>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="container-x">
          <SectionHeading
            eyebrow="Results"
            title="Return on the engagement."
            body={study.roiSummary}
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {study.roi.map((m) => (
              <div key={m.v} className="bg-background p-8">
                <p className="font-display text-3xl font-extrabold text-growth">{m.k}</p>
                <p className="mt-2 text-sm text-muted-foreground">{m.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-2xl">
            <TestimonialCard
              t={{
                name: study.person.split("·")[0]?.trim() ?? study.person,
                role: study.person.split("·")[1]?.trim() ?? "",
                company: study.client,
                quote: study.feedback,
                service: study.practice,
              }}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-20">
        <div className="container-x max-w-3xl">
          <SectionHeading eyebrow="Conclusion" title="What we would tell a similar business." />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            The gain here came from sequencing — fixing the measurable constraint first, then
            building around it. If your business shows the same symptoms {study.client} did, the
            diagnosis usually takes one conversation and a look at ninety days of data.
          </p>
        </div>
      </section>

      <RelatedGrid
        items={related}
        eyebrow="More stories"
        title="Related case studies."
        tone="surface"
      />
      <CtaBand />
    </>
  );
}
