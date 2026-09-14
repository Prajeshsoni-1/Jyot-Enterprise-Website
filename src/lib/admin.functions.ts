import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin desk server layer.
 *
 * Every function below runs with `requireSupabaseAuth`, so the caller's bearer
 * token is validated server-side before anything else happens. Reads/writes go
 * through the request-scoped Supabase client, which means RLS ("team members
 * only") is enforced a second time by the database — a stolen route path is
 * worthless without a team role. The service-role client is only loaded inside
 * a handler, after the role check, and only to sign private document URLs.
 */

const STATUSES = [
  "new",
  "assigned",
  "contacted",
  "qualified",
  "follow_up",
  "proposal",
  "won",
  "lost",
  "archived",
] as const;
const CLOSED = ["won", "lost", "archived"];
const PRIORITIES = ["High", "Medium", "Low"] as const;

export type LeadStatus = (typeof STATUSES)[number];
export type LeadPriority = (typeof PRIORITIES)[number];

export type TeamRole = "admin" | "manager" | "staff";

type Ctx = { supabase: any; userId: string };

async function loadRoles(ctx: Ctx): Promise<TeamRole[]> {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Error("Could not verify your access. Please sign in again.");
  return (data ?? []).map((r: { role: TeamRole }) => r.role);
}

/** Throws unless the caller holds at least one team role. */
async function requireTeam(ctx: Ctx) {
  const roles = await loadRoles(ctx);
  if (roles.length === 0) throw new Error("Forbidden: your account is not part of the team.");
  return roles;
}

async function requireAdmin(ctx: Ctx) {
  const roles = await requireTeam(ctx);
  if (!roles.includes("admin") && !roles.includes("manager")) {
    throw new Error("Forbidden: this action needs an admin or manager account.");
  }
  return roles;
}

import {
  getEffectiveUser,
  requirePermission,
  protectOwnerSafety,
  logAdminAudit,
} from "./permissions.server";
import {
  calculateEffectivePermissions,
  isRoleAtLeast,
  normalizeRole,
  type AccountStatus,
  type Role,
  type UserPermissionOverrides,
} from "./permissions";

/* ------------------------------------------------------------------ session */

export const getAdminSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const email = ((context as any).claims?.email as string | undefined) ?? null;

    // Keep a lightweight profile row so team members can be assigned by name.
    const { data: existing } = await ctx.supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", ctx.userId)
      .maybeSingle();
    if (!existing) {
      await ctx.supabase
        .from("profiles")
        .insert({ id: ctx.userId, email, full_name: email?.split("@")[0] ?? null });
    }

    const effective = await getEffectiveUser(ctx);
    let adminExists = false;
    try {
      const { count } = await ctx.supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .in("role", ["admin", "owner"]);
      adminExists = (count ?? 0) > 0;
    } catch {
      adminExists = effective.isTeam;
    }

    return {
      userId: ctx.userId,
      email,
      name: effective.name,
      role: effective.role,
      status: effective.status,
      roles: effective.rawRoles,
      isTeam: effective.isTeam,
      isOwner: effective.isOwner,
      permissions: Array.from(effective.effectivePermissions),
      adminExists,
    };
  });

