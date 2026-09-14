import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { SERVICES, PRODUCTS, INDUSTRIES, CONTACT } from "@/data/site";
import { TOOLS } from "@/components/site/tools/registry";
import { canonical, breadcrumbSchema, jsonLd, pageMeta, SITE_NAME } from "@/lib/seo";
import {
  loadBlogPosts,
  loadCaseStudies,
  loadIndustries,
  loadJobs,
  loadProjects,
  loadResources,
  loadSubServices,
} from "@/lib/cms-loaders";
import {
  Search,
  ExternalLink,
  Banknote,
  Cpu,
  Scale,
  Cog,
  Boxes,
  Calculator,
  Factory,
  Briefcase,
  BookOpen,
  Users,
  CalendarCheck,
  ShieldAlert,
  ArrowRight,
  FileCode2,
} from "lucide-react";

export const Route = createFileRoute("/sitemap")({
  loader: async () => {
    const [subServices, industries, caseStudies, projects, resources, posts, jobs] =
      await Promise.all([
        loadSubServices().catch(() => []),
        loadIndustries().catch(() => []),
        loadCaseStudies().catch(() => []),
        loadProjects().catch(() => []),
        loadResources().catch(() => []),
        loadBlogPosts().catch(() => []),
        loadJobs().catch(() => []),
      ]);

    return {
      subServices,
      industries,
      caseStudies,
      projects,
      resources,
      posts,
      jobs,
    };
  },
  head: () => ({
    meta: pageMeta({
      title: `HTML Sitemap & Directory — ${SITE_NAME}`,
      description:
        "Comprehensive site directory and index of all practice areas, digital platforms, industry solutions, calculators, guides, and corporate resources at Jyot Enterprise.",
      path: "/sitemap",
      type: "website",
    }),
    links: [canonical("/sitemap")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Sitemap", path: "/sitemap" },
        ]),
      ),
    ],
  }),
  component: SitemapPage,
});

type SitemapLink = {
  title: string;
  to?: string;
  href?: string;
  badge?: string;
  description?: string;
};

type SitemapSection = {
  title: string;
  description: string;
  icon: typeof Banknote;
  links: SitemapLink[];
};

