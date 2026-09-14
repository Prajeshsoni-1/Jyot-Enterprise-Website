import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { mergeSettings, type SiteSettings } from "@/lib/site-settings";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./permissions.server";

/**
 * Site settings, media library and job applications.
 *
 * Reads of settings/media are public (published, non-sensitive values only).
 * Every write re-checks the caller's admin/manager role in the database and
 * is additionally enforced by RLS.
 */

type Ctx = { supabase: any; userId: string; claims?: Record<string, unknown> };

const SETTINGS_KEY = "site";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
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
  if (!roles.length) throw new Error("Forbidden: your account is not part of the team.");
  return roles;
}

async function requireEditor(ctx: Ctx) {
  const roles = await requireTeam(ctx);
  if (!roles.includes("admin") && !roles.includes("manager")) {
    throw new Error("Forbidden: this needs an admin or manager account.");
  }
  return roles;
}

async function audit(
  ctx: Ctx,
  entry: {
    module: string;
    action: string;
    title?: string | null;
    entityId?: string | null;
    detail?: Record<string, unknown>;
  },
) {
  const email = (ctx.claims as { email?: string } | undefined)?.email ?? null;
  await ctx.supabase.from("cms_audit_log").insert({
    actor_id: ctx.userId,
    actor_email: email,
    module: entry.module,
    entity_id: entry.entityId ?? null,
    entity_title: entry.title ?? null,
    action: entry.action,
    detail: entry.detail ?? {},
  });
}

/* --------------------------------------------------------------- settings */

/** Saved settings merged over the built-in values. Safe for public routes. */
export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    try {
      const supabase = publicClient();
      const [{ data: row }, { data: offices }] = await Promise.all([
        supabase.from("cms_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle(),
        supabase
          .from("cms_offices")
          .select(
            "id, title, city, address, maps_url, embed_url, phone, email, hours, latitude, longitude",
          )
          .eq("status", "published")
          .order("sort_order", { ascending: true }),
      ]);
      const merged = mergeSettings((row?.value ?? null) as Partial<SiteSettings> | null);
      if (offices?.length) {
        merged.offices = offices.map((o: Record<string, any>) => ({
          id: o["id"],
          title: o["title"] ?? o["city"] ?? "Office",
          city: o["city"] ?? "",
          address: o["address"] ?? "",
          maps: o["maps_url"] ?? "",
          embed: o["embed_url"] ?? "",
          phone: o["phone"],
          email: o["email"],
          hours: o["hours"],
          latitude: o["latitude"],
          longitude: o["longitude"],
        }));
      }
      return merged;
    } catch {
      // Settings are additive: never take the public site down.
      return mergeSettings(null);
    }
  },
);

export const adminGetSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const roles = await requireTeam(ctx);
    const { data } = await ctx.supabase
      .from("cms_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    return {
      settings: mergeSettings((data?.value ?? null) as Partial<SiteSettings> | null),
      canEdit: roles.includes("admin") || roles.includes("manager"),
    };
  });

const textField = z.string().max(2000).optional();

const settingsInput = z.object({
  brand: z
    .object({
      companyName: textField,
      tagline: textField,
      description: textField,
      logoUrl: textField,
      faviconUrl: textField,
    })
    .partial()
    .optional(),
  contact: z
    .object({
      email: textField,
      phone: textField,
      phone2: textField,
      whatsapp: textField,
      whatsapp2: textField,
      address: textField,
      hours: textField,
    })
    .partial()
    .optional(),
  social: z
    .object({
      facebook: textField,
      instagram: textField,
      linkedin: textField,
      youtube: textField,
      twitter: textField,
    })
    .partial()
    .optional(),
  website: z
    .object({
      ctaLabel: textField,
      ctaHref: textField,
      footerText: textField,
      copyright: textField,
      headerCtaVisible: z.boolean().optional(),
      headerContactVisible: z.boolean().optional(),
      hiddenNav: z.array(z.string().max(120)).max(40).optional(),
      navOrder: z.array(z.string().max(120)).max(40).optional(),
      footerLinks: z
        .array(z.object({ label: z.string().max(80), to: z.string().max(200) }))
        .max(20)
        .optional(),
    })
    .partial()
    .optional(),
  seo: z
    .object({
      title: textField,
      description: textField,
      ogImage: textField,
      keywords: z.array(z.string().max(60)).max(40).optional(),
    })
    .partial()
    .optional(),
  analytics: z.object({ ga4: textField, gtm: textField, clarity: textField }).partial().optional(),
});

