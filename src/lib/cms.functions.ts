import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CMS_MODULES,
  CMS_MODULE_DEFS,
  slugify,
  type CmsModule,
  type CmsRow,
} from "@/lib/cms-schema";

/**
 * Website CMS server layer.
 *
 * Reads of PUBLISHED content are public (anon key + `status = 'published'`
 * RLS policy). Every mutation goes through the existing Supabase auth
 * middleware, re-checks the caller's database role (admin/manager) and is
 * additionally enforced by RLS, so hiding buttons is never the control.
 */

type Ctx = { supabase: any; userId: string; claims?: Record<string, unknown> };

const moduleEnum = z.enum(CMS_MODULES as unknown as [CmsModule, ...CmsModule[]]);

function tableFor(module: CmsModule) {
  return CMS_MODULE_DEFS[module].table;
}

/* ------------------------------------------------------------ sanitising */

const MAX_TEXT = 20000;

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value)
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\u0000/g, "")
    .slice(0, MAX_TEXT)
    .trim();
  return s.length ? s : null;
}

function cleanList(value: unknown): string[] {
  const arr = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,]/) : [];
  return arr
    .map((v) => clean(v))
    .filter((v): v is string => !!v)
    .slice(0, 200);
}

function cleanJson(value: unknown, depth = 0): unknown {
  if (depth > 4) return null;
  if (Array.isArray(value)) return value.slice(0, 200).map((v) => cleanJson(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 60)) {
      out[k.slice(0, 60)] = cleanJson(v, depth + 1);
    }
    return out;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  return clean(value);
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* ------------------------------------------------------------- authorise */

async function loadRoles(ctx: Ctx): Promise<string[]> {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Error("Could not verify your access. Please sign in again.");
  return (data ?? []).map((r: { role: string }) => r.role);
}

import { requirePermission } from "./permissions.server";

export function mapCmsModuleToPerm(module: CmsModule): string {
  if (module === "services" || module === "sub_services") return "services";
  if (module === "posts") return "blogs";
  if (module === "downloads") return "downloads";
  if (module === "jobs") return "jobs";
  return "website";
}

async function requireTeam(ctx: Ctx) {
  const roles = await loadRoles(ctx);
  if (roles.length === 0) throw new Error("Forbidden: your account is not part of the team.");
  return roles;
}

async function requireEditor(ctx: Ctx) {
  const roles = await requireTeam(ctx);
  if (!roles.includes("admin") && !roles.includes("manager")) {
    throw new Error("Forbidden: managing website content needs an admin or manager account.");
  }
  return roles;
}

async function audit(
  ctx: Ctx,
  entry: {
    module: CmsModule;
    action: string;
    entityId?: string | null;
    slug?: string | null;
    title?: string | null;
    detail?: Record<string, unknown>;
  },
) {
  const email = (ctx.claims as { email?: string } | undefined)?.email ?? null;
  await ctx.supabase.from("cms_audit_log").insert({
    actor_id: ctx.userId,
    actor_email: email,
    module: entry.module,
    entity_id: entry.entityId ?? null,
    entity_slug: entry.slug ?? null,
    entity_title: entry.title ?? null,
    action: entry.action,
    detail: entry.detail ?? {},
  });
}

/* ------------------------------------------------------------ public read */

function publicClient() {
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://xmveofqeunsqzyxhakyj.supabase.co";
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["SUPABASE_ANON_KEY"] ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdmVvZnFldW5zcXp5eGhha3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjI4MjMsImV4cCI6MjEwNDQzODgyM30.krXHwtaUwy45nyH86I6Tl8pz7dEhQIdcIlVO027-BnI";
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: any, init: any) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Published rows for one module — safe for public routes and SSR. */
export const getPublishedContent = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ module: moduleEnum }).parse(data))
  .handler(async ({ data }): Promise<CmsRow[]> => {
    try {
      const supabase = publicClient();
      const { data: rows, error } = await supabase
        .from(tableFor(data.module))
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) return [];
      return (rows ?? []) as CmsRow[];
    } catch {
      // Content management is additive: never take the public site down.
      return [];
    }
  });

