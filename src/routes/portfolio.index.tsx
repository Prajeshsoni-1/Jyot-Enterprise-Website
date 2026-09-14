import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Target, Lightbulb, TrendingUp } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/primitives";
import { PROJECTS } from "@/data/projects";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";
import { loadProjects } from "@/lib/cms-loaders";

export const Route = createFileRoute("/portfolio/")({
  head: () => ({
    meta: pageMeta({
      title: "Portfolio & Case Studies — Jyot Enterprise",
      description:
        "Selected mandates across finance, IT, legal and engineering with the challenge, solution, technology and measured outcome for each.",
      path: "/portfolio",
      type: "website",
    }),
    links: [canonical("/portfolio")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Portfolio & Case Studies", path: "/portfolio" },
        ]),
      ),
    ],
  }),
  loader: async () => ({ projects: await loadProjects() }),
  component: Portfolio,
});

function Thumb({
  url,
  hue,
  practice,
  title,
}: {
  url?: string | undefined;
  hue: number;
  practice: string;
  title?: string | undefined;
}) {
  if (url) {
    return (
      <div className="relative h-56 w-full overflow-hidden bg-secondary">
        <img
          src={url}
          alt={title || practice}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute top-4 left-4 rounded-full bg-ink/85 px-3 py-1 text-[0.68rem] font-bold tracking-wide text-background uppercase backdrop-blur-sm shadow-xs">
          {practice}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-500" />
      </div>
    );
  }

  return (
    <div
      className="relative h-56 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, oklch(0.94 0.06 ${hue}), oklch(0.88 0.09 ${hue + 20}))`,
      }}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 200">
        <defs>
          <pattern id={`p-${hue}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="oklch(0.3 0 0 / 0.35)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="400" height="200" fill={`url(#p-${hue})`} />
        <circle cx="330" cy="40" r="70" fill="oklch(1 0 0 / 0.35)" />
        <circle cx="70" cy="180" r="55" fill="oklch(1 0 0 / 0.25)" />
      </svg>
      <span className="absolute top-4 left-4 rounded-full bg-ink/85 px-3 py-1 text-[0.68rem] font-bold tracking-wide text-background uppercase backdrop-blur-sm">
        {practice}
      </span>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent transition-opacity duration-500 group-hover:opacity-0" />
    </div>
  );
}

function Portfolio() {
  const { projects } = Route.useLoaderData();
  const [selectedPractice, setSelectedPractice] = useState("all");

  const practices = ["all", "IT", "Financial", "Legal", "Engineering"];

  const filteredProjects = projects.filter((p) => {
    if (selectedPractice === "all") return true;
    return p.practice.toLowerCase().includes(selectedPractice.toLowerCase());
  });

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="Mandates, and what they actually changed."
        body="A selection of engagements across our four practices. Names published with client permission."
      />

      {/* Practice filter chips */}
      <div className="border-b border-border bg-surface/60 py-4">
        <div className="container-x flex flex-wrap items-center justify-center gap-2">
          {practices.map((pr) => (
            <button
              key={pr}
              type="button"
              onClick={() => setSelectedPractice(pr)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                selectedPractice === pr
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-ink"
              }`}
            >
              {pr === "all" ? "All Mandates" : pr}
            </button>
          ))}
        </div>
      </div>

      <section className="bg-background py-20 lg:py-24">
        <div className="container-x grid gap-6 lg:grid-cols-2">
          {filteredProjects.map((w, i) => (
            <Reveal key={w.slug} delay={(i % 2) * 0.08}>
              <motion.article
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="overflow-hidden">
                  <div className="transition-transform duration-700 group-hover:scale-105">
                    <Thumb
                      url={w.thumbnailImage || w.featuredImage || w.heroImage}
                      hue={w.hue}
                      practice={w.practice}
                      title={w.title}
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-display text-sm font-bold text-ink">{w.client}</span>
                    <span className="text-xs text-muted-foreground">{w.industry}</span>
                  </div>

                  <h2 className="mt-4 text-xl leading-snug font-bold text-ink">{w.title}</h2>

                  <dl className="mt-6 space-y-4">
                    {[
                      { icon: Target, label: "Challenge", value: w.challenge },
                      { icon: Lightbulb, label: "Solution", value: w.solution },
                    ].map((row) => (
                      <div key={row.label} className="flex gap-3">
                        <row.icon
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          strokeWidth={1.7}
                        />
                        <div>
                          <dt className="font-display text-[0.68rem] font-bold tracking-[0.16em] text-muted-foreground/70 uppercase">
                            {row.label}
                          </dt>
                          <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {row.value}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-6 flex items-center gap-2 rounded-2xl bg-growth/15 px-5 py-3.5">
                    <TrendingUp className="h-4 w-4 shrink-0 text-growth-foreground" />
                    <span className="font-display text-sm font-extrabold text-growth-foreground">
                      {w.metrics[0]?.k ?? w.outcome}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {w.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[0.68rem] font-semibold text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <Link
                    to="/portfolio/$slug"
                    params={{ slug: w.slug }}
                    className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-ink transition-colors hover:text-primary"
                  >
                    View the full project
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
