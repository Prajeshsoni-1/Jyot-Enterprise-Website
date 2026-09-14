"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { listEnquiries, listTeam } from "@/lib/admin.functions";
import {
  DIVISION_LABEL,
  DIVISION_OPTIONS,
  EmptyState,
  ErrorState,
  Loading,
  PRIORITY_OPTIONS,
  PriorityPill,
  STATUS_LABEL,
  STATUS_OPTIONS,
  StatusPill,
  formatDate,
} from "@/components/admin/ui";

const QUICK_FILTERS = [
  { key: "new", label: "New" },
  { key: "high", label: "High priority" },
  { key: "unassigned", label: "Unassigned" },
  { key: "followup_due", label: "Follow-up due" },
  { key: "followup_today", label: "Today's follow-ups" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
] as const;

type QuickKey = (typeof QUICK_FILTERS)[number]["key"];

type Search = {
  q?: string | undefined;
  status?: string | undefined;
  priority?: string | undefined;
  division?: string | undefined;
  source?: string | undefined;
  assignment?: "any" | "unassigned" | "mine" | undefined;
  from?: string | undefined;
  to?: string | undefined;
  sort?: "newest" | "oldest" | "score" | "updated" | undefined;
  quick?: QuickKey | undefined;
  page?: number | undefined;
};

const str = (v: unknown, max = 80) => (typeof v === "string" && v ? v.slice(0, max) : undefined);

export const Route = createFileRoute("/_authenticated/admin/enquiries/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: str(search["q"], 120),
    status: str(search["status"], 20),
    priority: str(search["priority"], 10),
    division: str(search["division"], 20),
    source: str(search["source"], 80),
    assignment: ["unassigned", "mine", "any"].includes(String(search["assignment"]))
      ? (search["assignment"] as Search["assignment"])
      : undefined,
    from: str(search["from"], 30),
    to: str(search["to"], 30),
    sort: ["newest", "oldest", "score", "updated"].includes(String(search["sort"]))
      ? (search["sort"] as Search["sort"])
      : undefined,
    quick: QUICK_FILTERS.some((f) => f.key === String(search["quick"]))
      ? (search["quick"] as QuickKey)
      : undefined,
    page: Number(search["page"]) > 1 ? Number(search["page"]) : undefined,
  }),
  component: EnquiryList,
});

function EnquiryList() {
  const navigate = useNavigate() as (opts: unknown) => void;
  const search = Route.useSearch();
  const fetchList = useServerFn(listEnquiries);
  const fetchTeam = useServerFn(listTeam);
  const [term, setTerm] = useState(search.q ?? "");

  const page = search.page ?? 1;
  const pageSize = 20;

  const filters = {
    search: search.q,
    status: search.status,
    priority: search.priority,
    division: search.division,
    source: search.source,
    assignment: search.assignment ?? ("any" as const),
    from: search.from,
    to: search.to,
    sort: search.sort ?? ("newest" as const),
    quick: search.quick ?? ("none" as const),
    page,
    pageSize,
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "enquiries", filters],
    queryFn: () => fetchList({ data: filters }),
    retry: false,
  });

  const { data: team } = useQuery({
    queryKey: ["admin", "team"],
    queryFn: () => fetchTeam({ data: undefined }),
    retry: false,
  });

  const teamName = (id: string | null) =>
    id ? ((team ?? []).find((t: any) => t.id === id)?.name ?? "Assigned") : "Unassigned";

  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev: Search) => ({ ...prev, ...patch, page: undefined }) });

  const selectClass =
    "rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary";

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Enquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} matching enquir${data.total === 1 ? "y" : "ies"}` : "Loading…"}
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: term || undefined });
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Name, email, phone, reference…"
              aria-label="Search enquiries"
              className="w-64 rounded-full border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>
          <button className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Quick views
        </span>
        {QUICK_FILTERS.map((f) => {
          const active = search.quick === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => set({ quick: active ? undefined : f.key })}
              className={
                active
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-ink"
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-background p-3">
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={search.status ?? "all"}
          onChange={(e) => set({ status: e.target.value === "all" ? undefined : e.target.value })}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by priority"
          className={selectClass}
          value={search.priority ?? "all"}
          onChange={(e) => set({ priority: e.target.value === "all" ? undefined : e.target.value })}
        >
          <option value="all">All priorities</option>
          {PRIORITY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by department"
          className={selectClass}
          value={search.division ?? "all"}
          onChange={(e) => set({ division: e.target.value === "all" ? undefined : e.target.value })}
        >
          <option value="all">All departments</option>
          {DIVISION_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {DIVISION_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          aria-label="Filter by source"
          placeholder="Source"
          defaultValue={search.source ?? ""}
          onBlur={(e) => set({ source: e.target.value || undefined })}
          className="w-32 rounded-full border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
        />
        <select
          aria-label="Filter by assignment"
          className={selectClass}
          value={search.assignment ?? "any"}
          onChange={(e) =>
            set({
              assignment:
                e.target.value === "any" ? undefined : (e.target.value as Search["assignment"]),
            })
          }
        >
          <option value="any">Any assignment</option>
          <option value="unassigned">Unassigned</option>
          <option value="mine">Assigned to me</option>
        </select>
        <input
          type="date"
          aria-label="From date"
          className={selectClass}
          value={search.from ?? ""}
          onChange={(e) => set({ from: e.target.value || undefined })}
        />
        <input
          type="date"
          aria-label="To date"
          className={selectClass}
          value={search.to ?? ""}
          onChange={(e) => set({ to: e.target.value || undefined })}
        />
        <select
          aria-label="Sort"
          className={selectClass}
          value={search.sort ?? "newest"}
          onChange={(e) => set({ sort: e.target.value as Search["sort"] })}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="score">Highest score</option>
          <option value="updated">Recently updated</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setTerm("");
            navigate({ search: {} });
          }}
          className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-ink"
        >
          Reset
        </button>
      </div>

      {isLoading ? (
        <Loading label="Loading enquiries…" />
      ) : isError || !data ? (
        <ErrorState message="Could not load enquiries." onRetry={() => refetch()} />
      ) : data.rows.length === 0 ? (
        <EmptyState title="No enquiries match these filters" body="Try clearing a filter." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border text-[0.7rem] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Department / service</th>
                <th className="px-4 py-3 font-semibold">Budget / timeline</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Assigned</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className={isFetching ? "opacity-60" : undefined}>
              {data.rows.map((r: any) => (
                <tr
                  key={r.id}
                  className="border-b border-border/60 last:border-0 hover:bg-secondary/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/enquiries/$id"
                      params={{ id: r.id }}
                      className="font-semibold text-ink hover:text-primary"
                    >
                      {r.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.phone}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-ink">
                      {DIVISION_LABEL[r.division] ?? r.division}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.service ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r.budget ?? "—"}
                    <br />
                    {r.timeline ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.source ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill value={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityPill value={r.priority} />
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-ink">{r.scoreValue}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {teamName(r.assignedTo)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(r.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > pageSize ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => navigate({ search: (p: Search) => ({ ...p, page: page - 1 }) })}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => navigate({ search: (p: Search) => ({ ...p, page: page + 1 }) })}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
