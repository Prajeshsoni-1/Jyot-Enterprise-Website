"use client";

import { useState } from "react";
import { Download, FileText, Check } from "lucide-react";
import { DOWNLOADS, downloadsFor } from "@/data/downloads";
import type { ServiceKey } from "@/data/site";
import { trackEvent } from "@/lib/analytics";

export function DownloadCenter({ division, title }: { division?: ServiceKey; title?: string }) {
  const items = division ? downloadsFor(division) : DOWNLOADS;
  const [done, setDone] = useState<string[]>([]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {title && (
        <h3 className="sm:col-span-2 font-display text-xl font-extrabold text-ink">{title}</h3>
      )}
      {items.map((item) => {
        const isDone = done.includes(item.slug);
        const filename = item.downloadName || `${item.slug}.pdf`;
        const fileUrl = item.fileUrl || `/api/downloads/${filename}`;

        return (
          <div
            key={item.slug}
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-background p-6 transition-colors hover:border-primary/30"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
                <FileText className="h-3.5 w-3.5" /> {item.kind}
              </span>
              <span className="rounded bg-muted px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                PDF
              </span>
            </div>
            <p className="mt-4 font-display text-base font-bold text-ink">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>

            <a
              href={fileUrl}
              download={filename}
              onClick={() => {
                setDone((prev) => (prev.includes(item.slug) ? prev : [...prev, item.slug]));
                trackEvent("file_download", {
                  file_name: filename,
                  division: item.division,
                });
              }}
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary cursor-pointer"
            >
              {isDone ? (
                <>
                  <Check className="h-3.5 w-3.5 text-growth-foreground" />
                  <span>Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download · PDF</span>
                </>
              )}
            </a>
          </div>
        );
      })}
    </div>
  );
}
