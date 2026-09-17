import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { leadReference } from "@/lib/lead-scoring";
import {
  BOOKING_STATUSES,
  DATE_RE,
  SLOT_DURATION_MINUTES,
  SLOT_TIMES,
  TIME_RE,
  isFutureEnough,
  isOpenDay,
  isWithinWindow,
  slotInstant,
} from "@/lib/booking-slots";

/**
 * Consultation booking layer.
 *
 * Public functions (availability + create) run through the service-role client
 * because visitors are not signed in; every field is validated server-side and
 * nothing about other people's bookings is ever returned.
 *
 * Admin functions reuse the existing `requireSupabaseAuth` middleware, the same
 * request-scoped client (RLS re-checked per query) and the existing
 * `lead_activity` history table.
 */

const DIVISIONS = ["financial", "it", "legal", "engineering"] as const;

type Ctx = { supabase: any; userId: string };

async function loadRoles(ctx: Ctx): Promise<string[]> {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Error("Could not verify your access. Please sign in again.");
  return (data ?? []).map((r: { role: string }) => r.role);
}

async function requireTeam(ctx: Ctx) {
  const roles = await loadRoles(ctx);
  if (roles.length === 0) throw new Error("Forbidden: your account is not part of the team.");
  return roles;
}

async function logActivity(
  ctx: Ctx,
  entry: {
    bookingId?: string | null;
    leadId?: string | null;
    customerId?: string | null;
    action: string;
    detail?: Record<string, unknown>;
  },
) {
  await ctx.supabase.from("lead_activity").insert({
    booking_id: entry.bookingId ?? null,
    lead_id: entry.leadId ?? null,
    customer_id: entry.customerId ?? null,
    actor_id: ctx.userId,
    action: entry.action,
    detail: entry.detail ?? {},
  });
}

const ACTIVE_STATUSES = ["pending", "confirmed", "rescheduled"];

/* ---------------------------------------------------------- availability */

export const getAvailability = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ date: z.string().regex(DATE_RE, "Choose a valid date") }).parse(data),
  )
  .handler(async ({ data }) => {
    const now = new Date();
    if (!isWithinWindow(data.date, now)) {
      return {
        date: data.date,
        closed: true,
        reason: "Pick a date within the next 60 days.",
        slots: [],
      };
    }
    if (!isOpenDay(data.date)) {
      return { date: data.date, closed: true, reason: "We are closed on Sundays.", slots: [] };
    }

    const dayStart = slotInstant(data.date, "00:00")!;
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: taken, error } = await supabaseAdmin
      .from("bookings")
      .select("slot_at")
      .gte("slot_at", dayStart.toISOString())
      .lt("slot_at", dayEnd.toISOString())
      .in("status", ACTIVE_STATUSES);
    if (error) throw new Error("We could not load availability. Please try again shortly.");

    const busy = new Set((taken ?? []).map((r) => new Date(r.slot_at as string).getTime()));

    const slots = SLOT_TIMES.map((time) => {
      const instant = slotInstant(data.date, time)!;
      const available = !busy.has(instant.getTime()) && isFutureEnough(data.date, time, now);
      return { time, available };
    });

    return {
      date: data.date,
      closed: false,
      reason: null as string | null,
      slots,
    };
  });

/* ------------------------------------------------------------ create */

