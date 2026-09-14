"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Plus,
  RefreshCcw,
  Save,
  Send,
  Sparkles,
  Tag,
  Trash2,
  X,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  BookOpen,
} from "lucide-react";
import { cmsAction, cmsGet, cmsSave } from "@/lib/cms.functions";
import {
  resourceFileListAdmin,
  resourceFileSave,
  resourceFileDelete,
  resourceFileReorder,
  type ResourceFile,
} from "@/lib/resource.functions";
import { slugify } from "@/lib/cms-schema";
import { ConfirmModal, Loading, ErrorState, formatDate } from "@/components/admin/ui";
import { MediaButton } from "@/components/admin/MediaPicker";
import {
  ResourceFileUploadButton,
  type ResourceFileUploadResult,
} from "@/components/admin/ResourceFileUploadButton";
import type { CmsRow } from "@/lib/cms-schema";
import type { ResourceSection, ResourceCta } from "@/data/resources";

/* ─── Tab types ──────────────────────────────────────────────────────────── */

type Tab = "basic" | "media" | "content" | "downloads" | "cta" | "seo" | "publishing";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "basic", label: "Basic Info", icon: FileText },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "content", label: "Content", icon: Layers },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "cta", label: "CTA", icon: Sparkles },
  { id: "seo", label: "SEO", icon: Globe },
  { id: "publishing", label: "Publishing", icon: Settings },
];

