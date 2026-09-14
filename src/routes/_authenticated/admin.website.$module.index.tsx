"use client";

import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Archive,
  Plus,
  Star,
  Trash2,
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  Check,
  FileText,
  Download,
  Users,
} from "lucide-react";
import { moduleDef, previewPath, type CmsModule, type CmsRow } from "@/lib/cms-schema";
import { cmsAction, cmsList, cmsReorder } from "@/lib/cms.functions";
import { ConfirmModal, EmptyState, ErrorState, Loading, formatDate } from "@/components/admin/ui";
import { getEmploymentType } from "@/lib/cms-content";
import { applicationList } from "@/lib/settings.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/website/$module/")({
  head: () => ({
    meta: pageMeta({
      title: "Website Content — Jyot Enterprise",
      description: "Manage website content.",
      path: "/admin/website",
      noindex: true,
    }),
  }),
  component: ModuleList,
});

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  draft: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  archived: "bg-muted text-muted-foreground border-border",
  closed: "bg-rose-500/10 text-rose-700 border-rose-500/20",
};

function ModuleList() {
  const { module } = useParams({ from: "/_authenticated/admin/website/$module/" });
  const def = moduleDef(module);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const list = useServerFn(cmsList);
  const act = useServerFn(cmsAction);
  const reorder = useServerFn(cmsReorder);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published" | "archived" | "closed">(
    "all",
  );
  const [projectCategoryFilter, setProjectCategoryFilter] = useState("all");
  const [projectIndustryFilter, setProjectIndustryFilter] = useState("all");
  const [projectFeaturedFilter, setProjectFeaturedFilter] = useState<"all" | "featured" | "normal">(
    "all",
  );
  const [projectSort, setProjectSort] = useState<"order" | "title" | "newest">("order");
  const [blogCategoryFilter, setBlogCategoryFilter] = useState("all");
  const [blogAuthorFilter, setBlogAuthorFilter] = useState("all");
  const [blogSort, setBlogSort] = useState<"newest" | "title" | "oldest">("newest");

  // Career Opening (Jobs & Internships) Filters
  const [careerFilterTab, setCareerFilterTab] = useState<
    "all" | "jobs" | "internships" | "published" | "draft" | "archived" | "featured"
  >("all");
  const [careerDeptFilter, setCareerDeptFilter] = useState("all");
  const [careerWorkModeFilter, setCareerWorkModeFilter] = useState("all");
  const [careerSort, setCareerSort] = useState<"order" | "newest" | "title">("order");
  const appList = useServerFn(applicationList);

  // Resources Filters
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [resourcePracticeFilter, setResourcePracticeFilter] = useState("all");
  const [resourceIndustryFilter, setResourceIndustryFilter] = useState("all");
  const [resourceFeaturedFilter, setResourceFeaturedFilter] = useState<
    "all" | "featured" | "normal"
  >("all");
  const [resourceSort, setResourceSort] = useState<"order" | "title" | "newest">("order");

  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const query = useQuery({
    enabled: !!def,
    queryKey: ["cms", "list", module, search, status],
    queryFn: () => list({ data: { module: module as CmsModule, search, status } }),
  });

  const rawRows = (query.data?.rows ?? []) as CmsRow[];
  const canEdit = query.data?.canEdit ?? false;

  // Applications query for job application counters
  const appsQuery = useQuery({
    enabled: module === "jobs",
    queryKey: ["cms", "applications", "all"],
    queryFn: () => appList({ data: { stage: "all" } }),
  });
  const allApplications = useMemo(() => appsQuery.data?.rows ?? [], [appsQuery.data?.rows]);

  const appCountByRole = useMemo(() => {
    if (module !== "jobs") return new Map<string, number>();
    const map = new Map<string, number>();
    for (const app of allApplications) {
      const d = (app.details ?? {}) as Record<string, unknown>;
      const careerId = String(d["careerId"] || d["jobId"] || "");
      const jobSlug = String(d["jobSlug"] || "");
      const jobTitle = String(d["jobTitle"] || "").toLowerCase();
      if (careerId) map.set(careerId, (map.get(careerId) ?? 0) + 1);
      if (jobSlug) map.set(jobSlug, (map.get(jobSlug) ?? 0) + 1);
      if (jobTitle) map.set(jobTitle, (map.get(jobTitle) ?? 0) + 1);
    }
    return map;
  }, [allApplications, module]);

  const careerDepartments = useMemo(() => {
    if (module !== "jobs") return [];
    return Array.from(new Set(rawRows.map((r) => r.department).filter(Boolean))) as string[];
  }, [rawRows, module]);

  const careerCounts = useMemo(() => {
    if (module !== "jobs") {
      return { all: 0, jobs: 0, internships: 0, published: 0, draft: 0, archived: 0, featured: 0 };
    }
    let jobs = 0;
    let internships = 0;
    let published = 0;
    let draft = 0;
    let archived = 0;
    let featured = 0;
    for (const r of rawRows) {
      const d = (r.data ?? {}) as Record<string, unknown>;
      const posType =
        (r as unknown as { position_type?: string }).position_type ||
        (d["positionType"] as string) ||
        (d["position_type"] as string);
      const rawType =
        (r.employment_type as string) || (d["employmentType"] as string) || (d["type"] as string);
      const parsedType =
        posType === "job"
          ? "job"
          : posType === "internship"
            ? "internship"
            : getEmploymentType(rawType, r.title);

      if (parsedType === "job") jobs++;
      if (parsedType === "internship") internships++;
      if (r.status === "published") published++;
      if (r.status === "draft") draft++;
      if (r.status === "archived") archived++;
      if (r.featured) featured++;
    }
    return {
      all: rawRows.length,
      jobs,
      internships,
      published,
      draft,
      archived,
      featured,
    };
  }, [rawRows, module]);

  const projectCategories = useMemo(() => {
    if (module !== "projects") return [];
    return Array.from(new Set(rawRows.map((r) => r.service).filter(Boolean))) as string[];
  }, [rawRows, module]);

  const projectIndustries = useMemo(() => {
    if (module !== "projects") return [];
    return Array.from(new Set(rawRows.map((r) => r.industry).filter(Boolean))) as string[];
  }, [rawRows, module]);

  const blogCategories = useMemo(() => {
    if (module !== "posts") return [];
    return Array.from(new Set(rawRows.map((r) => r.category).filter(Boolean))) as string[];
  }, [rawRows, module]);

  const blogAuthors = useMemo(() => {
    if (module !== "posts") return [];
    return Array.from(new Set(rawRows.map((r) => r.author).filter(Boolean))) as string[];
  }, [rawRows, module]);

  const resourceTypes = useMemo(() => {
    if (module !== "resources") return [];
    const fromRows = rawRows.map((r) => r.resource_type).filter(Boolean) as string[];
    const defaults = [
      "Guide",
      "Checklist",
      "Template",
      "Calculator",
      "Report",
      "Ebook",
      "Whitepaper",
      "Case Study",
      "Other",
    ];
    return Array.from(new Set([...fromRows, ...defaults]));
  }, [rawRows, module]);

  const resourcePractices = useMemo(() => {
    if (module !== "resources") return [];
    const fromRows = rawRows.map((r) => r.category).filter(Boolean) as string[];
    const defaults = ["Financial", "IT", "Legal", "Engineering", "Business", "Other"];
    return Array.from(new Set([...fromRows, ...defaults]));
  }, [rawRows, module]);

  const resourceIndustries = useMemo(() => {
    if (module !== "resources") return [];
    const fromRows = rawRows
      .map((r) => {
        const d = (r.data ?? {}) as Record<string, unknown>;
        return (r.industry || d["industry"]) as string | undefined;
      })
      .filter(Boolean) as string[];
    return Array.from(new Set(fromRows)).sort();
  }, [rawRows, module]);

  const rows = useMemo(() => {
    if (module === "projects") {
      return rawRows
        .filter((r) => {
          if (
            projectCategoryFilter !== "all" &&
            (r.service || "").toLowerCase() !== projectCategoryFilter.toLowerCase()
          ) {
            return false;
          }
          if (
            projectIndustryFilter !== "all" &&
            (r.industry || "").toLowerCase() !== projectIndustryFilter.toLowerCase()
          ) {
            return false;
          }
          if (projectFeaturedFilter === "featured" && !r.featured) return false;
          if (projectFeaturedFilter === "normal" && r.featured) return false;
          return true;
        })
        .sort((a, b) => {
          if (projectSort === "title") return (a.title || "").localeCompare(b.title || "");
          if (projectSort === "newest")
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
    }

    if (module === "posts") {
      return rawRows
        .filter((r) => {
          if (
            blogCategoryFilter !== "all" &&
            (r.category || "").toLowerCase() !== blogCategoryFilter.toLowerCase()
          ) {
            return false;
          }
          if (
            blogAuthorFilter !== "all" &&
            (r.author || "").toLowerCase() !== blogAuthorFilter.toLowerCase()
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          if (blogSort === "title") return (a.title || "").localeCompare(b.title || "");
          const dateA = a.published_at
            ? new Date(a.published_at).getTime()
            : new Date(a.created_at).getTime();
          const dateB = b.published_at
            ? new Date(b.published_at).getTime()
            : new Date(b.created_at).getTime();
          if (blogSort === "oldest") return dateA - dateB;
          return dateB - dateA;
        });
    }

    if (module === "jobs") {
      return rawRows
        .filter((r) => {
          const d = (r.data ?? {}) as Record<string, unknown>;
          const posType =
            (r as unknown as { position_type?: string }).position_type ||
            (d["positionType"] as string) ||
            (d["position_type"] as string);
          const rawType =
            (r.employment_type as string) ||
            (d["employmentType"] as string) ||
            (d["type"] as string);
          const parsedType =
            posType === "job"
              ? "job"
              : posType === "internship"
                ? "internship"
                : getEmploymentType(rawType, r.title);

          if (careerFilterTab === "jobs" && parsedType !== "job") return false;
          if (careerFilterTab === "internships" && parsedType !== "internship") return false;
          if (careerFilterTab === "published" && r.status !== "published") return false;
          if (careerFilterTab === "draft" && r.status !== "draft") return false;
          if (careerFilterTab === "archived" && r.status !== "archived") return false;
          if (careerFilterTab === "featured" && !r.featured) return false;

          if (
            careerDeptFilter !== "all" &&
            (r.department || "").toLowerCase() !== careerDeptFilter.toLowerCase()
          ) {
            return false;
          }
          if (
            careerWorkModeFilter !== "all" &&
            ((r.work_mode as string) || (d["workMode"] as string) || "").toLowerCase() !==
              careerWorkModeFilter.toLowerCase()
          ) {
            return false;
          }

          if (search.trim()) {
            const q = search.trim().toLowerCase();
            const title = (r.title || "").toLowerCase();
            const dept = (r.department || "").toLowerCase();
            const loc = (r.location || "").toLowerCase();
            const skillsList = [
              ...(Array.isArray(d["requiredSkills"]) ? d["requiredSkills"] : []),
              ...(Array.isArray(d["skills"]) ? d["skills"] : []),
              ...(Array.isArray(d["preferredSkills"]) ? d["preferredSkills"] : []),
              ...(Array.isArray(r.skills) ? (r.skills as string[]) : []),
            ];
            const skillsStr = skillsList.join(" ").toLowerCase();
            if (
              !title.includes(q) &&
              !dept.includes(q) &&
              !loc.includes(q) &&
              !skillsStr.includes(q)
            ) {
              return false;
            }
          }

          return true;
        })
        .sort((a, b) => {
          if (careerSort === "title") return (a.title || "").localeCompare(b.title || "");
          if (careerSort === "newest")
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
    }

    if (module === "resources") {
      return rawRows
        .filter((r) => {
          const d = (r.data ?? {}) as Record<string, unknown>;
          if (
            resourceTypeFilter !== "all" &&
            (r.resource_type || "").toLowerCase() !== resourceTypeFilter.toLowerCase()
          )
            return false;
          if (
            resourcePracticeFilter !== "all" &&
            (r.category || "").toLowerCase() !== resourcePracticeFilter.toLowerCase()
          )
            return false;
          const ind = (r.industry || (d["industry"] as string) || "").toLowerCase();
          if (resourceIndustryFilter !== "all" && ind !== resourceIndustryFilter.toLowerCase())
            return false;
          if (resourceFeaturedFilter === "featured" && !r.featured) return false;
          if (resourceFeaturedFilter === "normal" && r.featured) return false;
          if (search.trim()) {
            const q = search.trim().toLowerCase();
            const title = (r.title || "").toLowerCase();
            const summary = (r.summary || "").toLowerCase();
            const author = (r.author || (d["author"] as string) || "").toLowerCase();
            const category = (r.category || "").toLowerCase();
            const rType = (r.resource_type || "").toLowerCase();
            if (
              !title.includes(q) &&
              !summary.includes(q) &&
              !author.includes(q) &&
              !category.includes(q) &&
              !rType.includes(q) &&
              !ind.includes(q)
            ) {
              return false;
            }
          }
          return true;
        })
        .sort((a, b) => {
          if (resourceSort === "title") return (a.title || "").localeCompare(b.title || "");
          if (resourceSort === "newest")
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
    }

    return rawRows;
  }, [
    rawRows,
    module,
    projectCategoryFilter,
    projectIndustryFilter,
    projectFeaturedFilter,
    projectSort,
    blogCategoryFilter,
    blogAuthorFilter,
    blogSort,
    careerFilterTab,
    careerDeptFilter,
    careerWorkModeFilter,
    careerSort,
    resourceTypeFilter,
    resourcePracticeFilter,
    resourceIndustryFilter,
    resourceFeaturedFilter,
    resourceSort,
    search,
  ]);

  const titleOf = (row: CmsRow) =>
    (def?.titleField === "question" ? row.question : row.title) ?? "Untitled";

  // Filter Counts
  const counts = useMemo(() => {
    return {
      all: rawRows.length,
      published: rawRows.filter((r) => r.status === "published").length,
      draft: rawRows.filter((r) => r.status === "draft").length,
      archived: rawRows.filter((r) => r.status === "archived").length,
      closed: rawRows.filter((r) => r.status === "closed").length,
    };
  }, [rawRows]);

  if (!def) {
    return <ErrorState message="That content section does not exist." />;
  }

  async function runAction(
    id: string,
    action: Parameters<typeof cmsAction>[0] extends never ? never : string,
    successText?: string,
  ) {
    setBusy(id + action);
    setError(null);
    setNotice(null);
    try {
      await act({ data: { module: module as CmsModule, id, action: action as "publish" } });
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setNotice(
        successText ||
          (action === "publish"
            ? "Published successfully — now live on the website."
            : action === "unpublish"
              ? "Unpublished — reverted to draft."
              : action === "duplicate"
                ? "Duplicated as a new draft copy."
                : action === "archive"
                  ? "Archived successfully."
                  : action === "restore"
                    ? "Restored to draft."
                    : "Action completed."),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "That action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setBusy(deleteTarget.id + "delete");
    setError(null);
    try {
      await act({ data: { module: module as CmsModule, id: deleteTarget.id, action: "delete" } });
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      setNotice(`“${deleteTarget.title}” was deleted successfully.`);
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete item.");
    } finally {
      setBusy(null);
    }
  }

  // Bulk Operations
  async function handleBulkAction(action: "publish" | "unpublish" | "archive") {
    if (selectedIds.size === 0) return;
    setBusy("bulk_" + action);
    setError(null);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          act({ data: { module: module as CmsModule, id, action } }),
        ),
      );
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setNotice(`${selectedIds.size} items updated to ${action}ed.`);
      setSelectedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk operation failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setBusy("bulk_delete");
    setError(null);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          act({ data: { module: module as CmsModule, id, action: "delete" } }),
        ),
      );
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setNotice(`${selectedIds.size} items were permanently deleted.`);
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk delete failed.");
    } finally {
      setBusy(null);
    }
  }

  // Ordering Handlers
  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rows.length) return;

    const currentRow = rows[index];
    const targetRow = rows[targetIndex];
    if (!currentRow || !targetRow) return;

    setBusy(currentRow.id + "_move");
    try {
      const currentOrder = currentRow.sort_order ?? index;
      const targetOrder = targetRow.sort_order ?? targetIndex;
      const newCurrentOrder = targetOrder;
      const newTargetOrder =
        currentOrder === targetOrder
          ? direction === "up"
            ? targetOrder + 1
            : targetOrder - 1
          : currentOrder;

      await Promise.all([
        reorder({
          data: {
            module: module as CmsModule,
            id: currentRow.id,
            sortOrder: Math.max(0, newCurrentOrder),
          },
        }),
        reorder({
          data: {
            module: module as CmsModule,
            id: targetRow.id,
            sortOrder: Math.max(0, newTargetOrder),
          },
        }),
      ]);
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reorder items.");
    } finally {
      setBusy(null);
    }
  }

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Header & New Button */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/admin/website"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Website Management Hub
          </Link>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{def.label}</h1>
          <p className="text-sm text-muted-foreground">{def.description}</p>
        </div>
        {canEdit ? (
          module === "jobs" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  navigate({
                    to: "/admin/website/$module/$id",
                    params: { module, id: "new" },
                    search: () => ({ type: "job" }),
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
              >
                <Plus className="h-4 w-4" /> Add Job
              </button>
              <button
                onClick={() =>
                  navigate({
                    to: "/admin/website/$module/$id",
                    params: { module, id: "new" },
                    search: () => ({ type: "internship" }),
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-500/20 transition dark:text-amber-400"
              >
                <Plus className="h-4 w-4 text-amber-600" /> Add Internship
              </button>
            </div>
          ) : (
            <button
              onClick={() =>
                navigate({ to: "/admin/website/$module/$id", params: { module, id: "new" } })
              }
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
            >
              <Plus className="h-4 w-4" /> Add {def.singular}
            </button>
          )
        ) : null}
      </div>

      {/* Notifications */}
      {notice ? (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-800 animate-in fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-between rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-semibold text-destructive animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Search & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {module === "jobs" ? (
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: `All (${careerCounts.all})` },
              { id: "jobs", label: `Jobs (${careerCounts.jobs})` },
              { id: "internships", label: `Internships (${careerCounts.internships})` },
              { id: "published", label: `Published (${careerCounts.published})` },
              { id: "draft", label: `Draft (${careerCounts.draft})` },
              { id: "archived", label: `Archived (${careerCounts.archived})` },
              { id: "featured", label: `Featured (${careerCounts.featured})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCareerFilterTab(f.id as typeof careerFilterTab)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  careerFilterTab === f.id
                    ? "bg-ink text-background shadow-xs"
                    : "border border-border bg-background text-muted-foreground hover:bg-secondary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "published", "draft", "archived"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                  status === s
                    ? "bg-ink text-background shadow-xs"
                    : "border border-border bg-background text-muted-foreground hover:bg-secondary"
                }`}
              >
                {s} {status === s ? `(${rows.length})` : ""}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              module === "jobs"
                ? "Search by title, dept, location, skills…"
                : `Search ${def.label.toLowerCase()}…`
            }
            aria-label={`Search ${def.label}`}
            className="w-64 sm:w-72 rounded-full border border-border bg-background pl-9 pr-4 py-2 text-xs outline-none focus:border-primary transition"
          />
        </div>
      </div>

      {/* Extra Filters Toolbar for Portfolio Projects */}
      {module === "projects" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/20 p-3 text-xs">
          <span className="font-bold text-ink whitespace-nowrap">Filter Projects:</span>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Category:</span>
            <select
              value={projectCategoryFilter}
              onChange={(e) => setProjectCategoryFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Categories</option>
              {projectCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Industry Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Industry:</span>
            <select
              value={projectIndustryFilter}
              onChange={(e) => setProjectIndustryFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Industries</option>
              {projectIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Featured:</span>
            <select
              value={projectFeaturedFilter}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => setProjectFeaturedFilter(e.target.value as any)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All</option>
              <option value="featured">Featured Only</option>
              <option value="normal">Standard Only</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-muted-foreground">Sort by:</span>
            <select
              value={projectSort}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => setProjectSort(e.target.value as any)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary font-medium"
            >
              <option value="order">Custom Display Order</option>
              <option value="newest">Recently Updated</option>
              <option value="title">Alphabetical (Title)</option>
            </select>
          </div>
        </div>
      ) : null}

      {/* Extra Filters Toolbar for Blogs */}
      {module === "posts" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/20 p-3 text-xs">
          <span className="font-bold text-ink whitespace-nowrap">Filter Articles:</span>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Category:</span>
            <select
              value={blogCategoryFilter}
              onChange={(e) => setBlogCategoryFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Categories</option>
              {blogCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Author:</span>
            <select
              value={blogAuthorFilter}
              onChange={(e) => setBlogAuthorFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Authors</option>
              {blogAuthors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-muted-foreground">Sort by:</span>
            <select
              value={blogSort}
              onChange={(e) => setBlogSort(e.target.value as typeof blogSort)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary font-medium"
            >
              <option value="newest">Recently Published</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Alphabetical (Title)</option>
            </select>
          </div>
        </div>
      ) : null}

      {/* Extra Filters Toolbar for Career Openings (Jobs & Internships) */}
      {module === "jobs" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/20 p-3 text-xs">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Department:</span>
            <select
              value={careerDeptFilter}
              onChange={(e) => setCareerDeptFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Departments</option>
              {careerDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Work Mode Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Work Mode:</span>
            <select
              value={careerWorkModeFilter}
              onChange={(e) => setCareerWorkModeFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Modes</option>
              <option value="on-site">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-muted-foreground font-medium">Sort by:</span>
            <select
              value={careerSort}
              onChange={(e) => setCareerSort(e.target.value as typeof careerSort)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary font-semibold"
            >
              <option value="order">Custom Sort Order</option>
              <option value="newest">Recently Added</option>
              <option value="title">Alphabetical (Title)</option>
            </select>
          </div>
        </div>
      ) : null}

      {/* Extra Filters Toolbar for Resources */}
      {module === "resources" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/20 p-3 text-xs">
          <span className="font-bold text-ink whitespace-nowrap">Filter Resources:</span>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Type:</span>
            <select
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Types</option>
              {resourceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Practice / Division Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Practice:</span>
            <select
              value={resourcePracticeFilter}
              onChange={(e) => setResourcePracticeFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Practices</option>
              {resourcePractices.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Industry Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Industry:</span>
            <select
              value={resourceIndustryFilter}
              onChange={(e) => setResourceIndustryFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Industries</option>
              {resourceIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Featured:</span>
            <select
              value={resourceFeaturedFilter}
              onChange={(e) =>
                setResourceFeaturedFilter(e.target.value as typeof resourceFeaturedFilter)
              }
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All</option>
              <option value="featured">Featured Only</option>
              <option value="normal">Standard Only</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-muted-foreground">Sort by:</span>
            <select
              value={resourceSort}
              onChange={(e) => setResourceSort(e.target.value as typeof resourceSort)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary font-medium"
            >
              <option value="order">Custom Display Order</option>
              <option value="newest">Recently Created</option>
              <option value="title">Alphabetical (Title)</option>
            </select>
          </div>
        </div>
      ) : null}

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && canEdit ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary/80 border border-border px-4 py-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground text-[0.65rem]">
              {selectedIds.size}
            </span>
            <span>Items Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={Boolean(busy)}
              onClick={() => handleBulkAction("publish")}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-50 transition"
            >
              Publish Selected
            </button>
            <button
              disabled={Boolean(busy)}
              onClick={() => handleBulkAction("unpublish")}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-50 transition"
            >
              Unpublish Selected
            </button>
            <button
              disabled={Boolean(busy)}
              onClick={() => handleBulkAction("archive")}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-50 transition"
            >
              Archive Selected
            </button>
            <button
              disabled={Boolean(busy)}
              onClick={() => setIsBulkDeleting(true)}
              className="rounded-full bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50 transition"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground hover:text-ink font-semibold ml-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Table / List */}
      {query.isLoading ? (
        <Loading label="Loading content list…" />
      ) : query.isError ? (
        <ErrorState
          message={query.error instanceof Error ? query.error.message : "Could not load content."}
          onRetry={() => query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`No ${def.label.toLowerCase()} found`}
          body={
            search || projectCategoryFilter !== "all" || projectIndustryFilter !== "all"
              ? "No items match your filters. Clear filters to view all."
              : `Create your first ${def.singular.toLowerCase()} using the button above.`
          }
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/40 text-xs text-muted-foreground uppercase tracking-wider">
                {module === "jobs" ? (
                  <tr>
                    {canEdit ? (
                      <th className="w-10 px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          aria-label="Select all rows"
                          className="text-muted-foreground hover:text-ink"
                        >
                          {allSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
                    ) : null}
                    <th className="px-4 py-3.5 font-bold">Title</th>
                    <th className="px-3 py-3.5 font-bold">Type</th>
                    <th className="px-3 py-3.5 font-bold">Department</th>
                    <th className="px-3 py-3.5 font-bold">Location</th>
                    <th className="px-3 py-3.5 font-bold">Work Mode</th>
                    <th className="px-3 py-3.5 font-bold">Experience</th>
                    <th className="px-3 py-3.5 font-bold">Status</th>
                    <th className="px-3 py-3.5 text-center font-bold">Featured</th>
                    <th className="px-3 py-3.5 font-bold">Updated</th>
                    <th className="px-4 py-3.5 text-right font-bold">Actions</th>
                  </tr>
                ) : module === "resources" ? (
                  <tr>
                    {canEdit ? (
                      <th className="w-10 px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          aria-label="Select all rows"
                          className="text-muted-foreground hover:text-ink"
                        >
                          {allSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
                    ) : null}
                    <th className="px-4 py-3.5 font-bold">Resource</th>
                    <th className="px-3 py-3.5 font-bold">Type</th>
                    <th className="px-3 py-3.5 font-bold">Category</th>
                    <th className="px-3 py-3.5 font-bold">Industry</th>
                    <th className="px-3 py-3.5 font-bold">Author</th>
                    <th className="px-3 py-3.5 font-bold">Status</th>
                    <th className="px-3 py-3.5 text-center font-bold">Featured</th>
                    <th className="px-3 py-3.5 font-bold">Files</th>
                    <th className="px-3 py-3.5 font-bold">Updated</th>
                    <th className="px-4 py-3.5 text-right font-bold">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    {canEdit ? (
                      <th className="w-12 px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          aria-label="Select all rows"
                          className="text-muted-foreground hover:text-ink"
                        >
                          {allSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
                    ) : null}
                    <th className="px-4 py-3.5 font-bold">
                      {def.titleField === "question" ? "Question" : "Title / Details"}
                    </th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-4 py-3.5 font-bold">Order</th>
                    <th className="px-4 py-3.5 font-bold">Last Updated</th>
                    <th className="px-4 py-3.5 text-right font-bold">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((row, index) => {
                  const isSelected = selectedIds.has(row.id);
                  // For preview: if draft, append preview=true parameter
                  const basePublicUrl = previewPath(module, row.slug);
                  const publicUrl = basePublicUrl
                    ? row.status !== "published"
                      ? `${basePublicUrl}?preview=true`
                      : basePublicUrl
                    : null;
                  const isBusy = busy?.startsWith(row.id);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const rowData = (row.data ?? {}) as Record<string, any>;
                  const projectImg =
                    row.hero_image ||
                    (rowData["thumbnailImage"] as string | undefined) ||
                    (rowData["featuredImage"] as string | undefined);

                  if (module === "jobs") {
                    const posType =
                      (row as unknown as { position_type?: string }).position_type ||
                      (rowData["positionType"] as string) ||
                      (rowData["position_type"] as string);
                    const rawType =
                      (row.employment_type as string) ||
                      (rowData["employmentType"] as string) ||
                      (rowData["type"] as string);
                    const parsedType =
                      posType === "job"
                        ? "job"
                        : posType === "internship"
                          ? "internship"
                          : getEmploymentType(rawType, row.title);
                    const appCount =
                      (appCountByRole.get(row.id) ?? 0) ||
                      (row.slug ? (appCountByRole.get(row.slug) ?? 0) : 0);
                    const workMode =
                      (row.work_mode as string) || (rowData["workMode"] as string) || "On-site";
                    const exp =
                      (rowData["duration"] as string) || (row.experience as string) || "Fresher";

                    return (
                      <tr
                        key={row.id}
                        className={`align-middle transition ${
                          isSelected ? "bg-primary/5" : "hover:bg-secondary/30"
                        }`}
                      >
                        {canEdit ? (
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelect(row.id)}
                              aria-label={`Select ${titleOf(row)}`}
                              className="text-muted-foreground hover:text-ink"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        ) : null}

                        {/* 1. Title */}
                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <Link
                              to="/admin/website/$module/$id"
                              params={{ module: "jobs", id: row.id }}
                              className="font-bold text-ink hover:text-primary transition truncate block"
                            >
                              {titleOf(row)}
                            </Link>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {row.slug ? (
                              <span className="text-[0.7rem] text-muted-foreground font-mono">
                                /{row.slug}
                              </span>
                            ) : null}
                            <Link
                              to="/admin/website/applications"
                              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.2 text-[0.65rem] font-semibold text-primary hover:bg-primary/20 transition"
                            >
                              <Users className="h-3 w-3" />
                              <span>
                                {appCount} app{appCount !== 1 ? "s" : ""}
                              </span>
                            </Link>
                          </div>
                        </td>

                        {/* 2. Type */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ${
                              parsedType === "internship"
                                ? "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-400"
                                : "bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:text-blue-400"
                            }`}
                          >
                            {parsedType === "internship" ? "Internship" : "Job"}
                          </span>
                        </td>

                        {/* 3. Department */}
                        <td className="px-3 py-3 text-xs font-semibold text-ink whitespace-nowrap">
                          {row.department || "—"}
                        </td>

                        {/* 4. Location */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {row.location || "Surat, India"}
                        </td>

                        {/* 5. Work Mode */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-ink">
                            {workMode}
                          </span>
                        </td>

                        {/* 6. Experience */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {exp}
                        </td>

                        {/* 7. Status */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ${
                              STATUS_STYLES[row.status] ?? "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* 8. Featured Toggle */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {canEdit ? (
                            <button
                              disabled={Boolean(isBusy)}
                              onClick={() =>
                                runAction(
                                  row.id,
                                  row.featured ? "unfeature" : "feature",
                                  row.featured ? "Removed from featured" : "Marked as featured",
                                )
                              }
                              title={row.featured ? "Click to unfeature" : "Click to feature"}
                              className={`rounded-full border border-border p-1.5 transition ${
                                row.featured
                                  ? "text-amber-600 bg-amber-500/10 border-amber-500/30"
                                  : "text-muted-foreground hover:text-ink hover:bg-secondary"
                              }`}
                            >
                              <Star
                                className={`h-3.5 w-3.5 ${
                                  row.featured ? "fill-amber-500 text-amber-500" : ""
                                }`}
                              />
                            </button>
                          ) : row.featured ? (
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* 9. Updated */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(row.updated_at)}
                        </td>

                        {/* 10. Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Sort Order Reordering */}
                            {canEdit ? (
                              <div className="flex items-center mr-1">
                                <button
                                  disabled={index === 0 || Boolean(isBusy)}
                                  onClick={() => handleMove(index, "up")}
                                  title="Move up"
                                  className="p-1 text-muted-foreground hover:text-ink disabled:opacity-20"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  disabled={index === rows.length - 1 || Boolean(isBusy)}
                                  onClick={() => handleMove(index, "down")}
                                  title="Move down"
                                  className="p-1 text-muted-foreground hover:text-ink disabled:opacity-20"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : null}

                            {/* Edit */}
                            <Link
                              to="/admin/website/$module/$id"
                              params={{ module: "jobs", id: row.id }}
                              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-bold text-ink hover:bg-secondary transition shadow-2xs"
                            >
                              Edit
                            </Link>

                            {/* Preview */}
                            {publicUrl ? (
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Preview role on website"
                                className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}

                            {canEdit ? (
                              <>
                                {/* Publish / Unpublish */}
                                <button
                                  disabled={Boolean(isBusy)}
                                  onClick={() =>
                                    runAction(
                                      row.id,
                                      row.status === "published" ? "unpublish" : "publish",
                                    )
                                  }
                                  title={
                                    row.status === "published"
                                      ? "Unpublish to draft"
                                      : "Publish live"
                                  }
                                  className="rounded-full border border-border px-2 py-1 text-[0.7rem] font-semibold text-muted-foreground hover:text-ink hover:bg-secondary transition disabled:opacity-50"
                                >
                                  {row.status === "published" ? "Unpublish" : "Publish"}
                                </button>

                                {/* Duplicate */}
                                <button
                                  disabled={Boolean(isBusy)}
                                  onClick={() => runAction(row.id, "duplicate")}
                                  title="Duplicate opening"
                                  className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>

                                {/* Archive / Restore */}
                                <button
                                  disabled={Boolean(isBusy)}
                                  onClick={() =>
                                    runAction(
                                      row.id,
                                      row.status === "archived" ? "restore" : "archive",
                                    )
                                  }
                                  title={row.status === "archived" ? "Restore" : "Archive"}
                                  className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  disabled={Boolean(isBusy)}
                                  onClick={() =>
                                    setDeleteTarget({ id: row.id, title: titleOf(row) })
                                  }
                                  title="Delete"
                                  className="rounded-full border border-border p-1.5 text-destructive hover:bg-destructive/10 transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (module === "resources") {
                    const d = (row.data ?? {}) as Record<string, unknown>;
                    const thumbnail =
                      row.thumbnail ||
                      row.hero_image ||
                      (d["thumbnailImage"] as string) ||
                      (d["featuredImage"] as string) ||
                      (d["heroImage"] as string);
                    const fileCount = Array.isArray(d["resourceFiles"])
                      ? (d["resourceFiles"] as unknown[]).length
                      : Array.isArray(d["downloads"])
                        ? (d["downloads"] as unknown[]).length
                        : row.file_url
                          ? 1
                          : 0;
                    const resourceType = row.resource_type || "Guide";
                    const practice = row.category || "—";
                    const ind = row.industry || (d["industry"] as string) || "—";
                    const author = row.author || (d["author"] as string) || "—";

                    return (
                      <tr
                        key={row.id}
                        className={`align-middle transition ${
                          isSelected ? "bg-primary/5" : "hover:bg-secondary/30"
                        }`}
                      >
                        {canEdit ? (
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelect(row.id)}
                              aria-label={`Select ${titleOf(row)}`}
                              className="text-muted-foreground hover:text-ink"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        ) : null}

                        {/* Thumbnail & Title */}
                        <td className="px-4 py-3 min-w-[260px]">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={titleOf(row)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full grid place-items-center text-[0.6rem] text-muted-foreground font-semibold uppercase">
                                  No img
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to="/admin/website/$module/$id"
                                params={{ module: "resources", id: row.id }}
                                className="font-bold text-ink hover:text-primary transition truncate block"
                              >
                                {titleOf(row)}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                <code className="text-[0.65rem] font-mono">
                                  /resources/{row.slug}
                                </code>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-3 py-3 text-xs whitespace-nowrap">
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary text-[0.68rem]">
                            {resourceType}
                          </span>
                        </td>

                        {/* Category / Practice */}
                        <td className="px-3 py-3 text-xs font-semibold text-ink whitespace-nowrap">
                          {practice}
                        </td>

                        {/* Industry */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {ind}
                        </td>

                        {/* Author */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {author}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ${
                              STATUS_STYLES[row.status] ?? "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* Featured */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {canEdit ? (
                            <button
                              disabled={Boolean(isBusy)}
                              onClick={() =>
                                runAction(
                                  row.id,
                                  row.featured ? "unfeature" : "feature",
                                  row.featured ? "Removed from featured" : "Marked as featured",
                                )
                              }
                              title={row.featured ? "Click to unfeature" : "Click to feature"}
                              className={`rounded-full border border-border p-1.5 transition cursor-pointer ${
                                row.featured
                                  ? "text-amber-600 bg-amber-500/10 border-amber-500/30"
                                  : "text-muted-foreground hover:text-ink hover:bg-secondary"
                              }`}
                            >
                              <Star
                                className={`h-3.5 w-3.5 ${
                                  row.featured ? "fill-amber-500 text-amber-500" : ""
                                }`}
                              />
                            </button>
                          ) : row.featured ? (
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* File count */}
                        <td className="px-3 py-3 text-xs whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-ink">
                            <Download className="h-3 w-3 text-primary" /> {fileCount}
                          </span>
                        </td>

                        {/* Updated */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(row.updated_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Sort Order Reordering */}
                            {canEdit ? (
                              <div className="flex items-center mr-1">
                                <button
                                  disabled={index === 0 || Boolean(isBusy)}
                                  onClick={() => handleMove(index, "up")}
                                  title="Move up"
                                  className="p-1 text-muted-foreground hover:text-ink disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  disabled={index === rows.length - 1 || Boolean(isBusy)}
                                  onClick={() => handleMove(index, "down")}
                                  title="Move down"
                                  className="p-1 text-muted-foreground hover:text-ink disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : null}

                            {/* Edit */}
                            <Link
                              to="/admin/website/$module/$id"
                              params={{ module: "resources", id: row.id }}
                              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-bold text-ink hover:bg-secondary transition shadow-2xs"
                            >
                              Edit
                            </Link>

                            {/* Preview */}
                            {publicUrl ? (
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Preview resource on website"
                                className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition cursor-pointer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}

                            {canEdit ? (
                              <>
                                {/* Publish / Unpublish */}
                                <button
                                  disabled={Boolean(isBusy)}
                                  onClick={() =>
                                    runAction(
                                      row.id,
                                      row.status === "published" ? "unpublish" : "publish",
                                    )
                                  }
                                  title={
                                    row.status === "published"
                                      ? "Unpublish to draft"
                                      : "Publish live"
                                  }
                                  className="rounded-full border border-border px-2 py-1 text-[0.7rem] font-semibold text-muted-foreground hover:text-ink hover:bg-secondary transition disabled:opacity-50 cursor-pointer"
                                >
                                  {row.status === "published" ? "Unpublish" : "Publish"}
                                </button>

                                {/* Duplicate */}
                                <button
                                  disabled={Boolean(isBusy)}
                                  onClick={() => runAction(row.id, "duplicate")}
                                  title="Duplicate resource"
                                  className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>

                                {/* Archive / Restore */}
                                <button
                                  disabled={Boolean(isBusy)}
                                  onClick={() =>
                                    runAction(
                                      row.id,
                                      row.status === "archived" ? "restore" : "archive",
                                    )
                                  }
                                  title={row.status === "archived" ? "Restore" : "Archive"}
                                  className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition cursor-pointer"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  disabled={Boolean(isBusy)}
                                  onClick={() =>
                                    setDeleteTarget({ id: row.id, title: titleOf(row) })
                                  }
                                  title="Delete"
                                  className="rounded-full border border-border p-1.5 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={row.id}
                      className={`align-middle transition ${
                        isSelected ? "bg-primary/5" : "hover:bg-secondary/30"
                      }`}
                    >
                      {canEdit ? (
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelect(row.id)}
                            aria-label={`Select ${titleOf(row)}`}
                            className="text-muted-foreground hover:text-ink"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      ) : null}

                      {/* Title & Slug / Rich project column */}
                      <td className="px-4 py-3 min-w-[240px]">
                        {module === "posts" ? (
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                              {projectImg ? (
                                <img
                                  src={projectImg}
                                  alt={titleOf(row)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full grid place-items-center text-[0.6rem] text-muted-foreground font-semibold uppercase">
                                  No img
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  to="/admin/website/$module/$id"
                                  params={{ module, id: row.id }}
                                  className="font-bold text-ink hover:text-primary transition truncate block"
                                >
                                  {titleOf(row)}
                                </Link>
                                {row.featured ? (
                                  <span
                                    title="Featured article"
                                    className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-700 shrink-0"
                                  >
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                {row.category ? (
                                  <span className="rounded-md bg-primary/10 px-1.5 py-0.2 text-[0.65rem] font-semibold text-primary">
                                    {row.category}
                                  </span>
                                ) : null}
                                {row.author ? (
                                  <span className="text-ink/80 font-medium">By {row.author}</span>
                                ) : null}
                                {row.read_time ? (
                                  <span className="text-muted-foreground">· {row.read_time}</span>
                                ) : null}
                                {row.published_at ? (
                                  <span className="text-muted-foreground font-mono text-[0.68rem]">
                                    · {row.published_at.slice(0, 10)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : module === "projects" ? (
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                              {projectImg ? (
                                <img
                                  src={projectImg}
                                  alt={titleOf(row)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full grid place-items-center text-[0.6rem] text-muted-foreground font-semibold uppercase">
                                  No img
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  to="/admin/website/$module/$id"
                                  params={{ module, id: row.id }}
                                  className="font-bold text-ink hover:text-primary transition truncate block"
                                >
                                  {titleOf(row)}
                                </Link>
                                {row.featured ? (
                                  <span
                                    title="Featured project"
                                    className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-700 shrink-0"
                                  >
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                {row.client ? (
                                  <span className="font-semibold text-ink/80">{row.client}</span>
                                ) : null}
                                {row.service ? (
                                  <span className="rounded-md bg-primary/10 px-1.5 py-0.2 text-[0.65rem] font-semibold text-primary">
                                    {row.service}
                                  </span>
                                ) : null}
                                {row.industry ? (
                                  <span className="rounded-md bg-secondary px-1.5 py-0.2 text-[0.65rem] font-medium text-muted-foreground">
                                    {row.industry}
                                  </span>
                                ) : null}
                                {rowData["year"] ? (
                                  <span className="font-mono text-[0.68rem]">
                                    · {rowData["year"]}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : module === "resources" ? (
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                              {projectImg || row.thumbnail ? (
                                <img
                                  src={(projectImg || row.thumbnail)!}
                                  alt={titleOf(row)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full grid place-items-center text-[0.6rem] text-muted-foreground font-semibold uppercase">
                                  <FileText className="h-4 w-4 text-muted-foreground/60" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  to="/admin/website/$module/$id"
                                  params={{ module, id: row.id }}
                                  className="font-bold text-ink hover:text-primary transition truncate block"
                                >
                                  {titleOf(row)}
                                </Link>
                                {row.featured ? (
                                  <span
                                    title="Featured resource"
                                    className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-700 shrink-0"
                                  >
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                {row.resource_type ? (
                                  <span className="rounded-md bg-primary/10 px-1.5 py-0.2 text-[0.65rem] font-semibold text-primary">
                                    {row.resource_type}
                                  </span>
                                ) : null}
                                {row.category ? (
                                  <span className="rounded-md bg-secondary px-1.5 py-0.2 text-[0.65rem] font-medium text-muted-foreground">
                                    {row.category}
                                  </span>
                                ) : null}
                                {rowData["subCategory"] ? (
                                  <span className="text-[0.68rem] text-muted-foreground">
                                    · {String(rowData["subCategory"])}
                                  </span>
                                ) : null}
                                {row.author ? (
                                  <span className="text-[0.68rem] text-ink/70">
                                    · By {row.author}
                                  </span>
                                ) : null}
                                {row.slug ? (
                                  <span className="font-mono text-[0.65rem] text-muted-foreground/70">
                                    · /{row.slug}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to="/admin/website/$module/$id"
                                params={{ module, id: row.id }}
                                className="font-bold text-ink hover:text-primary transition"
                              >
                                {titleOf(row)}
                              </Link>
                              {row.featured ? (
                                <span
                                  title="Featured item"
                                  className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-700"
                                >
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                </span>
                              ) : null}
                              {module === "downloads" && row.category ? (
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary uppercase tracking-wider">
                                  {row.category}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {row.slug ? (
                                <p className="text-xs text-muted-foreground font-mono">
                                  /{row.slug}
                                </p>
                              ) : null}
                              {module === "downloads" &&
                              typeof rowData["file_size"] === "number" ? (
                                <span className="text-[0.68rem] text-muted-foreground font-mono">
                                  · {Math.round(rowData["file_size"] / 1024)} KB
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ${
                            STATUS_STYLES[row.status] ?? "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Order & Reordering */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-semibold text-muted-foreground w-6">
                            {row.sort_order ?? index}
                          </span>
                          {canEdit ? (
                            <div className="flex flex-col">
                              <button
                                disabled={index === 0 || isBusy}
                                onClick={() => handleMove(index, "up")}
                                title="Move up"
                                className="p-0.5 text-muted-foreground hover:text-ink disabled:opacity-20"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                disabled={index === rows.length - 1 || isBusy}
                                onClick={() => handleMove(index, "down")}
                                title="Move down"
                                className="p-0.5 text-muted-foreground hover:text-ink disabled:opacity-20"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Updated Date */}
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(row.updated_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* Primary Edit Button */}
                          <Link
                            to="/admin/website/$module/$id"
                            params={{ module, id: row.id }}
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-ink hover:bg-secondary transition shadow-2xs"
                          >
                            Edit
                          </Link>

                          {/* PDF Direct View/Download Link */}
                          {module === "downloads" &&
                          (row.file_url ||
                            (typeof rowData["storage_path"] === "string" &&
                              rowData["storage_path"])) ? (
                            <a
                              href={
                                row.file_url ||
                                `https://xmveofqeunsqzyxhakyj.supabase.co/storage/v1/object/public/jyot-enterprise/${String(rowData["storage_path"])}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              title="Open PDF from Supabase Storage"
                              className="rounded-full border border-border p-1.5 text-primary hover:bg-primary/10 transition"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </a>
                          ) : null}

                          {/* Preview Link */}
                          {publicUrl ? (
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Preview on website"
                              className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : null}

                          {canEdit ? (
                            <>
                              {/* Feature / Unfeature for portfolio */}
                              {module === "projects" ? (
                                <button
                                  disabled={isBusy}
                                  onClick={() =>
                                    runAction(
                                      row.id,
                                      row.featured ? "unfeature" : "feature",
                                      row.featured ? "Removed from featured" : "Marked as featured",
                                    )
                                  }
                                  title={row.featured ? "Unfeature project" : "Feature project"}
                                  className={`rounded-full border border-border p-1.5 transition ${
                                    row.featured
                                      ? "text-amber-600 bg-amber-500/10 border-amber-500/30"
                                      : "text-muted-foreground hover:text-ink hover:bg-secondary"
                                  }`}
                                >
                                  <Star
                                    className={`h-3.5 w-3.5 ${
                                      row.featured ? "fill-amber-500 text-amber-500" : ""
                                    }`}
                                  />
                                </button>
                              ) : null}

                              {/* Publish / Unpublish */}
                              <button
                                disabled={isBusy}
                                onClick={() =>
                                  runAction(
                                    row.id,
                                    row.status === "published" ? "unpublish" : "publish",
                                  )
                                }
                                title={
                                  row.status === "published" ? "Unpublish to draft" : "Publish live"
                                }
                                className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary transition disabled:opacity-50"
                              >
                                {row.status === "published" ? "Unpublish" : "Publish"}
                              </button>

                              {/* Duplicate */}
                              <button
                                disabled={isBusy}
                                onClick={() => runAction(row.id, "duplicate")}
                                title="Duplicate as draft copy"
                                className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>

                              {/* Archive / Restore */}
                              <button
                                disabled={isBusy}
                                onClick={() =>
                                  runAction(
                                    row.id,
                                    row.status === "archived" ? "restore" : "archive",
                                  )
                                }
                                title={row.status === "archived" ? "Restore" : "Archive"}
                                className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                disabled={isBusy}
                                onClick={() => setDeleteTarget({ id: row.id, title: titleOf(row) })}
                                title="Delete"
                                className="rounded-full border border-border p-1.5 text-destructive hover:bg-destructive/10 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Item Permanently?"
        message={`Are you sure you want to delete “${deleteTarget?.title}”?\n\nThis action cannot be undone. You can Archive it instead to safely hide it from the website while retaining the content.`}
        confirmLabel="Delete Item"
        cancelLabel="Keep Item"
        isDestructive={true}
        busy={busy === deleteTarget?.id + "delete"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirmation Modal for Bulk Delete */}
      <ConfirmModal
        isOpen={isBulkDeleting}
        title={`Delete ${selectedIds.size} Items?`}
        message={`You are about to permanently delete ${selectedIds.size} selected items.\n\nThis action cannot be undone. Are you sure you want to proceed?`}
        confirmLabel={`Delete ${selectedIds.size} Items`}
        cancelLabel="Cancel"
        isDestructive={true}
        busy={busy === "bulk_delete"}
        onConfirm={handleBulkDelete}
        onCancel={() => setIsBulkDeleting(false)}
      />
    </div>
  );
}
