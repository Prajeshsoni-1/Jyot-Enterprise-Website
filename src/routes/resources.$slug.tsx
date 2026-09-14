import { createFileRoute, Link, notFound, useSearch } from "@tanstack/react-router";
import { Clock, Download, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { RelatedGrid } from "@/components/site/RelatedGrid";
import { Reveal } from "@/components/site/primitives";
import { RESOURCE_LIBRARY, type ResourceItem } from "@/data/resources";
import { canonical, breadcrumbSchema, faqSchema, jsonLd, pageMeta, SITE_NAME } from "@/lib/seo";
import { loadResourceBySlug, loadResources } from "@/lib/cms-loaders";

export const Route = createFileRoute("/resources/$slug")({
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } => {
    const isP =
      search["preview"] === true || search["preview"] === "true" || search["preview"] === "1";
    return isP ? { preview: true } : {};
  },
  loaderDeps: ({ search }) => ({ preview: Boolean(search.preview) }),
  loader: async ({ params, deps }) => {
    const resource = await loadResourceBySlug(params.slug, deps.preview);
    if (!resource) throw notFound();
    // Also load sibling resources for "Related" section
    const library = await loadResources();
    return { resource, library };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Resource not found" }, { name: "robots", content: "noindex" }] };
    }
    const r = loaderData.resource as ResourceItem;
    const path = `/resources/${params.slug}`;
    return {
      meta: pageMeta({
        title: r.seoTitle || `${r.title} — ${SITE_NAME}`,
        description: r.seoDescription || r.summary,
        path,
        type: "article",
        ...(r.ogImage ? { image: r.ogImage } : {}),
        ...(r.noindex ? { noindex: true } : {}),
      }),
      links: [canonical(r.canonicalUrl || path)],
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: r.title,
          description: r.summary,
          articleSection: r.category,
          ...(r.author ? { author: { "@type": "Person", name: r.author } } : {}),
          publisher: { "@type": "Organization", name: SITE_NAME },
          mainEntityOfPage: path,
          ...(r.ogImage ? { image: r.ogImage } : {}),
        }),
        jsonLd(faqSchema(r.faqs)),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: r.title, path },
          ]),
        ),
      ],
    };
  },
  component: ResourcePage,
  notFoundComponent: () => (
    <section className="container-x py-32 text-center">
      <h1 className="font-display text-3xl font-extrabold text-ink">Resource not found</h1>
      <Link to="/resources" className="mt-6 inline-block font-semibold text-primary">
        Browse the library
      </Link>
    </section>
  ),
});