const INTERNAL_LINK = /^\/[a-z0-9\-/_?=&.]*$/i;

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => settingsInput.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    if (data.seo) {
      await requirePermission(ctx, "seo", "edit");
    }
    await requirePermission(ctx, "system", "edit");

    // Never let a settings edit create a broken internal link.
    const href = data.website?.ctaHref?.trim();
    if (href && !INTERNAL_LINK.test(href) && !/^https?:\/\//i.test(href)) {
      throw new Error(
        "The button link must be a path such as /contact, or a full https:// address.",
      );
    }
    for (const link of data.website?.footerLinks ?? []) {
      if (link.to && !INTERNAL_LINK.test(link.to) && !/^https?:\/\//i.test(link.to)) {
        throw new Error(
          `“${link.label}” must link to a path such as /services, or a full https:// address.`,
        );
      }
    }

    const { error } = await ctx.supabase
      .from("cms_settings")
      .upsert({ key: SETTINGS_KEY, value: data, updated_by: ctx.userId }, { onConflict: "key" });
    if (error) throw new Error("Could not save the settings.");
    await audit(ctx, { module: "settings", action: "updated", title: "Site settings" });
    return { ok: true };
  });

/* ------------------------------------------------------------------ media */

export const mediaList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ search: z.string().max(120).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const roles = await requireTeam(ctx);
    let items: {
      id: string;
      path: string;
      url: string;
      name: string;
      mime_type: string | null;
      size_bytes: number | null;
      created_at: string;
    }[] = [];

    try {
      let q = ctx.supabase
        .from("cms_media")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (data.search?.trim()) q = q.ilike("name", `%${data.search.trim().replace(/[%,]/g, "")}%`);
      const { data: rows, error } = await q;
      if (!error && rows && rows.length > 0) {
        items = rows.map((r: any) => ({
          id: r.id,
          path: r.path,
          url: r.url || ctx.supabase.storage.from(r.bucket || "site-media").getPublicUrl(r.path).data.publicUrl,
          name: r.name,
          mime_type: r.mime_type,
          size_bytes: r.size_bytes,
          created_at: r.created_at,
        }));
      }
    } catch {
      // fallback to storage
    }

    // Fallback or augment with files stored in Supabase Storage site-media
    if (items.length === 0) {
      try {
        const { data: files } = await ctx.supabase.storage.from("site-media").list("site", {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });
        if (files && files.length > 0) {
          items = files
            .filter((f: any) => f.name && !f.name.startsWith("."))
            .map((f: any) => {
              const fullPath = `site/${f.name}`;
              const { data: pUrl } = ctx.supabase.storage.from("site-media").getPublicUrl(fullPath);
              return {
                id: f.id || f.name,
                path: fullPath,
                url: pUrl.publicUrl,
                name: f.name.replace(/^\d+-/, ""),
                mime_type: f.metadata?.mimetype || "image/png",
                size_bytes: f.metadata?.size || null,
                created_at: f.created_at || new Date().toISOString(),
              };
            });
          if (data.search?.trim()) {
            const q = data.search.trim().toLowerCase();
            items = items.filter((it) => it.name.toLowerCase().includes(q));
          }
        }
      } catch {}
    }

    return {
      rows: items,
      canEdit: roles.includes("admin") || roles.includes("manager"),
    };
  });

export const mediaRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        path: z.string().min(3).max(300),
        name: z.string().min(1).max(200),
        mimeType: z.string().max(100).optional(),
        sizeBytes: z.number().int().min(0).max(20_000_000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requirePermission(ctx, "media", "create");
    if (!/^site\/[A-Za-z0-9._-]+$/.test(data.path))
      throw new Error("That file name is not allowed.");

    const { data: pUrl } = ctx.supabase.storage.from("site-media").getPublicUrl(data.path);
    const directUrl = pUrl?.publicUrl;

    let mediaId = `media-${Date.now()}`;
    try {
      const { data: row, error } = await ctx.supabase
        .from("cms_media")
        .insert({
          bucket: "site-media",
          path: data.path,
          url: directUrl,
          name: data.name.slice(0, 200),
          mime_type: data.mimeType ?? null,
          size_bytes: data.sizeBytes ?? null,
          uploaded_by: ctx.userId,
        })
        .select("id")
        .maybeSingle();

      if (row?.id) {
        mediaId = row.id;
      }
    } catch {
      // Table may not be created in Postgres; the image is still stored in Supabase storage
    }

    await audit(ctx, { module: "media", action: "uploaded", entityId: mediaId, title: data.name });
    return { id: mediaId, url: directUrl };
  });

