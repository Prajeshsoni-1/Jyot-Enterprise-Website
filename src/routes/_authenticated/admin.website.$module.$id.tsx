"use client";

import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  Send,
  Sparkles,
  Layers,
  FileText,
  Image as ImageIcon,
  Search,
  Check,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  moduleDef,
  slugify,
  toLines,
  type CmsField,
  type CmsModule,
  type CmsRow,
  previewPath,
} from "@/lib/cms-schema";
import { cmsGet, cmsRelations, cmsSave } from "@/lib/cms.functions";
import { ErrorState, Loading, formatDate } from "@/components/admin/ui";
import { MediaButton } from "@/components/admin/MediaPicker";
import { PdfUploadButton } from "@/components/admin/PdfUploadButton";
import { PortfolioEditor } from "@/components/admin/PortfolioEditor";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { CareerEditor } from "@/components/admin/CareerEditor";
import { ResourceEditor } from "@/components/admin/ResourceEditor";
import { FinancialServiceEditor } from "@/components/admin/FinancialServiceEditor";
import { pageMeta } from "@/lib/seo";

const IMAGE_FIELDS = new Set(["hero_image", "og_image", "thumbnail", "file_url", "gallery"]);

export const Route = createFileRoute("/_authenticated/admin/website/$module/$id")({
  head: () => ({
    meta: pageMeta({
      title: "Edit Website Content — Jyot Enterprise",
      description: "Edit website content.",
      path: "/admin/website",
      noindex: true,
    }),
  }),
  component: ModuleEditor,
});

type Values = Record<string, unknown>;

function initialValues(def: ReturnType<typeof moduleDef>, row?: CmsRow): Values {
  const values: Values = {};
  if (!def) return values;
  for (const field of def.fields) {
    const source = field.json
      ? ((row?.data ?? {}) as Values)[field.name]
      : (row as Values | undefined)?.[field.name];
    if (field.type === "lines" || field.type === "tags")
      values[field.name] = toLines(source).join("\n");
    else if (field.type === "bool") values[field.name] = Boolean(source);
    else values[field.name] = source == null ? "" : String(source);
  }
  if (row?.published_at && def.key === "posts")
    values["published_at"] = row.published_at.slice(0, 10);
  return values;
}

function getFieldHelp(name: string, fallback?: string): string | undefined {
  if (name === "seo_title") {
    return "Title shown in Google search results. Keep it clear and relevant (recommended: under 60 characters).";
  }
  if (name === "seo_description") {
    return "Short summary that appears below your title in Google search results (recommended: under 160 characters).";
  }
  if (name === "slug") {
    return "URL-friendly web address for this page (e.g. ai-automation-suite). Auto-generated from title.";
  }
  return fallback;
}

export function ModuleEditor() {
  const { module, id } = useParams({ from: "/_authenticated/admin/website/$module/$id" });

  if (module === "projects") {
    return <PortfolioEditor id={id} />;
  }

  if (module === "posts") {
    return <BlogEditor id={id} />;
  }

  if (module === "jobs" || module === "careers") {
    return <CareerEditor id={id} />;
  }

  if (module === "resources") {
    return <ResourceEditor id={id} />;
  }

  if (
    module === "financial" ||
    (module === "services" && (id === "financial" || id.toLowerCase().includes("financial")))
  ) {
    return <FinancialServiceEditor id={id} />;
  }

  return <StandardModuleEditor module={module} id={id} />;
}