/** One-time bootstrap: the first signed-in account may claim the admin role if no admin exists. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const { count } = await ctx.supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .in("role", ["admin", "owner"]);
    if ((count ?? 0) > 0) {
      return { claimed: false };
    }
    const { error } = await ctx.supabase
      .from("user_roles")
      .insert({ user_id: ctx.userId, role: "admin" });
    if (error) throw new Error("Could not set up the first admin account.");
    return { claimed: true };
  });

/* ---------------------------------------------------------------- dashboard */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const getAdminDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: leads, error } = await ctx.supabase
      .from("leads")
      .select(
        "id, reference, name, email, phone, division, service, status, priority, score, score_value, estimated_value, source, assigned_to, follow_up_at, details, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error("Could not load the dashboard.");

    const rows = leads ?? [];
    const today = startOfToday();
    const todayEnd = new Date(today.getTime() + 86_400_000);
    const isCareer = (r: any) => typeof r.service === "string" && /^application —/i.test(r.service);
    const bookingDate = (r: any) => {
      const raw = r.details?.preferredDate;
      if (!raw || typeof raw !== "string") return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const upcomingBookings = rows
      .map((r: any) => ({ row: r, date: bookingDate(r) }))
      .filter((x: any) => x.date && x.date >= today)
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
      .slice(0, 8)
      .map((x: any) => ({
        id: x.row.id,
        reference: x.row.reference,
        name: x.row.name,
        service: x.row.service,
        date: x.date.toISOString(),
        contactMethod: (x.row.details?.contactMethod as string) ?? null,
      }));

    const followUpsToday = rows
      .filter((r: any) => {
        if (!r.follow_up_at) return false;
        const d = new Date(r.follow_up_at);
        return d < todayEnd;
      })
      .filter((r: any) => !["won", "lost", "archived"].includes(r.status))
      .slice(0, 10);

    const slim = (r: any) => ({
      id: r.id,
      reference: r.reference,
      name: r.name,
      email: r.email,
      phone: r.phone,
      division: r.division,
      service: r.service,
      status: r.status,
      priority: r.priority,
      score: r.score,
      scoreValue: r.score_value,
      estimatedValue: r.estimated_value,
      source: r.source,
      assignedTo: r.assigned_to,
      followUpAt: r.follow_up_at,
      createdAt: r.created_at,
    });

    let publishedContent = 0;
    let draftContent = 0;
    try {
      const cmsTables = [
        "cms_services",
        "cms_sub_services",
        "cms_products",
        "cms_industries",
        "cms_projects",
        "cms_case_studies",
        "cms_posts",
        "cms_resources",
        "cms_testimonials",
        "cms_team_members",
        "cms_faqs",
        "cms_pages",
        "cms_jobs",
        "cms_downloads",
        "cms_offices",
      ];
      const counts = await Promise.all(
        cmsTables.map(async (table) => {
          try {
            const [p, d] = await Promise.all([
              ctx.supabase
                .from(table)
                .select("id", { count: "exact", head: true })
                .eq("status", "published"),
              ctx.supabase
                .from(table)
                .select("id", { count: "exact", head: true })
                .eq("status", "draft"),
            ]);
            return { p: p.count ?? 0, d: d.count ?? 0 };
          } catch {
            return { p: 0, d: 0 };
          }
        }),
      );
      publishedContent = counts.reduce((acc, c) => acc + c.p, 0);
      draftContent = counts.reduce((acc, c) => acc + c.d, 0);
    } catch {
      // graceful fallback
    }

    return {
      stats: {
        total: rows.length,
        newCount: rows.filter((r: any) => r.status === "new").length,
        highPriority: rows.filter((r: any) => r.priority === "High").length,
        pendingFollowUps: rows.filter(
          (r: any) =>
            r.follow_up_at &&
            new Date(r.follow_up_at) < todayEnd &&
            !["won", "lost", "archived"].includes(r.status),
        ).length,
        upcomingBookings: rows.filter((r: any) => {
          const d = bookingDate(r);
          return d !== null && d >= today;
        }).length,
        customers: new Set(rows.map((r: any) => String(r.email).toLowerCase())).size,
        careerApplications: rows.filter(isCareer).length,
        assigned: rows.filter((r: any) => r.status === "assigned").length,
        contacted: rows.filter((r: any) => r.status === "contacted").length,
        qualified: rows.filter((r: any) => r.status === "qualified").length,
        followUp: rows.filter((r: any) => r.status === "follow_up").length,
        proposal: rows.filter((r: any) => r.status === "proposal").length,
        won: rows.filter((r: any) => r.status === "won").length,
        lost: rows.filter((r: any) => r.status === "lost").length,
        unassigned: rows.filter((r: any) => !r.assigned_to && !CLOSED.includes(r.status)).length,
        publishedContent,
        draftContent,
      },
      recent: rows.slice(0, 8).map(slim),
      highPriority: rows
        .filter(
          (r: any) => r.priority === "High" && !["won", "lost", "archived"].includes(r.status),
        )
        .slice(0, 8)
        .map(slim),
      followUpsToday: followUpsToday.map(slim),
      upcomingBookings,
    };
  });