const RESOURCE_TYPES = [
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

const PRACTICES = ["Financial", "IT", "Legal", "Engineering", "Business", "Other"];

const FILE_TYPES = ["PDF", "XLSX", "DOCX", "PPTX", "CSV", "ZIP", "Other"];

const SECTION_TYPE_OPTIONS = [
  {
    value: "heading_text",
    label: "Heading + Text",
    desc: "Section with heading and body paragraph",
  },
  { value: "rich_text", label: "Rich Text", desc: "Long-form prose with optional bullet points" },
  {
    value: "checklist",
    label: "Checklist / Bullet List",
    desc: "Items with checkmarks or bullets",
  },
  { value: "steps", label: "Steps / Process", desc: "Numbered step-by-step process" },
  { value: "stats", label: "Statistics / Metrics", desc: "Key numbers displayed as cards" },
  { value: "quote", label: "Quote / Callout", desc: "Pull quote with attribution" },
  { value: "image_text", label: "Image + Text", desc: "Image alongside descriptive text" },
  { value: "full_image", label: "Full Width Image", desc: "Showcase image spanning full width" },
  { value: "faq", label: "FAQ List", desc: "Questions and answers" },
  { value: "table", label: "Comparison Table", desc: "Table with headers and rows" },
  { value: "cta", label: "CTA Block", desc: "Inline call to action banner" },
  { value: "custom", label: "Custom HTML", desc: "Flexible custom content block" },
];

/* ─── Section helpers ────────────────────────────────────────────────────── */

function newSection(type = "heading_text"): ResourceSection {
  return {
    id: crypto.randomUUID(),
    type,
    order: 0,
    heading: "",
    body: "",
    enabled: true,
  };
}

/* ─── Main ResourceEditor component ─────────────────────────────────────── */

export function ResourceEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const get = useServerFn(cmsGet);
  const save = useServerFn(cmsSave);
  const listFiles = useServerFn(resourceFileListAdmin);
  const saveFile = useServerFn(resourceFileSave);
  const deleteFile = useServerFn(resourceFileDelete);
  const reorderFiles = useServerFn(resourceFileReorder);

  const act = useServerFn(cmsAction);

  /* ── Active tab ── */
  const [activeTab, setActiveTab] = useState<Tab>("basic");

  /* ── Basic Info ── */
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSlug, setManualSlug] = useState(!isNew);
  const [resourceType, setResourceType] = useState("Guide");
  const [practice, setPractice] = useState("Financial");
  const [subCategory, setSubCategory] = useState("");
  const [industry, setIndustry] = useState("");
  const [icon, setIcon] = useState("FileText");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [readTime, setReadTime] = useState("6 min");

  /* ── Media ── */
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [featuredImageCaption, setFeaturedImageCaption] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");
  const [authorImage, setAuthorImage] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [deleteResourceModal, setDeleteResourceModal] = useState(false);

  /* ── Content sections ── */
  const [sections, setSections] = useState<ResourceSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  /* ── Downloads (from cms_resource_files) ── */
  const [resourceId, setResourceId] = useState<string | null>(isNew ? null : id);
  const [files, setFiles] = useState<ResourceFile[]>([]);
  const [filesBusy, setFilesBusy] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<Partial<ResourceFile> | null>(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState<ResourceFile | null>(null);

  /* ── CTA ── */
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaHeading, setCtaHeading] = useState("");
  const [ctaDescription, setCtaDescription] = useState("");
  const [ctaPrimaryText, setCtaPrimaryText] = useState("Schedule Consultation");
  const [ctaPrimaryUrl, setCtaPrimaryUrl] = useState("/contact");
  const [ctaSecondaryText, setCtaSecondaryText] = useState("Explore Services");
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState("/services");

  /* ── SEO ── */
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [seoKeywordInput, setSeoKeywordInput] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [twitterTitle, setTwitterTitle] = useState("");
  const [twitterDescription, setTwitterDescription] = useState("");
  const [noindex, setNoindex] = useState(false);

  /* ── Publishing ── */
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  /* ── UI state ── */
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [loaded, setLoaded] = useState(isNew);
  const [copied, setCopied] = useState(false);

  /* ─── Load existing row ─────────────────────────────────────────────── */

  const record = useQuery({
    enabled: !isNew,
    queryKey: ["cms", "resources", id],
    queryFn: () => get({ data: { module: "resources", id } }),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!record.data || loaded) return;
    const row = record.data.row as CmsRow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = row.data ?? {};

    setTitle(row.title ?? "");
    setSlug(row.slug ?? "");
    setResourceType(row.resource_type ?? "Guide");
    setPractice(row.category ?? "Financial");
    setSubCategory(d.subCategory ?? "");
    setIndustry(row.industry ?? "");
    setIcon(row.icon ?? "FileText");
    setSummary(row.summary ?? "");
    setDescription(row.body ?? d.description ?? "");
    setAuthor(row.author ?? "");
    setAuthorRole(row.author_role ?? "");
    setReadTime(d.read_time ?? "6 min");
    setFeaturedImage(row.hero_image ?? d.featuredImage ?? "");
    setFeaturedImageAlt(d.featuredImageAlt ?? "");
    setFeaturedImageCaption(d.featuredImageCaption ?? "");
    setThumbnailImage(row.thumbnail ?? d.thumbnailImage ?? "");
    setAuthorImage(d.author_image ?? "");
    setOgImage(row.og_image ?? d.ogImage ?? "");

    // Sections
    if (Array.isArray(d.sections) && d.sections.length > 0) {
      setSections(
        d.sections
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((sec: any) => ({ ...sec, id: sec.id ?? crypto.randomUUID() })),
      );
    }

    // CTA
    if (d.cta) {
      setCtaEnabled(d.cta.enabled !== false);
      setCtaHeading(d.cta.heading ?? "");
      setCtaDescription(d.cta.description ?? "");
      setCtaPrimaryText(d.cta.primaryText ?? "Schedule Consultation");
      setCtaPrimaryUrl(d.cta.primaryUrl ?? "/contact");
      setCtaSecondaryText(d.cta.secondaryText ?? "Explore Services");
      setCtaSecondaryUrl(d.cta.secondaryUrl ?? "/services");
    }

    // SEO
    setSeoTitle(row.seo_title ?? d.seoTitle ?? "");
    setSeoDescription(row.seo_description ?? d.seoDescription ?? "");
    setSeoKeywords(row.seo_keywords ?? d.seoKeywords ?? []);
    setCanonicalUrl(d.canonicalUrl ?? "");
    setOgTitle(d.ogTitle ?? "");
    setOgDescription(d.ogDescription ?? "");
    setTwitterTitle(d.twitterTitle ?? "");
    setTwitterDescription(d.twitterDescription ?? "");
    setNoindex(Boolean(d.noindex));

    // Publishing
    setStatus((row.status ?? "draft") as "draft" | "published" | "archived");
    setFeatured(Boolean(row.featured));
    setSortOrder(row.sort_order ?? 0);
    setResourceId(row.id);
    setLoaded(true);
  }, [record.data, loaded]);

  /* ─── Load files for existing resource ─────────────────────────────── */

  async function refreshFiles(rid: string) {
    setFilesBusy(true);
    setFilesError(null);
    try {
      const result = await listFiles({ data: { resourceId: rid } });
      setFiles(result);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : "Could not load files.");
    } finally {
      setFilesBusy(false);
    }
  }

  useEffect(() => {
    if (resourceId && !isNew) void refreshFiles(resourceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, isNew]);

  /* ─── Slug auto-generation ──────────────────────────────────────────── */

  useEffect(() => {
    if (!manualSlug && title) {
      setSlug(slugify(title));
    }
  }, [title, manualSlug]);

  /* ─── Build record for save ─────────────────────────────────────────── */

  function buildValues() {
    const cta: ResourceCta = {
      enabled: ctaEnabled,
      heading: ctaHeading,
      description: ctaDescription,
      primaryText: ctaPrimaryText,
      primaryUrl: ctaPrimaryUrl,
      secondaryText: ctaSecondaryText,
      secondaryUrl: ctaSecondaryUrl,
    };

    const sortedSections = sections.map((s, i) => ({ ...s, order: i }));

    return {
      title,
      slug,
      resource_type: resourceType,
      category: practice,
      industry,
      icon,
      hero_image: featuredImage,
      thumbnail: thumbnailImage,
      featuredImageAlt,
      featuredImageCaption,
      summary,
      body: description,
      author,
      author_role: authorRole,
      seo_title: seoTitle,
      seo_description: seoDescription,
      seo_keywords: seoKeywords,
      og_image: ogImage,
      // JSON data fields
      subCategory,
      read_time: readTime,
      sections: sortedSections,
      cta,
      author_image: authorImage,
      ogTitle,
      ogDescription,
      twitterTitle,
      twitterDescription,
      canonicalUrl,
      noindex,
    };
  }

  /* ─── Save ──────────────────────────────────────────────────────────── */

  async function handleSave(targetStatus?: "draft" | "published" | "archived") {
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    if (!slug.trim()) {
      setError("A web address (slug) is required.");
      return;
    }
    const saveStatus = targetStatus ?? status;
    if (saveStatus === "published") {
      const invalidFiles = files.filter(
        (f) => f.is_active && (!f.file_url || f.file_url.trim() === "" || f.file_url === "#"),
      );
      if (invalidFiles.length > 0) {
        setError(
          `Download validation warning: Download file "${invalidFiles[0]?.title}" is missing or invalid. Please ensure all active files have a valid uploaded document before publishing.`,
        );
        return;
      }
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await save({
        data: {
          module: "resources",
          ...(isNew ? {} : { id }),
          status: saveStatus,
          featured,
          sortOrder,
          values: buildValues(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setIsDirty(false);
      const newId = (result as { id: string }).id;
      if (isNew && newId) {
        setResourceId(newId);
        await navigate({
          to: "/admin/website/$module/$id",
          params: { module: "resources", id: newId },
          replace: true,
        });
        await refreshFiles(newId);
      }
      setStatus(saveStatus);
      setNotice(
        targetStatus === "published"
          ? "Published — now live on the website."
          : targetStatus === "archived"
            ? "Archived successfully."
            : "Draft saved.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  /* ─── File operations ───────────────────────────────────────────────── */

  async function handleSaveFile(fileData: Partial<ResourceFile>) {
    if (!resourceId) {
      setError("Please save the resource first before adding downloads.");
      return;
    }
    if (!fileData.title?.trim()) {
      setFilesError("A file title is required.");
      return;
    }
    setFilesBusy(true);
    setFilesError(null);
    try {
      await saveFile({
        data: {
          id: fileData.id,
          resource_id: resourceId,
          title: fileData.title!,
          description: fileData.description ?? undefined,
          file_url: fileData.file_url ?? undefined,
          storage_path: fileData.storage_path ?? undefined,
          file_name: fileData.file_name ?? undefined,
          file_size: fileData.file_size ?? undefined,
          mime_type: fileData.mime_type ?? undefined,
          file_type: fileData.file_type ?? "PDF",
          display_label: fileData.display_label ?? undefined,
          download_filename: fileData.download_filename ?? undefined,
          sort_order: fileData.sort_order ?? files.length,
          is_active: fileData.is_active ?? true,
        },
      });
      await refreshFiles(resourceId);
      setEditingFile(null);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : "Could not save file.");
    } finally {
      setFilesBusy(false);
    }
  }

  async function handleDeleteFile(file: ResourceFile) {
    if (!resourceId) return;
    setFilesBusy(true);
    try {
      await deleteFile({ data: { id: file.id, resourceId } });
      await refreshFiles(resourceId);
      setDeleteFileTarget(null);
    } catch (e) {
      setFilesError(e instanceof Error ? e.message : "Could not delete file.");
    } finally {
      setFilesBusy(false);
    }
  }

  async function handleReorderFiles(newOrder: ResourceFile[]) {
    if (!resourceId) return;
    setFiles(newOrder);
    try {
      await reorderFiles({ data: { resourceId, orderedIds: newOrder.map((f) => f.id) } });
    } catch {
      // Non-critical; refresh to get real order
      await refreshFiles(resourceId);
    }
  }

  async function handleDuplicate() {
    if (!resourceId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await act({ data: { module: "resources", id: resourceId, action: "duplicate" } });
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setNotice("Resource duplicated successfully.");
      if (res && typeof res === "object" && "id" in res && res.id) {
        navigate({
          to: "/admin/website/$module/$id",
          params: { module: "resources", id: res.id as string },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not duplicate resource.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteResource() {
    if (!resourceId) return;
    setSaving(true);
    setError(null);
    try {
      await act({ data: { module: "resources", id: resourceId, action: "delete" } });
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      navigate({
        to: "/admin/website/$module",
        params: { module: "resources" },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete resource.");
    } finally {
      setSaving(false);
      setDeleteResourceModal(false);
    }
  }

  /* ─── Section operations ────────────────────────────────────────────── */

  function addSection(type = "heading_text") {
    const sec = newSection(type);
    setSections((prev) => [...prev, sec]);
    setSelectedSectionId(sec.id!);
    setIsDirty(true);
  }

  function updateSection(id: string, patch: Partial<ResourceSection>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setIsDirty(true);
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
    setIsDirty(true);
  }

  function moveSection(id: string, dir: "up" | "down") {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      const a = arr[idx];
      const b = arr[newIdx];
      if (a && b) {
        arr[idx] = b;
        arr[newIdx] = a;
      }
      return arr;
    });
    setIsDirty(true);
  }

  /* ─── Keyword helpers ───────────────────────────────────────────────── */

  function addKeyword() {
    const kw = seoKeywordInput.trim();
    if (!kw || seoKeywords.includes(kw)) return;
    setSeoKeywords((prev) => [...prev, kw]);
    setSeoKeywordInput("");
    setIsDirty(true);
  }

  function removeKeyword(kw: string) {
    setSeoKeywords((prev) => prev.filter((k) => k !== kw));
    setIsDirty(true);
  }

  /* ─── Helpers ───────────────────────────────────────────────────────── */

  const previewUrl = slug ? `/resources/${slug}?preview=true` : null;

  function copySlug() {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  /* ─── Loading / error states ─────────────────────────────────────────── */

  if (!isNew && record.isLoading) return <Loading />;
  if (!isNew && record.isError)
    return <ErrorState message="Could not load this resource. Please try again." />;

  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/website/$module"
            params={{ module: "resources" }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Resources
          </Link>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
            {isNew ? "New Resource" : title || "Edit Resource"}
          </h1>
          {!isNew && slug ? (
            <div className="mt-1 flex items-center gap-2">
              <code className="text-xs text-muted-foreground font-mono">/resources/{slug}</code>
              <button
                onClick={copySlug}
                className="text-xs text-muted-foreground hover:text-ink transition cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              {previewUrl ? (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status badge */}
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold border ${
              status === "published"
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                : status === "archived"
                  ? "bg-muted text-muted-foreground border-border"
                  : "bg-amber-500/10 text-amber-700 border-amber-500/20"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>

          <button
            onClick={() => void handleSave("draft")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-muted transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Draft
          </button>

          <button
            onClick={() => void handleSave("published")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {status === "published" ? "Update Live" : "Publish"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notice ? (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-800 animate-in fade-in">
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="flex items-center justify-between rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-semibold text-destructive animate-in fade-in">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.id === "downloads" && files.length > 0 ? (
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-bold text-primary">
                    {files.length}
                  </span>
                ) : null}
                {tab.id === "content" && sections.length > 0 ? (
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-bold text-primary">
                    {sections.length}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ═══════════════════════════════ BASIC INFO ════════════════════════════ */}
      {activeTab === "basic" ? (
        <div className="grid gap-6 max-w-2xl">
          <FormField label="Resource Title *" help="Shown as the page heading.">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. GST Filing Checklist for Indian SMEs"
              className="input-field"
            />
          </FormField>

          <FormField
            label="Web Address (Slug) *"
            help="URL-friendly identifier. Auto-generated from title."
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setManualSlug(true);
                  setIsDirty(true);
                }}
                placeholder="gst-filing-checklist"
                className="input-field flex-1 font-mono text-sm"
              />
              {manualSlug ? (
                <button
                  onClick={() => {
                    setManualSlug(false);
                    setSlug(slugify(title));
                  }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-ink transition cursor-pointer"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Resource Type *">
              <select
                value={resourceType}
                onChange={(e) => {
                  setResourceType(e.target.value);
                  setIsDirty(true);
                }}
                className="input-field"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Practice / Division *">
              <select
                value={practice}
                onChange={(e) => {
                  setPractice(e.target.value);
                  setIsDirty(true);
                }}
                className="input-field"
              >
                {PRACTICES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Sub-category" help="e.g. GST, ERP Selection, Trademark">
              <input
                type="text"
                value={subCategory}
                onChange={(e) => {
                  setSubCategory(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="GST"
                className="input-field"
              />
            </FormField>
            <FormField label="Industry (optional)" help="e.g. Manufacturing, FMCG">
              <input
                type="text"
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Manufacturing"
                className="input-field"
              />
            </FormField>
          </div>

          <FormField label="Icon Name" help="Lucide icon name, e.g. FileText, Calculator, BookOpen">
            <input
              type="text"
              value={icon}
              onChange={(e) => {
                setIcon(e.target.value);
                setIsDirty(true);
              }}
              placeholder="FileText"
              className="input-field font-mono"
            />
          </FormField>

          <FormField
            label="Short Description *"
            help="Shown on the listing card and as the meta description fallback. Keep under 160 characters."
          >
            <textarea
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setIsDirty(true);
              }}
              rows={3}
              placeholder="A step-by-step checklist for preparing and filing GST returns..."
              className="input-field resize-y"
            />
            <CharCount value={summary} max={160} />
          </FormField>

          <FormField
            label="Full Description / Introduction"
            help="Extended intro shown at the top of the detail page."
          >
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              rows={5}
              placeholder="This resource covers everything you need to know about..."
              className="input-field resize-y"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Author Name">
              <input
                type="text"
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Ravi Sharma"
                className="input-field"
              />
            </FormField>
            <FormField label="Author Role / Designation">
              <input
                type="text"
                value={authorRole}
                onChange={(e) => {
                  setAuthorRole(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="CA, Tax Advisory"
                className="input-field"
              />
            </FormField>
          </div>

          <FormField label="Read Time" help="Displayed next to the clock icon. e.g. 6 min">
            <input
              type="text"
              value={readTime}
              onChange={(e) => {
                setReadTime(e.target.value);
                setIsDirty(true);
              }}
              placeholder="6 min"
              className="input-field w-32"
            />
          </FormField>
        </div>
      ) : null}

      {/* ═══════════════════════════════ MEDIA ══════════════════════════════════ */}
      {activeTab === "media" ? (
        <div className="grid gap-8 max-w-2xl">
          <div>
            <p className="text-sm font-semibold text-ink mb-1">Featured Image</p>
            <p className="text-xs text-muted-foreground mb-3">
              Shown as the hero image on the resource detail page (recommended: 1200×630 px).
            </p>
            <MediaButton
              onSelect={(url) => {
                setFeaturedImage(url);
                setIsDirty(true);
              }}
            />
            {featuredImage ? (
              <div className="mt-3 space-y-3">
                <div className="flex gap-3 items-center">
                  <img
                    src={featuredImage}
                    alt={featuredImageAlt || "Featured"}
                    className="h-20 w-32 rounded-xl object-cover border border-border"
                  />
                  <button
                    onClick={() => {
                      setFeaturedImage("");
                      setIsDirty(true);
                    }}
                    className="text-xs text-destructive hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 pt-1">
                  <FormField label="Image Alt Text" help="For accessibility and SEO">
                    <input
                      type="text"
                      value={featuredImageAlt}
                      onChange={(e) => {
                        setFeaturedImageAlt(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. GST Checklist Document Guide"
                      className="input-field text-xs"
                    />
                  </FormField>
                  <FormField label="Image Caption (optional)">
                    <input
                      type="text"
                      value={featuredImageCaption}
                      onChange={(e) => {
                        setFeaturedImageCaption(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="e.g. Official GST filing calendar"
                      className="input-field text-xs"
                    />
                  </FormField>
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-semibold text-ink mb-1">Thumbnail Image</p>
            <p className="text-xs text-muted-foreground mb-3">
              Shown on the listing card (recommended: 600×400 px). Falls back to Featured Image if
              empty.
            </p>
            <MediaButton
              onSelect={(url) => {
                setThumbnailImage(url);
                setIsDirty(true);
              }}
            />
            {thumbnailImage ? (
              <div className="mt-3 flex gap-3 items-center">
                <img
                  src={thumbnailImage}
                  alt="Thumbnail"
                  className="h-16 w-24 rounded-xl object-cover border border-border"
                />
                <button
                  onClick={() => {
                    setThumbnailImage("");
                    setIsDirty(true);
                  }}
                  className="text-xs text-destructive hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-semibold text-ink mb-1">Author Photo</p>
            <MediaButton
              onSelect={(url) => {
                setAuthorImage(url);
                setIsDirty(true);
              }}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-ink mb-1">Social / OG Image</p>
            <p className="text-xs text-muted-foreground mb-3">
              Used when shared on LinkedIn, Twitter etc. Falls back to Featured Image.
            </p>
            <MediaButton
              onSelect={(url) => {
                setOgImage(url);
                setIsDirty(true);
              }}
            />
          </div>
        </div>
      ) : null}

      {/* ═══════════════════════════════ CONTENT ════════════════════════════════ */}
      {activeTab === "content" ? (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Section list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-ink uppercase tracking-wide">
                Sections ({sections.length})
              </p>
            </div>

            {sections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
                No sections yet. Add one below.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {sections.map((sec, i) => (
                  <li key={sec.id} className="flex gap-1 items-center">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveSection(sec.id!, "up")}
                        disabled={i === 0}
                        className="p-0.5 rounded text-muted-foreground hover:text-ink disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveSection(sec.id!, "down")}
                        disabled={i === sections.length - 1}
                        className="p-0.5 rounded text-muted-foreground hover:text-ink disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedSectionId(sec.id === selectedSectionId ? null : sec.id!)
                      }
                      className={`flex-1 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                        selectedSectionId === sec.id
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                          : "bg-muted/40 text-ink hover:bg-muted"
                      }`}
                    >
                      <span className="block truncate font-semibold">
                        {sec.heading || `Section ${i + 1}`}
                      </span>
                      <span className="block text-[0.6rem] text-muted-foreground capitalize">
                        {sec.type?.replace(/_/g, " ") ?? "heading_text"}
                      </span>
                    </button>
                    <button
                      onClick={() => removeSection(sec.id!)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add section buttons */}
            <div className="pt-3 space-y-1.5">
              <p className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wide">
                Add Section
              </p>
              {SECTION_TYPE_OPTIONS.slice(0, 6).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => addSection(opt.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-left text-xs text-ink hover:border-primary/40 hover:bg-primary/5 transition cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-ink">
                  More types…
                </summary>
                <div className="mt-1.5 space-y-1.5">
                  {SECTION_TYPE_OPTIONS.slice(6).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => addSection(opt.value)}
                      className="w-full rounded-xl border border-border px-3 py-2 text-left text-xs text-ink hover:border-primary/40 hover:bg-primary/5 transition cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* Section editor panel */}
          <div>
            {selectedSection ? (
              <SectionEditor
                section={selectedSection}
                onChange={(patch) => updateSection(selectedSection.id!, patch)}
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                Select a section on the left to edit it
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ═══════════════════════════════ DOWNLOADS ══════════════════════════════ */}
      {activeTab === "downloads" ? (
        <div className="space-y-6 max-w-2xl">
          {isNew ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
              Save the resource first to add downloadable files.
            </div>
          ) : null}

          {filesError ? (
            <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {filesError}
              <button
                onClick={() => setFilesError(null)}
                className="ml-auto text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {!isNew && (
            <>
              {/* File list */}
              {filesBusy && files.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading files…
                </div>
              ) : null}

              {files.length > 0 ? (
                <ul className="space-y-3">
                  {files.map((f, i) => (
                    <li
                      key={f.id}
                      className="flex gap-3 items-start rounded-2xl border border-border bg-card/60 p-4"
                    >
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => handleReorderFiles(moveItem(files, i, "up"))}
                          disabled={i === 0}
                          className="p-0.5 text-muted-foreground hover:text-ink disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorderFiles(moveItem(files, i, "down"))}
                          disabled={i === files.length - 1}
                          className="p-0.5 text-muted-foreground hover:text-ink disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                            {f.file_type}
                          </span>
                          <p className="text-sm font-semibold text-ink truncate">{f.title}</p>
                          {!f.is_active ? (
                            <span className="text-[0.65rem] text-muted-foreground">(hidden)</span>
                          ) : null}
                        </div>
                        {f.file_name ? (
                          <p className="mt-0.5 text-xs text-muted-foreground font-mono truncate">
                            {f.file_name}
                          </p>
                        ) : null}
                        {f.file_url ? (
                          <a
                            href={f.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Preview / Download
                          </a>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">No file uploaded yet</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setEditingFile({ ...f })}
                          className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink hover:bg-muted transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteFileTarget(f)}
                          className="rounded-full border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/5 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                !filesBusy && (
                  <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                    No downloadable files yet. Add one below.
                  </div>
                )
              )}

              <button
                onClick={() =>
                  setEditingFile({
                    resource_id: resourceId!,
                    file_type: "PDF",
                    is_active: true,
                    sort_order: files.length,
                  })
                }
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Download File
              </button>
            </>
          )}
        </div>
      ) : null}

      {/* ═══════════════════════════════ CTA ════════════════════════════════════ */}
      {activeTab === "cta" ? (
        <div className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={ctaEnabled}
              onClick={() => {
                setCtaEnabled((v) => !v);
                setIsDirty(true);
              }}
              className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${ctaEnabled ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${ctaEnabled ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
            <span className="text-sm font-semibold text-ink">
              {ctaEnabled ? "Custom CTA enabled" : "Custom CTA disabled (uses site-wide CTA band)"}
            </span>
          </div>

          {ctaEnabled ? (
            <>
              <FormField label="CTA Heading">
                <input
                  type="text"
                  value={ctaHeading}
                  onChange={(e) => {
                    setCtaHeading(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Need specialist advice for your business?"
                  className="input-field"
                />
              </FormField>
              <FormField label="CTA Description">
                <textarea
                  value={ctaDescription}
                  onChange={(e) => {
                    setCtaDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  rows={2}
                  placeholder="Speak with our practice leads…"
                  className="input-field resize-y"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Primary Button Text">
                  <input
                    type="text"
                    value={ctaPrimaryText}
                    onChange={(e) => {
                      setCtaPrimaryText(e.target.value);
                      setIsDirty(true);
                    }}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Primary Button URL">
                  <input
                    type="text"
                    value={ctaPrimaryUrl}
                    onChange={(e) => {
                      setCtaPrimaryUrl(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="/contact"
                    className="input-field font-mono"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Secondary Button Text">
                  <input
                    type="text"
                    value={ctaSecondaryText}
                    onChange={(e) => {
                      setCtaSecondaryText(e.target.value);
                      setIsDirty(true);
                    }}
                    className="input-field"
                  />
                </FormField>
                <FormField label="Secondary Button URL">
                  <input
                    type="text"
                    value={ctaSecondaryUrl}
                    onChange={(e) => {
                      setCtaSecondaryUrl(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="/services"
                    className="input-field font-mono"
                  />
                </FormField>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {/* ═══════════════════════════════ SEO ════════════════════════════════════ */}
      {activeTab === "seo" ? (
        <div className="space-y-6 max-w-2xl">
          <FormField
            label="SEO Title"
            help="Shown in Google search results. Keep under 60 characters. Defaults to resource title."
          >
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => {
                setSeoTitle(e.target.value);
                setIsDirty(true);
              }}
              placeholder={title}
              className="input-field"
            />
            <CharCount value={seoTitle} max={60} />
          </FormField>

          <FormField
            label="Meta Description"
            help="Shown below your title in Google. Keep under 160 characters. Defaults to short description."
          >
            <textarea
              value={seoDescription}
              onChange={(e) => {
                setSeoDescription(e.target.value);
                setIsDirty(true);
              }}
              rows={3}
              placeholder={summary}
              className="input-field resize-y"
            />
            <CharCount value={seoDescription} max={160} />
          </FormField>

          <FormField label="Keywords / Tags" help="Press Enter or comma to add.">
            <div className="flex gap-2">
              <input
                type="text"
                value={seoKeywordInput}
                onChange={(e) => setSeoKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="GST, SME, India"
                className="input-field flex-1"
              />
              <button
                onClick={addKeyword}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-muted transition cursor-pointer"
              >
                Add
              </button>
            </div>
            {seoKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {seoKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                  >
                    {kw}
                    <button
                      onClick={() => removeKeyword(kw)}
                      className="hover:text-destructive cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </FormField>

          <FormField
            label="Canonical URL"
            help="Leave blank to use the default /resources/[slug] URL."
          >
            <input
              type="text"
              value={canonicalUrl}
              onChange={(e) => {
                setCanonicalUrl(e.target.value);
                setIsDirty(true);
              }}
              placeholder="/resources/gst-checklist"
              className="input-field font-mono text-sm"
            />
          </FormField>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold text-ink mb-4">Open Graph (Social Sharing)</p>
            <div className="space-y-4">
              <FormField label="OG Title">
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => {
                    setOgTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={seoTitle || title}
                  className="input-field"
                />
              </FormField>
              <FormField label="OG Description">
                <textarea
                  value={ogDescription}
                  onChange={(e) => {
                    setOgDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  rows={2}
                  placeholder={seoDescription || summary}
                  className="input-field resize-y"
                />
              </FormField>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold text-ink mb-4">Twitter / X Card</p>
            <div className="space-y-4">
              <FormField label="Twitter Title">
                <input
                  type="text"
                  value={twitterTitle}
                  onChange={(e) => {
                    setTwitterTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={ogTitle || seoTitle || title}
                  className="input-field"
                />
              </FormField>
              <FormField label="Twitter Description">
                <textarea
                  value={twitterDescription}
                  onChange={(e) => {
                    setTwitterDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  rows={2}
                  placeholder={ogDescription || seoDescription || summary}
                  className="input-field resize-y"
                />
              </FormField>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noindex}
                onChange={(e) => {
                  setNoindex(e.target.checked);
                  setIsDirty(true);
                }}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm font-semibold text-ink">
                Exclude from search engines (noindex, nofollow)
              </span>
            </label>
            <p className="mt-1 text-xs text-muted-foreground ml-7">
              Use this for draft resources you never want Google to index.
            </p>
          </div>
        </div>
      ) : null}

      {/* ════════════════════════════ PUBLISHING ═════════════════════════════════ */}
      {activeTab === "publishing" ? (
        <div className="space-y-6 max-w-sm">
          <FormField label="Status">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "draft" | "published" | "archived");
                setIsDirty(true);
              }}
              className="input-field"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </FormField>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => {
                setFeatured(e.target.checked);
                setIsDirty(true);
              }}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm font-semibold text-ink">Mark as Featured</span>
          </label>

          <FormField label="Sort Order" help="Lower numbers appear first. Default: 0.">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(Number(e.target.value));
                setIsDirty(true);
              }}
              min={0}
              max={9999}
              className="input-field w-28"
            />
          </FormField>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => void handleSave("draft")}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:bg-muted transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save as Draft
            </button>
            <button
              onClick={() => void handleSave("published")}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {status === "published" ? "Update Live" : "Publish Now"}
            </button>
            {status === "published" && (
              <button
                onClick={() => void handleSave("draft")}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-500/10 transition disabled:opacity-50 cursor-pointer"
              >
                Unpublish (revert to Draft)
              </button>
            )}
            {status !== "archived" && (
              <button
                onClick={() => void handleSave("archived")}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-muted px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition disabled:opacity-50 cursor-pointer"
              >
                Archive
              </button>
            )}
          </div>

          {!isNew && slug ? (
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleDuplicate()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-50 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setDeleteResourceModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
              <div>
                <p className="text-xs font-bold text-ink mb-1">Preview</p>
                <a
                  href={`/resources/${slug}?preview=true`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Eye className="h-3.5 w-3.5" /> Open preview in new tab
                </a>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ═══════════════ FILE EDITOR MODAL ═══════════════ */}
      {editingFile ? (
        <FileEditorModal
          file={editingFile}
          resourceId={resourceId!}
          busy={filesBusy}
          onSave={handleSaveFile}
          onClose={() => {
            setEditingFile(null);
            setFilesError(null);
          }}
        />
      ) : null}

      {/* ═══════════════ FILE DELETE CONFIRM ═══════════════ */}
      {deleteFileTarget ? (
        <ConfirmModal
          isOpen={Boolean(deleteFileTarget)}
          title="Delete this file?"
          message={`"${deleteFileTarget.title}" will be permanently removed from this resource. The file itself will remain in Supabase Storage.`}
          confirmLabel="Delete"
          onConfirm={() => void handleDeleteFile(deleteFileTarget)}
          onCancel={() => setDeleteFileTarget(null)}
          isDestructive
        />
      ) : null}

      {/* ═══════════════ RESOURCE DELETE CONFIRM ═══════════════ */}
      {deleteResourceModal ? (
        <ConfirmModal
          isOpen={deleteResourceModal}
          title="Delete Resource?"
          message={`Are you sure you want to permanently delete "${title || "this resource"}"? All associated content will be removed.`}
          confirmLabel="Delete Resource"
          onConfirm={() => void handleDeleteResource()}
          onCancel={() => setDeleteResourceModal(false)}
          isDestructive
        />
      ) : null}
    </div>
  );
}

/* ─── Section Editor sub-component ──────────────────────────────────────── */

function SectionEditor({
  section,
  onChange,
}: {
  section: ResourceSection;
  onChange: (patch: Partial<ResourceSection>) => void;
}) {
  const typeOpt = SECTION_TYPE_OPTIONS.find((o) => o.value === section.type);

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ink">{typeOpt?.label ?? section.type}</p>
          <p className="text-xs text-muted-foreground">{typeOpt?.desc}</p>
        </div>
        <select
          value={section.type ?? "heading_text"}
          onChange={(e) => onChange({ type: e.target.value })}
          className="input-field text-xs py-1.5 w-44"
        >
          {SECTION_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <FormField label="Heading">
        <input
          type="text"
          value={section.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
          placeholder="Section heading…"
          className="input-field"
        />
      </FormField>

      <FormField label="Body / Paragraph">
        <textarea
          value={section.body}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={4}
          placeholder="Body text…"
          className="input-field resize-y"
        />
      </FormField>

      {/* Bullet points (for rich_text, heading_text, checklist) */}
      {["heading_text", "rich_text", "checklist"].includes(section.type ?? "") ? (
        <FormField label="Bullet Points" help="One per line">
          <textarea
            value={(section.points ?? []).join("\n")}
            onChange={(e) =>
              onChange({
                points: e.target.value
                  .split("\n")
                  .map((p) => p.trim())
                  .filter(Boolean),
              })
            }
            rows={4}
            placeholder="Point 1&#10;Point 2&#10;Point 3"
            className="input-field resize-y font-mono text-sm"
          />
        </FormField>
      ) : null}

      {/* Steps */}
      {section.type === "steps" ? (
        <FormField label="Steps" help='Format: "Step title | Step body" one per line'>
          <textarea
            value={(section.steps ?? []).map((s) => `${s.step} | ${s.body}`).join("\n")}
            onChange={(e) =>
              onChange({
                steps: e.target.value
                  .split("\n")
                  .map((l) => {
                    const [step, ...rest] = l.split("|");
                    return { step: step?.trim() ?? "", body: rest.join("|").trim() };
                  })
                  .filter((s) => s.step),
              })
            }
            rows={4}
            placeholder="Gather documents | Collect GSTIN, PAN, bank details&#10;File return | Use GST portal"
            className="input-field resize-y font-mono text-sm"
          />
        </FormField>
      ) : null}

      {/* Stats */}
      {section.type === "stats" ? (
        <FormField label="Statistics" help='"Label | Value" one per line'>
          <textarea
            value={(section.stats ?? []).map((s) => `${s.label} | ${s.value}`).join("\n")}
            onChange={(e) =>
              onChange({
                stats: e.target.value
                  .split("\n")
                  .map((l) => {
                    const [label, ...rest] = l.split("|");
                    return { label: label?.trim() ?? "", value: rest.join("|").trim() };
                  })
                  .filter((s) => s.label),
              })
            }
            rows={4}
            placeholder="Businesses assisted | 2,000+&#10;Filings completed | 98%"
            className="input-field resize-y font-mono text-sm"
          />
        </FormField>
      ) : null}

      {/* Quote */}
      {section.type === "quote" ? (
        <>
          <FormField label="Quote Text">
            <textarea
              value={section.quote ?? ""}
              onChange={(e) => onChange({ quote: e.target.value })}
              rows={3}
              className="input-field resize-y"
            />
          </FormField>
          <FormField label="Attribution">
            <input
              type="text"
              value={section.quoteBy ?? ""}
              onChange={(e) => onChange({ quoteBy: e.target.value })}
              placeholder="Ravi Sharma, CFO"
              className="input-field"
            />
          </FormField>
        </>
      ) : null}

      {/* Image URL */}
      {["image_text", "full_image"].includes(section.type ?? "") ? (
        <FormField label="Image URL">
          <input
            type="text"
            value={section.imageUrl ?? ""}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="https://..."
            className="input-field font-mono text-sm"
          />
        </FormField>
      ) : null}

      {/* FAQ list */}
      {section.type === "faq" ? (
        <FormField label="FAQ Items" help='"Question | Answer" one per line'>
          <textarea
            value={(section.faqs ?? []).map((f) => `${f.q} | ${f.a}`).join("\n")}
            onChange={(e) =>
              onChange({
                faqs: e.target.value
                  .split("\n")
                  .map((l) => {
                    const [q, ...rest] = l.split("|");
                    return { q: q?.trim() ?? "", a: rest.join("|").trim() };
                  })
                  .filter((f) => f.q),
              })
            }
            rows={6}
            className="input-field resize-y font-mono text-sm"
          />
        </FormField>
      ) : null}

      {/* CTA block */}
      {section.type === "cta" ? (
        <>
          <FormField label="CTA Heading">
            <input
              type="text"
              value={section.ctaHeading ?? ""}
              onChange={(e) => onChange({ ctaHeading: e.target.value })}
              className="input-field"
            />
          </FormField>
          <FormField label="CTA Body">
            <textarea
              value={section.ctaBody ?? ""}
              onChange={(e) => onChange({ ctaBody: e.target.value })}
              rows={2}
              className="input-field resize-y"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Button Text">
              <input
                type="text"
                value={section.ctaPrimaryText ?? ""}
                onChange={(e) => onChange({ ctaPrimaryText: e.target.value })}
                className="input-field"
              />
            </FormField>
            <FormField label="Button URL">
              <input
                type="text"
                value={section.ctaPrimaryUrl ?? ""}
                onChange={(e) => onChange({ ctaPrimaryUrl: e.target.value })}
                className="input-field font-mono text-sm"
              />
            </FormField>
          </div>
        </>
      ) : null}

      {/* Enabled toggle */}
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={section.enabled !== false}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        <span className="text-muted-foreground">Section visible</span>
      </label>
    </div>
  );
}

/* ─── File Editor Modal ──────────────────────────────────────────────────── */

function FileEditorModal({
  file,
  resourceId,
  busy,
  onSave,
  onClose,
}: {
  file: Partial<ResourceFile>;
  resourceId: string;
  busy: boolean;
  onSave: (f: Partial<ResourceFile>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<ResourceFile>>({ ...file });

  function patch(p: Partial<ResourceFile>) {
    setForm((prev) => ({ ...prev, ...p }));
  }

  function handleFileUpload(result: ResourceFileUploadResult) {
    patch({
      file_url: result.url,
      storage_path: result.storagePath,
      file_name: result.fileName,
      file_size: result.fileSize,
      mime_type: result.mimeType,
      file_type: result.fileType,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="font-display text-base font-bold text-ink">
            {form.id ? "Edit Download File" : "Add Download File"}
          </p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-ink transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] px-6 py-5 space-y-5">
          <FormField label="File Title *" help="Shown to the user as the download name">
            <input
              type="text"
              value={form.title ?? ""}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="GST Checklist — PDF"
              className="input-field"
              autoFocus
            />
          </FormField>

          <FormField label="File Type">
            <select
              value={form.file_type ?? "PDF"}
              onChange={(e) => patch({ file_type: e.target.value })}
              className="input-field"
            >
              {FILE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Description (optional)">
            <textarea
              value={form.description ?? ""}
              onChange={(e) => patch({ description: e.target.value })}
              rows={2}
              placeholder="What's in this download?"
              className="input-field resize-y"
            />
          </FormField>

          {/* File Upload */}
          <div>
            <p className="text-sm font-semibold text-ink mb-2">Upload Download File</p>
            <ResourceFileUploadButton
              currentUrl={form.file_url ?? undefined}
              currentPath={form.storage_path ?? undefined}
              currentFileName={form.file_name ?? undefined}
              currentFileSize={form.file_size ?? undefined}
              currentFileType={form.file_type ?? "PDF"}
              onSelect={handleFileUpload}
            />
          </div>

          {/* Or provide URL manually */}
          <FormField label="— or paste a direct file URL —">
            <input
              type="text"
              value={form.file_url ?? ""}
              onChange={(e) => patch({ file_url: e.target.value })}
              placeholder="https://..."
              className="input-field font-mono text-sm"
            />
          </FormField>

          <FormField
            label="Display Label (optional)"
            help="Override the button label. Defaults to title."
          >
            <input
              type="text"
              value={form.display_label ?? ""}
              onChange={(e) => patch({ display_label: e.target.value })}
              placeholder="Download Full Guide"
              className="input-field"
            />
          </FormField>

          <FormField
            label="Download Filename (optional)"
            help="Suggested filename when user downloads the file."
          >
            <input
              type="text"
              value={form.download_filename ?? ""}
              onChange={(e) => patch({ download_filename: e.target.value })}
              placeholder="jyot-gst-checklist.pdf"
              className="input-field font-mono text-sm"
            />
          </FormField>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active !== false}
              onChange={(e) => patch({ is_active: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm font-semibold text-ink">Visible to users</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-muted transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {form.id ? "Update File" : "Add File"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function moveItem<T>(arr: T[], index: number, dir: "up" | "down"): T[] {
  const newIndex = dir === "up" ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= arr.length) return arr;
  const next = [...arr];
  const a = next[index];
  const b = next[newIndex];
  if (a !== undefined && b !== undefined) {
    next[index] = b;
    next[newIndex] = a;
  }
  return next;
}

function FormField({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink">{label}</label>
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      {children}
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  return (
    <p
      className={`text-[0.65rem] text-right ${len > max ? "text-destructive" : "text-muted-foreground"}`}
    >
      {len}/{max}
    </p>
  );
}
