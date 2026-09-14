"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Images,
  Trash2,
  Upload,
  FileText,
  ExternalLink,
  Download,
  Plus,
  X,
  HardDrive,
  FolderTree,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  Edit3,
} from "lucide-react";
import { mediaDelete, mediaList, mediaRegister, mediaUsage } from "@/lib/settings.functions";
import { cmsList, cmsAction, cmsSave } from "@/lib/cms.functions";
import { slugify, type CmsRow } from "@/lib/cms-schema";
import { uploadMedia } from "@/components/admin/MediaPicker";
import { PdfUploadButton, type PdfUploadResult } from "@/components/admin/PdfUploadButton";
import { EmptyState, ErrorState, Loading, formatDate } from "@/components/admin/ui";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/website/media")({
  head: () => ({
    meta: pageMeta({
      title: "Media & Document Library — Jyot Enterprise",
      description: "Website images and PDF documents stored centrally in Supabase Storage.",
      path: "/admin/website/media",
      noindex: true,
    }),
  }),
  component: MediaPage,
});

function size(bytes: number | null) {
  if (!bytes) return "—";
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

const DOCUMENT_CATEGORIES = [
  "IT Services",
  "Brochures",
  "Case Studies",
  "Resources",
] as const;

function MediaPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Media server functions
  const list = useServerFn(mediaList);
  const register = useServerFn(mediaRegister);
  const usage = useServerFn(mediaUsage);
  const remove = useServerFn(mediaDelete);

  // CMS functions for downloads
  const listDownloads = useServerFn(cmsList);
  const actDownloads = useServerFn(cmsAction);
  const saveDownload = useServerFn(cmsSave);

  // Active Tab: "images" or "documents"
  const [activeTab, setActiveTab] = useState<"images" | "documents">("images");

  // Common filters & states
  const [search, setSearch] = useState("");
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Image upload ref
  const fileRef = useRef<HTMLInputElement>(null);

  // Document Upload Modal / Inline state
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<string>("IT Services");
  const [newDocSummary, setNewDocSummary] = useState("");
  const [uploadedPdfResult, setUploadedPdfResult] = useState<PdfUploadResult | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);

  // Query Images
  const imageQuery = useQuery({
    queryKey: ["cms", "media", search],
    queryFn: () => list({ data: { search } }),
  });

  // Query Documents / Downloads
  const docQuery = useQuery({
    queryKey: ["cms", "downloads_media", search],
    queryFn: () => listDownloads({ data: { module: "downloads", search, status: "all" } }),
  });

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await uploadMedia(file, register);
      setNotice("Image uploaded successfully.");
      await imageQuery.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function delImage(id: string, name: string) {
    setError(null);
    setNotice(null);
    try {
      const { used } = await usage({ data: { id } });
      if (used.length) {
        const ok = window.confirm(
          `“${name}” is still used by:\n\n${used.join("\n")}\n\nDelete it anyway? Those places will show a missing image.`,
        );
        if (!ok) return;
        await remove({ data: { id, confirmUsed: true } });
      } else {
        if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
        await remove({ data: { id, confirmUsed: false } });
      }
      setNotice("Image deleted.");
      await imageQuery.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this image.");
    }
  }

  async function togglePublishDoc(doc: CmsRow) {
    setError(null);
    setNotice(null);
    try {
      const action = doc.status === "published" ? "unpublish" : "publish";
      await actDownloads({ data: { module: "downloads", id: doc.id, action } });
      await docQuery.refetch();
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setNotice(
        action === "publish"
          ? `“${doc.title}” is now published live on the website.`
          : `“${doc.title}” unpublished and moved to draft.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update document status.");
    }
  }

  async function deleteDoc(doc: CmsRow) {
    if (!window.confirm(`Delete document “${doc.title}”? This removes it from the website.`)) return;
    setError(null);
    setNotice(null);
    try {
      await actDownloads({ data: { module: "downloads", id: doc.id, action: "delete" } });
      await docQuery.refetch();
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setNotice(`Document “${doc.title}” deleted successfully.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete document.");
    }
  }

  async function handleSaveNewDoc(publishImmediately: boolean) {
    if (!uploadedPdfResult) {
      setError("Please select and upload a valid PDF document first.");
      return;
    }
    const title = newDocTitle.trim() || uploadedPdfResult.fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    const slug = slugify(title);

    setSavingDoc(true);
    setError(null);
    setNotice(null);

    try {
      await saveDownload({
        data: {
          module: "downloads",
          status: publishImmediately ? "published" : "draft",
          values: {
            title,
            slug,
            category: newDocCategory,
            summary: newDocSummary.trim(),
            file_url: uploadedPdfResult.url,
            storage_path: uploadedPdfResult.storagePath,
            file_name: uploadedPdfResult.fileName,
            file_size: uploadedPdfResult.fileSize,
            file_type: uploadedPdfResult.mimeType,
            cta_label: "Download",
          },
        },
      });

      await docQuery.refetch();
      await queryClient.invalidateQueries({ queryKey: ["cms"] });

      setNotice(
        publishImmediately
          ? `“${title}” saved and published live on the website!`
          : `“${title}” saved as draft.`,
      );

      // Reset form
      setShowUploadDoc(false);
      setNewDocTitle("");
      setNewDocSummary("");
      setUploadedPdfResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save document.");
    } finally {
      setSavingDoc(false);
    }
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  const imageRows = imageQuery.data?.rows ?? [];
  const docRows = (docQuery.data?.rows ?? []) as CmsRow[];
  const canEdit = imageQuery.data?.canEdit ?? docQuery.data?.canEdit ?? true;

  const filteredDocs = docRows.filter((doc) => {
    if (docCategoryFilter === "all") return true;
    return (doc.category || "").toLowerCase() === docCategoryFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/admin/website"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Website Management
          </Link>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold text-ink">
            {activeTab === "images" ? (
              <>
                <Images className="h-6 w-6 text-primary" /> Media & Images
              </>
            ) : (
              <>
                <FileText className="h-6 w-6 text-primary" /> PDF & Document Storage
              </>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "images"
              ? "Website images stored in Supabase Storage ('site-media')."
              : "Centralized PDF documents stored in Supabase Storage ('jyot-enterprise')."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-2xl border border-border bg-secondary/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "images"
                ? "bg-background text-ink shadow-xs"
                : "text-muted-foreground hover:text-ink"
            }`}
          >
            <Images className="h-3.5 w-3.5" />
            <span>Images</span>
            <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.2 text-[0.65rem]">
              {imageRows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "documents"
                ? "bg-background text-ink shadow-xs"
                : "text-muted-foreground hover:text-ink"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Documents & PDFs</span>
            <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.2 text-[0.65rem]">
              {docRows.length}
            </span>
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "images" ? "Search images…" : "Search documents…"}
            aria-label="Search"
            className="w-64 rounded-full border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary transition"
          />

          {activeTab === "documents" ? (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setDocCategoryFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  docCategoryFilter === "all"
                    ? "bg-ink text-background"
                    : "border border-border bg-background text-muted-foreground hover:bg-secondary"
                }`}
              >
                All Categories
              </button>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDocCategoryFilter(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                    docCategoryFilter === cat
                      ? "bg-ink text-background"
                      : "border border-border bg-background text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {canEdit ? (
          <div>
            {activeTab === "images" ? (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload Image"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={(e) => void uploadImage(e.target.files?.[0])}
                />
              </>
            ) : (
              <button
                onClick={() => setShowUploadDoc(!showUploadDoc)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground cursor-pointer shadow-xs hover:bg-primary/90 transition"
              >
                {showUploadDoc ? (
                  <>
                    <X className="h-3.5 w-3.5" /> Close Form
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Upload New PDF Document
                  </>
                )}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {notice ? (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      {/* Upload Document Panel */}
      {showUploadDoc && activeTab === "documents" ? (
        <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Upload New PDF to Supabase Storage
              </h2>
              <p className="text-xs text-muted-foreground">
                Documents are stored in dedicated bucket <code className="font-mono text-primary font-bold">jyot-enterprise</code> organized by category folder.
              </p>
            </div>
            <button
              onClick={() => setShowUploadDoc(false)}
              className="rounded-full p-1 text-muted-foreground hover:text-ink hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-ink">Category *</label>
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-primary"
              >
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink">Document Title</label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="e.g. IT Services — Frequently Asked Questions"
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-ink">Description / Summary</label>
              <textarea
                rows={2}
                value={newDocSummary}
                onChange={(e) => setNewDocSummary(e.target.value)}
                placeholder="Brief summary of what this document contains..."
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-ink mb-1.5 block">Select PDF Document *</label>
              <PdfUploadButton
                category={newDocCategory}
                currentUrl={uploadedPdfResult?.url}
                currentPath={uploadedPdfResult?.storagePath}
                currentFileName={uploadedPdfResult?.fileName}
                currentFileSize={uploadedPdfResult?.fileSize}
                onSelect={(res) => {
                  setUploadedPdfResult(res);
                  if (!newDocTitle) {
                    setNewDocTitle(res.fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setShowUploadDoc(false)}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!uploadedPdfResult || savingDoc}
              onClick={() => void handleSaveNewDoc(false)}
              className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-ink hover:bg-secondary disabled:opacity-50 cursor-pointer"
            >
              {savingDoc ? "Saving…" : "Save as Draft"}
            </button>
            <button
              type="button"
              disabled={!uploadedPdfResult || savingDoc}
              onClick={() => void handleSaveNewDoc(true)}
              className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {savingDoc ? "Publishing…" : "Save & Publish Live"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Content views */}
      {activeTab === "images" ? (
        imageQuery.isLoading ? (
          <Loading label="Loading images…" />
        ) : imageRows.length ? (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {imageRows.map((row) => (
              <div
                key={row.id}
                className="overflow-hidden rounded-2xl border border-border bg-background shadow-xs hover:border-primary/40 transition"
              >
                <img
                  src={row.url}
                  alt={row.name}
                  className="h-32 w-full object-cover"
                  loading="lazy"
                />
                <div className="space-y-1 p-3">
                  <p className="truncate text-xs font-semibold text-ink">{row.name}</p>
                  <p className="text-[0.68rem] text-muted-foreground">
                    {row.mime_type ?? "image"} · {size(row.size_bytes)} · {formatDate(row.created_at)}
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => handleCopy(row.url)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[0.68rem] font-semibold text-muted-foreground hover:text-ink cursor-pointer"
                    >
                      {copiedUrl === row.url ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy link
                        </>
                      )}
                    </button>
                    {canEdit ? (
                      <button
                        onClick={() => void delImage(row.id, row.name)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[0.68rem] font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No images yet"
            body="Upload an image to use it anywhere in the website content."
          />
        )
      ) : docQuery.isLoading ? (
        <Loading label="Loading document storage…" />
      ) : filteredDocs.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const data: any = doc.data ?? {};
            const storagePath = (doc.file_path || data.storage_path || "") as string;
            const fileSize = (data.file_size || doc.file_size) as number | undefined;
            const fileUrl = (doc.file_url || (storagePath ? `https://xmveofqeunsqzyxhakyj.supabase.co/storage/v1/object/public/jyot-enterprise/${storagePath}` : `/api/downloads/${doc.slug}.pdf`)) as string;
            const isPublished = doc.status === "published";

            return (
              <div
                key={doc.id}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                      {doc.category || "Document"}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                        isPublished
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-base font-bold text-ink leading-snug">
                    {doc.title}
                  </h3>

                  {doc.summary ? (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {doc.summary}
                    </p>
                  ) : null}

                  {/* Supabase Storage metadata */}
                  <div className="mt-4 space-y-1.5 rounded-2xl bg-secondary/50 p-3 text-[0.7rem] text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-mono">
                      <HardDrive className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-ink">Bucket:</span> jyot-enterprise
                    </div>
                    {storagePath ? (
                      <div className="flex items-center gap-1.5 font-mono truncate" title={storagePath}>
                        <FolderTree className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{storagePath}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between text-[0.68rem] pt-1 border-t border-border/60">
                      <span>Size: {size(fileSize ?? null)}</span>
                      <span>Updated: {formatDate(doc.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Document Actions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      title="Preview / Open PDF"
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-ink hover:border-primary hover:text-primary transition"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Preview</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(fileUrl)}
                      title="Copy public CDN URL"
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-ink transition cursor-pointer"
                    >
                      {copiedUrl === fileUrl ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {canEdit ? (
                    <div className="flex items-center gap-1">
                      <Link
                        to="/admin/website/$module/$id"
                        params={{ module: "downloads", id: doc.id }}
                        title="Edit metadata & replace file"
                        className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => void togglePublishDoc(doc)}
                        title={isPublished ? "Unpublish document" : "Publish document live"}
                        className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink hover:bg-secondary transition cursor-pointer"
                      >
                        {isPublished ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteDoc(doc)}
                        title="Delete document"
                        className="rounded-full border border-border p-1.5 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No documents found"
          body="Upload your first PDF document to Supabase Storage using the button above."
        />
      )}
    </div>
  );
}
