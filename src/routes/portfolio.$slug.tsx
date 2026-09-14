import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Layers,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { RelatedGrid } from "@/components/site/RelatedGrid";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { PROJECTS, type Project } from "@/data/projects";
import { canonical, breadcrumbSchema, jsonLd, pageMeta, SITE_NAME } from "@/lib/seo";
import { loadProject, loadProjects } from "@/lib/cms-loaders";
import { PortfolioSectionsRenderer } from "@/components/portfolio/PortfolioSectionsRenderer";

export const Route = createFileRoute("/portfolio/$slug")({
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } => {
    const isP = search["preview"] === "true" || search["preview"] === true || search["preview"] === "1";
    return isP ? { preview: true } : {};
  },
  loader: async ({ params, location }) => {
    const isPreview = Boolean(
      typeof location.search === "object" && (location.search as any)?.preview,
    );
    const project = await loadProject(params.slug, isPreview);
    if (!project) throw notFound();
    const allProjects = await loadProjects();
    return { project, allProjects, isPreview };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Project not found" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.project as Project;
    const path = `/portfolio/${params.slug}`;
    const title = p.seoTitle || `${p.client} — ${p.title} | ${SITE_NAME}`;
    const description = p.seoDescription || p.summary;
    const ogImage = p.ogImage || p.featuredImage || p.heroImage;

    const metaOpts: Parameters<typeof pageMeta>[0] = {
      title,
      description,
      path,
      type: "article",
      noindex: Boolean(p.noindex || loaderData.isPreview),
    };
    if (ogImage) {
      metaOpts.image = ogImage;
    }

    return {
      meta: [
        ...pageMeta(metaOpts),
        ...(p.nofollow ? [{ name: "robots", content: "nofollow" }] : []),
      ],
      links: [canonical(p.canonicalUrl || path)],
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: `${p.client} — ${p.title}`,
          description: p.summary,
          about: p.industry,
          creator: { "@type": "Organization", name: SITE_NAME },
          url: path,
        }),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Portfolio", path: "/portfolio" },
            { name: p.client, path },
          ]),
        ),
      ],
    };
  },
  component: ProjectPage,
  notFoundComponent: () => (
    <section className="container-x py-32 text-center">
      <h1 className="font-display text-3xl font-extrabold text-ink">Project not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The project you are looking for may have been unpublished or moved.
      </p>
      <Link to="/portfolio" className="mt-6 inline-block font-semibold text-primary">
        See all projects
      </Link>
    </section>
  ),
});

