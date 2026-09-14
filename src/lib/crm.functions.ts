import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Customer / follow-up / task / document-review server layer.
 *
 * This extends the existing admin desk: same auth middleware, same
 * request-scoped Supabase client (so RLS re-checks every read and write),
 * same `lead_activity` history table. Nothing here is reachable without a
 * validated bearer token AND a team role in the database.
 */

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "ppt",
  "pptx",
  "txt",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "zip",
];

export const DOC_STATUSES = ["uploaded", "under_review", "approved", "rejected"] as const;
export const FOLLOW_UP_STATUSES = ["pending", "completed", "cancelled"] as const;
export const TASK_STATUSES = ["open", "completed", "cancelled"] as const;

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

async function requireManager(ctx: Ctx) {
  const roles = await requireTeam(ctx);
  if (!roles.includes("admin") && !roles.includes("manager")) {
    throw new Error("Forbidden: this action needs an admin or manager account.");
  }
  return roles;
}

/** Appends to the EXISTING activity/history table. */
async function logActivity(
  ctx: Ctx,
  entry: {
    leadId?: string | null;
    customerId?: string | null;
    action: string;
    detail?: Record<string, unknown>;
  },
) {
  await ctx.supabase.from("lead_activity").insert({
    lead_id: entry.leadId ?? null,
    customer_id: entry.customerId ?? null,
    actor_id: ctx.userId,
    action: entry.action,
    detail: entry.detail ?? {},
  });
}

function dayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86_400_000 - 1);
  return { start, end };
}

/* ------------------------------------------------------- lead → customer */

export const convertLeadToCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: lead, error: leadError } = await ctx.supabase
      .from("leads")
      .select("id, name, email, phone, company, city, division, customer_id")
      .eq("id", data.leadId)
      .maybeSingle();
    if (leadError) throw new Error("Could not read this enquiry.");
    if (!lead) throw new Error("This enquiry no longer exists.");

    // Already converted — never create a second customer.
    if (lead.customer_id) return { customerId: lead.customer_id as string, created: false };

    const email = (lead.email ?? "").trim().toLowerCase();
    let customerId: string | null = null;

    if (email) {
      const { data: existing } = await ctx.supabase
        .from("customers")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      if (existing?.id) customerId = existing.id as string;
    }

    let created = false;
    if (!customerId) {
      const { data: inserted, error } = await ctx.supabase
        .from("customers")
        .insert({
          origin_lead_id: lead.id,
          name: lead.name,
          email: email || null,
          phone: lead.phone,
          company: lead.company,
          city: lead.city,
          division: lead.division,
          created_by: ctx.userId,
        })
        .select("id")
        .single();
      if (error || !inserted) throw new Error("Could not create the customer record.");
      customerId = inserted.id as string;
      created = true;
    }

    // The lead itself is preserved; it is only linked.
    const { error: linkError } = await ctx.supabase
      .from("leads")
      .update({ customer_id: customerId })
      .eq("id", lead.id);
    if (linkError) throw new Error("Could not link this enquiry to the customer.");

    await logActivity(ctx, {
      leadId: lead.id,
      customerId,
      action: "converted_to_customer",
      detail: { customerId, created },
    });
    if (created) {
      await logActivity(ctx, {
        customerId,
        action: "customer_created",
        detail: { fromLead: lead.id },
      });
    }

    return { customerId, created };
  });

/* ------------------------------------------------------------- customers */

const customerListSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(20).optional(),
  division: z.string().trim().max(20).optional(),
  sort: z.enum(["newest", "oldest", "name", "updated"]).default("newest"),
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
});