/** Single portfolio project by slug, with draft preview support. */
export const getPortfolioProject = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        slug: z.string(),
        preview: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<CmsRow | null> => {
    try {
      if (data.preview) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: row, error } = await supabaseAdmin
            .from("cms_projects")
            .select("*")
            .eq("slug", data.slug)
            .maybeSingle();
          if (!error && row) return row as unknown as CmsRow;
        } catch {
          // Fall through to public client if admin client fails
        }
      }

      const supabase = publicClient();
      let query = supabase.from("cms_projects").select("*").eq("slug", data.slug);
      if (!data.preview) {
        query = query.eq("status", "published");
      }
      const { data: row, error } = await query.maybeSingle();
      if (error || !row) return null;
      return row as unknown as CmsRow;
    } catch {
      return null;
    }
  });

/** Single blog post by slug, with draft preview support. */
export const getBlogPost = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        slug: z.string(),
        preview: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<CmsRow | null> => {
    try {
      if (data.preview) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: row, error } = await supabaseAdmin
            .from("cms_posts")
            .select("*")
            .eq("slug", data.slug)
            .maybeSingle();
          if (!error && row) return row as unknown as CmsRow;
        } catch {
          // Fall through to public client if admin client fails
        }
      }

      const supabase = publicClient();
      let query = supabase.from("cms_posts").select("*").eq("slug", data.slug);
      if (!data.preview) {
        query = query.eq("status", "published");
      }
      const { data: row, error } = await query.maybeSingle();
      if (error || !row) return null;
      return row as unknown as CmsRow;
    } catch {
      return null;
    }
  });

/** Single career role/job by slug, with draft preview support. */
export const getCareerRole = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        slug: z.string(),
        preview: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<CmsRow | null> => {
    try {
      if (data.preview) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: row, error } = await supabaseAdmin
            .from("cms_jobs")
            .select("*")
            .eq("slug", data.slug)
            .maybeSingle();
          if (!error && row) return row as unknown as CmsRow;
        } catch {
          // Fall through to public client if admin client fails
        }
      }

      const supabase = publicClient();
      let query = supabase.from("cms_jobs").select("*").eq("slug", data.slug);
      if (!data.preview) {
        query = query.eq("status", "published");
      }
      const { data: row, error } = await query.maybeSingle();
      if (error || !row) return null;
      return row as unknown as CmsRow;
    } catch {
      return null;
    }
  });

/** Every published row, grouped by module — used by search and the sitemap. */
export const getAllPublishedContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<CmsModule, CmsRow[]>> => {
    const out = {} as Record<CmsModule, CmsRow[]>;
    try {
      const supabase = publicClient();
      await Promise.all(
        CMS_MODULES.map(async (m) => {
          const { data } = await supabase
            .from(tableFor(m))
            .select("*")
            .eq("status", "published")
            .order("sort_order", { ascending: true })
            .limit(500);
          out[m] = (data ?? []) as CmsRow[];
        }),
      );
    } catch {
      for (const m of CMS_MODULES) out[m] = out[m] ?? [];
    }
    for (const m of CMS_MODULES) out[m] = out[m] ?? [];
    return out;
  },
);

/* ------------------------------------------------------------- admin read */

