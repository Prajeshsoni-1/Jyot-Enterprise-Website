import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Download, Clock } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { getIcon } from "@/components/site/icon-map";
import { RESOURCE_LIBRARY } from "@/data/resources";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";
import { loadResources } from "@/lib/cms-loaders";

export const Route = createFileRoute("/resources/")({
  head: () => ({
    meta: pageMeta({
      title: "Resource Centre — Guides, Checklists & Templates | Jyot Enterprise",
      description:
        "Free business guides, loan and GST explainers, ERP and CRM selection checklists, engineering references and downloadable templates for Indian businesses.",
      path: "/resources",
      type: "website",
    }),
    links: [canonical("/resources")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
        ]),
      ),
    ],
  }),
  loader: async () => ({ library: await loadResources() }),
  component: Resources,
});

function Resources() {
  const data = Route.useLoaderData();
  const library = Array.isArray(data?.library) ? data.library : [];
  return (
    <>
      <PageHero
        eyebrow="Resource centre"
        title="Everything we know, written down and free to take."
        body="The same guides, formats and checklists our own consultants use on live mandates."
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
        ]}
      />

      <section className="bg-background py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Library" title="Guides, checklists and templates." />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {library.map((r, i) => {
              const Icon = getIcon(r.icon);
              const activeDownloads = r.downloads.filter((d) => d.isActive !== false);
              return (
                <Reveal key={r.slug} delay={(i % 3) * 0.06}>
                  <Link
                    to="/resources/$slug"
                    params={{ slug: r.slug }}
                    className="group flex h-full flex-col rounded-3xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift overflow-hidden"
                  >
                    {/* Thumbnail image strip (only when available) */}
                    {r.thumbnailImage || r.featuredImage ? (
                      <div className="w-full h-36 overflow-hidden bg-surface shrink-0">
                        <img
                          src={(r.thumbnailImage || r.featuredImage)!}
                          alt={r.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-7">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/10">
                        <Icon className="h-5 w-5" strokeWidth={1.6} />
                      </span>
                      <div className="mt-6 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/8 px-3 py-1 text-[0.65rem] font-bold tracking-wide text-primary uppercase">
                          {r.category}
                        </span>
                        <span className="text-[0.7rem] text-muted-foreground">{r.practice}</span>
                      </div>
                      <h2 className="mt-4 font-display text-base leading-snug font-bold text-ink">
                        {r.title}
                      </h2>
                      <p className="mt-3 flex-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {r.summary}
                      </p>
                      <div className="mt-6 flex items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {r.readTime}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Download className="h-3.5 w-3.5" /> {activeDownloads.length} file
                          {activeDownloads.length === 1 ? "" : "s"}
                          <ArrowUpRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Need it applied?"
        title="A guide tells you what. We do the how."
        body="Bring the checklist to a consultation and we will tell you exactly what your business needs to change first."
      />
    </>
  );
}