export const listCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => customerListSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    let query = ctx.supabase
      .from("customers")
      .select("id, name, email, phone, company, city, division, status, created_at, updated_at", {
        count: "exact",
      });

    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.division && data.division !== "all") query = query.eq("division", data.division);
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,company.ilike.%${term}%,city.ilike.%${term}%`,
        );
      }
    }

    if (data.sort === "oldest") query = query.order("created_at", { ascending: true });
    else if (data.sort === "name") query = query.order("name", { ascending: true });
    else if (data.sort === "updated") query = query.order("updated_at", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await query.range(from, from + data.pageSize - 1);
    if (error) throw new Error("Could not load customers.");

    return {
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      rows: rows ?? [],
    };
  });

export const getCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: customer, error } = await ctx.supabase
      .from("customers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("Could not load this customer.");
    if (!customer) return null;

    const [leads, followUps, tasks, documents, activity] = await Promise.all([
      ctx.supabase
        .from("leads")
        .select(
          "id, reference, service, division, status, priority, score, estimated_value, details, created_at",
        )
        .eq("customer_id", data.id)
        .order("created_at", { ascending: false }),
      ctx.supabase
        .from("follow_ups")
        .select("*")
        .eq("customer_id", data.id)
        .order("due_at", { ascending: true }),
      ctx.supabase
        .from("tasks")
        .select("*")
        .eq("customer_id", data.id)
        .order("created_at", { ascending: false }),
      ctx.supabase
        .from("documents")
        .select("*")
        .eq("customer_id", data.id)
        .order("created_at", { ascending: false }),
      ctx.supabase
        .from("lead_activity")
        .select("id, action, detail, actor_id, lead_id, created_at")
        .eq("customer_id", data.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const leadIds = (leads.data ?? []).map((l: any) => l.id);
    let notes: any[] = [];
    if (leadIds.length > 0) {
      const { data: n } = await ctx.supabase
        .from("lead_notes")
        .select("id, note, author_id, created_at, lead_id")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false });
      notes = n ?? [];
    }

    // Bookings recorded on the linked enquiries (existing booking flow).
    const bookings = (leads.data ?? [])
      .map((l: any) => ({
        leadId: l.id,
        reference: l.reference,
        service: l.service,
        date: (l.details?.preferredDate as string) ?? null,
        contactMethod: (l.details?.contactMethod as string) ?? null,
      }))
      .filter((b: any) => Boolean(b.date));

    return {
      customer,
      leads: leads.data ?? [],
      bookings,
      followUps: followUps.data ?? [],
      tasks: tasks.data ?? [],
      documents: documents.data ?? [],
      notes,
      activity: activity.data ?? [],
    };
  });

const customerUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(160).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  company: z.string().trim().max(160).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  address: z.string().trim().max(400).nullable().optional(),
  status: z.enum(["active", "on_hold", "closed"]).optional(),
});

const customerCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  company: z.string().trim().max(160).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  division: z.string().trim().max(50).nullable().optional(),
});

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => customerCreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    const email = data.email?.trim().toLowerCase() || null;
    const { data: customer, error } = await ctx.supabase
      .from("customers")
      .insert({
        name: data.name,
        email,
        phone: data.phone || null,
        company: data.company || null,
        city: data.city || null,
        division: data.division || null,
        created_by: ctx.userId,
      })
      .select("id")
      .single();
    if (error || !customer) {
      if (String(error?.message).includes("customers_email_unique")) {
        throw new Error("A customer with this email address already exists.");
      }
      throw new Error("Could not create customer: " + (error?.message || "Unknown error"));
    }
    await logActivity(ctx, {
      customerId: customer.id,
      action: "customer_created",
      detail: { createdDirectly: true },
    });
    return { id: customer.id };
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => customerUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { id, ...rest } = data;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined) continue;
      patch[key] = typeof value === "string" && value.trim() === "" ? null : value;
    }
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await ctx.supabase.from("customers").update(patch).eq("id", id);
    if (error) {
      if (String(error.message).includes("customers_email_unique")) {
        throw new Error("Another customer already uses this email address.");
      }
      throw new Error("Could not save the customer.");
    }
    await logActivity(ctx, {
      customerId: id,
      action: "customer_updated",
      detail: { fields: Object.keys(patch) },
    });
    return { ok: true };
  });

/* ------------------------------------------------------------ follow-ups */

const followUpCreateSchema = z
  .object({
    leadId: z.string().uuid().nullable().optional(),
    customerId: z.string().uuid().nullable().optional(),
    assignedTo: z.string().uuid().nullable().optional(),
    dueAt: z.string().min(4).max(40),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => Boolean(v.leadId || v.customerId), {
    message: "A follow-up must belong to an enquiry or a customer.",
  });

export const createFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => followUpCreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const due = new Date(data.dueAt);
    if (Number.isNaN(due.getTime())) throw new Error("Please choose a valid follow-up date.");

    const { data: row, error } = await ctx.supabase
      .from("follow_ups")
      .insert({
        lead_id: data.leadId ?? null,
        customer_id: data.customerId ?? null,
        assigned_to: data.assignedTo ?? null,
        due_at: due.toISOString(),
        notes: data.notes ?? null,
        created_by: ctx.userId,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not create the follow-up.");

    await logActivity(ctx, {
      leadId: data.leadId ?? null,
      customerId: data.customerId ?? null,
      action: "follow_up_created",
      detail: { dueAt: due.toISOString() },
    });
    return { id: row.id as string };
  });

const followUpUpdateSchema = z.object({
  id: z.string().uuid(),
  dueAt: z.string().min(4).max(40).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(FOLLOW_UP_STATUSES).optional(),
});

export const updateFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => followUpUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: current } = await ctx.supabase
      .from("follow_ups")
      .select("id, lead_id, customer_id, due_at, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!current) throw new Error("This follow-up no longer exists.");

    const patch: Record<string, unknown> = {};
    if (data.dueAt) {
      const due = new Date(data.dueAt);
      if (Number.isNaN(due.getTime())) throw new Error("Please choose a valid follow-up date.");
      patch["due_at"] = due.toISOString();
    }
    if (data.assignedTo !== undefined) patch["assigned_to"] = data.assignedTo;
    if (data.notes !== undefined) patch["notes"] = data.notes;
    if (data.status) {
      patch["status"] = data.status;
      patch["completed_at"] = data.status === "completed" ? new Date().toISOString() : null;
    }
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await ctx.supabase.from("follow_ups").update(patch).eq("id", data.id);
    if (error) throw new Error("Could not save the follow-up.");

    const action =
      data.status === "completed"
        ? "follow_up_completed"
        : data.status === "cancelled"
          ? "follow_up_cancelled"
          : patch["due_at"]
            ? "follow_up_rescheduled"
            : "follow_up_updated";
    await logActivity(ctx, {
      leadId: current.lead_id,
      customerId: current.customer_id,
      action,
      detail: { from: current.due_at, to: patch["due_at"] ?? current.due_at },
    });
    return { ok: true };
  });

const followUpListSchema = z.object({
  leadId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  scope: z.enum(["today", "upcoming", "overdue", "completed", "all"]).default("today"),
  assignment: z.enum(["any", "mine"]).default("any"),
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
});

export const listFollowUps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => followUpListSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    const { start, end } = dayBounds();

    let query = ctx.supabase
      .from("follow_ups")
      .select(
        "id, lead_id, customer_id, assigned_to, due_at, notes, status, completed_at, created_at",
        { count: "exact" },
      );

    if (data.scope === "today") {
      query = query
        .eq("status", "pending")
        .gte("due_at", start.toISOString())
        .lte("due_at", end.toISOString());
    } else if (data.scope === "overdue") {
      query = query.eq("status", "pending").lt("due_at", start.toISOString());
    } else if (data.scope === "upcoming") {
      query = query.eq("status", "pending").gt("due_at", end.toISOString());
    } else if (data.scope === "completed") {
      query = query.eq("status", "completed");
    }
    if (data.assignment === "mine") query = query.eq("assigned_to", ctx.userId);
    if (data.leadId) query = query.eq("lead_id", data.leadId);
    if (data.customerId) query = query.eq("customer_id", data.customerId);

    query = query.order("due_at", { ascending: data.scope !== "completed" });
    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await query.range(from, from + data.pageSize - 1);
    if (error) throw new Error("Could not load follow-ups.");

    const leadIds = Array.from(new Set((rows ?? []).map((r: any) => r.lead_id).filter(Boolean)));
    const customerIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.customer_id).filter(Boolean)),
    );
    const [leads, customers] = await Promise.all([
      leadIds.length
        ? ctx.supabase.from("leads").select("id, name, reference").in("id", leadIds)
        : Promise.resolve({ data: [] }),
      customerIds.length
        ? ctx.supabase.from("customers").select("id, name").in("id", customerIds)
        : Promise.resolve({ data: [] }),
    ]);

    return {
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      rows: (rows ?? []).map((r: any) => ({
        ...r,
        leadName: (leads.data ?? []).find((l: any) => l.id === r.lead_id)?.name ?? null,
        leadReference: (leads.data ?? []).find((l: any) => l.id === r.lead_id)?.reference ?? null,
        customerName: (customers.data ?? []).find((c: any) => c.id === r.customer_id)?.name ?? null,
      })),
    };
  });

/* ----------------------------------------------------------------- tasks */

const taskCreateSchema = z.object({
  leadId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(2).max(200),
  notes: z.string().trim().max(2000).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueAt: z.string().max(40).nullable().optional(),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
});

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => taskCreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    let dueAt: string | null = null;
    if (data.dueAt) {
      const d = new Date(data.dueAt);
      if (Number.isNaN(d.getTime())) throw new Error("Please choose a valid due date.");
      dueAt = d.toISOString();
    }

    const { data: row, error } = await ctx.supabase
      .from("tasks")
      .insert({
        lead_id: data.leadId ?? null,
        customer_id: data.customerId ?? null,
        title: data.title,
        notes: data.notes ?? null,
        assigned_to: data.assignedTo ?? null,
        due_at: dueAt,
        priority: data.priority,
        created_by: ctx.userId,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not create the task.");

    await logActivity(ctx, {
      leadId: data.leadId ?? null,
      customerId: data.customerId ?? null,
      action: "task_created",
      detail: { title: data.title },
    });
    return { id: row.id as string };
  });

const taskUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(TASK_STATUSES).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueAt: z.string().max(40).nullable().optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => taskUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: current } = await ctx.supabase
      .from("tasks")
      .select("id, lead_id, customer_id, title, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!current) throw new Error("This task no longer exists.");

    const patch: Record<string, unknown> = {};
    if (data.status) {
      patch["status"] = data.status;
      patch["completed_at"] = data.status === "completed" ? new Date().toISOString() : null;
    }
    if (data.assignedTo !== undefined) patch["assigned_to"] = data.assignedTo;
    if (data.priority) patch["priority"] = data.priority;
    if (data.notes !== undefined) patch["notes"] = data.notes;
    if (data.dueAt !== undefined) {
      if (!data.dueAt) patch["due_at"] = null;
      else {
        const d = new Date(data.dueAt);
        if (Number.isNaN(d.getTime())) throw new Error("Please choose a valid due date.");
        patch["due_at"] = d.toISOString();
      }
    }
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await ctx.supabase.from("tasks").update(patch).eq("id", data.id);
    if (error) throw new Error("Could not save the task.");

    await logActivity(ctx, {
      leadId: current.lead_id,
      customerId: current.customer_id,
      action:
        data.status === "completed"
          ? "task_completed"
          : data.status === "open"
            ? "task_reopened"
            : "task_updated",
      detail: { title: current.title },
    });
    return { ok: true };
  });

const taskListSchema = z.object({
  leadId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  scope: z.enum(["open", "completed", "all"]).default("open"),
  assignment: z.enum(["any", "mine"]).default("any"),
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
});

export const listTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => taskListSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    let query = ctx.supabase.from("tasks").select("*", { count: "exact" });
    if (data.scope === "open") query = query.eq("status", "open");
    else if (data.scope === "completed") query = query.eq("status", "completed");
    if (data.assignment === "mine") query = query.eq("assigned_to", ctx.userId);
    if (data.leadId) query = query.eq("lead_id", data.leadId);
    if (data.customerId) query = query.eq("customer_id", data.customerId);
    query = query.order("due_at", { ascending: true, nullsFirst: false });

    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await query.range(from, from + data.pageSize - 1);
    if (error) {
      if (error.code === "PGRST205" || /schema cache/i.test(error.message)) {
        console.warn("[listTasks] 'tasks' table not yet migrated in Supabase.");
        return { total: 0, page: data.page, pageSize: data.pageSize, rows: [], notMigrated: true };
      }
      throw new Error("Could not load tasks.");
    }

    const leadIds = Array.from(new Set((rows ?? []).map((r: any) => r.lead_id).filter(Boolean)));
    const customerIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.customer_id).filter(Boolean)),
    );
    const [leads, customers] = await Promise.all([
      leadIds.length
        ? ctx.supabase.from("leads").select("id, name, reference").in("id", leadIds)
        : Promise.resolve({ data: [] }),
      customerIds.length
        ? ctx.supabase.from("customers").select("id, name").in("id", customerIds)
        : Promise.resolve({ data: [] }),
    ]);

    return {
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      rows: (rows ?? []).map((r: any) => ({
        ...r,
        leadName: (leads.data ?? []).find((l: any) => l.id === r.lead_id)?.name ?? null,
        leadReference: (leads.data ?? []).find((l: any) => l.id === r.lead_id)?.reference ?? null,
        customerName: (customers.data ?? []).find((c: any) => c.id === r.customer_id)?.name ?? null,
      })),
    };
  });

/* ------------------------------------------------------------- documents */

const documentRegisterSchema = z
  .object({
    leadId: z.string().uuid().nullable().optional(),
    customerId: z.string().uuid().nullable().optional(),
    path: z
      .string()
      .max(400)
      .regex(/^[a-z0-9-]+\/[\w.\-]+$/i, "Invalid document path"),
    name: z.string().trim().min(1).max(200),
    mimeType: z.string().trim().max(120).optional(),
    sizeBytes: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES),
    replacesDocumentId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => Boolean(v.leadId || v.customerId), {
    message: "A document must belong to an enquiry or a customer.",
  })
  .refine((v) => ALLOWED_EXT.includes((v.name.split(".").pop() ?? "").toLowerCase()), {
    message: "That file type is not accepted.",
  });

/**
 * Records a file that already lives in the private `lead-uploads` bucket so it
 * can go through review. Size and type are re-validated server-side.
 */
export const registerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => documentRegisterSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: existing } = await ctx.supabase
      .from("documents")
      .select("id")
      .eq("path", data.path)
      .maybeSingle();
    if (existing?.id) return { id: existing.id as string, created: false };

    const { data: profile } = await ctx.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", ctx.userId)
      .maybeSingle();

    const { data: row, error } = await ctx.supabase
      .from("documents")
      .insert({
        lead_id: data.leadId ?? null,
        customer_id: data.customerId ?? null,
        path: data.path,
        name: data.name,
        mime_type: data.mimeType ?? null,
        size_bytes: data.sizeBytes,
        uploaded_by: ctx.userId,
        uploaded_by_label: profile?.full_name ?? profile?.email ?? null,
        replaces_document_id: data.replacesDocumentId ?? null,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not save this document.");

    if (data.replacesDocumentId) {
      await ctx.supabase
        .from("documents")
        .update({ status: "under_review" })
        .eq("id", data.replacesDocumentId);
    }

    await logActivity(ctx, {
      leadId: data.leadId ?? null,
      customerId: data.customerId ?? null,
      action: "document_uploaded",
      detail: { name: data.name },
    });
    return { id: row.id as string, created: true };
  });

/**
 * Imports the attachments already stored on an enquiry into the review
 * workflow. Existing visitor uploads keep working exactly as before.
 */
export const syncLeadDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: lead } = await ctx.supabase
      .from("leads")
      .select("id, attachments, customer_id")
      .eq("id", data.leadId)
      .maybeSingle();
    if (!lead) throw new Error("This enquiry no longer exists.");

    const attachments = (lead.attachments ?? []) as Array<{
      name: string;
      path: string;
      size: number;
    }>;
    if (attachments.length === 0) return { imported: 0 };

    const { data: known } = await ctx.supabase
      .from("documents")
      .select("path")
      .in(
        "path",
        attachments.map((a) => a.path),
      );
    const knownPaths = new Set((known ?? []).map((d: any) => d.path));
    const missing = attachments.filter((a) => !knownPaths.has(a.path));
    if (missing.length === 0) return { imported: 0 };

    const { error } = await ctx.supabase.from("documents").insert(
      missing.map((a) => ({
        lead_id: lead.id,
        customer_id: lead.customer_id ?? null,
        path: a.path,
        name: a.name,
        size_bytes: Math.min(a.size ?? 0, MAX_UPLOAD_BYTES),
        uploaded_by_label: "Customer upload",
      })),
    );
    if (error) throw new Error("Could not import the uploaded documents.");
    return { imported: missing.length };
  });

export const listDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        leadId: z.string().uuid().optional(),
        customerId: z.string().uuid().optional(),
        status: z.enum(["all", ...DOC_STATUSES]).default("all"),
        page: z.number().int().min(1).max(1000).default(1),
        pageSize: z.number().int().min(5).max(100).default(20),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    let query = ctx.supabase.from("documents").select("*", { count: "exact" });
    if (data.leadId) query = query.eq("lead_id", data.leadId);
    if (data.customerId) query = query.eq("customer_id", data.customerId);
    if (data.status !== "all") query = query.eq("status", data.status);
    query = query.order("created_at", { ascending: false });

    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await query.range(from, from + data.pageSize - 1);
    if (error) {
      if (error.code === "PGRST205" || /schema cache/i.test(error.message)) {
        console.warn("[listDocuments] 'documents' table not yet migrated in Supabase.");
        return { total: 0, page: data.page, pageSize: data.pageSize, rows: [], notMigrated: true };
      }
      throw new Error("Could not load documents.");
    }
    return { total: count ?? 0, page: data.page, pageSize: data.pageSize, rows: rows ?? [] };
  });

export const reviewDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(DOC_STATUSES),
        rejectionReason: z.string().trim().max(500).nullable().optional(),
      })
      .refine((v) => v.status !== "rejected" || Boolean(v.rejectionReason?.trim()), {
        message: "Please add a reason when rejecting a document.",
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: current } = await ctx.supabase
      .from("documents")
      .select("id, lead_id, customer_id, name, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!current) throw new Error("This document no longer exists.");

    const { error } = await ctx.supabase
      .from("documents")
      .update({
        status: data.status,
        rejection_reason: data.status === "rejected" ? (data.rejectionReason ?? null) : null,
        reviewed_by: ctx.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not save the review.");

    await logActivity(ctx, {
      leadId: current.lead_id,
      customerId: current.customer_id,
      action:
        data.status === "approved"
          ? "document_approved"
          : data.status === "rejected"
            ? "document_rejected"
            : "document_reviewed",
      detail: { name: current.name, from: current.status, to: data.status },
    });
    return { ok: true };
  });

/* ---------------------------------------------------------- crm metrics */

export const getCrmMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    const { start, end } = dayBounds();
    const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const head = { count: "exact" as const, head: true };
    const [customers, newCustomers, dueToday, overdue, upcoming, openTasks, pendingDocs] =
      await Promise.all([
        ctx.supabase.from("customers").select("id", head),
        ctx.supabase.from("customers").select("id", head).gte("created_at", monthAgo),
        ctx.supabase
          .from("follow_ups")
          .select("id", head)
          .eq("status", "pending")
          .gte("due_at", start.toISOString())
          .lte("due_at", end.toISOString()),
        ctx.supabase
          .from("follow_ups")
          .select("id", head)
          .eq("status", "pending")
          .lt("due_at", start.toISOString()),
        ctx.supabase
          .from("follow_ups")
          .select("id", head)
          .eq("status", "pending")
          .gt("due_at", end.toISOString()),
        ctx.supabase.from("tasks").select("id", head).eq("status", "open"),
        ctx.supabase
          .from("documents")
          .select("id", head)
          .in("status", ["uploaded", "under_review"]),
      ]);

    return {
      customers: customers.count ?? 0,
      newCustomers: newCustomers.count ?? 0,
      followUpsDueToday: dueToday.count ?? 0,
      followUpsOverdue: overdue.count ?? 0,
      followUpsUpcoming: upcoming.count ?? 0,
      openTasks: openTasks.count ?? 0,
      pendingDocumentReviews: pendingDocs.count ?? 0,
    };
  });

/** Signed, short-lived link for a private document (team only). */
export const getDocumentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    const { data: doc } = await ctx.supabase
      .from("documents")
      .select("path")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) throw new Error("Could not open this document.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("lead-uploads")
      .createSignedUrl(doc.path, 300);
    if (error || !signed?.signedUrl) throw new Error("Could not open this document.");
    return { url: signed.signedUrl };
  });

export { requireManager };