export const cmsList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        module: moduleEnum,
        search: z.string().max(120).optional(),
        status: z.enum(["all", "draft", "published", "archived", "closed"]).default("all"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const roles = await requireTeam(ctx);
    const def = CMS_MODULE_DEFS[data.module];

    let query = ctx.supabase
      .from(def.table)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(500);

    if (data.status !== "all") query = query.eq("status", data.status);
    if (data.search?.trim()) {
      const term = `%${data.search.trim().replace(/[%,]/g, "")}%`;
      query = query.or(
        def.titleField === "question"
          ? `question.ilike.${term},answer.ilike.${term}`
          : data.module === "jobs"
            ? `title.ilike.${term},slug.ilike.${term},department.ilike.${term},location.ilike.${term}`
            : `title.ilike.${term},slug.ilike.${term}`,
      );
    }

    const { data: rows, error } = await query;
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        throw new Error(
          `The database table "${def.table}" has not been created yet in Supabase. Please execute the SQL migration in your Supabase SQL Editor.`,
        );
      }
      throw new Error(`Could not load content: ${error.message}`);
    }
    return {
      rows: (rows ?? []) as CmsRow[],
      canEdit: roles.includes("admin") || roles.includes("manager"),
    };
  });

export const cmsGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ module: moduleEnum, id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const roles = await requireTeam(ctx);
    const def = CMS_MODULE_DEFS[data.module];
    const { data: row, error } = await ctx.supabase
      .from(def.table)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        throw new Error(
          `The database table "${def.table}" has not been created yet in Supabase. Please execute the SQL migration in your Supabase SQL Editor.`,
        );
      }
      throw new Error(`Could not load this item: ${error.message}`);
    }
    if (!row) throw new Error("This item no longer exists.");
    return { row: row as CmsRow, canEdit: roles.includes("admin") || roles.includes("manager") };
  });

/** Parent pickers for relationship fields. */
export const cmsRelations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    const [services, industries] = await Promise.all([
      ctx.supabase.from("cms_services").select("id, title").order("sort_order"),
      ctx.supabase.from("cms_industries").select("id, title").order("sort_order"),
    ]);
    return {
      services: (services.data ?? []) as { id: string; title: string }[],
      industries: (industries.data ?? []) as { id: string; title: string }[],
    };
  });

export const cmsHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        module: moduleEnum.optional(),
        entityId: z.string().uuid().optional(),
        limit: z.number().max(100).default(30),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    let q = ctx.supabase
      .from("cms_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.module) q = q.eq("module", data.module);
    if (data.entityId) q = q.eq("entity_id", data.entityId);
    const { data: rows } = await q;
    return (rows ?? []) as {
      id: string;
      actor_email: string | null;
      module: string;
      entity_title: string | null;
      action: string;
      created_at: string;
    }[];
  });

/* ------------------------------------------------------------ admin write */

function buildRecord(module: CmsModule, values: Record<string, unknown>) {
  const def = CMS_MODULE_DEFS[module];
  const record: Record<string, unknown> = {};
  const data: Record<string, unknown> = {};

  for (const field of def.fields) {
    if (!(field.name in values)) continue;
    const raw = values[field.name];
    let out: unknown;
    switch (field.type) {
      case "tags":
        out = cleanList(raw);
        break;
      case "lines":
        out = cleanList(Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split("\n") : []);
        break;
      case "number":
        out =
          raw === "" || raw === null || raw === undefined || Number.isNaN(Number(raw))
            ? null
            : Number(raw);
        break;
      case "bool":
        out = Boolean(raw);
        break;
      default:
        out = clean(raw);
    }
    if (field.json) data[field.name] = out;
    else record[field.name] = out;
  }

  if (values["extraData"] && typeof values["extraData"] === "object") {
    Object.assign(data, cleanJson(values["extraData"]) as Record<string, unknown>);
  }

  record["data"] = data;
  return record;
}

const saveInput = z.object({
  module: moduleEnum,
  id: z.string().uuid().optional(),
  status: z.enum(["draft", "published", "archived", "closed"]).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  values: z.record(z.string(), z.unknown()),
});