export const adminCreateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(5).max(30),
        email: z.string().trim().email().max(120).optional().or(z.literal("")),
        division: z.enum(["financial", "it", "legal", "engineering"]).default("financial"),
        service: z.string().trim().max(100).default("General Consultation"),
        priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
        message: z.string().trim().max(2000).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    const reference = `JYOT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const { data: row, error } = await ctx.supabase
      .from("leads")
      .insert({
        reference,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        division: data.division,
        service: data.service,
        priority: data.priority,
        status: "new",
        source: "admin_desk",
        details: {
          message: data.message || "Created directly from Admin Desk",
          createdByAdmin: true,
        },
      })
      .select("id, reference")
      .single();
    if (error || !row)
      throw new Error("Could not create lead: " + (error?.message || "Unknown error"));
    return row;
  });

/* --------------------------------------------------------------- enquiries */

const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(20).optional(),
  priority: z.string().trim().max(10).optional(),
  division: z.string().trim().max(20).optional(),
  source: z.string().trim().max(80).optional(),
  assignment: z.enum(["any", "unassigned", "mine"]).default("any"),
  from: z.string().trim().max(30).optional(),
  to: z.string().trim().max(30).optional(),
  sort: z.enum(["newest", "oldest", "score", "updated"]).default("newest"),
  quick: z
    .enum(["none", "new", "high", "unassigned", "followup_due", "followup_today", "won", "lost"])
    .default("none"),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
});

export type EnquiryFilters = z.infer<typeof listSchema>;

export const listEnquiries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    let query = ctx.supabase
      .from("leads")
      .select(
        "id, reference, name, email, phone, division, service, status, priority, score, score_value, estimated_value, source, page_url, assigned_to, follow_up_at, details, created_at, updated_at",
        { count: "exact" },
      );

    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.priority && data.priority !== "all") query = query.eq("priority", data.priority);
    if (data.division && data.division !== "all") query = query.eq("division", data.division);
    if (data.source && data.source !== "all") query = query.eq("source", data.source);
    if (data.assignment === "unassigned") query = query.is("assigned_to", null);
    if (data.assignment === "mine") query = query.eq("assigned_to", ctx.userId);
    if (data.from) query = query.gte("created_at", new Date(data.from).toISOString());
    if (data.to) {
      const to = new Date(data.to);
      to.setHours(23, 59, 59, 999);
      query = query.lte("created_at", to.toISOString());
    }
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,reference.ilike.%${term}%,company.ilike.%${term}%,service.ilike.%${term}%`,
        );
      }
    }

    // Quick filters run server-side on top of the explicit filters above.
    if (data.quick !== "none") {
      const now = new Date();
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      if (data.quick === "new") query = query.eq("status", "new");
      else if (data.quick === "high") query = query.eq("priority", "High");
      else if (data.quick === "unassigned") query = query.is("assigned_to", null);
      else if (data.quick === "won") query = query.eq("status", "won");
      else if (data.quick === "lost") query = query.eq("status", "lost");
      else if (data.quick === "followup_due") {
        query = query.not("follow_up_at", "is", null).lte("follow_up_at", endOfToday.toISOString());
      } else if (data.quick === "followup_today") {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        query = query
          .gte("follow_up_at", startOfDay.toISOString())
          .lte("follow_up_at", endOfToday.toISOString());
      }
      if (data.quick === "followup_due" || data.quick === "followup_today") {
        query = query.not("status", "in", `(${CLOSED.join(",")})`);
      }
    }

    if (data.sort === "oldest") query = query.order("created_at", { ascending: true });
    else if (data.sort === "score") query = query.order("score_value", { ascending: false });
    else if (data.sort === "updated") query = query.order("updated_at", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const fromIdx = (data.page - 1) * data.pageSize;
    query = query.range(fromIdx, fromIdx + data.pageSize - 1);

    const { data: rows, count, error } = await query;
    if (error) throw new Error("Could not load enquiries.");

    return {
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      rows: (rows ?? []).map((r: any) => ({
        id: r.id,
        reference: r.reference,
        name: r.name,
        email: r.email,
        phone: r.phone,
        division: r.division,
        service: r.service,
        status: r.status,
        priority: r.priority,
        score: r.score,
        scoreValue: r.score_value,
        estimatedValue: r.estimated_value,
        source: r.source,
        assignedTo: r.assigned_to,
        followUpAt: r.follow_up_at,
        budget: (r.details?.budget as string) ?? null,
        timeline: (r.details?.timeline as string) ?? null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    };
  });

export const getEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const { data: lead, error } = await ctx.supabase
      .from("leads")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("Could not load this enquiry.");
    if (!lead) return null;

    const [{ data: notes }, { data: activity }] = await Promise.all([
      ctx.supabase
        .from("lead_notes")
        .select("id, note, author_id, created_at")
        .eq("lead_id", data.id)
        .order("created_at", { ascending: false }),
      ctx.supabase
        .from("lead_activity")
        .select("id, action, detail, actor_id, created_at")
        .eq("lead_id", data.id)
        .order("created_at", { ascending: false }),
    ]);

    return { lead, notes: notes ?? [], activity: activity ?? [] };
  });

