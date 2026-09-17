"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Search,
} from "lucide-react";
import { APPLICATION_STAGES, applicationList, applicationSetStage } from "@/lib/settings.functions";
import { getAttachmentLink } from "@/lib/admin.functions";
import { EmptyState, ErrorState, Loading, formatDate } from "@/components/admin/ui";
import { getEmploymentType } from "@/lib/cms-content";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/website/applications")({
  head: () => ({
    meta: pageMeta({
      title: "Job Applications — Jyot Enterprise",
      description: "Applications received for open roles and internships.",
      path: "/admin/website/applications",
      noindex: true,
    }),
  }),
  component: ApplicationsPage,
});

type Row = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  application_stage: string | null;
  created_at: string;
  details: Record<string, unknown> | null;
  attachments?: Array<{ name?: string; path?: string; url?: string; size?: number; type?: string }> | null;
};

function ApplicationsPage() {
  const list = useServerFn(applicationList);
  const setStage = useServerFn(applicationSetStage);
  const signAttachment = useServerFn(getAttachmentLink);
  const [stage, setStageFilter] = useState<"all" | (typeof APPLICATION_STAGES)[number]>("all");
  const [roleTypeFilter, setRoleTypeFilter] = useState<"all" | "job" | "internship">("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("search") ?? "";
  });
  const [error, setError] = useState<string | null>(null);
  const [openingDocPath, setOpeningDocPath] = useState<string | null>(null);

  async function handleOpenDoc(path?: string | null, fallbackUrl?: string | null) {
    if (fallbackUrl && (fallbackUrl.startsWith("http://") || fallbackUrl.startsWith("https://"))) {
      window.open(fallbackUrl, "_blank", "noopener");
      return;
    }
    if (!path) {
      if (fallbackUrl) window.open(fallbackUrl, "_blank", "noopener");
      return;
    }
    setOpeningDocPath(path);
    try {
      const { url } = await signAttachment({ data: { path } });
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error("Could not sign attachment link", err);
      setError("Could not open this resume document. The link may have expired.");
    } finally {
      setOpeningDocPath(null);
    }
  }

  const query = useQuery({
    queryKey: ["cms", "applications", stage],
    queryFn: () => list({ data: { stage } }),
  });

  async function update(id: string, next: (typeof APPLICATION_STAGES)[number]) {
    setError(null);
    try {
      await setStage({ data: { id, stage: next } });
      await query.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update this application.");
    }
  }

  const rawRows = (Array.isArray(query.data?.rows) ? query.data.rows : []) as Row[];

  // Dynamic roles list for filter
  const distinctRoles = useMemo(() => {
    const set = new Set<string>();
    for (const r of rawRows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: any = r.details ?? {};
      const title = d.jobTitle || d.role;
      if (title && typeof title === "string") set.add(title.trim());
    }
    return Array.from(set).sort();
  }, [rawRows]);

  // Role Type counts
  const counts = useMemo(() => {
    let jobs = 0;
    let internships = 0;
    for (const r of rawRows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: any = r.details ?? {};
      const title = d.jobTitle || d.role || "";
      const type = getEmploymentType(d.employmentType, title);
      if (type === "internship") internships++;
      else jobs++;
    }
    return { all: rawRows.length, jobs, internships };
  }, [rawRows]);

  // Filtered rows
  const rows = useMemo(() => {
    return rawRows.filter((r) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: any = r.details ?? {};
      const title = String(d.jobTitle || d.role || "");
      const parsedType = getEmploymentType(d.employmentType, title);

      if (roleTypeFilter === "job" && parsedType === "internship") return false;
      if (roleTypeFilter === "internship" && parsedType !== "internship") return false;

      if (selectedRole !== "all" && title.toLowerCase() !== selectedRole.toLowerCase()) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesEmail = r.email.toLowerCase().includes(q);
        const matchesPhone = r.phone.toLowerCase().includes(q);
        const matchesTitle = title.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesTitle) {
          return false;
        }
      }

      return true;
    });
  }, [rawRows, roleTypeFilter, selectedRole, search]);

  if (query.isLoading) return <Loading label="Loading applications…" />;
  if (query.error)
    return (
      <ErrorState message="Could not load applications." onRetry={() => void query.refetch()} />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/admin/website"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Website Management
          </Link>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold text-ink">
            <BriefcaseBusiness className="h-5 w-5 text-primary" /> Career & Internship Applications
          </h1>
          <p className="text-sm text-muted-foreground">
            Candidates who submitted applications for jobs and internship openings.
          </p>
        </div>

        <Link
          to="/admin/website/$module"
          params={{ module: "jobs" }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-ink hover:bg-secondary transition"
        >
          <Briefcase className="h-3.5 w-3.5 text-primary" />
          <span>Manage Openings</span>
        </Link>
      </div>

      {/* Primary Status Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...APPLICATION_STAGES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition ${
                stage === s
                  ? "bg-ink text-background shadow-xs"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate, role, email…"
            className="w-64 rounded-full border border-border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Role Type & Role Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/20 p-3 text-xs">
        <span className="font-bold text-ink whitespace-nowrap">Filter Applications:</span>

        {/* Role Type Filter */}
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: `All Types (${counts.all})` },
            { id: "job", label: `Jobs (${counts.jobs})` },
            { id: "internship", label: `Internships (${counts.internships})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setRoleTypeFilter(t.id as typeof roleTypeFilter)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                roleTypeFilter === t.id
                  ? "bg-ink text-background shadow-xs"
                  : "bg-background border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Role Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Opening:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
          >
            <option value="all">All Roles</option>
            {distinctRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      {rows.length ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3.5">Applicant</th>
                  <th className="px-4 py-3.5">Role Applied For</th>
                  <th className="px-4 py-3.5">Resume / Docs</th>
                  <th className="px-4 py-3.5">Date Received</th>
                  <th className="px-4 py-3.5">Hiring Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const d: any = row.details ?? {};
                  const roleTitle = String(d.jobTitle || d.role || "Unspecified Role");
                  const roleSlug = d.jobSlug as string | undefined;
                  const parsedType = getEmploymentType(d.employmentType, roleTitle);

                  const att =
                    (Array.isArray(row.attachments) && row.attachments[0]) ||
                    (Array.isArray(d["attachments"]) && d["attachments"][0]) ||
                    (typeof d["resumeUrl"] === "string" ? { name: "Resume", url: d["resumeUrl"] } : null) ||
                    (typeof d["resume"] === "string" ? { name: "Resume", url: d["resume"] } : null);

                  const hasAttachment = Boolean(att && (att.path || att.url));

                  return (
                    <tr key={row.id} className="hover:bg-secondary/30 transition">
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/enquiries/$id"
                          params={{ id: row.id }}
                          className="font-bold text-ink hover:text-primary transition"
                        >
                          {row.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {row.email} · {row.phone}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {roleSlug ? (
                            <a
                              href={`/careers/${roleSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-ink hover:text-primary transition inline-flex items-center gap-1"
                            >
                              <span>{roleTitle}</span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                          ) : (
                            <span className="font-semibold text-ink">{roleTitle}</span>
                          )}
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              parsedType === "internship"
                                ? "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-400"
                                : "bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:text-blue-400"
                            }`}
                          >
                            {parsedType === "internship" ? "Internship" : "Job"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        {hasAttachment ? (
                          <button
                            type="button"
                            disabled={openingDocPath === att?.path}
                            onClick={() => void handleOpenDoc(att?.path, att?.url)}
                            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline hover:text-primary/80 transition disabled:opacity-60 text-left"
                            title={att?.name ? `${att.name}${att.size ? ` (${Math.round(att.size / 1024)} KB)` : ""}` : "View Resume"}
                          >
                            {openingDocPath === att?.path ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                            <span className="truncate max-w-[130px] sm:max-w-[180px]">
                              {att?.name || "View Resume"}
                            </span>
                            {att?.size ? (
                              <span className="text-[10px] text-muted-foreground font-normal shrink-0">
                                ({Math.round(att.size / 1024)} KB)
                              </span>
                            ) : null}
                          </button>
                        ) : (
                          <span className="text-muted-foreground italic">None attached</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={row.application_stage ?? "new"}
                          onChange={(e) =>
                            void update(row.id, e.target.value as (typeof APPLICATION_STAGES)[number])
                          }
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold capitalize outline-none focus:border-primary"
                        >
                          {APPLICATION_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No applications found"
          body={
            search || roleTypeFilter !== "all" || selectedRole !== "all"
              ? "No applications match your current filters. Clear filters to see all."
              : "Applications submitted on the Careers page will appear here."
          }
        />
      )}
    </div>
  );
}