export const cmsSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => saveInput.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const permModule = mapCmsModuleToPerm(data.module);
    if (data.id) {
      await requirePermission(ctx, permModule, "edit");
    } else {
      await requirePermission(ctx, permModule, "create");
    }
    if (data.status === "published") {
      await requirePermission(ctx, permModule, "publish");
    }
    const def = CMS_MODULE_DEFS[data.module];

    const record = buildRecord(data.module, data.values);

    const titleValue = clean(data.values[def.titleField]);
    if (!titleValue)
      throw new Error(
        def.titleField === "question" ? "A question is required." : "A title is required.",
      );
    if (def.titleField === "question" && !clean(data.values["answer"]))
      throw new Error("An answer is required.");

    const rawSlug = clean(data.values["slug"]);
    const slug = rawSlug ? slugify(rawSlug) : null;
    if (slug && !SLUG_RE.test(slug)) {
      throw new Error("The web address may only use lowercase letters, numbers and hyphens.");
    }
    if (!slug && def.key !== "faqs") throw new Error("A web address (slug) is required.");
    if (slug) record["slug"] = slug;

    if (data.status) record["status"] = data.status;
    if (typeof data.featured === "boolean") record["featured"] = data.featured;
    if (typeof data.sortOrder === "number") record["sort_order"] = data.sortOrder;
    if (data.module === "jobs") {
      const raw = record["deadline"];
      if (raw) {
        const d = new Date(String(raw));
        record["deadline"] = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      } else record["deadline"] = null;
    }
    if (data.module === "posts" && record["published_at"]) {
      const d = new Date(String(record["published_at"]));
      record["published_at"] = Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    record["updated_by"] = ctx.userId;

    if (data.id) {
      const { data: row, error } = await ctx.supabase
        .from(def.table)
        .update(record)
        .eq("id", data.id)
        .select("id, slug")
        .maybeSingle();
      if (error)
        throw new Error(
          error.message.includes("duplicate")
            ? "That web address is already used."
            : "Could not save this item.",
        );
      await audit(ctx, {
        module: data.module,
        action: data.status ? `saved_${data.status}` : "updated",
        entityId: data.id,
        slug: row?.slug ?? slug,
        title: titleValue,
      });
      return { id: data.id };
    }

    record["created_by"] = ctx.userId;
    if (!record["status"]) record["status"] = "draft";
    const { data: row, error } = await ctx.supabase
      .from(def.table)
      .insert(record)
      .select("id, slug")
      .maybeSingle();
    if (error)
      throw new Error(
        error.message.includes("duplicate")
          ? "That web address is already used."
          : "Could not create this item.",
      );
    await audit(ctx, {
      module: data.module,
      action: "created",
      entityId: row?.id,
      slug: row?.slug,
      title: titleValue,
    });
    return { id: row?.id as string };
  });

