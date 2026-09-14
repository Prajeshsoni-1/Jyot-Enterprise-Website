"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Calendar,
  Check,
  CheckCheck,
  ExternalLink,
  Filter,
  Inbox,
  Loader2,
  Mail,
  Phone,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import {
  useAdminNotifications,
  getNotificationRoute,
} from "@/hooks/useAdminNotifications";
import {
  type AdminNotification,
  type NotificationType,
} from "@/lib/notifications.functions";
import { EmptyState, Loading, formatDate } from "@/components/admin/ui";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({
    meta: pageMeta({
      title: "Notifications Hub — Jyot Enterprise",
      description: "Real-time alerts for bookings, job applications, and enquiries.",
      path: "/admin/notifications",
      noindex: true,
    }),
  }),
  component: NotificationsPage,
});

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function getNotificationBadge(type: AdminNotification["type"]) {
  switch (type) {
    case "booking":
      return {
        icon: Calendar,
        label: "Booking",
        className: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
      };
    case "job_application":
      return {
        icon: Briefcase,
        label: "Job Application",
        className: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
      };
    case "enquiry":
    case "request":
    default:
      return {
        icon: Inbox,
        label: "Enquiry",
        className: "bg-primary/10 text-primary border-primary/20",
      };
  }
}

function NotificationsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "unread" | NotificationType>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const {
    notifications,
    total,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    deleteNotification,
    isMarkingAllRead,
  } = useAdminNotifications({
    filter: tab,
    search,
    page,
    pageSize,
    enableRealtime: true,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleOpenRecord(notif: AdminNotification) {
    if (!notif.is_read) {
      void markRead(notif.id);
    }
    const route = getNotificationRoute(notif);
    await navigate({ to: route as any });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold text-ink">
            <Bell className="h-5 w-5 text-primary" /> Notifications Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time activity alerts for consultant bookings, job applications, and client enquiries.
          </p>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={isMarkingAllRead}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-ink shadow-2xs hover:bg-secondary transition disabled:opacity-50"
          >
            {isMarkingAllRead ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
            )}
            <span>Mark all as read ({unreadCount})</span>
          </button>
        ) : null}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}` },
            { id: "booking", label: "Bookings" },
            { id: "job_application", label: "Job Applications" },
            { id: "enquiry", label: "Enquiries / Requests" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as typeof tab);
                setPage(1);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                tab === t.id
                  ? "bg-ink text-background shadow-xs"
                  : "border border-border bg-background text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, reference, message…"
            className="w-64 sm:w-72 rounded-full border border-border bg-background pl-9 pr-3.5 py-1.5 text-xs outline-none focus:border-primary transition"
          />
        </div>
      </div>

      {/* Notification List Table / Cards */}
      {isLoading ? (
        <Loading label="Loading real-time notifications…" />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          body={
            search || tab !== "all"
              ? "No alerts match your search or filter. Try switching tabs or clearing your search."
              : "When visitors book consultations, submit enquiries, or apply for jobs online, alerts will appear here in real-time."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-xs">
          <div className="divide-y divide-border">
            {notifications.map((notif: AdminNotification) => {
              const badge = getNotificationBadge(notif.type);
              const BadgeIcon = badge.icon;
              const d = (notif.data ?? {}) as Record<string, any>;

              return (
                <div
                  key={notif.id}
                  className={`p-4 transition sm:flex sm:items-start sm:justify-between gap-4 hover:bg-secondary/30 ${
                    !notif.is_read ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  {/* Left Column: Icon + Details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${badge.className} mt-0.5`}
                    >
                      <BadgeIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${badge.className}`}
                        >
                          {badge.label}
                        </span>

                        {!notif.is_read ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-bold text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Unread
                          </span>
                        ) : null}

                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(notif.created_at)} · {formatDate(notif.created_at)}
                        </span>
                      </div>

                      <h2 className="mt-1 font-bold text-sm text-ink">{notif.title}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Extra Meta Pills */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {d["name"] ? (
                          <span className="font-semibold text-ink">
                            Contact: {String(d["name"])}
                          </span>
                        ) : null}
                        {d["email"] ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{String(d["email"])}</span>
                          </span>
                        ) : null}
                        {d["phone"] ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{String(d["phone"])}</span>
                          </span>
                        ) : null}
                        {notif.entity_reference ? (
                          <span className="inline-flex items-center gap-1 font-mono text-muted-foreground/90">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span>{notif.entity_reference}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="mt-3 flex items-center justify-end gap-2 sm:mt-0 sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleOpenRecord(notif)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-secondary hover:text-primary transition"
                      title="Open related record"
                    >
                      <span>Open Record</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </button>

                    {!notif.is_read ? (
                      <button
                        type="button"
                        onClick={() => void markRead(notif.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-primary hover:bg-secondary transition"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void deleteNotification(notif.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 transition"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border bg-secondary/10 px-4 py-3 text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages} ({total} total alerts)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-border bg-card px-3 py-1 font-semibold text-ink hover:bg-secondary transition disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border bg-card px-3 py-1 font-semibold text-ink hover:bg-secondary transition disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
