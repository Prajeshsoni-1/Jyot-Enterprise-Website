import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves a website image from the private media area through a short-lived
 * signed link. Only images registered in the media library are reachable —
 * private business documents live in a different area and are never served here.
 */
export const Route = createFileRoute("/api/public/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = String(params.id ?? "");
        if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("cms_media")
          .select("bucket, path")
          .eq("id", id)
          .maybeSingle();
        if (!row) return new Response("Not found", { status: 404 });

        const { data: signed } = await supabaseAdmin.storage
          .from(row.bucket ?? "site-media")
          .createSignedUrl(row.path, 60 * 60);
        if (!signed?.signedUrl) return new Response("Not found", { status: 404 });

        return new Response(null, {
          status: 302,
          headers: { Location: signed.signedUrl, "Cache-Control": "public, max-age=1800" },
        });
      },
    },
  },
});
