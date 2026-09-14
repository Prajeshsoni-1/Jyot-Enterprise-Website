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
  FileSpreadsheet,
  FileArchive,
  File,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mediaRegister } from "@/lib/settings.functions";
import { safeFileName } from "@/components/admin/MediaPicker";

export type ResourceFileUploadResult = {
  url: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: string;
};

type Props = {
  currentUrl?: string | undefined;
  currentPath?: string | undefined;
  currentFileName?: string | undefined;
  currentFileSize?: number | undefined;
  currentFileType?: string | undefined;
  onSelect: (result: ResourceFileUploadResult) => void;
};

const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".xlsx",
  ".xls",
  ".docx",
  ".doc",
  ".pptx",
  ".ppt",
  ".csv",
  ".zip",
];

const MIME_MAP: Record<string, { mime: string; type: string }> = {
  ".pdf": { mime: "application/pdf", type: "PDF" },
  ".xlsx": {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    type: "XLSX",
  },
  ".xls": { mime: "application/vnd.ms-excel", type: "XLS" },
  ".docx": {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    type: "DOCX",
  },
  ".doc": { mime: "application/msword", type: "DOC" },
  ".pptx": {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    type: "PPTX",
  },
  ".ppt": { mime: "application/vnd.ms-powerpoint", type: "PPT" },
  ".csv": { mime: "text/csv", type: "CSV" },
  ".zip": { mime: "application/zip", type: "ZIP" },
};

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return null;
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function getFileIcon(type?: string) {
  const t = (type || "").toUpperCase();
  if (t === "PDF") return FileText;
  if (t === "XLSX" || t === "XLS" || t === "CSV") return FileSpreadsheet;
  if (t === "ZIP") return FileArchive;
  return File;
}

