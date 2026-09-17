"use client";

import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/primitives";
import { CtaBand } from "@/components/site/CtaBand";
import { DownloadCenter } from "@/components/site/DownloadCenter";
import { SERVICES } from "@/data/site";
import { loadDownloads } from "@/lib/cms-loaders";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/downloads")({
  loader: async () => ({ documents: await loadDownloads() }),
  head: () => ({
    meta: pageMeta({
      title: "Download Centre — Brochures, Checklists & Guides | Jyot Enterprise",
      description:
        "Download capability brochures, document checklists, process guides and FAQ sheets for Jyot Enterprise financial, IT, legal and engineering services.",
      path: "/downloads",
      type: "website",
    }),
    links: [canonical("/downloads")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Download Centre", path: "/downloads" },
        ]),
      ),
    ],
  }),
  component: Downloads,
});

function Downloads() {
  const data = Route.useLoaderData();
  const documents = Array.isArray(data?.documents) ? data.documents : [];
  return (
    <>
      <PageHero
        eyebrow="Download Centre"
        title="Everything you would ask for in a first meeting."
        body="Brochures, document checklists, process guides and FAQ sheets for all four practices. No form, no wait."
      />

      {documents.length ? (
        <section className="border-b border-border bg-surface py-20">
          <div className="container-x">
            <SectionHeading eyebrow="Documents" title="Latest documents" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((d) => {
                const targetUrl = d.fileUrl || `/downloads/${d.slug}.pdf`;
                const filename = `${d.slug}.pdf`;
                return (
                  <a
                    key={d.slug}
                    href={targetUrl}
                    download={filename}
                    className="rounded-2xl border border-border bg-background p-6 transition hover:border-primary/40 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {d.category ? (
                        <p className="eyebrow text-primary uppercase">{d.category}</p>
                      ) : (
                        <span />
                      )}
                      <span className="rounded bg-muted px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        PDF
                      </span>
                    </div>
                    <p className="mt-2 font-display text-base font-bold text-ink group-hover:text-primary transition-colors">
                      {d.title}
                    </p>
                    {d.summary ? (
                      <p className="mt-2 text-sm text-muted-foreground">{d.summary}</p>
                    ) : null}
                    <p className="mt-4 text-xs font-semibold text-primary">
                      {d.ctaLabel || "Download"} · PDF
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-background py-24">
        <div className="container-x grid gap-16">
          {SERVICES.map((service) => (
            <div key={service.slug}>
              <SectionHeading eyebrow={service.short} title={`${service.name} downloads`} />
              <div className="mt-8">
                <DownloadCenter division={service.slug} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
