"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileText } from "lucide-react";
import { getDocumentLink, listDocuments, reviewDocument } from "@/lib/crm.functions";
import { DocStatusPill } from "@/components/admin/DocumentPanel";
import { EmptyState, ErrorState, Loading, Panel, formatDate } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: DocumentsPage,
});

const STATUSES = ["all", "uploaded", "under_review", "approved", "rejected"] as const;
const LABEL: Record<string, string> = {
  all: "All",
  uploaded: "Uploaded",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

function DocumentsPage() {
  const fetchDocs = useServerFn(listDocuments);
  const review = useServerFn(reviewDocument);
  const link = useServerFn(getDocumentLink);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("uploaded");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "documents", "queue", { status, page }],
    queryFn: () => fetchDocs({ data: { status, page, pageSize: 20 } } as any),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => review({ data: input } as any),
    onSuccess: () => {
      setRejecting(null);
      setReason("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  async function open(id: string) {
    setError(null);
    try {
      const { url } = await link({ data: { id } });
      window.open(url, "_blank", "noopener");
    } catch {
      setError("Could not open this document.");
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Document reviews</h1>
        {data ? (
          <span className="text-xs font-semibold text-muted-foreground">{data.total} total</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
              status === s
                ? "bg-primary text-primary-foreground"
                : "border border-border text-ink hover:bg-secondary"
            }`}
          >
            {LABEL[s]}
          </button>
        ))}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {isLoading ? <Loading label="Loading documents…" /> : null}
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
      ) : data && data.rows.length === 0 ? (
        <EmptyState title="Nothing to review here" />
      ) : null}

      {data && data.rows.length > 0 ? (
        <Panel className="p-0">
          <ul className="divide-y divide-border">
            {data.rows.map((d: any) => (
              <li key={d.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate font-semibold">{d.name}</span>
                  </span>
                  <DocStatusPill value={d.status} />
                </div>
                <p className="mt-1 text-[0.7rem] text-muted-foreground">
                  {Math.max(1, Math.round((d.size_bytes ?? 0) / 1024))} KB · uploaded{" "}
                  {formatDate(d.created_at)}
                  {d.uploaded_by_label ? ` · by ${d.uploaded_by_label}` : ""} ·{" "}
                  {d.customer_id ? (
                    <Link
                      to="/admin/customers/$id"
                      params={{ id: d.customer_id }}
                      className="hover:text-primary"
                    >
                      Customer
                    </Link>
                  ) : d.lead_id ? (
                    <Link
                      to="/admin/enquiries/$id"
                      params={{ id: d.lead_id }}
                      className="hover:text-primary"
                    >
                      Enquiry
                    </Link>
                  ) : (
                    "—"
                  )}
                </p>
                {d.status === "rejected" && d.rejection_reason ? (
                  <p className="mt-2 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                    Rejected: {d.rejection_reason}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => open(d.id)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
                  >
                    Open securely
                  </button>
                  {d.status !== "under_review" ? (
                    <button
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ id: d.id, status: "under_review" })}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60"
                    >
                      Mark under review
                    </button>
                  ) : null}
                  {d.status !== "approved" ? (
                    <button
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ id: d.id, status: "approved" })}
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
                    className="mt-2 flex flex-wrap gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (reason.trim().length < 3) {
                        setError("Please add a reason when rejecting a document.");
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
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason for rejection (team only)"
                      className="min-w-[220px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      disabled={mutation.isPending}
                      className="rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-60"
                    >
                      Save rejection
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {data && pages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}

      <p className="text-[0.7rem] text-muted-foreground">
        Documents stay in private storage. Access links expire after 5 minutes.
      </p>
    </div>
  );
}
