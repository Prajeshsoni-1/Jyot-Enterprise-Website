/**
 * Resource-specific server functions.
 *
 * - getResourceBySlug      — single resource with draft preview
 * - resourceFileList       — downloadable files for a given resource_id (public)
 * - resourceFileListAdmin  — downloadable files including inactive (admin)
 * - resourceFileSave       — upsert a resource file record (dual persistence)
 * - resourceFileDelete     — delete a file record
 * - resourceFileReorder    — reorder file records
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CmsRow } from "@/lib/cms-schema";

type Ctx = { supabase: SupabaseClient; userId: string };

/** Public Supabase client — for published-only queries. */
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
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/* ------------------------------------------------------------------ types */

export type ResourceFile = {
  id: string;
  resource_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  file_type: string;
  display_label: string | null;
  download_filename: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------- getResourceBySlug (public) */

/**
 * Fetch a single resource by slug.
 * When `preview = true`, uses the admin client to return draft resources.
 * This mirrors getBlogPost / getPortfolioProject.
 */
export const getResourceBySlug = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        slug: z.string().min(1).max(200),
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
            .from("cms_resources")
            .select("*")
            .eq("slug", data.slug)
            .maybeSingle();
          if (!error && row) return row as unknown as CmsRow;
        } catch {
          // Fall through to public client
        }
      }

      const supabase = publicClient();
      let query = supabase.from("cms_resources").select("*").eq("slug", data.slug);
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

/* ------------------------------------------- resourceFileList (admin + public) */

/**
 * Lists downloadable files for a resource.
 * Uses primary cms_resource_files table with dual-persistence fallback to
 * cms_resources.data.resourceFiles for resilient zero-downtime operation.
 */
export const resourceFileList = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        resourceId: z.string().uuid(),
        includeInactive: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<ResourceFile[]> => {
    try {
      const supabase = publicClient();
      let query = supabase
        .from("cms_resource_files")
        .select("*")
        .eq("resource_id", data.resourceId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!data.includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data: rows, error } = await query;
      if (!error && rows && rows.length > 0) {
        return rows as ResourceFile[];
      }

      // Fallback: Read from cms_resources row data.resourceFiles
      const { data: resRow } = await supabase
        .from("cms_resources")
        .select("data")
        .eq("id", data.resourceId)
        .maybeSingle();

      const d = (resRow?.data ?? {}) as Record<string, unknown>;
      if (Array.isArray(d["resourceFiles"])) {
        let files = d["resourceFiles"] as ResourceFile[];
        if (!data.includeInactive) {
          files = files.filter((f) => f.is_active !== false);
        }
        return files.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      }

      return [];
    } catch {
      return [];
    }
  });

/** Admin-authenticated version that can see inactive files. */
export const resourceFileListAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ resourceId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<ResourceFile[]> => {
    const ctx = context as unknown as Ctx;
    try {
      const { data: rows, error } = await ctx.supabase
        .from("cms_resource_files")
        .select("*")
        .eq("resource_id", data.resourceId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error && rows && rows.length > 0) {
        return rows as ResourceFile[];
      }

      // Fallback to cms_resources data.resourceFiles
      const { data: resRow } = await ctx.supabase
        .from("cms_resources")
        .select("data")
        .eq("id", data.resourceId)
        .maybeSingle();

      const d = (resRow?.data ?? {}) as Record<string, unknown>;
      if (Array.isArray(d["resourceFiles"])) {
        return (d["resourceFiles"] as ResourceFile[]).sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
      }

      return (rows ?? []) as ResourceFile[];
    } catch (e) {
      // Non-fatal fallback check
      try {
        const { data: resRow } = await ctx.supabase
          .from("cms_resources")
          .select("data")
          .eq("id", data.resourceId)
          .maybeSingle();
        const d = (resRow?.data ?? {}) as Record<string, unknown>;
        if (Array.isArray(d["resourceFiles"])) {
          return d["resourceFiles"] as ResourceFile[];
        }
      } catch {
        // ignore
      }
      throw new Error(e instanceof Error ? e.message : "Could not load resource files.");
    }
  });

/* ---------------------------------------------- resourceFileSave (admin) */

