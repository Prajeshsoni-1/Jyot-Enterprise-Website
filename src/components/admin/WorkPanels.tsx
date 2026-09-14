"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, CheckCircle2, Loader2 } from "lucide-react";
import { createFollowUp, createTask, updateFollowUp, updateTask } from "@/lib/crm.functions";
import { EmptyState, Panel, PriorityPill, formatDate } from "@/components/admin/ui";

type Subject = { leadId?: string; customerId?: string };

const FOLLOW_TONE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-muted text-muted-foreground",
};

export function FollowUpPanel({
  subject,
  rows,
  team,
}: {
  subject: Subject;
  rows: any[];
  team: Array<{ id: string; name: string }>;
}) {
  const queryClient = useQueryClient();
  const create = useServerFn(createFollowUp);
  const update = useServerFn(updateFollowUp);
  const [dueAt, setDueAt] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const createMutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          ...subject,
          dueAt,
          assignedTo: assignedTo || null,
          notes: notes.trim() || undefined,
        },
      } as any),
    onSuccess: () => {
      setDueAt("");
      setNotes("");
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => update({ data: input } as any),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Panel title="Follow-ups">
      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!dueAt) {
            setError("Choose a date and time for the follow-up.");
            return;
          }
          createMutation.mutate();
        }}
      >
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          aria-label="Follow-up date and time"
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          aria-label="Assign follow-up"
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Unassigned</option>
          {team.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          disabled={createMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CalendarClock className="h-3.5 w-3.5" />
          )}
          Add
        </button>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Follow-up notes (team only)…"
          className="sm:col-span-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </form>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState title="No follow-ups scheduled" />
        ) : (
          <ul className="space-y-2.5">
            {rows.map((f: any) => {
              const overdue = f.status === "pending" && new Date(f.due_at).getTime() < Date.now();
              return (
                <li key={f.id} className="rounded-xl border border-border px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{formatDate(f.due_at)}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${
                        overdue ? "bg-destructive/10 text-destructive" : FOLLOW_TONE[f.status]
                      }`}
                    >
                      {overdue
                        ? "Overdue"
                        : f.status === "pending"
                          ? "Pending"
                          : f.status === "completed"
                            ? "Completed"
                            : "Cancelled"}
                    </span>
                  </div>
                  {f.notes ? <p className="mt-1 text-xs text-muted-foreground">{f.notes}</p> : null}
                  {f.status === "pending" ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: f.id, status: "completed" })}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                      </button>
                      <button
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: f.id, status: "cancelled" })}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <input
                        type="datetime-local"
                        aria-label="Reschedule follow-up"
                        onChange={(e) =>
                          e.target.value &&
                          updateMutation.mutate({ id: f.id, dueAt: e.target.value })
                        }
                        className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}

export function TaskPanel({
  subject,
  rows,
  team,
}: {
  subject: Subject;
  rows: any[];
  team: Array<{ id: string; name: string }>;
}) {
  const queryClient = useQueryClient();
  const create = useServerFn(createTask);
  const update = useServerFn(updateTask);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const createMutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          ...subject,
          title: title.trim(),
          assignedTo: assignedTo || null,
          dueAt: dueAt || null,
          priority,
        },
      } as any),
    onSuccess: () => {
      setTitle("");
      setDueAt("");
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => update({ data: input } as any),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Panel title="Internal tasks">
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim().length < 2) {
            setError("Give the task a short title.");
            return;
          }
          createMutation.mutate();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          aria-label="Task title"
          className="sm:col-span-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          aria-label="Assign task"
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Unassigned</option>
          {team.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as typeof priority)}
          aria-label="Task priority"
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <input
          type="date"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          aria-label="Task due date"
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          disabled={createMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Add task
        </button>
      </form>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState title="No tasks yet" />
        ) : (
          <ul className="space-y-2.5">
            {rows.map((t: any) => (
              <li key={t.id} className="rounded-xl border border-border px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      t.status === "completed" ? "text-muted-foreground line-through" : "text-ink"
                    }`}
                  >
                    {t.title}
                  </span>
                  <PriorityPill value={t.priority} />
                </div>
                <p className="mt-1 text-[0.7rem] text-muted-foreground">
                  {t.due_at ? `Due ${formatDate(t.due_at)}` : "No due date"} ·{" "}
                  {t.status === "completed"
                    ? "Completed"
                    : t.status === "open"
                      ? "Open"
                      : "Cancelled"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {t.status === "open" ? (
                    <button
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: t.id, status: "completed" })}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Mark complete
                    </button>
                  ) : (
                    <button
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: t.id, status: "open" })}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