const createSchema = z.object({
  division: z.enum(DIVISIONS),
  service: z.string().trim().max(120).optional(),
  date: z.string().regex(DATE_RE, "Choose a valid date"),
  time: z.string().regex(TIME_RE, "Choose a valid time"),
  meetingType: z.enum(["video", "phone", "office"]),
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(120),
  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[+\d][\d\s()-]{7,19}$/, "Enter a valid phone number"),
  company: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  message: z.string().trim().max(1500).optional(),
  honeypot: z.string().max(0).optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .validator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.honeypot) throw new Error("Submission blocked. Please call us instead.");

    const now = new Date();
    if (!SLOT_TIMES.includes(data.time as (typeof SLOT_TIMES)[number])) {
      throw new Error("That time is not one of our consultation slots.");
    }
    if (!isWithinWindow(data.date, now)) throw new Error("Pick a date within the next 60 days.");
    if (!isOpenDay(data.date))
      throw new Error("We are closed on Sundays. Please pick another day.");
    if (!isFutureEnough(data.date, data.time, now)) {
      throw new Error("That slot has passed. Please choose a later time.");
    }
    const instant = slotInstant(data.date, data.time);
    if (!instant) throw new Error("That date and time could not be understood.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    // Same person, same slot request twice — return the existing booking.
    const { data: mine } = await supabaseAdmin
      .from("bookings")
      .select("reference, slot_at, status")
      .eq("email", email)
      .eq("slot_at", instant.toISOString())
      .in("status", ACTIVE_STATUSES)
      .maybeSingle();
    if (mine) {
      return {
        reference: mine.reference as string,
        slotAt: mine.slot_at as string,
        duplicate: true,
      };
    }

    // Slot already held by someone else.
    const { data: clash, error: clashError } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("slot_at", instant.toISOString())
      .in("status", ACTIVE_STATUSES)
      .limit(1);
    if (clashError) throw new Error("We could not reach our systems. Please try again shortly.");
    if (clash && clash.length > 0) {
      throw new Error("That slot was just taken. Please choose another time.");
    }

    // Reuse an existing enquiry/customer for this person instead of duplicating.
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id, customer_id")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let customerId = (lead?.customer_id as string | null) ?? null;
    if (!customerId) {
      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      customerId = (customer?.id as string | null) ?? null;
    }

    const row = (reference: string) => ({
      reference,
      lead_id: (lead?.id as string | undefined) ?? null,
      customer_id: customerId,
      division: data.division,
      service: data.service ?? null,
      name: data.name,
      email,
      phone: data.phone,
      company: data.company ?? null,
      city: data.city ?? null,
      message: data.message ?? null,
      meeting_type: data.meetingType,
      slot_at: instant.toISOString(),
      duration_minutes: SLOT_DURATION_MINUTES,
      status: "pending",
      source: "book-page",
    });

    let reference = `BK-${leadReference(data.division).split("-").slice(1).join("-")}`;
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: insertedBooking, error } = await supabaseAdmin
        .from("bookings")
        .insert(row(reference))
        .select("id")
        .maybeSingle();

      if (!error) {
        if (lead?.id) {
          await supabaseAdmin.from("lead_activity").insert({
            lead_id: lead.id,
            customer_id: customerId,
            action: "booking_created",
            detail: { reference, slotAt: instant.toISOString() },
          });
        }

        // 1. Trigger automated email notifications asynchronously
        try {
          const { sendBookingNotifications } = await import("@/lib/notifications.server");
          void sendBookingNotifications({
            reference,
            name: data.name,
            email,
            phone: data.phone,
            company: data.company,
            division: data.division,
            service: data.service,
            slotAt: instant.toISOString(),
            meetingType: data.meetingType,
            message: data.message,
          }).catch((err) => console.error("[createBooking] Notification dispatch failed:", err));
        } catch (notifErr) {
          console.error("[createBooking] Notification module error:", notifErr);
        }

        // 2. Trigger real-time admin panel notification asynchronously
        try {
          const { triggerAdminNotification } = await import("@/lib/notifications.functions");
          const formattedTime = instant.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "short",
          });
          try {
            await triggerAdminNotification({
              type: "booking",
              title: "New consultant booking received",
              message: `${data.name} booked a ${data.meetingType || "consultation"} session on ${formattedTime}.`,
              entity_type: "booking",
              entity_id: insertedBooking?.id ? String(insertedBooking.id) : null,
              entity_reference: reference,
              data: {
                name: data.name,
                email,
                phone: data.phone,
                company: data.company,
                division: data.division,
                service: data.service,
                meetingType: data.meetingType,
                slotAt: instant.toISOString(),
                reference,
              },
            });
          } catch (err) {
            console.error("[createBooking] Real-time admin notification error:", err);
          }
        } catch (adminNotifErr) {
          console.error("[createBooking] Could not trigger admin notification:", adminNotifErr);
        }

        return { reference, slotAt: instant.toISOString(), duplicate: false };
      }
      lastError = error.message;
      if (/bookings_active_slot_unique/.test(error.message)) {
        throw new Error("That slot was just taken. Please choose another time.");
      }
      if (!/duplicate key|unique/i.test(error.message)) break;
      reference = `BK-${leadReference(data.division).split("-").slice(1).join("-")}`;
    }
    console.error("[createBooking] insert failed:", lastError);
    throw new Error("We could not save your booking. Please try again or call us directly.");
  });

/* ------------------------------------------------------------- admin */

const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(20).optional(),
  division: z.string().trim().max(20).optional(),
  assignedTo: z.string().trim().max(60).optional(),
  from: z.string().trim().max(20).optional(),
  to: z.string().trim().max(20).optional(),
  sort: z.enum(["upcoming", "newest"]).default("upcoming"),
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
});

