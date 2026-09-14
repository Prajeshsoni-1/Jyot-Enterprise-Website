"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listFollowUps, updateFollowUp } from "@/lib/crm.functions";
import { EmptyState, ErrorState, Loading, Panel, formatDate } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/followups")({
  component: FollowUpsPage,
});

const SCOPES = [
  { key: "today", label: "Today" },
  { key: "overdue", label: "Overdue" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
] as const;

function FollowUpsPage() {
  const fetchFollowUps = useServerFn(listFollowUps);
  const save = useServerFn(updateFollowUp);
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<(typeof SCOPES)[number]["key"]>("today");
  const [assignment, setAssignment] = useState<"any" | "mine">("any");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "followups", { scope, assignment, page }],
    queryFn: () => fetchFollowUps({ data: { scope, assignment, page, pageSize: 20 } } as any),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const update = useMutation({
    mutationFn: (input: Record<string, unknown>) => save({ data: input } as any),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Follow-ups</h1>
        {data ? (
          <span className="text-xs font-semibold text-muted-foreground">{data.total} total</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setScope(s.key);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
              scope === s.key
                ? "bg-primary text-primary-foreground"
                : "border border-border text-ink hover:bg-secondary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => {
            setAssignment((a) => (a === "mine" ? "any" : "mine"));
            setPage(1);
          }}
          className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
            assignment === "mine"
              ? "bg-ink text-background"
              : "border border-border text-ink hover:bg-secondary"
          }`}
        >
          Assigned to me
        </button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {isLoading ? <Loading label="Loading follow-ups…" /> : null}
      {isError ? (
        <ErrorState message="Could not load follow-ups." onRetry={() => refetch()} />
      ) : null}
      {data && data.rows.length === 0 ? <EmptyState title="Nothing scheduled here" /> : null}

      {data && data.rows.length > 0 ? (
        <Panel className="p-0">
          <ul className="divide-y divide-border">
            {data.rows.map((f: any) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{formatDate(f.due_at)}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.customer_id ? (
                      <Link
                        to="/admin/customers/$id"
                        params={{ id: f.customer_id }}
                        className="hover:text-primary"
                      >
                        {f.customerName ?? "Customer"}
                      </Link>
                    ) : f.lead_id ? (
                      <Link
                        to="/admin/enquiries/$id"
                        params={{ id: f.lead_id }}
                        className="hover:text-primary"
                      >
                        {f.leadName ?? "Enquiry"} ({f.leadReference})
                      </Link>
                    ) : (
                      "—"
                    )}
                    {f.notes ? ` · ${f.notes}` : ""}
                  </p>
                </div>
                {f.status === "pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: f.id, status: "completed" })}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Complete
                    </button>
                    <button
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: f.id, status: "cancelled" })}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold capitalize text-muted-foreground">
                    {f.status}
                  </span>
                )}
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
    </div>
  );
}
