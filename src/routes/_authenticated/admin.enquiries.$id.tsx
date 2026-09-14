"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import {
  addEnquiryNote,
  getAdminSession,
  getAttachmentLink,
  getEnquiry,
  listTeam,
  updateEnquiry,
} from "@/lib/admin.functions";
import { convertLeadToCustomer, listFollowUps, listTasks } from "@/lib/crm.functions";
import { DocumentPanel } from "@/components/admin/DocumentPanel";
import { FollowUpPanel, TaskPanel } from "@/components/admin/WorkPanels";
import {
  DIVISION_LABEL,
  EmptyState,
  ErrorState,
  Loading,
  PRIORITY_OPTIONS,
  PriorityPill,
  Panel,
  STATUS_LABEL,
  STATUS_OPTIONS,
  StatusPill,
  formatDate,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/enquiries/$id")({
  component: EnquiryDetail,
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

function EnquiryDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchEnquiry = useServerFn(getEnquiry);
  const fetchTeam = useServerFn(listTeam);
  const saveEnquiry = useServerFn(updateEnquiry);
  const saveNote = useServerFn(addEnquiryNote);
  const signAttachment = useServerFn(getAttachmentLink);

  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "enquiry", id],
    queryFn: () => fetchEnquiry({ data: { id } }),
    retry: false,
  });
  const { data: team } = useQuery({
    queryKey: ["admin", "team"],
    queryFn: () => fetchTeam({ data: undefined }),
    retry: false,
  });
  const fetchSession = useServerFn(getAdminSession);
  const { data: session } = useQuery({
    queryKey: ["admin", "session"],
    queryFn: () => fetchSession({ data: undefined }),
    retry: false,
  });
  const fetchLeadFollowUps = useServerFn(listFollowUps);
  const fetchLeadTasks = useServerFn(listTasks);
  const convert = useServerFn(convertLeadToCustomer);
  const { data: followUps } = useQuery({
    queryKey: ["admin", "followups", "lead", id],
    queryFn: () => fetchLeadFollowUps({ data: { leadId: id, scope: "all", pageSize: 50 } } as any),
    retry: false,
  });
  const { data: leadTasks } = useQuery({
    queryKey: ["admin", "tasks", "lead", id],
    queryFn: () => fetchLeadTasks({ data: { leadId: id, scope: "all", pageSize: 50 } } as any),
    retry: false,
  });
  const convertMutation = useMutation({
    mutationFn: () => convert({ data: { leadId: id } } as any),
    onSuccess: () => {
      setFeedback({ tone: "ok", text: "Customer record ready." });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setFeedback({ tone: "error", text: e.message }),
  });

  const canSetPriority =
    session?.roles?.includes("admin") === true || session?.roles?.includes("manager") === true;

  const update = useMutation({
    mutationFn: (patch: Record<string, unknown>) => saveEnquiry({ data: { id, ...patch } } as any),
    onSuccess: () => {
      setFeedback({ tone: "ok", text: "Saved." });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => setFeedback({ tone: "error", text: e.message }),
  });

  const noteMutation = useMutation({
    mutationFn: (text: string) => saveNote({ data: { id, note: text } }),
    onSuccess: () => {
      setNote("");
      setFeedback({ tone: "ok", text: "Note added." });
      queryClient.invalidateQueries({ queryKey: ["admin", "enquiry", id] });
    },
    onError: (e: Error) => setFeedback({ tone: "error", text: e.message }),
  });

  if (isLoading) return <Loading label="Loading enquiry…" />;
  if (isError)
    return <ErrorState message="Could not load this enquiry." onRetry={() => refetch()} />;
  if (!data) return <EmptyState title="Enquiry not found" body="It may have been removed." />;

  const lead = data.lead as any;
  const details = (lead.details ?? {}) as Record<string, unknown>;
  const attachments = (lead.attachments ?? []) as Array<{
    name: string;
    path: string;
    size: number;
  }>;
  const teamList = ((team ?? []) as any[]).map((t) => ({
    id: t.id as string,
    name: t.name as string,
  }));
  const teamName = (uid: string | null) =>
    uid ? ((team ?? []).find((t: any) => t.id === uid)?.name ?? "Team member") : "Unassigned";

  async function openDoc(path: string) {
    setDocError(null);
    try {
      const { url } = await signAttachment({ data: { path } });
      window.open(url, "_blank", "noopener");
    } catch {
      setDocError("Could not open this document.");
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/admin/enquiries"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to enquiries
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{lead.name}</h1>
        <StatusPill value={lead.status} />
        <PriorityPill value={lead.priority} />
        <span className="text-xs font-semibold text-muted-foreground">{lead.reference}</span>
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
          <Panel title="Enquiry">
            <Row label="Reference" value={lead.reference} />
            <Row label="Email" value={<a href={`mailto:${lead.email}`}>{lead.email}</a>} />
            <Row label="Phone" value={<a href={`tel:${lead.phone}`}>{lead.phone}</a>} />
            <Row label="Company" value={lead.company} />
            <Row label="City" value={lead.city} />
            <Row label="Department" value={DIVISION_LABEL[lead.division] ?? lead.division} />
            <Row label="Desk" value={lead.department} />
            <Row label="Service" value={lead.service} />
            <Row label="Requirement" value={lead.message} />
            <Row label="Budget" value={(details["budget"] as string) ?? null} />
            <Row label="Timeline" value={(details["timeline"] as string) ?? null} />
            <Row label="Preferred date" value={(details["preferredDate"] as string) ?? null} />
            <Row label="Contact method" value={(details["contactMethod"] as string) ?? null} />
            <Row label="Industry" value={(details["industry"] as string) ?? null} />
            <Row label="Lead score" value={`${lead.score_value} (${lead.score})`} />
            <Row label="Estimated value" value={lead.estimated_value} />
            <Row label="Project size" value={lead.project_size} />
            <Row label="Source" value={lead.source} />
            <Row label="Landing page" value={lead.page_url} />
            <Row label="Assigned to" value={teamName(lead.assigned_to)} />
            <Row label="Follow-up" value={formatDate(lead.follow_up_at)} />
            <Row label="Created" value={formatDate(lead.created_at)} />
            <Row label="Last updated" value={formatDate(lead.updated_at)} />
          </Panel>

          <Panel title="Documents">
            {attachments.length === 0 ? (
              <EmptyState title="No documents uploaded" />
            ) : (
              <ul className="space-y-2">
                {attachments.map((a) => (
                  <li
                    key={a.path}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{a.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {Math.round((a.size ?? 0) / 1024)} KB
                      </span>
                    </span>
                    <button
                      onClick={() => openDoc(a.path)}
                      className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
                    >
                      Open securely
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {docError ? <p className="mt-3 text-xs text-destructive">{docError}</p> : null}
            <p className="mt-3 text-[0.7rem] text-muted-foreground">
              Documents stay private. Links expire after 5 minutes.
            </p>
          </Panel>

          <DocumentPanel leadId={id} />

          <FollowUpPanel subject={{ leadId: id }} rows={followUps?.rows ?? []} team={teamList} />

          <TaskPanel subject={{ leadId: id }} rows={leadTasks?.rows ?? []} team={teamList} />

          <Panel title="Activity history">
            {data.activity.length === 0 ? (
              <EmptyState title="No changes recorded yet" />
            ) : (
              <ul className="space-y-2.5">
                {data.activity.map((a: any) => (
                  <li key={a.id} className="text-xs text-muted-foreground">
                    <span className="font-semibold text-ink">{a.action.replace(/_/g, " ")}</span>{" "}
                    {a.detail?.from !== undefined
                      ? `${String(a.detail.from ?? "—")} → ${String(a.detail.to ?? "—")}`
                      : null}{" "}
                    · {formatDate(a.created_at)} · {teamName(a.actor_id)}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Customer">
            {lead.customer_id ? (
              <Link
                to="/admin/customers/$id"
                params={{ id: lead.customer_id }}
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Open customer record
              </Link>
            ) : (
              <button
                disabled={convertMutation.isPending}
                onClick={() => convertMutation.mutate()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
              >
                {convertMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Convert to customer
              </button>
            )}
            <p className="mt-2 text-[0.7rem] text-muted-foreground">
              The enquiry is always kept. Converting links it to a customer record.
            </p>
          </Panel>

          <Panel title="Actions">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-ink">Status</span>
                <select
                  value={lead.status}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ status: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Priority</span>
                <select
                  value={lead.priority}
                  disabled={update.isPending || !canSetPriority}
                  onChange={(e) => update.mutate({ priority: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
                >
                  {PRIORITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {!canSetPriority ? (
                  <span className="mt-1 block text-[0.7rem] text-muted-foreground">
                    Only an admin or manager can change priority.
                  </span>
                ) : null}
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Assigned employee</span>
                <select
                  value={lead.assigned_to ?? ""}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ assignedTo: e.target.value || null })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Unassigned</option>
                  {(team ?? []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink">Follow-up date</span>
                <input
                  type="date"
                  disabled={update.isPending}
                  defaultValue={lead.follow_up_at ? String(lead.follow_up_at).slice(0, 10) : ""}
                  onChange={(e) => update.mutate({ followUpAt: e.target.value || null })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
              {update.isPending ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Internal notes">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim().length < 2) return;
                noteMutation.mutate(note.trim());
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
