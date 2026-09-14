"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listCustomers } from "@/lib/crm.functions";
import {
  DIVISION_LABEL,
  DIVISION_OPTIONS,
  EmptyState,
  ErrorState,
  Loading,
  Panel,
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
    queryFn: () =>
      fetchCustomers({ data: { search, division, status, sort, page, pageSize } } as any),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Customers</h1>
        {data ? (
          <span className="text-xs font-semibold text-muted-foreground">{data.total} total</span>
        ) : null}
      </div>

      <Panel>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
        >
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone, company…"
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            aria-label="Search customers"
          />
          <select
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              setPage(1);
            }}
            aria-label="Department"
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="all">All departments</option>
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
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
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
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="updated">Recently updated</option>
          </select>
        </form>
      </Panel>

      {isLoading ? <Loading label="Loading customers…" /> : null}
      {isError ? (
        <ErrorState message="Could not load customers." onRetry={() => refetch()} />
      ) : null}

      {data && data.rows.length === 0 ? (
        <EmptyState
          title="No customers yet"
          body="Convert a qualified enquiry into a customer from the lead page."
        />
      ) : null}

      {data && data.rows.length > 0 ? (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-[0.7rem] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-b border-border/60 last:border-0 hover:bg-secondary/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/customers/$id"
                      params={{ id: c.id }}
                      className="font-semibold text-ink hover:text-primary"
                    >
                      {c.name}
                    </Link>
                    <p className="text-[0.7rem] capitalize text-muted-foreground">
                      {String(c.status).replace("_", " ")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.email ?? "—"}
                    <br />
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.company ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.division ? (DIVISION_LABEL[c.division] ?? c.division) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDay(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
