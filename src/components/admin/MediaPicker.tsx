"use client";

import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mediaList, mediaRegister } from "@/lib/settings.functions";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_BYTES = 10 * 1024 * 1024;

export type MediaItem = {
  id: string;
  url: string;
  name: string;
  created_at: string;
  size_bytes: number | null;
};

export function safeFileName(name: string) {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-60);
  return `${Date.now()}-${clean}`;
}

/** Uploads an image to the private website media area and registers it. */
export async function uploadMedia(
  file: File,
  register: ReturnType<typeof useServerFn<typeof mediaRegister>>,
  folderPrefix = "site",
) {
  if (!ALLOWED.includes(file.type))
    throw new Error("Please choose a JPG, PNG, WEBP, GIF or SVG image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 10 MB or smaller.");
  const path = `${folderPrefix}/${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from("site-media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error("Upload failed. Please try again.");
  return register({ data: { path, name: file.name, mimeType: file.type, sizeBytes: file.size } });
}

export function MediaPicker({
  onSelect,
  onClose,
  folderPrefix = "site",
}: {
  onSelect: (url: string, item?: MediaItem) => void;
  onClose: () => void;
  folderPrefix?: string;
}) {
  const list = useServerFn(mediaList);
  const register = useServerFn(mediaRegister);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh(q = "") {
    try {
      const res = await list({ data: { search: q } });
      setItems(res.rows as MediaItem[]);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await uploadMedia(file, register, folderPrefix);
      await refresh(search);
      onSelect(res.url, {
        id: res.id,
        url: res.url,
        name: file.name,
        created_at: new Date().toISOString(),
        size_bytes: file.size,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleCopy(url: string, e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="max-h-[88vh] w-full max-w-4xl flex flex-col rounded-3xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink">Media Library</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select an existing media asset, upload a new image, or paste an external URL.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-ink transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Toolbar: Upload, Search, Paste URL */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                void refresh(e.target.value);
              }}
              placeholder="Search images in media library…"
              className="w-full rounded-2xl border border-border bg-secondary/30 px-3.5 py-2 text-sm outline-none focus:border-primary focus:bg-background transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-60 transition"
            >
              <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload New"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ALLOWED.join(",")}
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </div>
        </div>

        {/* Custom URL row */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-2 text-xs">
          <span className="font-semibold text-muted-foreground whitespace-nowrap pl-1">
            Or direct URL:
          </span>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://images.unsplash.com/... or /images/..."
            className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={!customUrl.trim()}
            onClick={() => {
              if (customUrl.trim()) {
                onSelect(customUrl.trim());
                onClose();
              }
            }}
            className="rounded-full bg-ink px-3 py-1.5 font-bold text-background hover:opacity-90 disabled:opacity-40 transition"
          >
            Use URL
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}

        {/* Grid of images */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelect(item.url, item);
                  onClose();
                }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary hover:shadow-md"
              >
                <div className="aspect-4/3 w-full bg-secondary/50 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-2.5">
                  <span className="block truncate text-xs font-semibold text-ink">
                    {item.name}
                  </span>
                  <div className="mt-1 flex items-center justify-between text-[0.68rem] text-muted-foreground">
                    <span>
                      {item.size_bytes ? `${Math.round(item.size_bytes / 1024)} KB` : "Image"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.url, e)}
                      className="rounded px-1.5 py-0.5 text-[0.65rem] font-bold text-primary hover:bg-primary/10 transition"
                    >
                      {copiedUrl === item.url ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!items.length && !busy ? (
              <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                <p>No media files found.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Upload an image or paste an image URL above.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MediaButton({
  label = "Choose image",
  onSelect,
  folderPrefix = "site",
}: {
  label?: string | undefined;
  onSelect: (url: string, item?: MediaItem) => void;
  folderPrefix?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[0.72rem] font-semibold text-ink shadow-2xs hover:bg-secondary transition"
      >
        <ImagePlus className="h-3.5 w-3.5 text-primary" /> {label}
      </button>
      {open ? (
        <MediaPicker
          onSelect={onSelect}
          onClose={() => setOpen(false)}
          folderPrefix={folderPrefix}
        />
      ) : null}
    </>
  );
}