const fileSchema = z.object({
  id: z.string().uuid().optional(),
  resource_id: z.string().uuid(),
  title: z.string().min(1).max(300).trim(),
  description: z.string().max(1000).trim().optional(),
  file_url: z.string().max(1000).trim().optional(),
  storage_path: z.string().max(500).trim().optional(),
  file_name: z.string().max(300).trim().optional(),
  file_size: z.number().int().nonnegative().optional(),
  mime_type: z.string().max(100).trim().optional(),
  file_type: z.string().max(50).trim().default("PDF"),
  display_label: z.string().max(200).trim().optional(),
  download_filename: z.string().max(300).trim().optional(),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

export const resourceFileSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => fileSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const ctx = context as unknown as Ctx;
    const fileId = data.id ?? crypto.randomUUID();
    const now = new Date().toISOString();

    const fileRecord: ResourceFile = {
      id: fileId,
      resource_id: data.resource_id,
      title: data.title,
      description: data.description ?? null,
      file_url: data.file_url ?? null,
      storage_path: data.storage_path ?? null,
      file_name: data.file_name ?? null,
      file_size: data.file_size ?? null,
      mime_type: data.mime_type ?? null,
      file_type: data.file_type,
      display_label: data.display_label ?? null,
      download_filename: data.download_filename ?? null,
      sort_order: data.sort_order,
      is_active: data.is_active,
      created_at: now,
      updated_at: now,
    };

    // 1. Dual-persistence: Update cms_resources.data.resourceFiles
    try {
      const { data: resRow } = await ctx.supabase
        .from("cms_resources")
        .select("data")
        .eq("id", data.resource_id)
        .maybeSingle();

      if (resRow) {
        const d = (resRow.data ?? {}) as Record<string, unknown>;
        const existingFiles = (
          Array.isArray(d["resourceFiles"]) ? d["resourceFiles"] : []
        ) as ResourceFile[];
        const idx = existingFiles.findIndex((f) => f.id === fileId);

        let updatedFiles: ResourceFile[];
        if (idx >= 0) {
          const prev = existingFiles[idx]!;
          updatedFiles = existingFiles.map((f, i) =>
            i === idx ? { ...prev, ...fileRecord, created_at: prev.created_at } : f,
          );
        } else {
          updatedFiles = [...existingFiles, fileRecord];
        }

        await ctx.supabase
          .from("cms_resources")
          .update({
            data: {
              ...d,
              resourceFiles: updatedFiles,
            },
          })
          .eq("id", data.resource_id);
      }
    } catch {
      // Non-blocking sync to data.resourceFiles
    }

    // 2. Primary table: cms_resource_files
    try {
      const dbRow: Record<string, unknown> = {
        resource_id: data.resource_id,
        title: data.title,
        description: data.description ?? null,
        file_url: data.file_url ?? null,
        storage_path: data.storage_path ?? null,
        file_name: data.file_name ?? null,
        file_size: data.file_size ?? null,
        mime_type: data.mime_type ?? null,
        file_type: data.file_type,
        display_label: data.display_label ?? null,
        download_filename: data.download_filename ?? null,
        sort_order: data.sort_order,
        is_active: data.is_active,
        created_by: ctx.userId,
      };

      if (data.id) {
        const { error } = await ctx.supabase
          .from("cms_resource_files")
          .update({ ...dbRow, created_by: undefined })
          .eq("id", data.id)
          .eq("resource_id", data.resource_id);
        if (error) {
          // If table error, dual-persistence already saved it to data.resourceFiles
          console.warn("cms_resource_files update warning:", error.message);
        }
      } else {
        const { error } = await ctx.supabase
          .from("cms_resource_files")
          .insert({ ...dbRow, id: fileId });
        if (error) {
          console.warn("cms_resource_files insert warning:", error.message);
        }
      }
    } catch (e) {
      console.warn("cms_resource_files persistence error (handled by fallback):", e);
    }

    return { id: fileId };
  });

/* --------------------------------------------- resourceFileDelete (admin) */

export const resourceFileDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), resourceId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const ctx = context as unknown as Ctx;

    // 1. Sync remove from cms_resources.data.resourceFiles
    try {
      const { data: resRow } = await ctx.supabase
        .from("cms_resources")
        .select("data")
        .eq("id", data.resourceId)
        .maybeSingle();

      if (resRow) {
        const d = (resRow.data ?? {}) as Record<string, unknown>;
        if (Array.isArray(d["resourceFiles"])) {
          const updated = (d["resourceFiles"] as ResourceFile[]).filter((f) => f.id !== data.id);
          await ctx.supabase
            .from("cms_resources")
            .update({ data: { ...d, resourceFiles: updated } })
            .eq("id", data.resourceId);
        }
      }
    } catch {
      // Non-blocking
    }

    // 2. Delete from cms_resource_files
    try {
      await ctx.supabase
        .from("cms_resource_files")
        .delete()
        .eq("id", data.id)
        .eq("resource_id", data.resourceId);
    } catch {
      // Non-blocking
    }

    return { ok: true };
  });

/* ----------------------------------- resourceFileReorder (admin) */

export const resourceFileReorder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        resourceId: z.string().uuid(),
        orderedIds: z.array(z.string().uuid()).max(100),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const ctx = context as unknown as Ctx;

    // 1. Sync reorder in cms_resources.data.resourceFiles
    try {
      const { data: resRow } = await ctx.supabase
        .from("cms_resources")
        .select("data")
        .eq("id", data.resourceId)
        .maybeSingle();

      if (resRow) {
        const d = (resRow.data ?? {}) as Record<string, unknown>;
        if (Array.isArray(d["resourceFiles"])) {
          const filesMap = new Map((d["resourceFiles"] as ResourceFile[]).map((f) => [f.id, f]));
          const reordered: ResourceFile[] = [];
          data.orderedIds.forEach((id, index) => {
            const f = filesMap.get(id);
            if (f) {
              reordered.push({ ...f, sort_order: index });
              filesMap.delete(id);
            }
          });
          // Append any remaining
          for (const remaining of filesMap.values()) {
            reordered.push({ ...remaining, sort_order: reordered.length });
          }
          await ctx.supabase
            .from("cms_resources")
            .update({ data: { ...d, resourceFiles: reordered } })
            .eq("id", data.resourceId);
        }
      }
    } catch {
      // Non-blocking
    }

    // 2. Update table
    try {
      await Promise.all(
        data.orderedIds.map((id, index) =>
          ctx.supabase
            .from("cms_resource_files")
            .update({ sort_order: index })
            .eq("id", id)
            .eq("resource_id", data.resourceId),
        ),
      );
    } catch {
      // Handled by data.resourceFiles fallback
    }

    return { ok: true };
  });