export const cmsAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        module: moduleEnum,
        id: z.string().uuid(),
        action: z.enum([
          "publish",
          "unpublish",
          "archive",
          "restore",
          "delete",
          "duplicate",
          "feature",
          "unfeature",
          "close",
          "reopen",
        ]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const permModule = mapCmsModuleToPerm(data.module);
    if (data.action === "delete") {
      await requirePermission(ctx, permModule, "delete");
    } else if (data.action === "publish" || data.action === "unpublish") {
      await requirePermission(ctx, permModule, "publish");
    } else if (data.action === "duplicate") {
      await requirePermission(ctx, permModule, "create");
    } else {
      await requirePermission(ctx, permModule, "edit");
    }
    const def = CMS_MODULE_DEFS[data.module];

    const { data: current } = await ctx.supabase
      .from(def.table)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!current) throw new Error("This item no longer exists.");
    const label = (current[def.titleField] ?? current.title ?? "") as string;

    if (data.action === "delete") {
      const { error } = await ctx.supabase.from(def.table).delete().eq("id", data.id);
      if (error) throw new Error("Could not delete this item.");
      await audit(ctx, {
        module: data.module,
        action: "deleted",
        entityId: data.id,
        slug: current.slug,
        title: label,
      });
      return { ok: true };
    }

    if (data.action === "duplicate") {
      const copy = { ...current } as Record<string, unknown>;
      delete copy["id"];
      delete copy["created_at"];
      delete copy["updated_at"];
      copy["status"] = "draft";
      copy["featured"] = false;
      copy["created_by"] = ctx.userId;
      copy["updated_by"] = ctx.userId;
      copy[def.titleField] = `${label} (copy)`;
      if (current.slug) copy["slug"] = `${current.slug}-copy-${Date.now().toString(36).slice(-4)}`;
      const { data: row, error } = await ctx.supabase
        .from(def.table)
        .insert(copy)
        .select("id")
        .maybeSingle();
      if (error) throw new Error("Could not duplicate this item.");
      await audit(ctx, {
        module: data.module,
        action: "duplicated",
        entityId: row?.id,
        title: label,
      });
      return { ok: true, id: row?.id as string };
    }

    const patch: Record<string, unknown> = { updated_by: ctx.userId };
    if (data.action === "publish") patch["status"] = "published";
    if (data.action === "unpublish") patch["status"] = "draft";
    if (data.action === "archive") patch["status"] = "archived";
    if (data.action === "restore") patch["status"] = "draft";
    if (data.action === "close") patch["status"] = "closed";
    if (data.action === "reopen") patch["status"] = "published";
    if (data.action === "feature") patch["featured"] = true;
    if (data.action === "unfeature") patch["featured"] = false;
    if (data.action === "publish" && data.module === "posts" && !current.published_at) {
      patch["published_at"] = new Date().toISOString();
    }

    const { error } = await ctx.supabase.from(def.table).update(patch).eq("id", data.id);
    if (error) throw new Error("Could not update this item.");
    await audit(ctx, {
      module: data.module,
      action: data.action,
      entityId: data.id,
      slug: current.slug,
      title: label,
    });
    return { ok: true };
  });

export const cmsReorder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        module: moduleEnum,
        id: z.string().uuid(),
        sortOrder: z.number().int().min(0).max(9999),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireEditor(ctx);
    const { error } = await ctx.supabase
      .from(tableFor(data.module))
      .update({ sort_order: data.sortOrder, updated_by: ctx.userId })
      .eq("id", data.id);
    if (error) throw new Error("Could not change the order.");
    return { ok: true };
  });

/* ------------------------------------------------------------- importing */

/**
 * Imports the website's existing built-in content into the CMS so admins can
 * edit it. Existing slugs are skipped, so it is safe to run repeatedly and it
 * never overwrites edited content.
 */
export const cmsImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        module: moduleEnum,
        records: z.array(z.record(z.string(), z.unknown())).max(400),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const permModule = mapCmsModuleToPerm(data.module);
    await requirePermission(ctx, permModule, "create");
    const def = CMS_MODULE_DEFS[data.module];

    const { data: existing } = await ctx.supabase.from(def.table).select("slug");
    const taken = new Set((existing ?? []).map((r: { slug: string | null }) => r.slug));

    const rows: Record<string, unknown>[] = [];
    for (const [index, raw] of data.records.entries()) {
      const slug = clean(raw["slug"]);
      if (def.key !== "faqs" && (!slug || !SLUG_RE.test(slug))) continue;
      if (slug && taken.has(slug)) continue;
      if (slug) taken.add(slug);
      const record = buildRecord(data.module, raw);
      record["slug"] = slug;
      record["status"] = "published";
      record["sort_order"] = index;
      record["featured"] = Boolean(raw["featured"]);
      record["created_by"] = ctx.userId;
      record["updated_by"] = ctx.userId;
      if (data.module === "posts") {
        const d = new Date(String(raw["published_at"] ?? ""));
        record["published_at"] = Number.isNaN(d.getTime())
          ? new Date().toISOString()
          : d.toISOString();
      }
      rows.push(record);
    }

    if (!rows.length) return { imported: 0, skipped: data.records.length };

    const { error } = await ctx.supabase.from(def.table).insert(rows);
    if (error) throw new Error(`Could not import content: ${error.message}`);
    await audit(ctx, { module: data.module, action: "imported", detail: { count: rows.length } });
    return { imported: rows.length, skipped: data.records.length - rows.length };
  });
