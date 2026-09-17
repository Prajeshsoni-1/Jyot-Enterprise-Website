"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { listEnquiries, listTeam } from "@/lib/admin.functions";
import { fetchClientEnquiries, fetchClientTeam } from "@/lib/admin-client";
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
  Panel,
  PageHeader,
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
    queryFn: async () => {
      try {
        const res = await fetchList({ data: filters });
        if (res && Array.isArray(res.rows)) return res;
      } catch (err) {
        console.warn("[admin.enquiries] ServerFn failed, falling back to direct Supabase SDK:", err);
      }
      return await fetchClientEnquiries(filters);
    },
    retry: false,
  });

  const { data: team } = useQuery({
    queryKey: ["admin", "team"],
    queryFn: async () => {
      try {
        const res = await fetchTeam({ data: undefined });
        if (res && Array.isArray(res)) return res;
      } catch (err) {
        console.warn("[admin.team] ServerFn failed, falling back to direct Supabase SDK:", err);
      }
      return await fetchClientTeam();
    },
    retry: false,
  });

  const teamName = (id: string | null) =>
    id ? ((team ?? []).find((t: any) => t.id === id)?.name ?? "Assigned") : "Unassigned";

  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev: Search) => ({ ...prev, ...patch, page: undefined }) });

  const selectClass =
    "rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary";

  const totalCount = data?.total ?? 0;
  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      {/* 1. Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">Leads & Enquiries</h1>
            {data && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
                {totalCount} total
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `Showing matching leads across all practice desks.` : "Loading live leads…"}
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
              className="w-56 sm:w-64 rounded-xl border border-border/80 bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-primary transition"
            />
          </div>
          <button className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition active:scale-[0.98]">
            Search
          </button>
        </form>
      </div>

      {/* 2. Quick View Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground mr-1">
          Quick Filters:
        </span>
        {QUICK_FILTERS.map((f) => {
          const active = search.quick === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => set({ quick: active ? undefined : f.key })}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "border border-border/80 bg-background text-muted-foreground hover:bg-secondary hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* 3. Comprehensive Filter Controls Panel */}
      <Panel className="p-4 sm:p-5">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <select
            aria-label="Filter by status"
            className="rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
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
            className="rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
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
            className="rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
            value={search.division ?? "all"}
            onChange={(e) => set({ division: e.target.value === "all" ? undefined : e.target.value })}
          >
            <option value="all">All departments</option>
            {DIVISION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {DIVISION_LABEL[d]}
              </option>
            ))}
          </select>
          <input
            aria-label="Filter by source"
            placeholder="Lead source"
            defaultValue={search.source ?? ""}
            onBlur={(e) => set({ source: e.target.value || undefined })}
            className="rounded-xl border border-border/80 bg-background px-3 py-2 text-xs outline-none focus:border-primary text-ink"
          />
          <select
            aria-label="Filter by assignment"
            className="rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
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
          <select
            aria-label="Sort"
            className="rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
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
            className="rounded-xl border border-border/80 bg-secondary/50 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary transition"
          >
            Reset Filters
          </button>
        </div>
      </Panel>

      {/* 4. Table / Content States */}
      {isLoading ? (
        <Loading label="Loading enquiries…" />
      ) : isError ? (
        <ErrorState message="Could not load enquiries." onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No enquiries match these filters"
          body="Try clearing or broadening your search parameters."
          action={
            <button
              onClick={() => {
                setTerm("");
                navigate({ search: {} });
              }}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
            >
              Clear all filters
            </button>
          }
        />
      ) : (
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="border-b border-border/80 bg-secondary/30 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Contact</th>
                  <th className="px-4 py-3.5 font-bold">Reference</th>
                  <th className="px-4 py-3.5 font-bold">Department</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold">Priority</th>
                  <th className="px-4 py-3.5 font-bold">Assigned</th>
                  <th className="px-4 py-3.5 font-bold">Created</th>
                  <th className="px-5 py-3.5 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-border/60 ${isFetching ? "opacity-60" : ""}`}>
                {rows.map((r: any) => {
                  const initials = (r.name || "U")
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={r.id}
                      className="group transition-colors hover:bg-secondary/40"
                    >
                      {/* Contact Column */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-xs text-ink border border-border/80">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to="/admin/enquiries/$id"
                              params={{ id: r.id }}
                              className="font-bold text-ink hover:text-primary transition-colors block truncate"
                            >
                              {r.name}
                            </Link>
                            <p className="text-[0.7rem] text-muted-foreground truncate mt-0.5">
                              {r.phone ? `${r.phone} · ` : ""}
                              {r.email ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono text-[0.72rem] text-muted-foreground">
                        {r.reference}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-secondary/80 px-2 py-0.5 text-[0.7rem] font-semibold text-ink border border-border/60">
                          {DIVISION_LABEL[r.division] ?? r.division}
                        </span>
                        {r.service && (
                          <p className="text-[0.68rem] text-muted-foreground truncate mt-0.5 max-w-[140px]">
                            {r.service}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusPill value={r.status} />
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5">
                        <PriorityPill value={r.priority} />
                      </td>

                      {/* Assigned */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {teamName(r.assignedTo)}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {formatDate(r.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to="/admin/enquiries/$id"
                          params={{ id: r.id }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-ink hover:bg-secondary hover:text-primary transition shadow-2xs"
                        >
                          <span>Manage</span>
                          <span>→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* 5. Pagination */}
      {data && data.total > pageSize ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => navigate({ search: (p: Search) => ({ ...p, page: page - 1 }) })}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => navigate({ search: (p: Search) => ({ ...p, page: page + 1 }) })}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
