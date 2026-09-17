"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  Check,
  Download,
  ExternalLink,
  File,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { getDocumentLink, listDocuments, registerDocument, reviewDocument } from "@/lib/crm.functions";
import { fetchClientDocuments } from "@/lib/admin-client";
import { uploadLeadFile } from "@/lib/lead-uploads";
import {
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Panel,
  StatCard,
  formatDate,
} from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: DocumentsPage,
});

const STATUSES = ["all", "uploaded", "under_review", "approved", "rejected"] as const;
const LABEL: Record<string, string> = {
  all: "All Files",
  uploaded: "Uploaded",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ModernDocIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") {
    return <FileText className="h-5 w-5 text-rose-500" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
  }
  if (["doc", "docx", "txt", "rtf"].includes(ext)) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext)) {
    return <ImageIcon className="h-5 w-5 text-purple-500" />;
  }
  return <File className="h-5 w-5 text-slate-500" />;
}

function ModernDocStatusBadge({ value }: { value: string }) {
  const styles: Record<string, { bg: string; dot: string; label: string }> = {
    approved: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      dot: "bg-emerald-500",
      label: "Approved",
    },
    under_review: {
      bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      dot: "bg-amber-500 animate-pulse",
      label: "Under Review",
    },
    rejected: {
      bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
      dot: "bg-rose-500",
      label: "Rejected",
    },
    uploaded: {
      bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-400",
      label: "Uploaded",
    },
  };

  const fallback = {
    bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
    label: value || "Uploaded",
  };

  const current = styles[value] || fallback;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${current.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

function DocumentsPage() {
  const fetchDocs = useServerFn(listDocuments);
  const review = useServerFn(reviewDocument);
  const register = useServerFn(registerDocument);
  const getLink = useServerFn(getDocumentLink);
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [uploading, setUploading] = useState(false);

  // Active status query
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "documents", "queue", { status, page }],
    queryFn: async () => {
      try {
        const res = await fetchDocs({ data: { status, page, pageSize: 20 } } as any);
        if (res && Array.isArray(res.rows)) return res;
      } catch (err) {
        console.warn("[admin.documents] ServerFn failed, fallback to client:", err);
      }
      return await fetchClientDocuments({ status, page, pageSize: 20 });
    },
    placeholderData: keepPreviousData,
    retry: false,
  });

  // Overview query to compute real stats across all documents
  const overviewQuery = useQuery({
    queryKey: ["admin", "documents", "overview-stats"],
    queryFn: async () => {
      try {
        const res = await fetchDocs({ data: { status: "all", page: 1, pageSize: 500 } } as any);
        if (res && Array.isArray(res.rows)) return res;
      } catch (err) {
        // fallback
      }
      return await fetchClientDocuments({ status: "all", page: 1, pageSize: 500 });
    },
    staleTime: 30_000,
  });

  const allRows = Array.isArray(overviewQuery.data?.rows) ? overviewQuery.data.rows : [];
  const statTotal = overviewQuery.data?.total ?? data?.total ?? 0;
  const statApproved = allRows.filter((d: any) => d.status === "approved").length;
  const statUnderReview = allRows.filter(
    (d: any) => d.status === "under_review" || d.status === "uploaded",
  ).length;
  const statRejected = allRows.filter((d: any) => d.status === "rejected").length;

  const mutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => review({ data: input } as any),
    onSuccess: () => {
      setRejecting(null);
      setReason("");
      setError(null);
      toast.success("Document status updated");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => {
      setError(e.message);
      toast.error(e.message || "Failed to update status");
    },
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadLeadFile("team", file);
      await register({
        data: {
          name: uploaded.name,
          path: uploaded.path,
          sizeBytes: uploaded.size,
          mimeType: file.type || null,
        },
      } as any);
      toast.success(`"${file.name}" uploaded successfully.`);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload document.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function open(id: string) {
    setError(null);
    try {
      const { url } = await link({ data: { id } });
      window.open(url, "_blank", "noopener");
    } catch {
      setError("Could not open this document securely.");
      toast.error("Could not open this document.");
    }
  }

  const rows = data?.rows ?? [];
  const filteredRows = rows.filter((d: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesName = d.name?.toLowerCase().includes(term);
    const matchesUploader = d.uploaded_by_label?.toLowerCase().includes(term);
    const matchesCategory =
      (d.customer_id && "customer".includes(term)) || (d.lead_id && "enquiry".includes(term));
    return matchesName || matchesUploader || matchesCategory;
  });

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      {/* Hidden native file input for Upload Document */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        aria-hidden="true"
      />

      {/* 1. Header */}
      <PageHeader
        title="Documents"
        description="Manage and track uploaded documents, client files, and resources."
        actions={
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition disabled:opacity-60 active:scale-[0.98]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload Document</span>
              </>
            )}
          </button>
        }
      />

      {/* 2. Top Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Documents"
          value={statTotal}
          hint="All registered uploads"
          icon={FileText}
          accent="primary"
        />
        <StatCard
          label="Approved"
          value={statApproved}
          hint="Verified and signed off"
          icon={FileCheck2}
          accent="emerald"
        />
        <StatCard
          label="Under Review"
          value={statUnderReview}
          hint="Awaiting team review"
          icon={Loader2}
          accent="amber"
        />
        <StatCard
          label="Rejected"
          value={statRejected}
          hint="Flagged for correction"
          icon={X}
          accent="rose"
        />
      </div>

      {/* 3. Search and Status Filters */}
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  status === s
                    ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                    : "border border-border/80 bg-background text-muted-foreground hover:bg-secondary hover:text-ink"
                }`}
              >
                {LABEL[s]}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search file, category or uploader…"
              className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 py-1.5 text-xs text-ink outline-none focus:border-primary transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* Error display */}
      {error ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-xs text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">
            ×
          </button>
        </div>
      ) : null}

      {isLoading ? <Loading label="Loading document records…" /> : null}

      {isError ? (
        <ErrorState message="Could not load documents." onRetry={() => refetch()} />
      ) : null}

      {data?.notMigrated ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-ink">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
            <span>Database Table Setup Required</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            The <code className="font-semibold text-ink">public.documents</code> table is not yet
            created in your Supabase project. To enable document reviews, run the ready SQL script
            in your Supabase SQL Editor:
          </p>
          <code className="mt-2.5 block rounded-lg bg-background/80 p-2.5 font-mono text-xs text-primary border border-border">
            supabase/fix_tasks_and_documents.sql
          </code>
        </div>
      ) : data && filteredRows.length === 0 ? (
        <EmptyState
          title={searchTerm ? "No documents match your search" : "No documents in this queue"}
          body={
            searchTerm
              ? `No documents found for "${searchTerm}". Try a different name or clear the search.`
              : "Uploaded customer and enquiry files will appear here for review."
          }
        />
      ) : null}

      {/* 4. Modern Document Table */}
      {data && filteredRows.length > 0 ? (
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-border/80 bg-secondary/30 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">File Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Uploaded By</th>
                  <th className="px-4 py-3.5">Size</th>
                  <th className="px-4 py-3.5">Uploaded On</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRows.map((d: any) => (
                  <tr
                    key={d.id}
                    className="group transition-colors hover:bg-secondary/40"
                  >
                    {/* File Name + Icon */}
                    <td className="px-5 py-3.5 font-medium text-ink">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/60 border border-border/60">
                          {getFileIcon(d.name)}
                        </div>
                        <div className="min-w-0 max-w-xs sm:max-w-sm">
                          <button
                            type="button"
                            onClick={() => open(d.id)}
                            className="font-bold text-ink hover:text-primary transition-colors truncate block text-left"
                            title={d.name}
                          >
                            {d.name}
                          </button>
                          {d.status === "rejected" && d.rejection_reason && (
                            <p className="text-[0.68rem] text-destructive truncate mt-0.5">
                              Reason: {d.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category / Associated Record */}
                    <td className="px-4 py-3.5">
                      {d.customer_id ? (
                        <Link
                          to="/admin/customers/$id"
                          params={{ id: d.customer_id }}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[0.7rem] font-bold text-emerald-700 border border-emerald-200 hover:underline dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        >
                          Customer File
                        </Link>
                      ) : d.lead_id ? (
                        <Link
                          to="/admin/enquiries/$id"
                          params={{ id: d.lead_id }}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[0.7rem] font-bold text-blue-700 border border-blue-200 hover:underline dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                        >
                          Enquiry Upload
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Uploaded By */}
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {d.uploaded_by_label || "Team upload"}
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3.5 font-mono text-muted-foreground">
                      {Math.max(1, Math.round((d.size_bytes ?? 0) / 1024))} KB
                    </td>

                    {/* Uploaded On */}
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {formatDate(d.created_at)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      <ModernDocStatusBadge value={d.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => open(d.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-ink hover:bg-secondary transition shadow-2xs"
                          title="Preview document in new tab"
                        >
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          <span>Preview</span>
                        </button>

                        {d.status !== "approved" && (
                          <button
                            type="button"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ id: d.id, status: "approved" })}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                            title="Approve document"
                          >
                            <Check className="h-3 w-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        {d.status !== "under_review" && (
                          <button
                            type="button"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ id: d.id, status: "under_review" })}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-50"
                            title="Mark under review"
                          >
                            <span>Review</span>
                          </button>
                        )}

                        {d.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejecting(rejecting === d.id ? null : d.id);
                              setReason("");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition dark:hover:bg-rose-950/30"
                            title="Reject document"
                          >
                            <span>Reject</span>
                          </button>
                        )}
                      </div>

                      {/* Inline Rejection Reason Form */}
                      {rejecting === d.id && (
                        <form
                          className="mt-2.5 flex items-center justify-end gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (reason.trim().length < 3) {
                              toast.error("Please add a reason for rejection.");
                              return;
                            }
                            mutation.mutate({
                              id: d.id,
                              status: "rejected",
                              rejectionReason: reason.trim(),
                            });
                          }}
                        >
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Rejection reason (team only)"
                            className="w-56 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
                          />
                          <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="rounded-lg bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground disabled:opacity-60"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejecting(null)}
                            className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {/* 5. Pagination */}
      {data && pages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-xs font-semibold text-muted-foreground">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      ) : null}

      <p className="text-[0.7rem] text-muted-foreground text-center sm:text-left">
        Documents stay in private storage. Preview access links expire securely after 5 minutes.
      </p>
    </div>
  );
}
