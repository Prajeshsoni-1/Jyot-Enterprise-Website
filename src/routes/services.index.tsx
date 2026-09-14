import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { SERVICES } from "@/data/site";
import { SUB_SERVICES } from "@/data/catalog";
import { breadcrumbSchema, canonical, jsonLd, pageMeta, serviceSchema } from "@/lib/seo";
import { loadServiceOverrides, loadSubServices } from "@/lib/cms-loaders";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: pageMeta({
      title: "Services — Financial, IT, Legal & Engineering | Jyot Enterprise",
      description:
        "Explore Jyot Enterprise's four practices — financial advisory, IT and software, legal and compliance, and engineering — delivered under one accountable partnership.",
      path: "/services",
    }),
    links: [canonical("/services")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ]),
      ),
      ...SERVICES.map((s) =>
        jsonLd(
          serviceSchema({
            name: s.name,
            description: s.description,
            path: `/services/${s.slug}`,
          }),
        ),
      ),
    ],
  }),
  loader: async () => ({ overrides: await loadServiceOverrides(), subs: await loadSubServices() }),
  component: ServicesIndex,
});

function ServicesIndex() {
  const { overrides, subs: allSubs } = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Four practices. One accountable partner."
        body="Financial, IT, legal and engineering mandates run by the practice leads who deliver them — with a single point of accountability across all four."
        variant="saas"
      />

      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ]}
      />

      <section className="bg-background py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Practices" title="Where we take responsibility" />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {SERVICES.map((base, i) => {
              const service = { ...base, ...(overrides[base.slug] ?? {}) };
              const Icon = base.icon;
              const subs = allSubs.filter((s) => s.parent === base.slug).slice(0, 6);
              return (
                <Reveal key={service.slug} delay={(i % 2) * 0.06}>
                  <article className="flex h-full flex-col rounded-3xl border border-border bg-surface p-6 sm:p-8 transition-colors hover:border-primary/30">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="mt-6 font-display text-2xl font-extrabold text-ink">
                      {service.name}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-primary">{service.tagline}</p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {service.description}
                    </p>

                    {subs.length > 0 && (
                      <ul className="mt-6 flex flex-wrap gap-2">
                        {subs.map((s) => (
                          <li key={s.slug}>
                            <Link
                              to="/service/$slug"
                              params={{ slug: s.slug }}
                              className="inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-ink"
                            >
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto pt-8">
                      <Link
                        to="/services/$slug"
                        params={{ slug: service.slug }}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-primary"
                      >
                        Explore {service.short} <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
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
