"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Download,
  PanelsTopLeft,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  Building,
  Briefcase,
  FolderKanban,
  FileText,
  HelpCircle,
  MessageSquareQuote,
  Users,
  FileSpreadsheet,
  MapPin,
  Palette,
  Settings,
  Search,
  BarChart3,
  Images,
  Home,
  Info,
  Landmark,
} from "lucide-react";
import { CMS_MODULES, CMS_MODULE_DEFS, type CmsModule } from "@/lib/cms-schema";
import { cmsHistory, cmsImport, cmsList } from "@/lib/cms.functions";
import { staticRecords } from "@/lib/cms-import";
import { EmptyState, Loading, Panel, PageHeader, formatDate } from "@/components/admin/ui";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/website/")({
  head: () => ({
    meta: pageMeta({
      title: "Website Management — Jyot Enterprise",
      description: "Manage the public website content, pages and configuration.",
      path: "/admin/website",
      noindex: true,
    }),
  }),
  component: WebsiteHome,
});

function WebsiteHome() {
  const queryClient = useQueryClient();
  const list = useServerFn(cmsList);
  const history = useServerFn(cmsHistory);
  const runImport = useServerFn(cmsImport);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useQuery({
    queryKey: ["cms", "counts"],
    queryFn: async () => {
      const entries = await Promise.all(
        CMS_MODULES.map(async (m) => {
          try {
            const res = await list({ data: { module: m, status: "all" } });
            return [m, res] as const;
          } catch {
            return [m, { rows: [], canEdit: true }] as const;
          }
        }),
      );
      return Object.fromEntries(entries) as unknown as Record<
        CmsModule,
        {
          rows: { id: string; slug: string | null; status: string; title?: string | null }[];
          canEdit: boolean;
        }
      >;
    },
  });

  const audit = useQuery({
    queryKey: ["cms", "history"],
    queryFn: () => history({ data: { limit: 12 } }),
  });

  const canEdit = counts.data?.["services"]?.canEdit ?? true;

  async function importAll() {
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      let total = 0;
      const failedModules: string[] = [];
      for (const m of CMS_MODULES) {
        const records = staticRecords(m);
        if (!records.length) continue;
        try {
          const res = await runImport({ data: { module: m, records } });
          total += res.imported;
        } catch {
          failedModules.push(CMS_MODULE_DEFS[m]?.label ?? m);
        }
      }
      if (failedModules.length > 0) {
        setMessage(
          `Imported ${total} items. Note: Some tables (${failedModules.join(", ")}) need the SQL migration run in Supabase first.`,
        );
      } else {
        setMessage(
          total
            ? `Imported ${total} existing items. They are published and ready to edit.`
            : "Everything is already in the content manager — nothing to import.",
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  if (counts.isLoading) return <Loading label="Loading website management hub…" />;

  // Find direct page row IDs for Home and About if they exist in cms_pages
  const pageRows = counts.data?.["pages"]?.rows ?? [];
  const homeRow = pageRows.find((r) => r.slug === "home");
  const aboutRow = pageRows.find((r) => r.slug === "about");

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <PageHeader
        title="Website Management Hub"
        description="Unified enterprise control for public website offerings, corporate pages, SEO metadata, and brand identity."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <PanelsTopLeft className="h-3.5 w-3.5" />
            CMS Engine
          </span>
        }
        actions={
          canEdit ? (
            <button
              onClick={importAll}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-semibold text-ink shadow-2xs hover:bg-secondary disabled:opacity-60 transition"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              {importing ? "Importing…" : "Seed / Import Built-in Content"}
            </button>
          ) : undefined
        }
      />

      {message ? (
        <p className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm font-semibold text-primary">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      {/* 1. CONTENT GROUP */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">1. Content</h2>
            <p className="text-xs text-muted-foreground">
              Core pages, service offerings, articles, and client proof.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">13 Modules</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Home Page Shortcut */}
          <div className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Home className="h-4 w-4" />
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[0.65rem] font-bold uppercase">
                  Published
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
                Home Page
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Hero title, tagline, primary call-to-actions, and section visibility toggles.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <Link
                to={homeRow ? "/admin/website/$module/$id" : "/admin/website/$module"}
                params={homeRow ? { module: "pages", id: homeRow.id } : { module: "pages" }}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                Edit Home <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* About Page Shortcut */}
          <div className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Info className="h-4 w-4" />
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[0.65rem] font-bold uppercase">
                  Published
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
                About Us
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Company story, vision, mission statements, corporate milestones, and leadership
                intro.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <Link
                to={aboutRow ? "/admin/website/$module/$id" : "/admin/website/$module"}
                params={aboutRow ? { module: "pages", id: aboutRow.id } : { module: "pages" }}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                Edit About <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Financial Services & Loans CMS Shortcut */}
          <div className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <Landmark className="h-4 w-4" />
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[0.65rem] font-bold uppercase">
                  CMS Managed
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
                Financial & Loans CMS
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Manage top statistics, EMI calculator rate, loan rate comparisons, and 86+ bank
                partner network.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <Link
                to="/admin/website/financial"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                Edit Rates & Lenders <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Core Content Modules */}
          {(
            [
              { module: "services", icon: Sparkles },
              { module: "sub_services", icon: Sparkles },
              { module: "products", icon: Layers },
              { module: "industries", icon: Building },
              { module: "projects", icon: FolderKanban },
              { module: "case_studies", icon: FileText },
              { module: "posts", icon: FileText },
              { module: "resources", icon: FileSpreadsheet },
              { module: "faqs", icon: HelpCircle },
              { module: "testimonials", icon: MessageSquareQuote },
              { module: "team_members", icon: Users },
            ] as const
          ).map(({ module: m, icon: Icon }) => {
            const def = CMS_MODULE_DEFS[m];
            const rows = counts.data?.[m]?.rows ?? [];
            const published = rows.filter((r) => r.status === "published").length;
            const drafts = rows.filter((r) => r.status === "draft").length;

            return (
              <div
                key={m}
                className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex gap-1.5">
                      <span className="rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[0.65rem] font-bold">
                        {published} Live
                      </span>
                      {drafts > 0 ? (
                        <span className="rounded-full bg-amber-500/10 text-amber-700 px-2 py-0.5 text-[0.65rem] font-bold">
                          {drafts} Draft
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
                    {def.label}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {def.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    to="/admin/website/$module"
                    params={{ module: m }}
                    className="text-xs font-semibold text-ink hover:text-primary inline-flex items-center gap-1"
                  >
                    Manage ({rows.length}) <ArrowRight className="h-3 w-3" />
                  </Link>
                  {canEdit ? (
                    <Link
                      to="/admin/website/$module/$id"
                      params={{ module: m, id: "new" }}
                      className="rounded-full bg-secondary border border-border p-1.5 text-ink hover:bg-primary hover:text-primary-foreground transition"
                      title={`Add new ${def.singular.toLowerCase()}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. BUSINESS GROUP */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">2. Business</h2>
            <p className="text-xs text-muted-foreground">
              Recruitment, candidate applications, resource downloads, and office locations.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">4 Modules</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Careers / Jobs */}
          {(() => {
            const m: CmsModule = "jobs";
            const def = CMS_MODULE_DEFS[m];
            const rows = counts.data?.[m]?.rows ?? [];
            const published = rows.filter((r) => r.status === "published").length;
            const drafts = rows.filter((r) => r.status === "draft").length;
            return (
              <div className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                      <Briefcase className="h-4 w-4" />
                    </span>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[0.65rem] font-bold">
                      {published} Active
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
                    Careers / Jobs
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Open job postings, salary, department, work mode, and application deadlines.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <Link
                    to="/admin/website/$module"
                    params={{ module: m }}
                    className="text-xs font-semibold text-ink hover:text-primary inline-flex items-center gap-1"
                  >
                    View Roles ({rows.length}) <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    to="/admin/website/$module/$id"
                    params={{ module: m, id: "new" }}
                    className="rounded-full bg-secondary border border-border p-1.5 text-ink hover:bg-primary hover:text-primary-foreground transition"
                    title="Post a job"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })()}

          {/* Job Applications */}
          <div className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sky-500/10 text-sky-600">
                  <Users className="h-4 w-4" />
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
                  Applicants
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
                Job Applications
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Candidate resumes, submissions, contact details, and linked job role records.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <Link
                to="/admin/website/applications"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Review Candidates <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Downloads */}
          {(() => {
            const m: CmsModule = "downloads";
            const def = CMS_MODULE_DEFS[m];
            const rows = counts.data?.[m]?.rows ?? [];
            return (
              <div className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                      <Download className="h-4 w-4" />
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
                      {rows.length} Files
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
                    Downloads
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Brochures, corporate checklists, PDF guides, and public document downloads.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <Link
                    to="/admin/website/$module"
                    params={{ module: m }}
                    className="text-xs font-semibold text-ink hover:text-primary inline-flex items-center gap-1"
                  >
                    Manage Files <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    to="/admin/website/$module/$id"
                    params={{ module: m, id: "new" }}
                    className="rounded-full bg-secondary border border-border p-1.5 text-ink hover:bg-primary hover:text-primary-foreground transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })()}

          {/* Offices / Locations */}
          {(() => {
            const m: CmsModule = "offices";
            const def = CMS_MODULE_DEFS[m];
            const rows = counts.data?.[m]?.rows ?? [];
            return (
              <div className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-2xl bg-rose-500/10 text-rose-600">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
                      {rows.length} Offices
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
                    Contact / Offices
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Office addresses, Google Maps coordinates, phone numbers, and operational hours.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <Link
                    to="/admin/website/$module"
                    params={{ module: m }}
                    className="text-xs font-semibold text-ink hover:text-primary inline-flex items-center gap-1"
                  >
                    Manage Locations <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    to="/admin/website/$module/$id"
                    params={{ module: m, id: "new" }}
                    className="rounded-full bg-secondary border border-border p-1.5 text-ink hover:bg-primary hover:text-primary-foreground transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 3. DESIGN GROUP */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">3. Design</h2>
            <p className="text-xs text-muted-foreground">
              Global header navigation, footer structure, and shared media asset library.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">3 Sections</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Header / Navigation */}
          <Link
            to="/admin/website/settings"
            search={{ tab: "website" }}
            className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Palette className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
              Header & Navigation
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Main navigation links, primary header CTA button text & target URL, and contact bar
              visibility.
            </p>
            <p className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
              Configure Header <ArrowRight className="h-3 w-3" />
            </p>
          </Link>

          {/* Footer */}
          <Link
            to="/admin/website/settings"
            search={{ tab: "website" }}
            className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600">
              <PanelsTopLeft className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
              Footer Management
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Footer brand summary, copyright notice, legal disclaimer text, and social icon links.
            </p>
            <p className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
              Configure Footer <ArrowRight className="h-3 w-3" />
            </p>
          </Link>

          {/* Media Library */}
          <Link
            to="/admin/website/media"
            className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Images className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
              Media Library
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Upload, preview, copy URLs, and reuse photos, illustrations, logos, and marketing
              banners.
            </p>
            <p className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
              Browse Media <ArrowRight className="h-3 w-3" />
            </p>
          </Link>
        </div>
      </section>

      {/* 4. SETTINGS GROUP */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">4. Settings</h2>
            <p className="text-xs text-muted-foreground">
              Single source of truth for company contact details, global SEO, and web analytics.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">3 Areas</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Site Settings */}
          <Link
            to="/admin/website/settings"
            search={{ tab: "brand" }}
            className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Settings className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
              Site Settings
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Company legal name, official logo, browser favicon, phones, WhatsApp, and email
              addresses.
            </p>
            <p className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
              Edit Settings <ArrowRight className="h-3 w-3" />
            </p>
          </Link>

          {/* SEO Settings */}
          <Link
            to="/admin/website/settings"
            search={{ tab: "seo" }}
            className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-teal-500/10 text-teal-600">
              <Search className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
              Default SEO
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Google search fallback title, meta description, and default OpenGraph social sharing
              image.
            </p>
            <p className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
              Configure SEO <ArrowRight className="h-3 w-3" />
            </p>
          </Link>

          {/* Analytics Settings */}
          <Link
            to="/admin/website/settings"
            search={{ tab: "analytics" }}
            className="group rounded-3xl border border-border bg-background p-5 shadow-2xs hover:border-primary/50 hover:shadow-md transition"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
              <BarChart3 className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-base font-bold text-ink group-hover:text-primary transition">
              Analytics
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Measurement IDs for Google Analytics (GA4), Google Tag Manager, and Microsoft Clarity.
            </p>
            <p className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
              Configure Tracking <ArrowRight className="h-3 w-3" />
            </p>
          </Link>
        </div>
      </section>

      {/* Audit History Panel */}
      <Panel title="Recent Content Activity">
        {audit.data?.length ? (
          <ul className="divide-y divide-border">
            {audit.data.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
                <span className="font-semibold text-ink">{entry.entity_title ?? "—"}</span>
                <span className="rounded-full bg-secondary border border-border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
                  {entry.action.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {CMS_MODULE_DEFS[entry.module as CmsModule]?.label ?? entry.module}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {entry.actor_email ?? "Admin"} · {formatDate(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No content changes yet"
            body="Edits made in any CMS module will be tracked here with timestamps."
          />
        )}
      </Panel>
    </div>
  );
}