function ResourcePage() {
  const { resource, library } = Route.useLoaderData() as {
    resource: ResourceItem;
    library: ResourceItem[];
  };
  const path = `/resources/${resource.slug}`;
  const related = library
    .filter((r) => r.slug !== resource.slug)
    .slice(0, 3)
    .map((r) => ({
      title: r.title,
      meta: r.category,
      href: `/resources/${r.slug}`,
      body: r.summary,
    }));

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: resource.title, path },
        ]}
      />

      <header className="border-b border-border bg-surface py-16 lg:py-20">
        <div className="container-x max-w-3xl">
          <p className="eyebrow text-primary">
            {resource.category} · {resource.practice}
          </p>
          <h1 className="mt-4 text-3xl leading-[1.1] font-extrabold tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl">
            {resource.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{resource.summary}</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" /> {resource.readTime} read
            </span>
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Updated {resource.updated}
            </span>
            {resource.author ? (
              <span className="inline-flex items-center gap-2">
                By <strong className="text-ink">{resource.author}</strong>
                {resource.authorRole ? `, ${resource.authorRole}` : ""}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <section className="bg-background py-20">
        <div className="container-x grid gap-14 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 max-w-3xl">
            {/* Featured image */}
            {resource.featuredImage ? (
              <Reveal className="mb-11">
                <img
                  src={resource.featuredImage}
                  alt={resource.title}
                  className="w-full rounded-2xl object-cover border border-border"
                  style={{ maxHeight: "400px" }}
                />
              </Reveal>
            ) : null}

            {/* Full description if present */}
            {resource.description && resource.description !== resource.summary ? (
              <Reveal className="mb-11">
                <p className="text-base leading-relaxed text-muted-foreground">
                  {resource.description}
                </p>
              </Reveal>
            ) : null}

            {/* Content sections */}
            {resource.sections
              .filter((sec) => sec.enabled !== false)
              .map((sec, i) => (
                <Reveal key={sec.id || sec.heading || i} className="mb-11">
                  {/* Heading */}
                  {sec.heading ? (
                    <h2 className="font-display text-2xl font-bold text-ink">{sec.heading}</h2>
                  ) : null}

                  {/* Body paragraph */}
                  {sec.body ? (
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                      {sec.body}
                    </p>
                  ) : null}

                  {/* Bullet points */}
                  {sec.points && sec.points.length > 0 ? (
                    <ul className="mt-5 grid gap-2.5">
                      {sec.points.map((p, pi) => (
                        <li
                          key={pi}
                          className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                        >
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {/* Checklist items */}
                  {sec.items && sec.items.length > 0 ? (
                    <ul className="mt-5 grid gap-2.5">
                      {sec.items.map((item, ii) => (
                        <li
                          key={ii}
                          className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {/* Steps / Process */}
                  {sec.steps && sec.steps.length > 0 ? (
                    <ol className="mt-5 grid gap-4">
                      {sec.steps.map((step, si) => (
                        <li
                          key={si}
                          className="flex gap-4 text-sm leading-relaxed text-muted-foreground"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {si + 1}
                          </span>
                          <div>
                            {step.step ? (
                              <strong className="text-ink">{step.step} — </strong>
                            ) : null}
                            {step.body}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : null}

                  {/* Quote */}
                  {sec.quote ? (
                    <blockquote className="mt-6 border-l-4 border-primary pl-5 italic text-ink">
                      <p className="text-base">{sec.quote}</p>
                      {sec.quoteBy ? (
                        <footer className="mt-2 text-sm font-semibold text-muted-foreground not-italic">
                          — {sec.quoteBy}
                        </footer>
                      ) : null}
                    </blockquote>
                  ) : null}

                  {/* Stats / Metrics */}
                  {sec.stats && sec.stats.length > 0 ? (
                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {sec.stats.map((stat, si) => (
                        <div
                          key={si}
                          className="rounded-2xl border border-border bg-card p-4 text-center"
                        >
                          <p className="text-2xl font-extrabold text-primary">{stat.value}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Callout box */}
                  {sec.calloutType ? (
                    <div
                      className={`mt-6 rounded-2xl border p-4 text-sm leading-relaxed ${
                        sec.calloutType === "warning"
                          ? "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-300"
                          : sec.calloutType === "tip"
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-300"
                            : "border-primary/30 bg-primary/5 text-ink"
                      }`}
                    >
                      {sec.body}
                    </div>
                  ) : null}

                  {/* Image (full_image or image_text) */}
                  {sec.imageUrl ? (
                    <div className="mt-6">
                      <img
                        src={sec.imageUrl}
                        alt={sec.imageAlt || sec.heading || ""}
                        className="rounded-2xl w-full object-cover border border-border max-h-[450px]"
                      />
                      {sec.imageAlt ? (
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                          {sec.imageAlt}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Video */}
                  {sec.videoUrl ? (
                    <div className="mt-6">
                      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black">
                        <iframe
                          src={sec.videoUrl}
                          title={sec.videoCaption || sec.heading || "Resource video"}
                          className="h-full w-full"
                          allowFullScreen
                        />
                      </div>
                      {sec.videoCaption ? (
                        <p className="mt-2 text-xs text-muted-foreground">{sec.videoCaption}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Table */}
                  {sec.tableHeaders && sec.tableHeaders.length > 0 && sec.tableRows ? (
                    <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="border-b border-border bg-muted/50 font-semibold text-ink">
                          <tr>
                            {sec.tableHeaders.map((h, hi) => (
                              <th key={hi} className="px-4 py-2.5">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sec.tableRows.map((row, ri) => (
                            <tr key={ri} className="hover:bg-muted/30">
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-4 py-2 text-muted-foreground">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {/* FAQs within section */}
                  {sec.faqs && sec.faqs.length > 0 ? (
                    <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card p-4">
                      {sec.faqs.map((faq, fi) => (
                        <div key={fi} className="py-3 first:pt-0 last:pb-0">
                          <p className="text-sm font-bold text-ink">{faq.q}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {faq.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Inline CTA block */}
                  {sec.ctaHeading ? (
                    <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
                      <p className="font-display text-base font-bold text-ink">{sec.ctaHeading}</p>
                      {sec.ctaBody ? (
                        <p className="mt-2 text-sm text-muted-foreground">{sec.ctaBody}</p>
                      ) : null}
                      {sec.ctaPrimaryUrl && sec.ctaPrimaryText ? (
                        <Link
                          to={sec.ctaPrimaryUrl}
                          className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition"
                        >
                          {sec.ctaPrimaryText}
                        </Link>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Custom content */}
                  {sec.html ? (
                    <div
                      className="mt-6 prose prose-sm max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: sec.html }}
                    />
                  ) : null}
                </Reveal>
              ))}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="eyebrow">Downloads</p>
              {resource.downloads.filter((d) => d.isActive !== false && Boolean(d.fileUrl)).length >
              0 ? (
                <ul className="mt-4 grid gap-3">
                  {resource.downloads
                    .filter((d) => d.isActive !== false && Boolean(d.fileUrl))
                    .map((d, di) => (
                      <li key={d.id || d.name || di}>
                        <DownloadItem download={d} />
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No downloads available yet.</p>
              )}
            </div>

            {/* CTA card if configured */}
            {resource.cta?.enabled !== false && resource.cta?.heading ? (
              <ResourceCtaCard cta={resource.cta} />
            ) : null}
          </aside>
        </div>
      </section>

      <FaqAccordion items={resource.faqs} eyebrow="FAQs" title="Questions this guide gets asked." />
      <RelatedGrid
        items={related}
        eyebrow="More resources"
        title="Related guides and checklists."
      />

      {/* Global CTA band — always show, or use custom CTA */}
      {resource.cta?.enabled !== false && resource.cta?.heading ? null : <CtaBand />}
    </>
  );
}

/** Renders a verified real download item. */
function DownloadItem({ download }: { download: ResourceItem["downloads"][number] }) {
  const label = download.displayLabel || download.name;
  const sizeStr = download.size ? ` · ${download.size}` : "";
  const formatStr = download.format || "PDF";

  return (
    <a
      href={download.fileUrl!}
      target="_blank"
      rel="noreferrer noopener"
      download={download.downloadFilename || true}
      className="group flex items-start gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:border-primary/40"
    >
      <Download className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink group-hover:text-primary">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {formatStr}
          {sizeStr}
        </span>
      </span>
      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
    </a>
  );
}

/** Custom CTA card from CMS resource editor. */
function ResourceCtaCard({ cta }: { cta: NonNullable<ResourceItem["cta"]> }) {
  return (
    <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-6">
      {cta.heading ? (
        <p className="font-display text-base font-bold text-ink">{cta.heading}</p>
      ) : null}
      {cta.description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cta.description}</p>
      ) : null}
      <div className="mt-4 grid gap-2">
        {cta.primaryUrl && cta.primaryText ? (
          <Link
            to={cta.primaryUrl}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            {cta.primaryText}
          </Link>
        ) : null}
        {cta.secondaryUrl && cta.secondaryText ? (
          <Link
            to={cta.secondaryUrl}
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
          >
            {cta.secondaryText}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
