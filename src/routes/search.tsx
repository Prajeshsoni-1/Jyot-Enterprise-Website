"use client";

import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon, ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/primitives";
import { searchSite, type SearchKind, type SearchRecord } from "@/lib/search-index";
import { getAllPublishedContent } from "@/lib/cms.functions";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"].slice(0, 100) : "",
  }),
  head: () => ({
    meta: [
      { title: "Search — Jyot Enterprise" },
      {
        name: "description",
        content:
          "Search every Jyot Enterprise service, guide, case study, industry page, project and FAQ from one place.",
      },
      { property: "og:title", content: "Search — Jyot Enterprise" },
      {
        property: "og:description",
        content: "Find services, guides, case studies and answers across the Jyot Enterprise site.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  loader: async (): Promise<{ cmsRecords: SearchRecord[] }> => {
    try {
      const all = await getAllPublishedContent();
      const records: SearchRecord[] = [];
      const push = (kind: SearchKind, prefix: string, meta: string, rows: typeof all.posts) => {
        for (const row of rows) {
          if (!row.slug) continue;
          records.push({
            kind,
            title: row.title ?? row.slug,
            body: `${row.summary ?? ""} ${row.excerpt ?? ""} ${row.body ?? ""}`.slice(0, 1200),
            href: `${prefix}/${row.slug}`,
            meta,
          });
        }
      };
      push("Service", "/service", "Service", all.sub_services);
      if (all.products) push("Product", "/#products", "Product", all.products);
      push("Blog", "/blogs", "Article", all.posts);
      push("Resource", "/resources", "Resource", all.resources);
      push("Case Study", "/case-studies", "Case study", all.case_studies);
      push("Industry", "/industries", "Industry", all.industries);
      push("Project", "/portfolio", "Project", all.projects);
      if (all.jobs) {
        for (const row of all.jobs) {
          if (!row.slug) continue;
          const isInternship =
            row.employment_type === "internship" ||
            (row.data as { position_type?: string } | undefined)?.position_type === "internship";
          records.push({
            kind: "Job",
            title: `${row.title ?? row.slug} (${isInternship ? "Internship" : "Job"})`,
            body: `${row.summary ?? ""} ${row.body ?? ""} ${row.department ?? ""} ${row.location ?? ""} ${(row.skills ?? []).join(" ")}`.slice(0, 1200),
            href: `/careers/${row.slug}`,
            meta: row.department ? `${row.department} · Career` : "Career Opening",
          });
        }
      }
      for (const row of all.faqs) {
        if (!row.question) continue;
        records.push({
          kind: "FAQ",
          title: row.question,
          body: row.answer ?? "",
          href: "/contact",
          meta: row.category ?? "FAQ",
        });
      }
      return { cmsRecords: records };
    } catch {
      return { cmsRecords: [] };
    }
  },
  component: SearchPage,
});

const FILTERS: (SearchKind | "All")[] = [
  "All",
  "Service",
  "Product",
  "Tool",
  "Job",
  "Blog",
  "Resource",
  "Case Study",
  "Industry",
  "Project",
  "FAQ",
];

const SUGGESTIONS = [
  "GST filing",
  "business loan",
  "ERP",
  "AI voice agent",
  "trademark",
  "SolidWorks",
  "working capital",
];

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [query, setQuery] = useState(q);
  const [filter, setFilter] = useState<SearchKind | "All">("All");

  const { cmsRecords } = Route.useLoaderData();

  const results = useMemo(() => {
    const found = searchSite(query, 40, cmsRecords);
    return filter === "All" ? found : found.filter((r) => r.kind === filter);
  }, [query, filter, cmsRecords]);

  return (
    <>
      <PageHero
        eyebrow="Search"
        title="Find anything on this site."
        body="Services, guides, case studies, industries, projects and answers — all indexed in one place."
      />

      <section className="bg-background py-16">
        <div className="container-x">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => {
                const next = e.target.value.slice(0, 100);
                setQuery(next);
                void navigate({ search: { q: next }, replace: true });
              }}
              placeholder="Search services, guides, FAQs…"
              aria-label="Search the site"
              className="w-full rounded-full border border-border bg-surface py-5 pr-6 pl-14 text-base text-ink placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {query.trim().length < 2 ? (
            <div className="mt-14">
              <p className="font-display text-xs font-bold tracking-[0.16em] text-muted-foreground/70 uppercase">
                Popular searches
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-12">
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query.trim()}
                &rdquo;
              </p>
              <div className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-border bg-border">
                {results.map((r) => (
                  <Link
                    key={`${r.kind}-${r.title}-${r.href}`}
                    to={r.href as "/"}
                    className="group flex items-start justify-between gap-6 bg-background px-6 py-5 transition-colors hover:bg-surface"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-primary uppercase">
                          {r.kind}
                        </span>
                        <span className="text-[0.7rem] text-muted-foreground">{r.meta}</span>
                      </span>
                      <span className="mt-2 block font-display text-base font-bold text-ink">
                        {r.title}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                        {r.body}
                      </span>
                    </span>
                    <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                ))}
                {results.length === 0 ? (
                  <div className="bg-background px-6 py-12 text-center">
                    <p className="font-display text-lg font-bold text-ink">No matches</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Try a broader term, or{" "}
                      <Link to="/contact" className="font-semibold text-primary">
                        ask us directly
                      </Link>
                      .
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      <Reveal className="container-x pb-24">
        <div className="rounded-3xl border border-border bg-surface p-10 text-center">
          <h2 className="text-2xl font-extrabold text-ink">Cannot find what you need?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Tell us what you are looking for and a consultant will point you to the right team
            within a working day.
          </p>
          <Link
            to="/contact"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-ember transition-colors hover:bg-primary-hover"
          >
            Contact us <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
    </>
  );
}
