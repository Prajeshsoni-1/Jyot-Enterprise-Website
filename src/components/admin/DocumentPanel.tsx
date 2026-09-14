"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import {
  getDocumentLink,
  listDocuments,
  registerDocument,
  reviewDocument,
  syncLeadDocuments,
} from "@/lib/crm.functions";
import { uploadLeadFile } from "@/lib/lead-uploads";
import { EmptyState, ErrorState, Loading, Panel, formatDate } from "@/components/admin/ui";

export const DOC_STATUS_LABEL: Record<string, string> = {
  uploaded: "Uploaded",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

const DOC_TONE: Record<string, string> = {
  uploaded: "bg-muted text-muted-foreground",
  under_review: "bg-amber-500/10 text-amber-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
};

export function DocStatusPill({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${
        DOC_TONE[value] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {DOC_STATUS_LABEL[value] ?? value}
    </span>
  );
}

function fileSize(bytes?: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Document review workflow over the EXISTING private `lead-uploads` bucket.
 * Files are never public; links are signed for 5 minutes on demand.
 */
export function DocumentPanel({ leadId, customerId }: { leadId?: string; customerId?: string }) {
  const queryClient = useQueryClient();
  const fetchDocs = useServerFn(listDocuments);
  const sync = useServerFn(syncLeadDocuments);
  const register = useServerFn(registerDocument);
  const review = useServerFn(reviewDocument);
  const link = useServerFn(getDocumentLink);
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const key = ["admin", "documents", leadId ?? null, customerId ?? null];
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (leadId) await sync({ data: { leadId } });
      return fetchDocs({
        data: { ...(leadId ? { leadId } : {}), ...(customerId ? { customerId } : {}) },
      } as any);
    },
    retry: false,
  });

  const reviewMutation = useMutation({
    mutationFn: (input: { id: string; status: string; rejectionReason?: string }) =>
      review({ data: input } as any),
    onSuccess: () => {
      setRejecting(null);
      setReason("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  async function onUpload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadLeadFile(customerId ? "customer" : "team", file);
      await register({
        data: {
          ...(leadId ? { leadId } : {}),
          ...(customerId ? { customerId } : {}),
          path: uploaded.path,
          name: uploaded.name,
          mimeType: file.type || undefined,
          sizeBytes: uploaded.size,
        },
      } as any);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload this document.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function open(id: string) {
    setError(null);
    try {
      const { url } = await link({ data: { id } });
      window.open(url, "_blank", "noopener");
    } catch {
      setError("Could not open this document.");
    }
  }

  return (
    <Panel
      title="Documents"
      action={
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary">
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Upload
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
        </label>
      }
    >
      {isLoading ? <Loading label="Loading documents…" /> : null}
      {isError ? (
        <ErrorState message="Could not load documents." onRetry={() => refetch()} />
      ) : null}
      {error ? <p className="mb-3 text-xs text-destructive">{error}</p> : null}

      {data && data.rows.length === 0 ? <EmptyState title="No documents yet" /> : null}

      {data && data.rows.length > 0 ? (
        <ul className="space-y-2.5">
          {data.rows.map((d: any) => (
            <li key={d.id} className="rounded-xl border border-border px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate font-medium">{d.name}</span>
                </span>
                <DocStatusPill value={d.status} />
              </div>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                {(d.mime_type as string) || (d.name.split(".").pop() ?? "file")} ·{" "}
                {fileSize(d.size_bytes)} · uploaded {formatDate(d.created_at)}
                {d.uploaded_by_label ? ` · by ${d.uploaded_by_label}` : ""}
              </p>
              {d.status === "rejected" && d.rejection_reason ? (
                <p className="mt-2 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                  Rejected: {d.rejection_reason}
                </p>
              ) : null}

              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  onClick={() => open(d.id)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
                >
                  Open securely
                </button>
                {d.status !== "under_review" ? (
                  <button
                    disabled={reviewMutation.isPending}
                    onClick={() => reviewMutation.mutate({ id: d.id, status: "under_review" })}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60"
                  >
                    Mark under review
                  </button>
                ) : null}
                {d.status !== "approved" ? (
                  <button
                    disabled={reviewMutation.isPending}
                    onClick={() => reviewMutation.mutate({ id: d.id, status: "approved" })}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    Approve
                  </button>
                ) : null}
                {d.status !== "rejected" ? (
                  <button
                    onClick={() => {
                      setRejecting(rejecting === d.id ? null : d.id);
                      setReason("");
                    }}
                    className="rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5"
                  >
                    Reject
                  </button>
                ) : null}
              </div>

              {rejecting === d.id ? (
                <form
                  className="mt-2.5 flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (reason.trim().length < 3) {
                      setError("Please add a reason when rejecting a document.");
                      return;
                    }
                    reviewMutation.mutate({
                      id: d.id,
                      status: "rejected",
                      rejectionReason: reason.trim(),
                    });
                  }}
                >
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejection (team only)"
                    className="min-w-[220px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    disabled={reviewMutation.isPending}
                    className="rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-60"
                  >
                    Save rejection
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-[0.7rem] text-muted-foreground">
        Documents stay private. Links expire after 5 minutes. Maximum 10 MB per file.
      </p>
    </Panel>
  );
}