export function ResourceFileUploadButton({
  currentUrl,
  currentPath,
  currentFileName,
  currentFileSize,
  currentFileType,
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
      const ext = ("." + (file.name.split(".").pop() || "")).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        throw new Error(
          `Invalid file extension '${ext}'. Supported formats: PDF, XLSX, XLS, DOCX, DOC, PPTX, PPT, CSV, ZIP.`,
        );
      }

      const fileMapping = MIME_MAP[ext] || {
        mime: file.type || "application/octet-stream",
        type: "FILE",
      };

      // Validate size (50 MB max, minimum 16 bytes)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File is too large: Maximum allowed size is 50 MB.");
      }
      if (file.size < 16) {
        throw new Error("File is empty or corrupted.");
      }

      // Binary header validation
      if (ext === ".pdf") {
        const headerSlice = await file.slice(0, 5).arrayBuffer();
        const headerText = new TextDecoder("ascii").decode(headerSlice);
        if (headerText !== "%PDF-") {
          throw new Error(
            `Invalid PDF signature: Expected '%PDF-' header, found '${headerText.replace(/[^a-zA-Z0-9%_-]/g, "?")}'. File is not a valid PDF document.`,
          );
        }
      } else if (ext === ".xlsx" || ext === ".docx" || ext === ".pptx" || ext === ".zip") {
        const headerSlice = new Uint8Array(await file.slice(0, 4).arrayBuffer());
        // ZIP magic bytes: 0x50, 0x4B, 0x03, 0x04 (or 0x05, 0x06 empty)
        if (!(
          headerSlice[0] === 0x50 &&
          headerSlice[1] === 0x4b &&
          (headerSlice[2] === 0x03 || headerSlice[2] === 0x05)
        )) {
          throw new Error(
            `Invalid archive signature for ${ext.toUpperCase()}: The file does not appear to be a valid OpenXML/ZIP document.`,
          );
        }
      } else if (ext === ".xls" || ext === ".doc" || ext === ".ppt") {
        const headerSlice = new Uint8Array(await file.slice(0, 4).arrayBuffer());
        // OLE compound document magic: D0 CF 11 E0
        if (!(
          headerSlice[0] === 0xd0 &&
          headerSlice[1] === 0xcf &&
          headerSlice[2] === 0x11 &&
          headerSlice[3] === 0xe0
        )) {
          throw new Error(`Invalid legacy Office signature for ${ext.toUpperCase()}.`);
        }
      }

      // Build structured folder path in existing bucket 'jyot-enterprise'
      const folder = "website-documents/resources";
      const sanitizedName = safeFileName(file.name);
      const storagePath = `${folder}/${sanitizedName}`;

      // Upload directly to dedicated Supabase Storage bucket 'jyot-enterprise'
      const { error: uploadError } = await supabase.storage
        .from("jyot-enterprise")
        .upload(storagePath, file, {
          contentType: fileMapping.mime,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
      }

      // Get permanent public storage URL
      const { data: publicUrlData } = supabase.storage
        .from("jyot-enterprise")
        .getPublicUrl(storagePath);
      const publicUrl = publicUrlData.publicUrl;

      // Register in media registry
      try {
        await register({
          data: {
            path: storagePath,
            name: file.name,
            mimeType: fileMapping.mime,
            sizeBytes: file.size,
          },
        });
      } catch {
        // Non-blocking
      }

      const sizeFormatted = formatBytes(file.size);
      setSuccessInfo(`Uploaded ${file.name}${sizeFormatted ? ` (${sizeFormatted})` : ""}`);

      onSelect({
        url: publicUrl,
        storagePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: fileMapping.mime,
        fileType: fileMapping.type,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleCopyUrl() {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const FileIconComponent = getFileIcon(currentFileType);

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.zip,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
        onChange={(e) => void handleFile(e.target.files?.[0])}
        className="hidden"
      />

      {/* Upload button & current state display */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink shadow-2xs hover:bg-secondary disabled:opacity-50 transition cursor-pointer"
        >
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Validating &amp; Uploading…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5 text-primary" />
              {currentUrl ? "Replace File" : "Choose File (PDF, XLSX, DOCX…)"}
            </>
          )}
        </button>

        {currentUrl ? (
          <div className="flex items-center gap-2 text-xs">
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 font-semibold text-ink hover:text-primary transition"
            >
              <ExternalLink className="h-3 w-3" />
              Preview / Open
            </a>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 font-semibold text-ink hover:text-primary transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy URL
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {/* Uploaded file metadata summary card */}
      {currentUrl ? (
        <div className="rounded-2xl border border-border bg-secondary/30 p-3 text-xs space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileIconComponent className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-ink truncate">
                {currentFileName || currentUrl.split("/").pop()}
              </span>
            </div>
            {currentFileType ? (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold text-primary shrink-0">
                {currentFileType}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-between text-muted-foreground pt-1">
            <span>Size: {formatBytes(currentFileSize) || "—"}</span>
            <span
              className="font-mono text-[0.65rem] truncate max-w-[200px]"
              title={currentPath || ""}
            >
              {currentPath || "jyot-enterprise"}
            </span>
          </div>
        </div>
      ) : null}

      {/* Success banner */}
      {successInfo ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-700 animate-in fade-in">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{successInfo}</span>
        </div>
      ) : null}

      {/* Error banner */}
      {error ? (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs font-semibold text-destructive animate-in fade-in">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-muted-foreground hover:text-ink text-[0.65rem] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <p className="text-[0.7rem] text-muted-foreground">
        Supported formats: <strong>PDF</strong>, <strong>XLSX</strong>, <strong>XLS</strong>,{" "}
        <strong>DOCX</strong>, <strong>DOC</strong>, <strong>PPTX</strong>, <strong>CSV</strong>,{" "}
        <strong>ZIP</strong>. PDFs are verified for valid{" "}
        <code className="text-[0.65rem]">%PDF-</code> magic bytes. Stored in bucket{" "}
        <code className="text-[0.65rem]">jyot-enterprise/website-documents/resources/</code>.
      </p>
    </div>
  );
}
