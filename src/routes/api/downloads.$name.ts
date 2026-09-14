import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/downloads/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const rawName = String(params.name ?? "");
        let cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, "");

        if (!cleanName.toLowerCase().endsWith(".pdf")) {
          cleanName = `${cleanName}.pdf`;
        }

        const baseSlug = cleanName.replace(/\.pdf$/i, "").toLowerCase();

        // 1. Try resolving the document from Supabase Storage bucket 'jyot-enterprise'
        try {
          // Check cms_downloads database for an exact file path
          const { data: rows } = await supabase
            .from("cms_downloads")
            .select("file_path, file_url, data, slug")
            .or(`slug.eq.${baseSlug},file_name.eq.${cleanName}`)
            .limit(1);

          let storagePath: string | null = null;
          if (rows && rows.length > 0 && rows[0]) {
            const firstRow = rows[0];
            const rowData: any = firstRow.data;
            storagePath =
              firstRow.file_path ||
              (rowData?.storage_path as string) ||
              null;
          }

          // If not found in DB or path not set, test standard storage folder locations
          const candidatePaths = storagePath
            ? [storagePath]
            : [
                `website-documents/it-services/${cleanName}`,
                `website-documents/brochures/${cleanName}`,
                `website-documents/resources/${cleanName}`,
                `website-documents/case-studies/${cleanName}`,
                `website-documents/${cleanName}`,
              ];

          for (const pathCandidate of candidatePaths) {
            const { data: blob, error } = await supabase.storage
              .from("jyot-enterprise")
              .download(pathCandidate);

            if (!error && blob) {
              const arrayBuffer = await blob.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              // Verify valid PDF header
              if (buffer.length >= 5) {
                const header = buffer.subarray(0, 5).toString("ascii");
                if (header === "%PDF-") {
                  return new Response(buffer, {
                    status: 200,
                    headers: {
                      "Content-Type": "application/pdf",
                      "Content-Disposition": `attachment; filename="${cleanName}"`,
                      "Cache-Control": "public, max-age=3600",
                      "X-Storage-Source": "supabase-storage",
                      "X-Storage-Bucket": "jyot-enterprise",
                      "X-Storage-Path": pathCandidate,
                    },
                  });
                }
              }
            }
          }
        } catch (err) {
          console.warn("[Download API] Supabase storage lookup failed, falling back to local:", err);
        }

        // 2. Fallback to local public/downloads directory if available
        const fs = await import("node:fs");
        const path = await import("node:path");
        const downloadsDir = path.join(process.cwd(), "public", "downloads");
        let filePath = path.join(downloadsDir, cleanName);

        if (!fs.existsSync(filePath)) {
          // Check case-insensitive match
          const allFiles = fs.existsSync(downloadsDir) ? fs.readdirSync(downloadsDir) : [];
          const matched = allFiles.find(
            (f) =>
              f.toLowerCase() === cleanName.toLowerCase() ||
              f.toLowerCase() === `${cleanName.toLowerCase().replace(/\.pdf$/, "")}.pdf`,
          );

          if (matched) {
            filePath = path.join(downloadsDir, matched);
            cleanName = matched;
          } else {
            return new Response("File not found in storage or local cache", { status: 404 });
          }
        }

        const fileBuffer = fs.readFileSync(filePath);

        return new Response(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${cleanName}"`,
            "Cache-Control": "public, max-age=3600",
            "X-Storage-Source": "local-fallback",
          },
        });
      },
    },
  },
});