export const listBookings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => listSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    let query = ctx.supabase
      .from("bookings")
      .select(
        "id, reference, name, email, phone, company, division, service, meeting_type, slot_at, duration_minutes, status, assigned_to, lead_id, customer_id, created_at",
        { count: "exact" },
      );

    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.division && data.division !== "all") query = query.eq("division", data.division);
    if (data.assignedTo === "unassigned") query = query.is("assigned_to", null);
    else if (data.assignedTo === "me") query = query.eq("assigned_to", ctx.userId);
    else if (data.assignedTo && data.assignedTo !== "all")
      query = query.eq("assigned_to", data.assignedTo);
    if (data.from && DATE_RE.test(data.from))
      query = query.gte("slot_at", slotInstant(data.from, "00:00")!.toISOString());
    if (data.to && DATE_RE.test(data.to)) {
      const end = slotInstant(data.to, "00:00")!;
      query = query.lt("slot_at", new Date(end.getTime() + 86_400_000).toISOString());
    }
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,company.ilike.%${term}%,reference.ilike.%${term}%,service.ilike.%${term}%`,
        );
      }
    }

    query =
      data.sort === "newest"
        ? query.order("created_at", { ascending: false })
        : query.order("slot_at", { ascending: true });

    const fromIdx = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await query.range(fromIdx, fromIdx + data.pageSize - 1);
    if (error) throw new Error("Could not load bookings.");

    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const getBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: booking, error } = await ctx.supabase
      .from("bookings")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("Could not load this booking.");
    if (!booking) throw new Error("This booking no longer exists.");

    const { data: history } = await ctx.supabase
      .from("lead_activity")
      .select("id, action, detail, created_at, actor_id")
      .eq("booking_id", data.id)
      .order("created_at", { ascending: false })
      .limit(50);

    return { booking, history: history ?? [] };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(BOOKING_STATUSES).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  internalNotes: z.string().trim().max(2000).optional(),
  cancelReason: z.string().trim().max(300).optional(),
  date: z.string().regex(DATE_RE).optional(),
  time: z.string().regex(TIME_RE).optional(),
});

export const updateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: current, error: readError } = await ctx.supabase
      .from("bookings")
      .select("id, status, slot_at, lead_id, customer_id, reference")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error("Could not read this booking.");
    if (!current) throw new Error("This booking no longer exists.");

    const patch: Record<string, unknown> = {};

    if (data.date || data.time) {
      if (!data.date || !data.time) throw new Error("Pick both a new date and a new time.");
      if (!SLOT_TIMES.includes(data.time as (typeof SLOT_TIMES)[number])) {
        throw new Error("That time is not one of our consultation slots.");
      }
      if (!isOpenDay(data.date)) throw new Error("We are closed on Sundays.");
      const instant = slotInstant(data.date, data.time);
      if (!instant) throw new Error("That date and time could not be understood.");

      const { data: clash } = await ctx.supabase
        .from("bookings")
        .select("id")
        .eq("slot_at", instant.toISOString())
        .in("status", ACTIVE_STATUSES)
        .neq("id", data.id)
        .limit(1);
      if (clash && clash.length > 0) throw new Error("Another booking already holds that slot.");

      patch["slot_at"] = instant.toISOString();
      patch["rescheduled_from"] = current.slot_at;
      patch["status"] = data.status ?? "rescheduled";
    }

    if (data.status && patch["status"] === undefined) patch["status"] = data.status;
    if (data.assignedTo !== undefined) patch["assigned_to"] = data.assignedTo;
    if (data.internalNotes !== undefined) patch["internal_notes"] = data.internalNotes;
    if (data.cancelReason !== undefined) patch["cancel_reason"] = data.cancelReason;

    if (patch["status"] === "cancelled" && !(data.cancelReason ?? "").trim()) {
      throw new Error("Add a short reason when cancelling a booking.");
    }
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await ctx.supabase.from("bookings").update(patch).eq("id", data.id);
    if (error) {
      if (/bookings_active_slot_unique/.test(error.message)) {
        throw new Error("Another booking already holds that slot.");
      }
      throw new Error("Could not update this booking.");
    }

    await logActivity(ctx, {
      bookingId: data.id,
      leadId: current.lead_id,
      customerId: current.customer_id,
      action: patch["slot_at"] ? "booking_rescheduled" : "booking_updated",
      detail: {
        reference: current.reference,
        ...(patch["status"] ? { status: patch["status"], from: current.status } : {}),
        ...(patch["slot_at"] ? { from: current.slot_at, to: patch["slot_at"] } : {}),
        ...(data.assignedTo !== undefined ? { assignedTo: data.assignedTo } : {}),
      },
    });

    return { ok: true };
  });
