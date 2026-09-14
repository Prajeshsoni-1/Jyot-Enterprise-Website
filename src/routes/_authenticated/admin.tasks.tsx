"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listTasks, updateTask } from "@/lib/crm.functions";
import {
  EmptyState,
  ErrorState,
  Loading,
  Panel,
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Internal tasks</h1>
        {data ? (
          <span className="text-xs font-semibold text-muted-foreground">{data.total} total</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["open", "completed", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setScope(s);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold capitalize ${
              scope === s
                ? "bg-primary text-primary-foreground"
                : "border border-border text-ink hover:bg-secondary"
            }`}
          >
            {s}
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
      {isLoading ? <Loading label="Loading tasks…" /> : null}
      {isError ? <ErrorState message="Could not load tasks." onRetry={() => refetch()} /> : null}
      {data?.notMigrated ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-ink">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
            <span>Database Table Setup Required</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            The <code className="font-semibold text-ink">public.tasks</code> table is not yet
            created in your Supabase project. To enable task tracking, run the ready SQL script in
            your Supabase SQL Editor:
          </p>
          <code className="mt-2.5 block rounded-lg bg-background/80 p-2.5 font-mono text-xs text-primary border border-border">
            supabase/fix_tasks_and_documents.sql
          </code>
        </div>
      ) : data && data.rows.length === 0 ? (
        <EmptyState title="No tasks here" body="Create tasks from an enquiry or customer page." />
      ) : null}

      {data && data.rows.length > 0 ? (
        <Panel className="p-0">
          <ul className="divide-y divide-border">
            {data.rows.map((t: any) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      t.status === "completed" ? "text-muted-foreground line-through" : "text-ink"
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.due_at ? `Due ${formatDate(t.due_at)}` : "No due date"} ·{" "}
                    {t.customer_id ? (
                      <Link
                        to="/admin/customers/$id"
                        params={{ id: t.customer_id }}
                        className="hover:text-primary"
                      >
                        {t.customerName ?? "Customer"}
                      </Link>
                    ) : t.lead_id ? (
                      <Link
                        to="/admin/enquiries/$id"
                        params={{ id: t.lead_id }}
                        className="hover:text-primary"
                      >
                        {t.leadName ?? "Enquiry"}
                      </Link>
                    ) : (
                      "Internal"
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityPill value={t.priority} />
                  {t.status === "open" ? (
                    <button
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: t.id, status: "completed" })}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Complete
                    </button>
                  ) : (
                    <button
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: t.id, status: "open" })}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60"
                    >
                      Reopen
                    </button>
                  )}
                </div>
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
