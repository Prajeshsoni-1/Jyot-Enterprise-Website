import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type NotificationType = "booking" | "job_application" | "enquiry" | "request";
export type NotificationEntityType = "booking" | "job_application" | "lead";

export interface AdminNotification {
  id: string;
  recipient_user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: NotificationEntityType;
  entity_id: string | null;
  entity_reference: string | null;
  data: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface TriggerNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  entity_type: NotificationEntityType;
  entity_id: string | null;
  entity_reference?: string | null;
  data?: Record<string, any>;
  recipientUserId?: string | null;
}

type Ctx = { supabase: any; userId: string; claims?: Record<string, unknown> };

async function requireTeam(ctx: Ctx) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error || !data || data.length === 0) {
    throw new Error("Forbidden: team access required.");
  }
  return data.map((r: { role: string }) => r.role);
}

// In-process memory buffer for seamless fallback during migrations or local testing
const fallbackNotifications: AdminNotification[] = [];

/**
 * Triggers an admin notification across all authorized team members.
 * Includes 5-minute duplicate prevention and safe try/catch wrapper.
 */
export async function triggerAdminNotification(input: TriggerNotificationInput): Promise<void> {
  try {
    const entityId = input.entity_id ? String(input.entity_id) : null;
    const entityRef = input.entity_reference ? String(input.entity_reference) : null;
    const nowIso = new Date().toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // 1. Resolve recipients from user_roles (all admins and managers)
    let recipientIds: string[] = [];
    if (input.recipientUserId) {
      recipientIds = [input.recipientUserId];
    } else {
      try {
        const { data: teamRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, role")
          .in("role", ["admin", "manager", "staff"]);
        if (teamRoles && teamRoles.length > 0) {
          recipientIds = Array.from(
            new Set(teamRoles.map((r: { user_id: string }) => r.user_id).filter(Boolean)),
          );
        }
      } catch (roleErr) {
        console.warn("[triggerAdminNotification] Could not load team roles:", roleErr);
      }
    }

    // Default to at least one broadcast row if no explicit recipient IDs found
    if (recipientIds.length === 0) {
      recipientIds = [null as unknown as string];
    }

    for (const recipientId of recipientIds) {
      // 2. Duplicate prevention check (entity_type + entity_id or reference within 5 minutes)
      let isDuplicate = false;

      // Check DB for existing notification
      try {
        let dupQuery = (supabaseAdmin as any)
          .from("admin_notifications")
          .select("id")
          .eq("entity_type", input.entity_type)
          .gte("created_at", fiveMinutesAgo)
          .limit(1);

        if (recipientId) dupQuery = dupQuery.eq("recipient_user_id", recipientId);
        if (entityId) dupQuery = dupQuery.eq("entity_id", entityId);
        else if (entityRef) dupQuery = dupQuery.eq("entity_reference", entityRef);

        const { data: dupData } = await dupQuery;
        if (dupData && dupData.length > 0) isDuplicate = true;
      } catch {
        // Table might not exist yet, check fallback buffer
        const found = fallbackNotifications.find(
          (n) =>
            n.entity_type === input.entity_type &&
            ((entityId && n.entity_id === entityId) || (entityRef && n.entity_reference === entityRef)) &&
            (!recipientId || n.recipient_user_id === recipientId) &&
            new Date(n.created_at).getTime() > Date.now() - 5 * 60 * 1000,
        );
        if (found) isDuplicate = true;
      }

      if (isDuplicate) {
        continue;
      }

      const notifRow: AdminNotification = {
        id: crypto.randomUUID(),
        recipient_user_id: recipientId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        entity_type: input.entity_type,
        entity_id: entityId,
        entity_reference: entityRef,
        data: input.data ?? {},
        is_read: false,
        read_at: null,
        created_at: nowIso,
      };

      // 3. Attempt DB insert
      let dbInserted = false;
      try {
        const { error: insertErr } = await (supabaseAdmin as any).from("admin_notifications").insert({
          id: notifRow.id,
          recipient_user_id: notifRow.recipient_user_id,
          type: notifRow.type,
          title: notifRow.title,
          message: notifRow.message,
          entity_type: notifRow.entity_type,
          entity_id: notifRow.entity_id,
          entity_reference: notifRow.entity_reference,
          data: notifRow.data,
          is_read: false,
          created_at: notifRow.created_at,
        });
        if (!insertErr) {
          dbInserted = true;
        } else {
          console.warn("[triggerAdminNotification] DB insert notice (fallback active):", insertErr.message);
        }
      } catch (dbErr) {
        console.warn("[triggerAdminNotification] DB not available, caching in memory:", dbErr);
      }

      // If DB insert was not available or pending migration, store in memory fallback
      if (!dbInserted) {
        fallbackNotifications.unshift(notifRow);
        if (fallbackNotifications.length > 200) fallbackNotifications.pop();
      }
    }
  } catch (err) {
    // Fail-safe: NEVER block caller flow on notification errors
    console.error("[triggerAdminNotification] Unexpected notification dispatch failure:", err);
  }
}

/* -------------------------------------------------------- Server Functions */

/**
 * List notifications for the authenticated admin user.
 */
export const getAdminNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        filter: z
          .enum(["all", "unread", "booking", "job_application", "enquiry", "request"])
          .default("all"),
        search: z.string().max(200).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const offset = (data.page - 1) * data.pageSize;
    let notifications: AdminNotification[] = [];
    let total = 0;
    let unreadCount = 0;

    // 1. Try DB query
    try {
      // Unread count
      const { count: unread } = await (ctx.supabase as any)
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .or(`recipient_user_id.eq.${ctx.userId},recipient_user_id.is.null`);
      unreadCount = unread ?? 0;

      // Filtered list
      let query = (ctx.supabase as any)
        .from("admin_notifications")
        .select("*", { count: "exact" })
        .or(`recipient_user_id.eq.${ctx.userId},recipient_user_id.is.null`);

      if (data.filter === "unread") {
        query = query.eq("is_read", false);
      } else if (data.filter !== "all") {
        query = query.eq("type", data.filter);
      }

      if (data.search?.trim()) {
        const s = `%${data.search.trim()}%`;
        query = query.or(`title.ilike.${s},message.ilike.${s},entity_reference.ilike.${s}`);
      }

      const { data: rows, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + data.pageSize - 1);

      if (!error && rows) {
        notifications = rows as AdminNotification[];
        total = count ?? rows.length;
        return { notifications, total, unreadCount, page: data.page, pageSize: data.pageSize };
      }
    } catch (e) {
      console.warn("[getAdminNotifications] DB query notice, using fallback memory buffer:", e);
    }

    // 2. Fallback memory buffer
    const userRows = fallbackNotifications.filter(
      (n) => !n.recipient_user_id || n.recipient_user_id === ctx.userId,
    );
    unreadCount = userRows.filter((n) => !n.is_read).length;

    let filtered = userRows;
    if (data.filter === "unread") {
      filtered = filtered.filter((n) => !n.is_read);
    } else if (data.filter !== "all") {
      filtered = filtered.filter((n) => n.type === data.filter);
    }

    if (data.search?.trim()) {
      const q = data.search.trim().toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.entity_reference && n.entity_reference.toLowerCase().includes(q)),
      );
    }

    total = filtered.length;
    notifications = filtered.slice(offset, offset + data.pageSize);

    return { notifications, total, unreadCount, page: data.page, pageSize: data.pageSize };
  });