/** Time-limited signed link for a private document. Never public. */
export const getAttachmentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        path: z
          .string()
          .max(400)
          .regex(/^[a-z0-9-]+\/[\w.\-]+$/i, "Invalid path"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("lead-uploads")
      .createSignedUrl(data.path, 300);
    if (error || !signed?.signedUrl) throw new Error("Could not open this document.");
    return { url: signed.signedUrl };
  });

/* ------------------------------------------------------------------ actions */

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  followUpAt: z.string().max(40).nullable().optional(),
});

export const updateEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    const patch: Record<string, unknown> = {};
    if (data.status) patch["status"] = data.status;
    if (data.priority) {
      await requireAdmin(ctx); // priority drives routing — restricted to admin/manager
      patch["priority"] = data.priority;
    }
    if (data.assignedTo !== undefined) patch["assigned_to"] = data.assignedTo;
    if (data.followUpAt !== undefined) {
      patch["follow_up_at"] = data.followUpAt ? new Date(data.followUpAt).toISOString() : null;
    }
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await ctx.supabase.from("leads").update(patch).eq("id", data.id);
    if (error) throw new Error("Could not save the change. Please try again.");
    return { ok: true };
  });

export const addEnquiryNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), note: z.string().trim().min(2).max(2000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    const { error } = await ctx.supabase
      .from("lead_notes")
      .insert({ lead_id: data.id, note: data.note, author_id: ctx.userId });
    if (error) throw new Error("Could not save the note.");
    return { ok: true };
  });

export const listTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    const { data: roles } = await ctx.supabase.from("user_roles").select("user_id, role");
    const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
    if (ids.length === 0) return [];
    const { data: profiles } = await ctx.supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    return (profiles ?? []).map((p: any) => ({
      id: p.id,
      name: (p.full_name as string) || (p.email as string) || "Team member",
      email: p.email,
      roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
    }));
  });

/* --------------------------------------------------------- team management */

/**
 * All registered accounts with their current role, status and permissions.
 */
export const listAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const caller = await requirePermission(ctx, "system", "view");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw new Error("Could not read registered accounts: " + error.message);

    const { data: roleRows } = await ctx.supabase.from("user_roles").select("user_id, role");
    const { data: profiles } = await ctx.supabase.from("profiles").select("id, full_name, email");

    let dbPerms: any[] = [];
    try {
      const { data: pData } = await ctx.supabase
        .from("user_permissions")
        .select("user_id, module, action, granted");
      if (pData) dbPerms = pData;
    } catch {
      // ignore if table not yet migrated
    }

    const nameOf = (id: string, email?: string | null, metaName?: string | null) =>
      (profiles ?? []).find((p: any) => p.id === id)?.full_name ??
      metaName ??
      (email ? email.split("@")[0] : "Account");

    const users = list?.users ?? [];

    const ownerCount = users.filter((u) => {
      const r = ((u.app_metadata as any)?.role as string | undefined)?.toLowerCase();
      return r === "owner";
    }).length;

    const accounts = users.map((u) => {
      const appMeta: any = u.app_metadata ?? {};
      const userMeta: any = u.user_metadata ?? {};
      const dbRole = (roleRows ?? []).find((r: any) => r.user_id === u.id)?.role;

      let resolvedRole: Role = "staff";
      if (appMeta.role) {
        resolvedRole = normalizeRole(appMeta.role as string);
      } else if (dbRole === "admin") {
        resolvedRole = ownerCount === 0 ? "owner" : "admin";
      } else if (dbRole) {
        resolvedRole = normalizeRole(dbRole);
      }

      const status: AccountStatus = appMeta.status === "inactive" ? "inactive" : "active";

      const overrides: UserPermissionOverrides = {};
      if (appMeta.permissions && typeof appMeta.permissions === "object") {
        Object.assign(overrides, appMeta.permissions);
      }
      dbPerms.filter((p) => p.user_id === u.id).forEach((p) => {
        overrides[`${p.module}.${p.action}`] = p.granted;
      });

      const effective = calculateEffectivePermissions(resolvedRole, overrides);

      return {
        id: u.id,
        email: u.email ?? null,
        name: nameOf(u.id, u.email, userMeta.full_name as string),
        role: resolvedRole,
        status,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        overrides,
        effectivePermissions: Array.from(effective),
        permissionCount: effective.size,
        hasOverrides: Object.keys(overrides).length > 0,
        isSelf: u.id === ctx.userId,
        isOwner: resolvedRole === "owner",
      };
    });

    return {
      callerRole: caller.role,
      isCallerOwner: caller.isOwner,
      ownerCount: accounts.filter((a) => a.role === "owner").length,
      adminCount: accounts.filter((a) => a.role === "admin" || a.role === "owner").length,
      accounts,
    };
  });

