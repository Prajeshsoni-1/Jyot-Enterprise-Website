"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getBooking, listBookings, updateBooking } from "@/lib/booking.functions";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABEL,
  MEETING_TYPES,
  SLOT_TIMES,
  formatIstDateTime,
  formatSlotLabel,
} from "@/lib/booking-slots";
import {
  DIVISION_LABEL,
  DIVISION_OPTIONS,
  EmptyState,
  ErrorState,
  Loading,
  Panel,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const fetchList = useServerFn(listBookings);
  const fetchOne = useServerFn(getBooking);
  const save = useServerFn(updateBooking);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("search") ?? "";
  });
  const [status, setStatus] = useState("all");
  const [division, setDivision] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [sort, setSort] = useState<"upcoming" | "newest">("upcoming");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("id") ?? null;
  });
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin", "bookings", { search, status, division, assignedTo, sort, page }],
    queryFn: () =>
      fetchList({
        data: { search, status, division, assignedTo, sort, page, pageSize: 20 },
      } as any),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const detail = useQuery({
    queryKey: ["admin", "booking", openId],
    queryFn: () => fetchOne({ data: { id: openId! } } as any),
    enabled: !!openId,
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

  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Bookings</h1>
        {list.data ? (
          <span className="text-xs font-semibold text-muted-foreground">
            {list.data.total} total
          </span>
        ) : null}
      </div>

      <Panel className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          aria-label="Search bookings"
          placeholder="Name, email, phone, reference"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink lg:col-span-2"
        />
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
        >
          <option value="all">All statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {BOOKING_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          aria-label="Division"
          value={division}
          onChange={(e) => {
            setDivision(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
        >
          <option value="all">All divisions</option>
          {DIVISION_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {DIVISION_LABEL[d]}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            aria-label="Assignment"
            value={assignedTo}
            onChange={(e) => {
              setAssignedTo(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
          >
            <option value="all">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as "upcoming" | "newest")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
          >
            <option value="upcoming">Soonest slot</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </Panel>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {list.isLoading ? <Loading label="Loading bookings…" /> : null}
      {list.isError ? (
        <ErrorState message="Could not load bookings." onRetry={() => list.refetch()} />
      ) : null}
      {list.data && list.data.rows.length === 0 ? (
        <EmptyState title="No bookings match these filters" />
      ) : null}

      {list.data && list.data.rows.length > 0 ? (
        <Panel className="p-0">
          <ul className="divide-y divide-border">
            {list.data.rows.map((b: any) => (
              <li key={b.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {b.name} · <span className="text-muted-foreground">{b.reference}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatIstDateTime(b.slot_at)} · {DIVISION_LABEL[b.division] ?? b.division}
                      {b.service ? ` · ${b.service}` : ""} ·{" "}
                      {MEETING_TYPES.find((m) => m.value === b.meeting_type)?.label ??
                        b.meeting_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.email} · {b.phone}
                      {b.lead_id ? (
                        <>
                          {" · "}
                          <Link
                            to="/admin/enquiries/$id"
                            params={{ id: b.lead_id }}
                            className="hover:text-primary"
                          >
                            Linked enquiry
                          </Link>
                        </>
                      ) : null}
                      {b.customer_id ? (
                        <>
                          {" · "}
                          <Link
                            to="/admin/customers/$id"
                            params={{ id: b.customer_id }}
                            className="hover:text-primary"
                          >
                            Customer
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.7rem] font-semibold text-ink">
                      {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                    </span>
                    {b.status === "pending" ? (
                      <button
                        disabled={update.isPending}
                        onClick={() => update.mutate({ id: b.id, status: "confirmed" })}
                        className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        Confirm
                      </button>
                    ) : null}
                    {b.status !== "completed" && b.status !== "cancelled" ? (
                      <>
                        <button
                          disabled={update.isPending}
                          onClick={() => update.mutate({ id: b.id, status: "completed" })}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60"
                        >
                          Complete
                        </button>
                        <button
                          disabled={update.isPending}
                          onClick={() => {
                            const reason = window.prompt("Reason for cancelling?");
                            if (reason && reason.trim()) {
                              update.mutate({
                                id: b.id,
                                status: "cancelled",
                                cancelReason: reason.trim(),
                              });
                            }
                          }}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                    <button
                      onClick={() => setOpenId(openId === b.id ? null : b.id)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
                    >
                      {openId === b.id ? "Hide" : "Details"}
                    </button>
                  </div>
                </div>

                {openId === b.id ? (
                  <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-4">
                    {detail.isLoading ? <Loading label="Loading booking…" /> : null}
                    {detail.isError ? (
                      <ErrorState
                        message="Could not load this booking."
                        onRetry={() => detail.refetch()}
                      />
                    ) : null}
                    {detail.data ? (
                      <div className="space-y-4">
                        {detail.data.booking.message ? (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-ink">Brief: </span>
                            {detail.data.booking.message}
                          </p>
                        ) : null}

                        <Reschedule
                          disabled={update.isPending}
                          onSubmit={(date, time) => update.mutate({ id: b.id, date, time })}
                        />

                        <div>
                          <p className="text-xs font-semibold text-ink">History</p>
                          {detail.data.history.length === 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              No changes recorded yet.
                            </p>
                          ) : (
                            <ul className="mt-2 space-y-1">
                              {detail.data.history.map((h: any) => (
                                <li key={h.id} className="text-xs text-muted-foreground">
                                  {formatIstDateTime(h.created_at)} · {h.action.replace(/_/g, " ")}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {list.data && pages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            disabled={page <= 1 || list.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages || list.isFetching}
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

function Reschedule({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (date: string, time: string) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState<string>(SLOT_TIMES[0]);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-[0.7rem] font-semibold text-ink" htmlFor="rs-date">
          Reschedule to
        </label>
        <input
          id="rs-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
        />
      </div>
      <select
        aria-label="New time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-ink"
      >
        {SLOT_TIMES.map((t) => (
          <option key={t} value={t}>
            {formatSlotLabel(t)}
          </option>
        ))}
      </select>
      <button
        disabled={disabled || !date}
        onClick={() => onSubmit(date, time)}
        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-background disabled:opacity-50"
      >
        Move slot
      </button>
    </div>
  );
}