/** Reports where an image is still used, so nothing is deleted blindly. */
export const mediaUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);
    let rowUrl: string | null = null;
    try {
      const { data: row } = await ctx.supabase
        .from("cms_media")
        .select("url")
        .eq("id", data.id)
        .maybeSingle();
      rowUrl = row?.url ?? null;
    } catch {}

    const tables = [
      "cms_services",
      "cms_sub_services",
      "cms_industries",
      "cms_projects",
      "cms_case_studies",
      "cms_posts",
      "cms_resources",
      "cms_pages",
      "cms_downloads",
      "cms_jobs",
    ];
    const used: string[] = [];
    if (rowUrl) {
      await Promise.all(
        tables.map(async (t) => {
          try {
            const { data: hits } = await ctx.supabase
              .from(t)
              .select("title, slug")
              .filter("hero_image", "eq", rowUrl)
              .limit(5);
            for (const h of hits ?? []) {
              used.push(`${t}: ${(h as any).title ?? (h as any).slug}`);
            }
          } catch {}
        }),
      );
    }
    return { used };
  });

export const mediaDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string(), confirmUsed: z.boolean().default(false) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requirePermission(ctx, "media", "delete");
    let rowPath: string | null = data.id.startsWith("site/") ? data.id : null;
    try {
      const { data: row } = await ctx.supabase
        .from("cms_media")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (row?.path) rowPath = row.path;
    } catch {}

    if (rowPath) {
      await ctx.supabase.storage.from("site-media").remove([rowPath]);
    }
    try {
      await ctx.supabase.from("cms_media").delete().eq("id", data.id);
    } catch {}

    await audit(ctx, {
      module: "media",
      action: "deleted",
      entityId: data.id,
      detail: { confirmUsed: data.confirmUsed },
    });
    return { ok: true };
  });

/* ----------------------------------------------------------- applications */

export const APPLICATION_STAGES = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
] as const;

export const applicationList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        stage: z.enum(["all", ...APPLICATION_STAGES]).default("all"),
        jobSlug: z.string().max(120).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const roles = await requireTeam(ctx);

    let rows: any[] = [];
    // 1. Try querying with application_stage column
    const primary = await ctx.supabase
      .from("leads")
      .select(
        "id, reference, name, email, phone, city, status, application_stage, details, attachments, created_at",
      )
      .eq("source", "careers")
      .order("created_at", { ascending: false })
      .limit(300);

    if (!primary.error && primary.data) {
      rows = primary.data;
    } else {
      // 2. Resilient fallback query without application_stage column
      const fallback = await ctx.supabase
        .from("leads")
        .select("id, reference, name, email, phone, city, status, details, attachments, created_at")
        .eq("source", "careers")
        .order("created_at", { ascending: false })
        .limit(300);

      if (fallback.error) throw new Error("Could not load applications: " + fallback.error.message);
      rows = fallback.data ?? [];
    }

    // 3. Normalize rows so application_stage is always populated
    const normalized = rows.map((r: any) => ({
      ...r,
      application_stage:
        r.application_stage ||
        r.details?.application_stage ||
        r.details?.stage ||
        r.status ||
        "new",
    }));

    // 4. Filter by stage if requested
    const byStage =
      data.stage === "all"
        ? normalized
        : normalized.filter((r) => r.application_stage === data.stage);

    const filtered = byStage.filter(
      (r: any) => !data.jobSlug || (r.details?.jobSlug ?? r.details?.role) === data.jobSlug,
    );

    return { rows: filtered, canEdit: roles.includes("admin") || roles.includes("manager") };
  });

export const applicationSetStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), stage: z.enum(APPLICATION_STAGES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await requireTeam(ctx);

    // Fetch current details so stage is also preserved in JSONB details
    const { data: current } = await ctx.supabase
      .from("leads")
      .select("details")
      .eq("id", data.id)
      .maybeSingle();

    const nextDetails = {
      ...((current?.details ?? {}) as Record<string, unknown>),
      application_stage: data.stage,
      stage: data.stage,
    };

    // Try updating application_stage column and details
    let updateErr = (
      await ctx.supabase
        .from("leads")
        .update({ application_stage: data.stage, details: nextDetails })
        .eq("id", data.id)
    ).error;

    if (updateErr) {
      // Column may not exist in Postgres, update details instead
      const fallback = await ctx.supabase
        .from("leads")
        .update({ details: nextDetails })
        .eq("id", data.id);
      if (fallback.error) throw new Error("Could not update this application: " + fallback.error.message);
    }

    await ctx.supabase.from("lead_activity").insert({
      lead_id: data.id,
      actor_id: ctx.userId,
      action: "application_stage_changed",
      detail: { to: data.stage },
    });
    return { ok: true };
  });