/**
 * Create a new admin or staff account with full role, status and permissions.
 */
export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(1, "Full name is required"),
        email: z.string().trim().email("Valid email required"),
        role: z.enum(["owner", "admin", "manager", "staff"]),
        status: z.enum(["active", "inactive"]).default("active"),
        permissions: z.record(z.boolean()).optional(),
        password: z.string().min(8).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const caller = await requirePermission(ctx, "system", "create");

    if (data.role === "owner" && !caller.isOwner) {
      throw new Error("Forbidden: only an Owner can create another Owner account.");
    }

    if (!isRoleAtLeast(caller.role, data.role)) {
      throw new Error("Forbidden: you cannot create an account with higher privileges than your own.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Secure temporary password if none provided
    const tempPassword =
      data.password ||
      `Jyot!${Math.random().toString(36).slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.toLowerCase().trim(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: data.name,
      },
      app_metadata: {
        role: data.role,
        status: data.status,
        permissions: data.permissions || {},
      },
    });

    if (createError || !newUser.user) {
      throw new Error(createError?.message || "Could not create user account.");
    }

    const newUserId = newUser.user.id;

    // Profiles record
    await ctx.supabase
      .from("profiles")
      .upsert({ id: newUserId, email: data.email.toLowerCase().trim(), full_name: data.name });

    // Database user_roles record (map owner to admin for RLS compatibility)
    const dbRole = data.role === "owner" ? "admin" : data.role;
    await ctx.supabase
      .from("user_roles")
      .upsert({ user_id: newUserId, role: dbRole }, { onConflict: "user_id,role" });

    // Sync database user_permissions if permissions supplied
    if (data.permissions && Object.keys(data.permissions).length > 0) {
      try {
        for (const [key, granted] of Object.entries(data.permissions)) {
          const [mod, act] = key.split(".");
          if (mod && act) {
            await ctx.supabase.from("user_permissions").upsert(
              { user_id: newUserId, module: mod, action: act, granted },
              { onConflict: "user_id,module,action" },
            );
          }
        }
      } catch {}
    }

    // Generate password recovery/invite link
    let inviteLink: string | null = null;
    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: data.email.toLowerCase().trim(),
      });
      inviteLink = linkData?.properties?.action_link ?? null;
    } catch {}

    await logAdminAudit(ctx, newUserId, "user.created", {
      targetEmail: data.email,
      name: data.name,
      role: data.role,
      status: data.status,
    });

    return {
      ok: true,
      userId: newUserId,
      inviteLink,
    };
  });

/**
 * Update user profile, role or active/inactive status.
 */
export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        name: z.string().trim().min(1).optional(),
        role: z.enum(["owner", "admin", "manager", "staff"]).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const caller = await requirePermission(ctx, "system", "edit");

    await protectOwnerSafety(caller, data.userId, data.role, data.status, false);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const updatePayload: any = {};
    if (data.name) {
      updatePayload.user_metadata = { full_name: data.name };
      await ctx.supabase.from("profiles").update({ full_name: data.name }).eq("id", data.userId);
    }

    const appMetaUpdates: any = {};
    if (data.role) appMetaUpdates.role = data.role;
    if (data.status) appMetaUpdates.status = data.status;

    if (Object.keys(appMetaUpdates).length > 0) {
      const { data: currentAuth } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      const existingMeta = currentAuth?.user?.app_metadata || {};
      updatePayload.app_metadata = { ...existingMeta, ...appMetaUpdates };
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(data.userId, updatePayload);
      if (authErr) throw new Error("Could not update account: " + authErr.message);
    }

    if (data.role) {
      const dbRole = data.role === "owner" ? "admin" : data.role;
      await ctx.supabase.from("user_roles").delete().eq("user_id", data.userId);
      await ctx.supabase.from("user_roles").insert({ user_id: data.userId, role: dbRole });
    }

    await logAdminAudit(ctx, data.userId, "user.updated", {
      name: data.name,
      role: data.role,
      status: data.status,
    });

    return { ok: true };
  });

/**
 * Configure granular module-and-action level permissions for a user.
 */
export const setUserPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        permissions: z.record(z.boolean()),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const caller = await requirePermission(ctx, "system", "manage");

    await protectOwnerSafety(caller, data.userId, undefined, undefined, false);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: currentAuth } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const existingMeta = currentAuth?.user?.app_metadata || {};

    const updatedMeta = {
      ...existingMeta,
      permissions: data.permissions,
    };

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      app_metadata: updatedMeta,
    });
    if (error) throw new Error("Could not save permissions: " + error.message);

    try {
      for (const [key, granted] of Object.entries(data.permissions)) {
        const [mod, act] = key.split(".");
        if (mod && act) {
          await ctx.supabase.from("user_permissions").upsert(
            { user_id: data.userId, module: mod, action: act, granted },
            { onConflict: "user_id,module,action" },
          );
        }
      }
    } catch {}

    await logAdminAudit(ctx, data.userId, "user.permissions_changed", {
      overridesCount: Object.keys(data.permissions).length,
    });

    return { ok: true };
  });

/**
 * Activate or deactivate an account.
 */
export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(["active", "inactive"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const caller = await requirePermission(ctx, "system", "edit");

    await protectOwnerSafety(caller, data.userId, undefined, data.status, false);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: currentAuth } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const existingMeta = currentAuth?.user?.app_metadata || {};

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      app_metadata: { ...existingMeta, status: data.status },
    });
    if (error) throw new Error("Could not update account status: " + error.message);

    await logAdminAudit(ctx, data.userId, data.status === "active" ? "user.activated" : "user.deactivated", {
      status: data.status,
    });

    return { ok: true };
  });

/**
 * Trigger a secure password reset link for a user.
 */
export const triggerPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requirePermission(ctx, "system", "manage");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userAuth, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (fetchErr || !userAuth?.user?.email) {
      throw new Error("Could not locate user account.");
    }

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: userAuth.user.email,
    });

    if (linkErr) {
      throw new Error("Could not generate password reset link: " + linkErr.message);
    }

    await logAdminAudit(ctx, data.userId, "user.password_reset_triggered", {
      targetEmail: userAuth.user.email,
    });

    return {
      ok: true,
      resetLink: linkData?.properties?.action_link ?? null,
    };
  });

/**
 * Delete a user account safely.
 */
export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const caller = await requirePermission(ctx, "system", "delete");

    await protectOwnerSafety(caller, data.userId, undefined, undefined, true);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Remove from auth
    const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (delAuthErr) throw new Error("Could not delete user: " + delAuthErr.message);

    // Remove from local tables
    await ctx.supabase.from("user_roles").delete().eq("user_id", data.userId);
    await ctx.supabase.from("profiles").delete().eq("id", data.userId);
    try {
      await ctx.supabase.from("user_permissions").delete().eq("user_id", data.userId);
    } catch {}

    await logAdminAudit(ctx, data.userId, "user.deleted");

    return { ok: true };
  });

/** Legacy setTeamRole function preserved for compatibility */
export const setTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "manager", "staff"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const caller = await requirePermission(ctx, "system", "manage");
    await protectOwnerSafety(caller, data.userId, data.role, undefined, false);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: currentAuth } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const existingMeta = currentAuth?.user?.app_metadata || {};

    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      app_metadata: { ...existingMeta, role: data.role },
    });

    await ctx.supabase.from("user_roles").delete().eq("user_id", data.userId);
    await ctx.supabase.from("user_roles").insert({ user_id: data.userId, role: data.role });

    await logAdminAudit(ctx, data.userId, "user.role_changed", { role: data.role });
    return { ok: true };
  });

/** Legacy revokeTeamRole function preserved for compatibility */
export const revokeTeamRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const caller = await requirePermission(ctx, "system", "manage");
    await protectOwnerSafety(caller, data.userId, undefined, undefined, true);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: currentAuth } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const existingMeta = currentAuth?.user?.app_metadata || {};

    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      app_metadata: { ...existingMeta, status: "inactive" },
    });

    await ctx.supabase.from("user_roles").delete().eq("user_id", data.userId);
    await logAdminAudit(ctx, data.userId, "user.access_revoked");
    return { ok: true };
  });

