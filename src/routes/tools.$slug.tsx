"use client";

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { DownloadCenter } from "@/components/site/DownloadCenter";
import { getTool, TOOLS } from "@/components/site/tools/registry";
import { SERVICES } from "@/data/site";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";
import { useTrackedView } from "@/lib/track";

export const Route = createFileRoute("/tools/$slug")({
  head: ({ params }) => {
    const tool = getTool(params.slug);
    const title = tool ? `${tool.name} — Jyot Enterprise` : "Business Tool — Jyot Enterprise";
    const description =
      tool?.description.slice(0, 155) ?? "Free business calculators from Jyot Enterprise.";
    return {
      meta: pageMeta({ title, description, path: `/tools/${params.slug}`, type: "website" }),
      links: [canonical(`/tools/${params.slug}`)],
      scripts: [
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Business Tools", path: "/tools" },
            { name: tool?.name ?? "Tool", path: `/tools/${params.slug}` },
          ]),
        ),
      ],
    };
  },
  loader: ({ params }) => {
    if (!getTool(params.slug)) throw notFound();
    return null;
  },
  component: ToolPage,
});

function ToolPage() {
  const { slug } = Route.useParams();
  const tool = getTool(slug)!;
  const Component = tool.component;
  const service = SERVICES.find((s) => s.slug === tool.division)!;
  const related = TOOLS.filter((t) => t.division === tool.division && t.slug !== tool.slug);

  useTrackedView("tool_used", { tool_slug: tool.slug, division: tool.division });

  return (
    <>
      <PageHero
        eyebrow={`${service.short} Tool`}
        title={tool.name}
        body={tool.description}
        variant="saas"
      />

      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Business Tools", path: "/tools" },
          { name: tool.name, path: `/tools/${tool.slug}` },
        ]}
      />

      <section className="bg-background py-16">
        <div className="container-x">
          <Component />
        </div>
      </section>

      <section className="border-y border-border bg-surface py-20">
        <div className="container-x grid gap-10">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">Take it further</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Numbers are a starting point. Send them to the {service.short.toLowerCase()} desk and
              we will come back with real, sourced options.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/services/$slug"
                params={{ slug: service.slug }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Explore {service.short} services <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink"
              >
                Book a consultation
              </Link>
            </div>
          </div>

          {related.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-extrabold text-ink">Related tools</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((t) => (
                  <Link
                    key={t.slug}
                    to="/tools/$slug"
                    params={{ slug: t.slug }}
                    className="rounded-2xl border border-border bg-background px-5 py-4 transition-colors hover:border-primary/35"
                  >
                    <p className="font-display text-sm font-bold text-ink">{t.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-display text-lg font-extrabold text-ink">
              Downloads for this practice
            </h3>
            <div className="mt-4">
              <DownloadCenter division={tool.division} />
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