function StandardModuleEditor({ module, id }: { module: string; id: string }) {
  const def = moduleDef(module);
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const get = useServerFn(cmsGet);
  const save = useServerFn(cmsSave);
  const relationsFn = useServerFn(cmsRelations);

  const [values, setValues] = useState<Values>(() => initialValues(def));
  const [status, setStatus] = useState<"draft" | "published" | "archived" | "closed">("draft");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(isNew);
  const [manualSlugEdit, setManualSlugEdit] = useState(!isNew);
  const [isDirty, setIsDirty] = useState(false);

  const record = useQuery({
    enabled: !!def && !isNew,
    queryKey: ["cms", "item", module, id],
    queryFn: () => get({ data: { module: module as CmsModule, id } }),
  });

  const relations = useQuery({
    enabled: !!def,
    queryKey: ["cms", "relations"],
    queryFn: () => relationsFn({ data: undefined }),
  });

  useEffect(() => {
    if (record.data && !loaded) {
      setValues(initialValues(def, record.data.row));
      setStatus(record.data.row.status);
      setFeatured(record.data.row.featured);
      setSortOrder(record.data.row.sort_order);
      setLoaded(true);
      setManualSlugEdit(true);
    }
  }, [record.data, loaded, def]);

  // Warn on unsaved changes before leaving
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const canEdit = isNew ? true : (record.data?.canEdit ?? false);

  // Group fields into logical sections
  const sections = useMemo(() => {
    if (!def)
      return {
        basic: [] as CmsField[],
        content: [] as CmsField[],
        media: [] as CmsField[],
        seo: [] as CmsField[],
      };

    const basicNames = new Set([
      "title",
      "question",
      "slug",
      "category",
      "department",
      "employment_type",
      "location",
      "work_mode",
      "experience",
      "salary",
      "openings",
      "deadline",
      "skills",
      "service_id",
      "industry_id",
      "parent_key",
      "city",
      "address",
      "phone",
      "email",
      "hours",
      "client",
      "industry",
      "service",
    ]);

    const mediaNames = new Set([
      "hero_image",
      "thumbnail",
      "icon",
      "file_url",
      "file_path",
      "maps_url",
      "embed_url",
      "latitude",
      "longitude",
    ]);

    const basic: CmsField[] = [];
    const content: CmsField[] = [];
    const media: CmsField[] = [];
    const seo: CmsField[] = [];

    for (const f of def.fields) {
      if (f.name.startsWith("seo_") || f.name === "og_image") {
        seo.push(f);
      } else if (mediaNames.has(f.name)) {
        media.push(f);
      } else if (basicNames.has(f.name)) {
        basic.push(f);
      } else {
        content.push(f);
      }
    }

    return { basic, content, media, seo };
  }, [def]);

  if (!def) return <ErrorState message="That content section does not exist." />;
  if (!isNew && record.isLoading) return <Loading label="Loading content details…" />;
  if (!isNew && record.isError) {
    return (
      <ErrorState
        message={record.error instanceof Error ? record.error.message : "Could not load this item."}
      />
    );
  }

  if (module === "services" && record.data?.row?.slug === "financial") {
    return <FinancialServiceEditor id={id} />;
  }

  function set(name: string, value: unknown) {
    setIsDirty(true);
    setValues((prev) => {
      const next = { ...prev, [name]: value };

      // Auto-generate slug from title for new items if slug hasn't been manually edited
      if (
        (name === "title" || name === def!.titleField) &&
        !manualSlugEdit &&
        def?.key !== "faqs"
      ) {
        next["slug"] = slugify(String(value ?? ""));
      }

      return next;
    });
  }

  async function submit(nextStatus?: "draft" | "published") {
    if (!def) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload: Values = { ...values };
      if (payload["slug"]) {
        payload["slug"] = slugify(String(payload["slug"]));
      }
      for (const field of def.fields) {
        if (field.type === "lines" || field.type === "tags") {
          payload[field.name] = toLines(payload[field.name]);
        }
      }

      const targetStatus = nextStatus ?? status;

      const res = await save({
        data: {
          module: module as CmsModule,
          ...(isNew ? {} : { id }),
          status: targetStatus,
          featured,
          sortOrder,
          values: payload,
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      if (nextStatus) setStatus(nextStatus);
      setIsDirty(false);

      const labelName = def.singular;
      setNotice(
        targetStatus === "published"
          ? `${labelName} published successfully — it is now live on the website.`
          : `${labelName} saved successfully as draft.`,
      );

      if (isNew) {
        navigate({ to: "/admin/website/$module/$id", params: { module, id: res.id } });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  function optionsFor(field: CmsField): { value: string; label: string }[] {
    if (field.name === "service_id") {
      return [
        { value: "", label: "None" },
        ...(relations.data?.services ?? []).map((s) => ({ value: s.id, label: s.title })),
      ];
    }
    if (field.name === "industry_id") {
      return [
        { value: "", label: "None" },
        ...(relations.data?.industries ?? []).map((s) => ({ value: s.id, label: s.title })),
      ];
    }
    return (field.options ?? []).map((o) => ({ value: o, label: o || "None" }));
  }

  function renderField(field: CmsField) {
    const value = values[field.name];
    const isRequired =
      field.name === def!.titleField || (field.name === "slug" && def?.key !== "faqs");
    const helpText = getFieldHelp(field.name, field.help);
    const strVal = String(value ?? "");

    // Character counter logic
    let counter: { current: number; max: number; isOver: boolean } | null = null;
    if (field.name === "seo_title") {
      counter = { current: strVal.length, max: 60, isOver: strVal.length > 60 };
    } else if (field.name === "seo_description") {
      counter = { current: strVal.length, max: 160, isOver: strVal.length > 160 };
    }

    const inputClasses =
      "mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary transition disabled:opacity-60";

    return (
      <div
        key={field.name}
        className={field.type === "textarea" || field.type === "lines" ? "sm:col-span-2" : ""}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-ink">
            {field.label} {isRequired ? <span className="text-primary">*</span> : null}
          </label>
          {counter ? (
            <span
              className={`text-[0.68rem] font-mono font-semibold ${
                counter.isOver ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {counter.current} / {counter.max} chars
            </span>
          ) : null}
        </div>

        {field.type === "select" ? (
          <select
            disabled={!canEdit}
            value={String(value ?? "")}
            onChange={(e) => set(field.name, e.target.value)}
            className={inputClasses}
          >
            {optionsFor(field).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" || field.type === "lines" || field.type === "tags" ? (
          <textarea
            disabled={!canEdit}
            rows={field.rows ?? (field.type === "textarea" ? 4 : 5)}
            value={strVal}
            onChange={(e) => set(field.name, e.target.value)}
            className={inputClasses}
          />
        ) : field.type === "bool" ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id={field.name}
              disabled={!canEdit}
              checked={Boolean(value)}
              onChange={(e) => set(field.name, e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor={field.name} className="text-xs text-muted-foreground cursor-pointer">
              Enable this feature
            </label>
          </div>
        ) : (
          <div className="relative">
            <input
              disabled={!canEdit}
              type={field.type === "number" ? "number" : "text"}
              value={strVal}
              onChange={(e) => {
                if (field.name === "slug") setManualSlugEdit(true);
                set(field.name, e.target.value);
              }}
              onBlur={() => {
                if (field.name === "slug") {
                  const current = String(values["slug"] ?? "").trim();
                  if (current) set("slug", slugify(current));
                }
              }}
              className={inputClasses}
            />
          </div>
        )}

        {canEdit &&
        (IMAGE_FIELDS.has(field.name) || (module === "downloads" && field.name === "file_url")) ? (
          <div className="mt-2 flex flex-col gap-2">
            {module === "downloads" && field.name === "file_url" ? (
              <PdfUploadButton
                currentUrl={strVal}
                currentPath={String(values["file_path"] || values["storage_path"] || "")}
                currentFileName={String(values["file_name"] || "")}
                currentFileSize={Number(values["file_size"]) || undefined}
                category={String(values["category"] || "")}
                onSelect={(res) => {
                  set("file_url", res.url);
                  set("file_path", res.storagePath);
                  set("storage_path", res.storagePath);
                  set("file_name", res.fileName);
                  set("file_size", res.fileSize);
                  set("file_type", res.mimeType);
                  if (!values["title"] || values["title"] === "") {
                    set("title", res.fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
                  }
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <MediaButton onSelect={(url) => set(field.name, url)} />
              </div>
            )}
            {strVal && !(module === "downloads" && field.name === "file_url") ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-ink">Current:</span>
                <a
                  href={strVal}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-primary hover:underline truncate max-w-md inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3 inline shrink-0" />
                  <span>{strVal}</span>
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        {helpText ? (
          <p className="mt-1 text-[0.7rem] text-muted-foreground leading-relaxed">{helpText}</p>
        ) : null}
      </div>
    );
  }

  const title = String(values[def.titleField] ?? "") || `New ${def.singular}`;
  const publicUrl = previewPath(module, values["slug"] as string);

  return (
    <div className="space-y-8">
      {/* Sticky / Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link
            to="/admin/website/$module"
            params={{ module }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {def.label}
          </Link>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ${
                status === "published"
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  : status === "draft"
                    ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                    : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {status}
            </span>
            {isDirty ? (
              <span className="text-xs text-amber-600 font-semibold">• Unsaved edits</span>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {publicUrl ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-ink hover:bg-secondary transition shadow-2xs"
            >
              <ExternalLink className="h-3.5 w-3.5 text-primary" /> Preview
            </a>
          ) : null}

          {canEdit ? (
            <>
              <button
                disabled={saving}
                onClick={() => submit("draft")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-ink hover:bg-secondary disabled:opacity-50 transition shadow-2xs"
              >
                <Save className="h-3.5 w-3.5" /> Save Draft
              </button>

              <button
                disabled={saving}
                onClick={() => submit("published")}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-xs"
              >
                <Send className="h-3.5 w-3.5" /> {saving ? "Publishing…" : "Publish Live"}
              </button>
            </>
          ) : null}
        </div>
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

      {/* Main Grid: Forms on left, Publishing & SEO on right */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* 1. Basic Information */}
          {sections.basic.length > 0 ? (
            <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Basic Information
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">{sections.basic.map(renderField)}</div>
            </div>
          ) : null}

          {/* 2. Content & Descriptions */}
          {sections.content.length > 0 ? (
            <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Content & Details
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">{sections.content.map(renderField)}</div>
            </div>
          ) : null}

          {/* 3. Media & Visuals */}
          {sections.media.length > 0 ? (
            <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <ImageIcon className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Media & Visuals
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">{sections.media.map(renderField)}</div>
            </div>
          ) : null}
        </div>

        {/* Sidebar: Publishing & SEO */}
        <div className="space-y-6">
          {/* Publishing Card */}
          <div className="rounded-3xl border border-border bg-background p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Publishing Status
            </h3>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Publication State</span>
              <select
                disabled={!canEdit}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as typeof status);
                  setIsDirty(true);
                }}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="draft">Draft (Private in Admin)</option>
                <option value="published">Published (Live on Website)</option>
                <option value="archived">Archived (Hidden from Website)</option>
                {module === "jobs" ? <option value="closed">Closed (Role Filled)</option> : null}
              </select>
            </label>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="featured"
                disabled={!canEdit}
                checked={featured}
                onChange={(e) => {
                  setFeatured(e.target.checked);
                  setIsDirty(true);
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="featured" className="text-xs font-semibold text-ink cursor-pointer">
                Mark as Featured
              </label>
            </div>

            <label className="block pt-1">
              <span className="text-xs font-semibold text-ink">Display Order</span>
              <input
                type="number"
                min={0}
                disabled={!canEdit}
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(Number(e.target.value) || 0);
                  setIsDirty(true);
                }}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <span className="text-[0.68rem] text-muted-foreground mt-1 block">
                Lower numbers display first on the website.
              </span>
            </label>

            {record.data?.row ? (
              <div className="border-t border-border pt-3 text-[0.7rem] text-muted-foreground space-y-1">
                <p>Created: {formatDate(record.data.row.created_at)}</p>
                <p>Updated: {formatDate(record.data.row.updated_at)}</p>
              </div>
            ) : null}
          </div>

          {/* Search Engine Optimization (SEO) */}
          {sections.seo.length > 0 ? (
            <div className="rounded-3xl border border-border bg-background p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Search className="h-4 w-4 text-teal-600" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Search Engine (SEO)
                </h3>
              </div>
              <div className="space-y-3">{sections.seo.map(renderField)}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
