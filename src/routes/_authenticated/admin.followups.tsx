"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  CalendarClock,
  User,
  AlertCircle,
  Check,
  X as XIcon,
} from "lucide-react";
import { listFollowUps, updateFollowUp } from "@/lib/crm.functions";
import {
  EmptyState,
  ErrorState,
  Loading,
  Panel,
  PageHeader,
  formatDate,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/followups")({
  component: FollowUpsPage,
});

const SCOPES = [
  { key: "today", label: "Today's Schedule" },
  { key: "overdue", label: "Overdue" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All Records" },
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
    <div className="space-y-6">
      <PageHeader
        title="Client Follow-ups"
        description="Track scheduled callbacks, client outreach, and enquiry milestones."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <CalendarClock className="h-3.5 w-3.5" />
            {data ? `${data.total} Scheduled` : "Follow-ups"}
          </span>
        }
      />

      {/* Scope and Assignment Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3 shadow-2xs">
        <div className="flex flex-wrap gap-1.5">
          {SCOPES.map((s) => {
            const active = scope === s.key;
            return (
              <button
                key={s.key}
                onClick={() => {
                  setScope(s.key);
                  setPage(1);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-ink hover:bg-secondary"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setAssignment((a) => (a === "mine" ? "any" : "mine"));
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            assignment === "mine"
              ? "bg-ink text-background shadow-2xs"
              : "border border-border bg-background text-ink hover:bg-secondary"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          Assigned to me
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? <Loading label="Loading follow-up schedule…" /> : null}
      {isError ? (
        <ErrorState message="Could not load follow-ups." onRetry={() => refetch()} />
      ) : null}

      {data && data.rows.length === 0 ? (
        <EmptyState
          title="Nothing scheduled here"
          body="You're all caught up! No follow-up reminders found for this filter criteria."
        />
      ) : null}

      {data && data.rows.length > 0 ? (
        <Panel className="p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {data.rows.map((f: any) => {
              const isOverdue =
                f.status === "pending" && f.due_at && new Date(f.due_at).getTime() < Date.now();
              const isCompleted = f.status === "completed";

              return (
                <li
                  key={f.id}
                  className="flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-2xs ${
                        isOverdue
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
                          : isCompleted
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-primary/30 bg-primary/10 text-primary"
                      }`}
                    >
                      {isOverdue ? (
                        <Clock className="h-4 w-4" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-ink">
                          {formatDate(f.due_at)}
                        </p>
                        {isOverdue ? (
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-rose-700">
                            Overdue
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-amber-500/10 text-amber-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isCompleted ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {f.status}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {f.customer_id ? (
                          <Link
                            to="/admin/customers/$id"
                            params={{ id: f.customer_id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {f.customerName ?? "Customer Profile"}
                          </Link>
                        ) : f.lead_id ? (
                          <Link
                            to="/admin/enquiries/$id"
                            params={{ id: f.lead_id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {f.leadName ?? "Enquiry"} ({f.leadReference})
                          </Link>
                        ) : (
                          <span>General reminder</span>
                        )}
                        {f.notes ? (
                          <span className="text-ink font-medium"> · "{f.notes}"</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {f.status === "pending" ? (
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                      <button
                        disabled={update.isPending}
                        onClick={() => update.mutate({ id: f.id, status: "completed" })}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 disabled:opacity-60 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Complete
                      </button>
                      <button
                        disabled={update.isPending}
                        onClick={() => update.mutate({ id: f.id, status: "cancelled" })}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-60 transition"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold capitalize text-muted-foreground">
                      {f.status}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      {data && pages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50 hover:bg-secondary transition"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-muted-foreground">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50 hover:bg-secondary transition"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
