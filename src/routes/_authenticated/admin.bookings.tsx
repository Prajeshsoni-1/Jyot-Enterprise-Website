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
  Calendar,
  Clock,
  Video,
  Phone,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  UserCheck,
  Search,
  Filter,
} from "lucide-react";
import {
  DIVISION_LABEL,
  DIVISION_OPTIONS,
  EmptyState,
  ErrorState,
  Loading,
  Panel,
  PageHeader,
  StatCard,
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

  // Real counts from current page rows for quick pulse
  const rows = list.data?.rows ?? [];
  const pendingCount = rows.filter((b: any) => b.status === "pending").length;
  const confirmedCount = rows.filter((b: any) => b.status === "confirmed").length;
  const completedCount = rows.filter((b: any) => b.status === "completed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultation Bookings"
        description="Schedule, confirm, reschedule, and manage multi-division client appointments."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <CalendarCheck className="h-3.5 w-3.5" />
            {list.data ? `${list.data.total} Total Records` : "Calendar Desk"}
          </span>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={list.data ? list.data.total : "…"}
          hint="All registered consultation slots"
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          label="Awaiting Confirmation"
          value={pendingCount}
          hint="Pending desk approval"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          label="Confirmed"
          value={confirmedCount}
          hint="Scheduled appointments"
          icon={<CheckCircle2 className="h-5 w-5 text-sky-600" />}
        />
        <StatCard
          label="Completed"
          value={completedCount}
          hint="Fulfilled consultations"
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      {/* Filter & Search Bar */}
      <Panel className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              aria-label="Search bookings"
              placeholder="Search by name, email, phone, reference…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-ink focus:border-primary focus:outline-none"
          >
            <option value="all">All Statuses</option>
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
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-ink focus:border-primary focus:outline-none"
          >
            <option value="all">All Divisions</option>
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
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-ink focus:border-primary focus:outline-none"
            >
              <option value="all">Anyone</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <select
              aria-label="Sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as "upcoming" | "newest")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-ink focus:border-primary focus:outline-none"
            >
              <option value="upcoming">Soonest slot</option>
              <option value="newest">Newest</option>
            </select>
          </div>
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
        <Panel className="p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {list.data.rows.map((b: any) => {
              const isPending = b.status === "pending";
              const isConfirmed = b.status === "confirmed";
              const isCompleted = b.status === "completed";
              const isCancelled = b.status === "cancelled";

              return (
                <li key={b.id} className="p-4 transition hover:bg-muted/30">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary/70 text-ink shadow-2xs">
                        {b.meeting_type === "video" ? (
                          <Video className="h-5 w-5 text-primary" />
                        ) : b.meeting_type === "phone" ? (
                          <Phone className="h-5 w-5 text-primary" />
                        ) : (
                          <Calendar className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-ink">{b.name}</p>
                          <span className="font-mono text-[0.7rem] text-muted-foreground">
                            {b.reference}
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                            {DIVISION_LABEL[b.division] ?? b.division}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-ink">
                            {formatIstDateTime(b.slot_at)}
                          </span>
                          <span>·</span>
                          <span>
                            {MEETING_TYPES.find((m) => m.value === b.meeting_type)?.label ??
                              b.meeting_type}
                          </span>
                          {b.service ? (
                            <>
                              <span>·</span>
                              <span className="text-muted-foreground">{b.service}</span>
                            </>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{b.email}</span>
                          <span>·</span>
                          <span>{b.phone}</span>
                          {b.lead_id ? (
                            <>
                              <span>·</span>
                              <Link
                                to="/admin/enquiries/$id"
                                params={{ id: b.lead_id }}
                                className="font-medium text-primary hover:underline"
                              >
                                Linked enquiry
                              </Link>
                            </>
                          ) : null}
                          {b.customer_id ? (
                            <>
                              <span>·</span>
                              <Link
                                to="/admin/customers/$id"
                                params={{ id: b.customer_id }}
                                className="font-medium text-primary hover:underline"
                              >
                                Customer profile
                              </Link>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold ${
                          isConfirmed
                            ? "border-sky-500/30 bg-sky-500/10 text-sky-700"
                            : isPending
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                              : isCompleted
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                : "border-rose-500/30 bg-rose-500/10 text-rose-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isConfirmed
                              ? "bg-sky-500"
                              : isPending
                                ? "bg-amber-500 animate-pulse"
                                : isCompleted
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                          }`}
                        />
                        {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                      </span>

                      {isPending ? (
                        <button
                          disabled={update.isPending}
                          onClick={() => update.mutate({ id: b.id, status: "confirmed" })}
                          className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 disabled:opacity-60 transition"
                        >
                          Confirm
                        </button>
                      ) : null}

                      {!isCompleted && !isCancelled ? (
                        <>
                          <button
                            disabled={update.isPending}
                            onClick={() => update.mutate({ id: b.id, status: "completed" })}
                            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-60 transition"
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
                            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-60 transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : null}

                      <button
                        onClick={() => setOpenId(openId === b.id ? null : b.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          openId === b.id
                            ? "border-ink bg-ink text-background"
                            : "border-border bg-background text-ink hover:bg-secondary"
                        }`}
                      >
                        {openId === b.id ? "Close" : "Manage"}
                      </button>
                    </div>
                  </div>

                {openId === b.id ? (
                  <div className="mt-4 rounded-2xl border border-border bg-background p-4 shadow-xs">
                    {detail.isLoading ? <Loading label="Loading booking details…" /> : null}
                    {detail.isError ? (
                      <ErrorState
                        message="Could not load this booking."
                        onRetry={() => detail.refetch()}
                      />
                    ) : null}
                    {detail.data ? (
                      <div className="space-y-4">
                        {detail.data.booking.message ? (
                          <div className="rounded-xl border border-border bg-secondary/30 p-3">
                            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                              Client Consultation Brief
                            </p>
                            <p className="mt-1 text-xs text-ink leading-relaxed">
                              {detail.data.booking.message}
                            </p>
                          </div>
                        ) : null}

                        <div className="rounded-xl border border-border bg-secondary/20 p-3">
                          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                            Reschedule Appointment Slot
                          </p>
                          <Reschedule
                            disabled={update.isPending}
                            onSubmit={(date, time) => update.mutate({ id: b.id, date, time })}
                          />
                        </div>

                        <div>
                          <p className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                            Audit & Activity Timeline
                          </p>
                          {detail.data.history.length === 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              No slot status changes recorded yet.
                            </p>
                          ) : (
                            <ul className="mt-2 space-y-1.5 border-l-2 border-primary/30 pl-3">
                              {detail.data.history.map((h: any) => (
                                <li key={h.id} className="text-xs text-muted-foreground">
                                  <span className="font-semibold text-ink">
                                    {h.action.replace(/_/g, " ")}
                                  </span>
                                  {" · "}
                                  <span>{formatIstDateTime(h.created_at)}</span>
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
            );
          })}
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
