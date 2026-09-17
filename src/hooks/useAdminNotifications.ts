"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  type AdminNotification,
  type NotificationType,
  getAdminNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/notifications.functions";

/**
 * Synthesize a gentle two-tone notification chime using Web Audio API.
 * 100% dependency-free, zero external audio asset requests, resilient to browser restrictions.
 */
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.1);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.38);
  } catch {
    // Autoplay restrictions or background tab limitations - fail silently
  }
}

/**
 * Returns navigation target route for a notification.
 */
export function getNotificationRoute(notif: AdminNotification): string {
  if (notif.entity_type === "booking" || notif.type === "booking") {
    if (notif.entity_id) return `/admin/bookings?id=${notif.entity_id}`;
    if (notif.entity_reference) return `/admin/bookings?search=${encodeURIComponent(notif.entity_reference)}`;
    return "/admin/bookings";
  }
  if (notif.entity_type === "job_application" || notif.type === "job_application") {
    if (notif.entity_reference) {
      return `/admin/website/applications?search=${encodeURIComponent(notif.entity_reference)}`;
    }
    const d = notif.data as Record<string, unknown>;
    if (d && d["name"]) {
      return `/admin/website/applications?search=${encodeURIComponent(String(d["name"]))}`;
    }
    return "/admin/website/applications";
  }
  if (
    notif.entity_type === "lead" ||
    notif.type === "enquiry" ||
    notif.type === "new_enquiry" ||
    notif.type === "request"
  ) {
    if (notif.entity_id) return `/admin/enquiries/${notif.entity_id}`;
    if (notif.entity_reference) return `/admin/enquiries?q=${encodeURIComponent(notif.entity_reference)}`;
    return "/admin/enquiries";
  }
  return "/admin/notifications";
}

export function useAdminNotifications(options?: {
  filter?: "all" | "unread" | NotificationType;
  search?: string;
  page?: number;
  pageSize?: number;
  enableRealtime?: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const fetchList = useServerFn(getAdminNotifications);
  const fetchUnreadCount = useServerFn(getUnreadNotificationCount);
  const markReadFn = useServerFn(markNotificationRead);
  const markAllReadFn = useServerFn(markAllNotificationsRead);
  const deleteNotifFn = useServerFn(deleteNotification);

  const filter = options?.filter ?? "all";
  const search = options?.search ?? "";
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const enableRealtime = options?.enableRealtime ?? true;

  // 1. Unread count query
  const unreadCountQuery = useQuery({
    queryKey: ["admin", "notifications-unread-count"],
    queryFn: () => fetchUnreadCount({ data: undefined }),
    refetchInterval: 30_000, // Background heartbeat polling as fail-safe fallback
    staleTime: 10_000,
  });

  // 2. Notifications list query
  const listQuery = useQuery({
    queryKey: ["admin", "notifications", { filter, search, page, pageSize }],
    queryFn: () => fetchList({ data: { filter, search, page, pageSize } }),
    staleTime: 10_000,
  });

  // 3. Mark Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markReadFn({ data: { id, isRead: true } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications-unread-count"] });
    },
  });

  // 4. Mark All Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllReadFn({ data: undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications-unread-count"] });
    },
  });

  // 5. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotifFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications-unread-count"] });
    },
  });

  // 6. Real-time Supabase Subscription
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      currentUserIdRef.current = data?.session?.user?.id ?? null;
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      currentUserIdRef.current = session?.user?.id ?? null;
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications-unread-count"] });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!enableRealtime || typeof window === "undefined") return;

    const channelName = "admin_notifications_realtime_" + Math.random().toString(36).slice(2, 7);
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_notifications",
        },
        (payload) => {
          const rec = (payload.new || payload.old) as AdminNotification | undefined;
          if (!rec) return;

          // Only process notifications intended for this user or broadcast (null)
          const uid = currentUserIdRef.current;
          if (rec.recipient_user_id && uid && rec.recipient_user_id !== uid) {
            return;
          }

          // If new notification arrived, show toast and play chime
          if (payload.eventType === "INSERT") {
            const notif = payload.new as AdminNotification;
            playNotificationChime();

            // Optimistically update unread count immediately
            queryClient.setQueryData(
              ["admin", "notifications-unread-count"],
              (old: { count: number } | undefined) => ({
                count: (old?.count ?? 0) + 1,
              }),
            );

            const targetUrl = getNotificationRoute(notif);
            toast(notif.title, {
              description: notif.message,
              action: {
                label: "View",
                onClick: () => {
                  void navigate({ to: targetUrl as any });
                },
              },
              duration: 6000,
            });
          }

          // Invalidate caches to sync full list and unread count from server
          queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "notifications-unread-count"] });
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("[useAdminNotifications] Realtime channel error, will retry on reconnection.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enableRealtime, queryClient, navigate]);

  return {
    notifications: listQuery.data?.notifications ?? [],
    total: listQuery.data?.total ?? 0,
    unreadCount: unreadCountQuery.data?.count ?? listQuery.data?.unreadCount ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: () => {
      void listQuery.refetch();
      void unreadCountQuery.refetch();
    },
    markRead: (id: string) => markReadMutation.mutateAsync(id),
    markAllRead: () => markAllReadMutation.mutateAsync(),
    deleteNotification: (id: string) => deleteMutation.mutateAsync(id),
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
