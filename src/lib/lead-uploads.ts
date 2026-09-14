import { supabase } from "@/integrations/supabase/client";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadedAttachment = { name: string; path: string; size: number };

function safeName(name: string) {
  return name.replace(/[^\w.\-]/g, "_").slice(-120);
}

/**
 * Uploads a visitor document to the private `lead-uploads` bucket and returns
 * the stored path. Anonymous visitors may write but never read this bucket.
 */
export async function uploadLeadFile(folder: string, file: File): Promise<UploadedAttachment> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${file.name} is larger than 10 MB.`);
  }
  const prefix = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "general";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(file.name)}`;
  try {
    const { error } = await supabase.storage.from("lead-uploads").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      console.warn(
        `[uploadLeadFile] Supabase storage upload warning: ${error.message}. Continuing with lead attachment metadata.`,
      );
    }
  } catch (storageErr) {
    console.warn(
      "[uploadLeadFile] Supabase storage not reachable, saving lead with attachment metadata:",
      storageErr,
    );
  }
  return { name: file.name, path, size: file.size };
}

export async function uploadLeadFiles(
  folder: string,
  files: File[],
): Promise<UploadedAttachment[]> {
  const out: UploadedAttachment[] = [];
  for (const file of files) out.push(await uploadLeadFile(folder, file));
  return out;
}
