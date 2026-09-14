"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getCustomer, updateCustomer } from "@/lib/crm.functions";
import { addEnquiryNote, listTeam } from "@/lib/admin.functions";
import { DocumentPanel } from "@/components/admin/DocumentPanel";
import { FollowUpPanel, TaskPanel } from "@/components/admin/WorkPanels";
import {
  DIVISION_LABEL,
  EmptyState,
  ErrorState,
  Loading,
  Panel,
  PriorityPill,
  StatusPill,
  formatDate,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/customers/$id")({
  component: CustomerDetail,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="max-w-[65%] text-right text-sm text-ink">{value ?? "—"}</span>
    </div>
  );
}

function CustomerDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchCustomer = useServerFn(getCustomer);
  const saveCustomer = useServerFn(updateCustomer);
  const fetchTeam = useServerFn(listTeam);
  const saveNote = useServerFn(addEnquiryNote);

  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: () => fetchCustomer({ data: { id } }),
    retry: false,
  });
  const { data: team } = useQuery({
    queryKey: ["admin", "team"],
    queryFn: () => fetchTeam({ data: undefined }),
    retry: false,
  });

  const update = useMutation({
    mutationFn: (patch: Record<string, unknown>) => saveCustomer({ data: { id, ...patch } } as any),
    onSuccess: () => {
      setEditing(false);
      setFeedback({ tone: "ok", text: "Customer saved." });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setFeedback({ tone: "error", text: e.message }),
  });

  const noteMutation = useMutation({
    mutationFn: (input: { leadId: string; text: string }) =>
      saveNote({ data: { id: input.leadId, note: input.text } }),
    onSuccess: () => {
      setNote("");
      setFeedback({ tone: "ok", text: "Note added." });
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", id] });
    },
    onError: (e: Error) => setFeedback({ tone: "error", text: e.message }),
  });

  if (isLoading) return <Loading label="Loading customer…" />;
  if (isError)
    return <ErrorState message="Could not load this customer." onRetry={() => refetch()} />;
  if (!data) return <EmptyState title="Customer not found" />;

  const c = data.customer as any;
  const teamList = (team ?? []).map((t: any) => ({ id: t.id, name: t.name }));
  const teamName = (uid: string | null) =>
    uid ? ((team ?? []).find((t: any) => t.id === uid)?.name ?? "Team member") : "—";
  const primaryLeadId = (data.leads[0] as any)?.id ?? null;

  return (
    <div className="space-y-5">
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to customers
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{c.name}</h1>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.7rem] font-semibold capitalize text-ink">
          {String(c.status).replace("_", " ")}
        </span>
      </div>

      {feedback ? (
        <p
          role="status"
          className={
            feedback.tone === "ok"
              ? "rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700"
              : "rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          }
        >
          {feedback.text}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Panel
            title="Customer details"
            action={
              <button
                onClick={() => setEditing((v) => !v)}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
              >
                {editing ? "Cancel" : "Edit"}
              </button>
            }
          >
            {editing ? (
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  update.mutate({
                    name: String(form.get("name") ?? "").trim(),
                    email: String(form.get("email") ?? "").trim() || null,
                    phone: String(form.get("phone") ?? "").trim() || null,
                    company: String(form.get("company") ?? "").trim() || null,
                    city: String(form.get("city") ?? "").trim() || null,
                    address: String(form.get("address") ?? "").trim() || null,
                    status: String(form.get("status") ?? "active"),
                  });
                }}
              >
                {[
                  ["name", "Name", c.name],
                  ["email", "Email", c.email],
                  ["phone", "Phone", c.phone],
                  ["company", "Company", c.company],
                  ["city", "City", c.city],
                ].map(([field, label, value]) => (
                  <label key={String(field)} className="block">
                    <span className="text-xs font-semibold text-ink">{label}</span>
                    <input
                      name={String(field)}
                      defaultValue={(value as string) ?? ""}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="text-xs font-semibold text-ink">Status</span>
                  <select
                    name="status"
                    defaultValue={c.status}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On hold</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-ink">Address</span>
                  <textarea
                    name="address"
                    rows={2}
                    defaultValue={c.address ?? ""}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </label>
                <button
                  disabled={update.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Save customer
                </button>
              </form>
            ) : (
              <>
                <Row label="Email" value={c.email} />
                <Row label="Phone" value={c.phone} />
                <Row label="Company" value={c.company} />
                <Row label="City" value={c.city} />
                <Row label="Address" value={c.address} />
                <Row
                  label="Department"
                  value={c.division ? (DIVISION_LABEL[c.division] ?? c.division) : null}
                />
                <Row label="Created" value={formatDate(c.created_at)} />
                <Row label="Last updated" value={formatDate(c.updated_at)} />
              </>
            )}
          </Panel>

          <Panel title="Related enquiries">
            {data.leads.length === 0 ? (
              <EmptyState title="No linked enquiries" />
            ) : (
              <ul className="space-y-2">
                {data.leads.map((l: any) => (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5"
                  >
                    <Link
                      to="/admin/enquiries/$id"
                      params={{ id: l.id }}
                      className="text-sm font-semibold text-ink hover:text-primary"
                    >
                      {l.reference} · {l.service ?? "General enquiry"}
                    </Link>
                    <span className="flex items-center gap-2">
                      <StatusPill value={l.status} />
                      <PriorityPill value={l.priority} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Appointments">
            {data.bookings.length === 0 ? (
              <EmptyState title="No appointments booked" />
            ) : (
              <ul className="space-y-2">
                {data.bookings.map((b: any) => (
                  <li
                    key={b.leadId}
                    className="rounded-xl border border-border px-3 py-2.5 text-sm"
                  >
                    <span className="font-semibold text-ink">{b.date}</span>{" "}
                    <span className="text-muted-foreground">
                      · {b.service ?? "Consultation"}
                      {b.contactMethod ? ` · ${b.contactMethod}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <DocumentPanel customerId={id} />

          <Panel title="Activity history">
            {data.activity.length === 0 ? (
              <EmptyState title="No activity recorded yet" />
            ) : (
              <ul className="space-y-2.5">
                {data.activity.map((a: any) => (
                  <li key={a.id} className="text-xs text-muted-foreground">
                    <span className="font-semibold text-ink">{a.action.replace(/_/g, " ")}</span>
                    {a.detail?.from !== undefined
                      ? ` ${String(a.detail.from ?? "—")} → ${String(a.detail.to ?? "—")}`
                      : ""}{" "}
                    · {formatDate(a.created_at)} · {teamName(a.actor_id)}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <FollowUpPanel subject={{ customerId: id }} rows={data.followUps} team={teamList} />
          <TaskPanel subject={{ customerId: id }} rows={data.tasks} team={teamList} />

          <Panel title="Internal notes">
            {primaryLeadId ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (note.trim().length < 2) return;
                  noteMutation.mutate({ leadId: primaryLeadId, text: note.trim() });
                }}
              >
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Visible to the team only…"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  disabled={noteMutation.isPending || note.trim().length < 2}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {noteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Add note
                </button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground">
                Notes are kept on the linked enquiry. Link an enquiry to add notes.
              </p>
            )}
            <div className="mt-4">
              {data.notes.length === 0 ? (
                <EmptyState title="No notes yet" />
              ) : (
                <ul className="space-y-3">
                  {data.notes.map((n: any) => (
                    <li key={n.id} className="rounded-xl bg-secondary/50 px-3 py-2.5">
                      <p className="text-sm text-ink">{n.note}</p>
                      <p className="mt-1 text-[0.7rem] text-muted-foreground">
                        {teamName(n.author_id)} · {formatDate(n.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
