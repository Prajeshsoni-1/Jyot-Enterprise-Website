"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  Calendar,
  CheckCheck,
  ChevronRight,
  Inbox,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";
import {
  useAdminNotifications,
  getNotificationRoute,
} from "@/hooks/useAdminNotifications";
import type { AdminNotification } from "@/lib/notifications.functions";

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

function getNotificationVisuals(type: AdminNotification["type"]) {
  switch (type) {
    case "booking":
      return {
        icon: Calendar,
        bg: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:text-blue-400",
        label: "Booking",
      };
    case "job_application":
      return {
        icon: Briefcase,
        bg: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400",
        label: "Career",
      };
    case "enquiry":
    case "request":
    default:
      return {
        icon: Inbox,
        bg: "bg-primary/10 text-primary border border-primary/20",
        label: "Enquiry",
      };
  }
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    isMarkingAllRead,
  } = useAdminNotifications({
    filter: "all",
    pageSize: 8,
    enableRealtime: true,
  });

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleItemClick(notif: AdminNotification) {
    if (!notif.is_read) {
      void markRead(notif.id);
    }
    setIsOpen(false);
    const targetRoute = getNotificationRoute(notif);
    await navigate({ to: targetRoute as any });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          isOpen ? "bg-secondary text-ink" : ""
        }`}
        aria-label="Admin Notifications"
        title="Admin Notifications"
      >
        <Bell className="h-4 w-4 shrink-0" />

        {/* Unread Count Badge */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-75">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {/* Popover Dropdown */}
      {isOpen ? (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-2xl border border-border bg-card shadow-lift z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-ink">Notifications</h2>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {unreadCount} new
                </span>
              ) : null}
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={isMarkingAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition disabled:opacity-50"
                title="Mark all as read"
              >
                {isMarkingAllRead ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                <span>Mark all read</span>
              </button>
            ) : null}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" />
                <p className="mt-2">Loading notifications…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-xs text-muted-foreground">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-secondary text-muted-foreground/60 mb-2">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="font-semibold text-ink">All caught up!</p>
                <p className="mt-1 text-[11px]">
                  New consultant bookings, job applications, and enquiries will appear here instantly.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const visuals = getNotificationVisuals(notif.type);
                const Icon = visuals.icon;

                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => void handleItemClick(notif)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-secondary/50 ${
                      !notif.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Icon Badge */}
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${visuals.bg} mt-0.5`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-ink truncate">{notif.title}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.entity_reference ? (
                        <span className="mt-1 inline-block text-[10px] font-mono text-muted-foreground/80">
                          Ref: {notif.entity_reference}
                        </span>
                      ) : null}
                    </div>

                    {/* Unread indicator dot */}
                    {!notif.is_read ? (
                      <span
                        className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2"
                        title="Unread"
                      />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-secondary/20 p-2.5 text-center">
            <Link
              to="/admin/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View all notifications</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
