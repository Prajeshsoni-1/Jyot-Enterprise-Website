"use client";

import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  FolderTree,
  HardDrive,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mediaRegister } from "@/lib/settings.functions";
import { safeFileName } from "@/components/admin/MediaPicker";

export type PdfUploadResult = {
  url: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

type Props = {
  currentUrl?: string | undefined;
  currentPath?: string | undefined;
  currentFileName?: string | undefined;
  currentFileSize?: number | undefined;
  category?: string | undefined;
  onSelect: (result: PdfUploadResult) => void;
};

/**
 * Maps category/kind to the required Supabase Storage folder structure:
 * jyot-enterprise/
 * ├── website-documents/
 * │   ├── it-services/
 * │   ├── brochures/
 * │   ├── case-studies/
 * │   └── resources/
 */
export function getDocumentStorageFolder(category?: string): string {
  const cat = (category || "").toLowerCase().trim();
  if (
    cat.includes("it") ||
    cat.includes("software") ||
    cat.includes("tech") ||
    cat.includes("digital") ||
    cat.includes("ai")
  ) {
    return "website-documents/it-services";
  }
  if (cat.includes("brochure")) {
    return "website-documents/brochures";
  }
  if (cat.includes("case")) {
    return "website-documents/case-studies";
  }
  return "website-documents/resources";
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return null;
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function PdfUploadButton({
  currentUrl,
  currentPath,
  currentFileName,
  currentFileSize,
  category,
  onSelect,
}: Props) {
  const register = useServerFn(mediaRegister);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSuccessInfo(null);
    setBusy(true);

    try {
      // 1. Validate file extension
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("Invalid file extension: The file must have a .pdf extension.");
      }

      // 2. Validate MIME type
      if (file.type && file.type !== "application/pdf") {
        throw new Error(`Invalid MIME type (${file.type}): Must be application/pdf.`);
      }

      // 3. Validate size (25 MB max)
      if (file.size > 25 * 1024 * 1024) {
        throw new Error("File is too large: Maximum allowed PDF size is 25 MB.");
      }

      if (file.size < 100) {
        throw new Error("File is too small to be a valid PDF document.");
      }

      // 4. Validate binary %PDF- magic bytes signature
      const headerSlice = await file.slice(0, 5).arrayBuffer();
      const headerText = new TextDecoder("ascii").decode(headerSlice);
      if (headerText !== "%PDF-") {
        throw new Error(
          `Invalid PDF signature: Expected '%PDF-' header, found '${headerText.replace(/[^a-zA-Z0-9%_-]/g, "?")}'. File is not a valid PDF.`,
        );
      }

      // 5. Build structured folder path in bucket 'jyot-enterprise'
      const folder = getDocumentStorageFolder(category);
      const fileName = safeFileName(file.name);
      const storagePath = `${folder}/${fileName}`;

      // 6. Upload directly to dedicated Supabase Storage bucket 'jyot-enterprise'
      const { error: uploadError } = await supabase.storage
        .from("jyot-enterprise")
        .upload(storagePath, file, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
      }

      // 7. Get permanent public storage URL
      const { data: publicUrlData } = supabase.storage
        .from("jyot-enterprise")
        .getPublicUrl(storagePath);
      const publicUrl = publicUrlData.publicUrl;

      // 8. Register in media registry
      try {
        await register({
          data: {
            path: storagePath,
            name: file.name,
            mimeType: "application/pdf",
            sizeBytes: file.size,
          },
        });
      } catch {
        // Non-blocking if media registry has custom rules
      }

      const sizeFormatted = formatBytes(file.size);
      setSuccessInfo(
        `PDF verified (%PDF- signature, ${sizeFormatted}) & stored permanently in Supabase bucket 'jyot-enterprise/${storagePath}'.`,
      );

      onSelect({
        url: publicUrl,
        storagePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: "application/pdf",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate or upload PDF.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const effectiveUrl = currentUrl || "";
  const displaySize = formatBytes(currentFileSize);

  function copyUrl() {
    if (!effectiveUrl) return;
    navigator.clipboard.writeText(effectiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition disabled:opacity-60 cursor-pointer"
          >
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Validating & Storing…</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                <span>{effectiveUrl ? "Replace PDF Document" : "Upload PDF to Supabase Storage"}</span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>

        {effectiveUrl ? (
          <div className="flex items-center gap-2">
            <a
              href={effectiveUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Preview / Open PDF</span>
            </a>

            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-ink transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {/* Storage & Metadata badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[0.7rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.68rem] text-ink">
          <HardDrive className="h-3 w-3 text-primary" />
          Bucket: jyot-enterprise
        </span>

        {currentPath ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.68rem] text-muted-foreground">
            <FolderTree className="h-3 w-3" />
            {currentPath}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.68rem] text-muted-foreground">
            <FolderTree className="h-3 w-3" />
            Folder: {getDocumentStorageFolder(category)}/
          </span>
        )}

        {displaySize ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.68rem] font-semibold text-ink">
            Size: {displaySize}
          </span>
        ) : null}

        {currentFileName ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.68rem] text-muted-foreground">
            <FileText className="h-3 w-3" />
            {currentFileName}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {successInfo ? (
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successInfo}</span>
        </div>
      ) : null}
    </div>
  );
}

