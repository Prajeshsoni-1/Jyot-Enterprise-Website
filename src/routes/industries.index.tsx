import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { getIcon } from "@/components/site/icon-map";
import { INDUSTRY_PAGES } from "@/data/industries";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";
import { loadIndustries } from "@/lib/cms-loaders";

export const Route = createFileRoute("/industries/")({
  head: () => ({
    meta: pageMeta({
      title: "Industries We Serve — Sector Expertise | Jyot Enterprise",
      description:
        "Healthcare, manufacturing, real estate, retail, logistics, education and more — the specific finance, IT, legal and engineering problems we solve in each sector.",
      path: "/industries",
      type: "website",
    }),
    links: [canonical("/industries")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
        ]),
      ),
    ],
  }),
  loader: async () => ({ industries: await loadIndustries() }),
  component: IndustriesIndex,
});

function IndustriesIndex() {
  const { industries } = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="We already know what breaks in your sector."
        body="Every industry carries its own cash cycle, compliance load and operating constraint. Here is how we work in each."
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
        ]}
      />

      <section className="bg-background py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Sectors" title="Choose your industry." />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((ind, i) => {
              const Icon = getIcon(ind.icon);
              return (
                <Reveal key={ind.slug} delay={(i % 3) * 0.05}>
                  <Link
                    to="/industries/$slug"
                    params={{ slug: ind.slug }}
                    className="group flex h-full flex-col bg-background p-8 transition-colors hover:bg-surface"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/10">
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                    </span>
                    <h2 className="mt-6 font-display text-lg font-bold text-ink">{ind.name}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {ind.headline}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink group-hover:text-primary">
                      Explore <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
