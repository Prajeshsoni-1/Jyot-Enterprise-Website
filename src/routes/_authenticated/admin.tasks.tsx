"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { listTasks, updateTask } from "@/lib/crm.functions";
import {
  EmptyState,
  ErrorState,
  Loading,
  Panel,
  PageHeader,
  PriorityPill,
  formatDate,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const fetchTasks = useServerFn(listTasks);
  const save = useServerFn(updateTask);
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"open" | "completed" | "all">("open");
  const [assignment, setAssignment] = useState<"any" | "mine">("any");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "tasks", { scope, assignment, page }],
    queryFn: () => fetchTasks({ data: { scope, assignment, page, pageSize: 20 } } as any),
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
        title="Operational Tasks"
        description="Internal assignments, operational deliverables, and lead action items."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <CheckSquare className="h-3.5 w-3.5" />
            {data ? `${data.total} Tasks` : "Task Hub"}
          </span>
        }
      />

      {/* Scope and Assignment Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3 shadow-2xs">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: "open", label: "Open Tasks" },
              { key: "completed", label: "Completed" },
              { key: "all", label: "All Tasks" },
            ] as const
          ).map((s) => {
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

      {isLoading ? <Loading label="Loading operational tasks…" /> : null}
      {isError ? <ErrorState message="Could not load tasks." onRetry={() => refetch()} /> : null}

      {data?.notMigrated ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-ink">
          <div className="flex items-center gap-2 font-bold text-amber-700">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Database Table Setup Required</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            The <code className="font-semibold text-ink">public.tasks</code> table is not yet
            created in your Supabase project. To enable task tracking, execute the ready SQL script in
            your Supabase SQL Editor:
          </p>
          <code className="mt-2.5 block rounded-lg bg-background/80 p-2.5 font-mono text-xs text-primary border border-border">
            supabase/fix_tasks_and_documents.sql
          </code>
        </div>
      ) : data && data.rows.length === 0 ? (
        <EmptyState
          title="No tasks found"
          body="All clear! You can assign tasks directly from any enquiry or customer profile page."
        />
      ) : null}

      {data && data.rows.length > 0 ? (
        <Panel className="p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {data.rows.map((t: any) => {
              const isCompleted = t.status === "completed";
              const isOverdue =
                !isCompleted && t.due_at && new Date(t.due_at).getTime() < Date.now();

              return (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30"
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate({
                          id: t.id,
                          status: isCompleted ? "open" : "completed",
                        })
                      }
                      className={`mt-0.5 grid h-6 w-6 place-items-center rounded-lg border transition ${
                        isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border bg-background hover:border-primary text-transparent"
                      }`}
                      title={isCompleted ? "Mark as open" : "Mark as completed"}
                    >
                      <CheckCircle2 className="h-4 w-4 fill-current" />
                    </button>

                    <div className="min-w-0 space-y-1">
                      <p
                        className={`text-sm font-bold ${
                          isCompleted ? "text-muted-foreground line-through" : "text-ink"
                        }`}
                      >
                        {t.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {t.due_at ? (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isOverdue ? "font-semibold text-rose-600" : ""
                            }`}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Due {formatDate(t.due_at)}
                            {isOverdue ? " (Overdue)" : ""}
                          </span>
                        ) : (
                          <span>No due date</span>
                        )}

                        <span>·</span>

                        {t.customer_id ? (
                          <Link
                            to="/admin/customers/$id"
                            params={{ id: t.customer_id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {t.customerName ?? "Customer Profile"}
                          </Link>
                        ) : t.lead_id ? (
                          <Link
                            to="/admin/enquiries/$id"
                            params={{ id: t.lead_id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {t.leadName ?? "Enquiry"}
                          </Link>
                        ) : (
                          <span>Internal Workflow</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
                    <PriorityPill value={t.priority} />

                    {t.status === "open" ? (
                      <button
                        disabled={update.isPending}
                        onClick={() => update.mutate({ id: t.id, status: "completed" })}
                        className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 disabled:opacity-60 transition"
                      >
                        Complete
                      </button>
                    ) : (
                      <button
                        disabled={update.isPending}
                        onClick={() => update.mutate({ id: t.id, status: "open" })}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60 transition"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reopen
                      </button>
                    )}
                  </div>
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