/**
 * Fast unread notification count.
 */
export const getUnreadNotificationCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    try {
      const { count, error } = await (ctx.supabase as any)
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .or(`recipient_user_id.eq.${ctx.userId},recipient_user_id.is.null`);

      if (!error && typeof count === "number") {
        return { count };
      }
    } catch {
      // fallback
    }

    const fallbackCount = fallbackNotifications.filter(
      (n) => (!n.recipient_user_id || n.recipient_user_id === ctx.userId) && !n.is_read,
    ).length;

    return { count: fallbackCount };
  });

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), isRead: z.boolean().default(true) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const readAt = data.isRead ? new Date().toISOString() : null;

    try {
      await (ctx.supabase as any)
        .from("admin_notifications")
        .update({ is_read: data.isRead, read_at: readAt })
        .eq("id", data.id);
    } catch {
      // fallback
    }

    const match = fallbackNotifications.find((n) => n.id === data.id);
    if (match) {
      match.is_read = data.isRead;
      match.read_at = readAt;
    }

    return { success: true };
  });

/**
 * Mark all unread notifications for current user as read.
 */
export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const nowIso = new Date().toISOString();

    try {
      await (ctx.supabase as any)
        .from("admin_notifications")
        .update({ is_read: true, read_at: nowIso })
        .eq("is_read", false)
        .or(`recipient_user_id.eq.${ctx.userId},recipient_user_id.is.null`);
    } catch {
      // fallback
    }

    for (const n of fallbackNotifications) {
      if (!n.recipient_user_id || n.recipient_user_id === ctx.userId) {
        n.is_read = true;
        n.read_at = nowIso;
      }
    }

    return { success: true };
  });

/**
 * Delete a notification.
 */
export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    try {
      await (ctx.supabase as any).from("admin_notifications").delete().eq("id", data.id);
    } catch {
      // fallback
    }

    const idx = fallbackNotifications.findIndex((n) => n.id === data.id);
    if (idx !== -1) {
      fallbackNotifications.splice(idx, 1);
    }

    return { success: true };
  });