function SitemapPage() {
  const data = Route.useLoaderData();
  const [search, setSearch] = useState("");

  const sections: SitemapSection[] = useMemo(() => {
    return [
      {
        title: "1. Advisory Divisions & Practices",
        description:
          "Our four multi-disciplinary core advisory groups and specialized capabilities.",
        icon: Scale,
        links: [
          { title: "All Advisory Services", to: "/services", badge: "Overview" },
          {
            title: "Financial Advisory & Corporate Funding",
            to: "/services/financial",
            badge: "Division",
            description: "Working capital, project finance, MSME credit & balance sheet loans",
          },
          {
            title: "Technology, Software & AI Systems",
            to: "/services/it",
            badge: "Division",
            description: "Custom software, ERP, CRM, AI agents & cloud architectures",
          },
          {
            title: "Legal, Taxation & Corporate Compliance",
            to: "/services/legal",
            badge: "Division",
            description: "GST registration/filing, ROC compliance, trademark & IP desks",
          },
          {
            title: "Engineering Consultancy & Mechanical Design",
            to: "/services/engineering",
            badge: "Division",
            description:
              "CAD, SolidWorks, machine design, shop-floor automation & reverse engineering",
          },
          ...data.subServices.map((s) => ({
            title: s.name,
            to: `/service/${s.slug}`,
            badge: s.parent ? s.parent.toUpperCase() : "Practice",
            description: s.tagline,
          })),
        ],
      },
      {
        title: "2. Enterprise Platforms & Software",
        description: "Standardized business applications, automation suites, and custom software.",
        icon: Boxes,
        links: [
          ...PRODUCTS.map((p) => ({
            title: p.name,
            to: "/contact",
            badge: p.tags?.[0] || "Platform",
            description: p.body,
          })),
          { title: "Client Portfolio & Platforms", to: "/portfolio", badge: "Live Systems" },
          ...data.projects.map((p) => ({
            title: p.title,
            to: `/portfolio/${p.slug}`,
            badge: "Platform Case",
          })),
        ],
      },
      {
        title: "3. Interactive Business Calculators",
        description: "Free estimation tools and financial modeling calculators.",
        icon: Calculator,
        links: [
          { title: "Calculators Index Hub", to: "/tools", badge: "Suite" },
          ...TOOLS.map((t) => ({
            title: t.name,
            to: `/tools/${t.slug}`,
            badge: t.division.toUpperCase(),
            description: t.summary || t.description,
          })),
        ],
      },
      {
        title: "4. Industry Advisory Verticals",
        description: "Targeted domain expertise engineered for specific business sectors.",
        icon: Factory,
        links: [
          { title: "All Industries Hub", to: "/industries", badge: "Overview" },
          ...(data.industries.length > 0
            ? data.industries.map((i) => ({
                title: i.name,
                to: `/industries/${i.slug}`,
                badge: "Sector",
                description: i.headline,
              }))
            : INDUSTRIES.map((i) => ({
                title: i.name,
                to: `/industries/${i.name.toLowerCase().replace(/\s+/g, "-")}`,
                badge: "Sector",
                description: i.body,
              }))),
        ],
      },
      {
        title: "5. Case Studies & Success Stories",
        description: "Documented client impact, turnaround stories, and measurable business ROI.",
        icon: Briefcase,
        links: [
          { title: "Case Studies Directory", to: "/case-studies", badge: "Index" },
          ...data.caseStudies.map((c) => ({
            title: c.title,
            to: `/case-studies/${c.slug}`,
            badge: c.client || "Impact",
          })),
        ],
      },
      {
        title: "6. Knowledge Hub, Downloads & Articles",
        description: "Insights, tax calendars, technical whitepapers, and guides.",
        icon: BookOpen,
        links: [
          { title: "Articles & Industry Insights", to: "/blogs", badge: "Publications" },
          ...data.posts.slice(0, 10).map((p) => ({
            title: p.title,
            to: `/blogs/${p.slug}`,
            badge: p.category || "Article",
          })),
          { title: "Knowledge Library & Guides", to: "/resources", badge: "Guides" },
          ...data.resources.slice(0, 10).map((r) => ({
            title: r.title,
            to: `/resources/${r.slug}`,
            badge: r.category || "Document",
          })),
          { title: "Download Center & Forms", to: "/downloads", badge: "Downloads" },
        ],
      },
      {
        title: "7. Company, Careers & Culture",
        description: "Our founding story, leadership, team members, and open career openings.",
        icon: Users,
        links: [
          {
            title: "About Jyot Enterprise",
            to: "/about",
            badge: "Story",
            description: "Operating model, values, leadership, and multi-disciplinary governance",
          },
          { title: "Careers & Open Positions", to: "/careers", badge: "Careers Hub" },
          ...data.jobs.map((j) => ({
            title: j.title,
            to: `/careers/${j.slug}`,
            badge: j.department || "Open Role",
            description: `${j.location || "Gandhinagar"} • ${j.type || "Full-time"}`,
          })),
        ],
      },
      {
        title: "8. Client Engagement & Inquiries",
        description: "Connect with our advisory desks or reserve a scheduled time slot.",
        icon: CalendarCheck,
        links: [
          {
            title: "Book a Scheduled Consultation",
            to: "/book",
            badge: "Direct Slot",
            description: "Interactive calendar picker for video, phone, or office sessions",
          },
          {
            title: "Contact Desks & Office Directions",
            to: "/contact",
            badge: "Desks",
            description: `Gandhinagar & Palanpur offices • Call ${CONTACT.phone}`,
          },
          {
            title: "Global Website Search",
            to: "/search",
            badge: "Fast Search",
            description: "Full-text real-time search across all published resources",
          },
        ],
      },
      {
        title: "9. Legal Disclosures, Compliance & Feeds",
        description:
          "Statutory governance, terms of service, privacy protections, and search engine protocols.",
        icon: ShieldAlert,
        links: [
          {
            title: "Privacy Policy",
            to: "/privacy",
            badge: "Compliance",
            description: "IT Act 2000, DPDP Act 2023, data governance and client record safeguards",
          },
          {
            title: "Terms of Service",
            to: "/terms",
            badge: "Legal",
            description:
              "Advisory engagement contracts, IP ownership, liability and Gandhinagar jurisdiction",
          },
          {
            title: "Search Engine XML Sitemap",
            href: "/sitemap.xml",
            badge: "XML Protocol",
            description:
              "Machine-readable standard feed for Google, Bing, and web indexing crawlers",
          },
        ],
      },
    ];
  }, [data]);

  const query = search.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!query) return sections;
    return sections
      .map((section) => ({
        ...section,
        links: section.links.filter(
          (l) =>
            l.title.toLowerCase().includes(query) ||
            l.badge?.toLowerCase().includes(query) ||
            l.description?.toLowerCase().includes(query),
        ),
      }))
      .filter((section) => section.links.length > 0);
  }, [sections, query]);

  const totalLinksCount = useMemo(() => {
    return sections.reduce((acc, s) => acc + s.links.length, 0);
  }, [sections]);

  return (
    <>
      <PageHero
        eyebrow="Directory & Navigation"
        title="HTML Sitemap"
        body="A structured overview of all advisory divisions, software systems, industry solutions, calculators, guides, and corporate resources at Jyot Enterprise."
      />

      <section className="bg-background py-16 text-ink">
        <div className="container-x space-y-12">
          {/* Top Control Bar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xs md:flex-row md:items-center md:justify-between">
            {/* Filter Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search across all pages, services, or tools..."
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Stats & XML Link */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{totalLinksCount} Active Indexed Destinations</span>
              </div>

              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                <FileCode2 className="h-3.5 w-3.5" />
                <span>Raw XML Sitemap Feed</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </div>
          </div>

          {/* Sections Grid */}
          {filteredSections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-base font-semibold text-ink">
                No pages matching &ldquo;{search}&rdquo;
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try searching for broader keywords like &quot;loan&quot;, &quot;ERP&quot;,
                &quot;tax&quot;, or &quot;careers&quot;.
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              {filteredSections.map((section, idx) => (
                <div
                  key={idx}
                  className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-md"
                >
                  {/* Section Title */}
                  <div className="flex items-start gap-3 border-b border-border/60 pb-4">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-lg font-bold text-ink">{section.title}</h2>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {section.links.length} {section.links.length === 1 ? "page" : "pages"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>

                  {/* Links List */}
                  <ul className="mt-4 divide-y divide-border/40">
                    {section.links.map((link, lIdx) => (
                      <li key={lIdx} className="py-2.5 first:pt-1 last:pb-1">
                        {link.to ? (
                          <Link
                            to={link.to as "/about"}
                            className="group flex items-center justify-between gap-3 text-sm text-ink transition-colors hover:text-primary"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium group-hover:underline">
                                  {link.title}
                                </span>
                                {link.badge && (
                                  <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground group-hover:border-primary/30 group-hover:text-primary">
                                    {link.badge}
                                  </span>
                                )}
                              </div>
                              {link.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {link.description}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary" />
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center justify-between gap-3 text-sm text-ink transition-colors hover:text-primary"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium group-hover:underline">
                                  {link.title}
                                </span>
                                {link.badge && (
                                  <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground group-hover:border-primary/30 group-hover:text-primary">
                                    {link.badge}
                                  </span>
                                )}
                              </div>
                              {link.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {link.description}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