function Panel({
  url,
  hue,
  caption,
  tall = false,
  alt,
}: {
  url?: string | undefined;
  hue: number;
  caption: string;
  tall?: boolean | undefined;
  alt?: string | undefined;
}) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-border shadow-xs bg-card">
      {url ? (
        <div className={tall ? "h-72 sm:h-96 w-full overflow-hidden bg-secondary" : "h-52 w-full overflow-hidden bg-secondary"}>
          <img
            src={url}
            alt={alt || caption}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className={tall ? "h-72 sm:h-96" : "h-52"}
          style={{
            background: `linear-gradient(135deg, oklch(0.94 0.06 ${hue}), oklch(0.88 0.09 ${hue + 20}))`,
          }}
          role="img"
          aria-label={caption}
        />
      )}
      {caption ? (
        <figcaption className="border-t border-border bg-card px-5 py-3 text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ProjectPage() {
  const { project, allProjects, isPreview } = Route.useLoaderData() as {
    project: Project;
    allProjects: Project[];
    isPreview: boolean;
  };

  const controls = project.controls ?? {
    showProject: true,
    showRelated: true,
    showTechnologies: true,
    showClientQuote: true,
    showCta: true,
    showGallery: true,
  };

  // Compute related projects: first check explicit relatedProjectSlugs, then fallback
  const related = (
    project.relatedProjectSlugs && project.relatedProjectSlugs.length > 0
      ? allProjects.filter(
          (p) => project.relatedProjectSlugs?.includes(p.slug) && p.slug !== project.slug
        )
      : allProjects.filter((p) => p.slug !== project.slug)
  )
    .slice(0, 3)
    .map((p) => ({
      title: `${p.client} — ${p.title}`,
      meta: p.industry,
      href: `/portfolio/${p.slug}`,
      body: p.summary,
    }));

  const mainDisplayImage = project.heroImage || project.featuredImage;

  return (
    <>
      {/* Draft Preview Bar */}
      {isPreview ? (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-xs font-bold tracking-wide flex items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            PREVIEW MODE — Viewing {project.published ? "published" : "draft"} version. Visitors will only see this project once published.
          </span>
        </div>
      ) : null}

      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Portfolio", path: "/portfolio" },
          { name: project.client, path: `/portfolio/${project.slug}` },
        ]}
      />

      {/* Header & Hero */}
      <header className="border-b border-border bg-surface py-16 lg:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-primary">
                {project.practice} · {project.industry}
              </span>
              {project.subCategory ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-primary">
                  {project.subCategory}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl leading-[1.1] font-extrabold tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl">
              {project.title}
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{project.summary}</p>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Client</dt>
                <dd className="font-display font-bold text-ink flex items-center gap-2 mt-0.5">
                  {project.clientLogo ? (
                    <img
                      src={project.clientLogo}
                      alt={project.client}
                      className="h-5 w-auto object-contain max-w-[80px]"
                    />
                  ) : null}
                  <span>{project.client}</span>
                </dd>
              </div>

              {project.duration ? (
                <div>
                  <dt className="text-muted-foreground text-xs">Timeline</dt>
                  <dd className="font-display font-bold text-ink mt-0.5">{project.duration}</dd>
                </div>
              ) : null}

              {project.year ? (
                <div>
                  <dt className="text-muted-foreground text-xs">Delivered</dt>
                  <dd className="font-display font-bold text-ink mt-0.5">{project.year}</dd>
                </div>
              ) : null}

              {project.clientLocation ? (
                <div>
                  <dt className="text-muted-foreground text-xs">Location</dt>
                  <dd className="font-display font-bold text-ink mt-0.5">{project.clientLocation}</dd>
                </div>
              ) : null}
            </dl>

            {project.projectUrl ? (
              <div className="mt-8">
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-ink hover:bg-secondary transition shadow-2xs"
                >
                  <span>Visit Client Project</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : null}
          </div>

          <Panel
            url={mainDisplayImage}
            hue={project.hue}
            caption={`${project.client} — featured overview`}
            alt={project.title}
            tall
          />
        </div>
      </header>

      {/* Challenge, Solution & Result */}
      <section className="bg-background py-20">
        <div className="container-x grid gap-12 lg:grid-cols-3">
          {/* Challenge Block */}
          <Reveal>
            <p className="eyebrow text-primary">
              {project.challengeDetails?.title || "Business challenge"}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
              {project.challengeDetails?.description || project.challenge}
            </p>
            {project.challengeDetails?.points && project.challengeDetails.points.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {project.challengeDetails.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink">
                    <span className="text-primary font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>

          {/* Solution Block */}
          <Reveal>
            <p className="eyebrow text-primary">
              {project.solutionDetails?.title || "Solution"}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
              {project.solutionDetails?.description || project.solution}
            </p>
            {project.solutionDetails?.points && project.solutionDetails.points.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {project.solutionDetails.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>

          {/* Result Block */}
          <Reveal>
            <p className="eyebrow text-primary">
              {project.resultDetails?.title || "Business result"}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
              {project.resultDetails?.description || project.outcome}
            </p>
          </Reveal>
        </div>

        {/* Outcome Metrics Cards */}
        {project.metrics && project.metrics.length > 0 ? (
          <div className="container-x mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {project.metrics.map((m, idx) => (
              <div key={idx} className="bg-background p-8 text-center sm:text-left">
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-growth">{m.k}</p>
                <p className="mt-2 text-sm text-muted-foreground">{m.v}</p>
                {m.label ? (
                  <span className="mt-2 inline-block text-[0.68rem] font-bold text-primary">
                    {m.label}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* Before & After Comparison */}
        {project.beforeImage?.url && project.afterImage?.url ? (
          <div className="container-x mt-16">
            <SectionHeading
              eyebrow="Transformation"
              title="Before & After Implementation."
            />
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
                <img
                  src={project.beforeImage.url}
                  alt="Before"
                  className="h-64 w-full object-cover"
                />
                <figcaption className="border-t border-border bg-card px-4 py-3 text-xs font-bold text-muted-foreground flex items-center justify-between">
                  <span>{project.beforeImage.label || "Before"}</span>
                  <span className="text-[0.65rem] text-destructive uppercase tracking-wider font-semibold">
                    Legacy state
                  </span>
                </figcaption>
              </figure>

              <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
                <img
                  src={project.afterImage.url}
                  alt="After"
                  className="h-64 w-full object-cover"
                />
                <figcaption className="border-t border-border bg-card px-4 py-3 text-xs font-bold text-ink flex items-center justify-between">
                  <span>{project.afterImage.label || "After"}</span>
                  <span className="text-[0.65rem] text-emerald-600 uppercase tracking-wider font-semibold">
                    Optimized state
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        ) : null}

        {/* Technologies Pills */}
        {controls.showTechnologies !== false && project.tech && project.tech.length > 0 ? (
          <div className="container-x mt-12 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink mr-2">Technologies:</span>
            {project.tech.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-ink transition"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {/* Dynamic Content Sections (Rendered in saved order) */}
      {project.sections && project.sections.length > 0 ? (
        <div className="py-16 bg-surface/50 border-t border-border">
          <PortfolioSectionsRenderer sections={project.sections} />
        </div>
      ) : null}

      {/* Gallery & Deliverables */}
      {controls.showGallery !== false && project.gallery && project.gallery.length > 0 ? (
        <section className="border-t border-border bg-surface py-20">
          <div className="container-x">
            <SectionHeading eyebrow="Gallery" title="Screens and deliverables." />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {project.gallery.map((g, i) => (
                <Panel
                  key={i}
                  url={g.url}
                  hue={g.hue}
                  caption={g.caption}
                  alt={g.alt || g.caption}
                />
              ))}
            </div>

            {/* Client Quote Card */}
            {controls.showClientQuote !== false && (project.clientQuote?.quote || project.quote) ? (
              <div className="mt-16 max-w-2xl">
                <TestimonialCard
                  t={{
                    name:
                      project.clientQuote?.name ||
                      project.quoteBy?.split("·")[0]?.trim() ||
                      project.client,
                    role:
                      project.clientQuote?.designation ||
                      project.quoteBy?.split("·")[1]?.trim() ||
                      "",
                    company: project.clientQuote?.company || project.client,
                    quote: project.clientQuote?.quote || project.quote || "",
                    service: project.practice,
                  }}
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Related Projects */}
      {controls.showRelated !== false && related.length > 0 ? (
        <RelatedGrid items={related} eyebrow="More work" title="Related projects." />
      ) : null}

      {/* Project Call to Action */}
      {controls.showCta !== false ? (
        project.cta && project.cta.enabled !== false ? (
          <section className="container-x py-20">
            <div className="rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-8 sm:p-14 text-center shadow-xs">
              <p className="eyebrow text-primary mb-2">Next Steps</p>
              <h2 className="font-display text-2xl font-extrabold text-ink sm:text-4xl">
                {project.cta.heading}
              </h2>
              {project.cta.description ? (
                <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                  {project.cta.description}
                </p>
              ) : null}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={project.cta.primaryButtonUrl || "/contact"}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
                >
                  <span>{project.cta.primaryButtonText || "Schedule Consultation"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {project.cta.secondaryButtonText && project.cta.secondaryButtonUrl ? (
                  <Link
                    to={project.cta.secondaryButtonUrl}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-5 py-3 text-sm font-bold text-ink hover:bg-secondary transition"
                  >
                    <span>{project.cta.secondaryButtonText}</span>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <CtaBand
            eyebrow="Similar problem?"
            title="We have solved this shape of problem before."
            body="Tell us where your operation leaks time or cash and we will scope what it takes to fix it."
          />
        )
      ) : null}
    </>
  );
}

