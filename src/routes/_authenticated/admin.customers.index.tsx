"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Building2, Search, Users } from "lucide-react";
import { listCustomers } from "@/lib/crm.functions";
import { fetchClientCustomers } from "@/lib/admin-client";
import {
  DIVISION_LABEL,
  DIVISION_OPTIONS,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Panel,
  StatCard,
  formatDay,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/customers/")({
  component: CustomerList,
});

function CustomerList() {
  const fetchCustomers = useServerFn(listCustomers);
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "name" | "updated">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "customers", { search, division, status, sort, page }],
    queryFn: async () => {
      try {
        const res = await fetchCustomers({ data: { search, division, status, sort, page, pageSize } } as any);
        if (res && Array.isArray(res.rows)) return res;
      } catch (err) {
        console.warn("[admin.customers] ServerFn failed, fallback to client:", err);
      }
      return await fetchClientCustomers({ search, division, status, sort, page, pageSize });
    },
    placeholderData: keepPreviousData,
    retry: false,
  });

  const totalCount = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const activeCount = rows.filter((c: any) => c.status === "active").length;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Customer Accounts"
        description="Manage active client relationships, company records, and mandate history."
        badge={
          data && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              {totalCount} clients
            </span>
          )
        }
      />

      {/* 2. Top Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Accounts"
          value={data?.total ?? 0}
          hint="All onboarded clients"
          icon={Building2}
          accent="primary"
        />
        <StatCard
          label="Active Retainers"
          value={activeCount}
          hint="Ongoing advisory and mandates"
          icon={Users}
          accent="emerald"
        />
        <StatCard
          label="Departments"
          value={4}
          hint="Financial, IT, Legal & Engineering"
          icon={Building2}
          accent="indigo"
        />
      </div>

      {/* 3. Search and Filters */}
      <Panel className="p-4 sm:p-5">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, company…"
              className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 py-2 text-xs outline-none focus:border-primary text-ink transition"
              aria-label="Search customers"
            />
          </div>

          <select
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              setPage(1);
            }}
            aria-label="Department"
            className="rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
          >
            <option value="all">All practice desks</option>
            {DIVISION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {DIVISION_LABEL[d]}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Customer status"
            className="rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort customers"
            className="rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="updated">Recently updated</option>
          </select>
        </form>
      </Panel>

      {/* 4. Table / Content States */}
      {isLoading ? <Loading label="Loading customer accounts…" /> : null}
      {isError ? (
        <ErrorState message="Could not load customers." onRetry={() => refetch()} />
      ) : null}

      {data && data.rows.length === 0 ? (
        <EmptyState
          title="No customers found"
          body="Convert a qualified enquiry into a customer or clear filters to see all."
        />
      ) : null}

      {data && data.rows.length > 0 ? (
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-border/80 bg-secondary/30 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Customer</th>
                  <th className="px-4 py-3.5 font-bold">Contact</th>
                  <th className="px-4 py-3.5 font-bold">Company</th>
                  <th className="px-4 py-3.5 font-bold">Department</th>
                  <th className="px-4 py-3.5 font-bold">Added</th>
                  <th className="px-5 py-3.5 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.rows.map((c: any) => {
                  const initials = (c.name || "C")
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={c.id}
                      className="group transition-colors hover:bg-secondary/40"
                    >
                      {/* Customer Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to="/admin/customers/$id"
                              params={{ id: c.id }}
                              className="font-bold text-ink hover:text-primary transition-colors block truncate"
                            >
                              {c.name}
                            </Link>
                            <span className="inline-block text-[0.68rem] capitalize text-muted-foreground">
                              {String(c.status || "active").replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <p className="text-ink font-medium">{c.email ?? "—"}</p>
                        <p className="text-[0.68rem] text-muted-foreground mt-0.5">{c.phone ?? "—"}</p>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3.5 font-medium text-ink">
                        {c.company || "Individual"}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-secondary/80 px-2 py-0.5 text-[0.7rem] font-semibold text-ink border border-border/60">
                          {c.division ? (DIVISION_LABEL[c.division] ?? c.division) : "General"}
                        </span>
                      </td>

                      {/* Added */}
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {formatDay(c.created_at)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to="/admin/customers/$id"
                          params={{ id: c.id }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-ink hover:bg-secondary hover:text-primary transition shadow-2xs"
                        >
                          <span>View Account</span>
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
      ) : null}

      {/* 5. Pagination */}
      {data && pages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-xs font-semibold text-muted-foreground">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  );
}
