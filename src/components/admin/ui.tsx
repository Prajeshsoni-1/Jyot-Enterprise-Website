"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const STATUS_OPTIONS = [
  "new",
  "assigned",
  "contacted",
  "qualified",
  "follow_up",
  "proposal",
  "won",
  "lost",
  "archived",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  assigned: "Assigned",
  contacted: "Contacted",
  qualified: "Qualified",
  follow_up: "Follow-up",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};
export const PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const;
export const DIVISION_OPTIONS = ["financial", "it", "legal", "engineering"] as const;

export const DIVISION_LABEL: Record<string, string> = {
  financial: "Financial",
  it: "IT & Technology",
  legal: "Legal & Compliance",
  engineering: "Engineering",
};

export function StatusPill({ value }: { value: string }) {
  const tone: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    assigned: "bg-indigo-500/10 text-indigo-600",
    contacted: "bg-sky-500/10 text-sky-600",
    qualified: "bg-amber-500/10 text-amber-600",
    follow_up: "bg-orange-500/10 text-orange-600",
    proposal: "bg-violet-500/10 text-violet-600",
    won: "bg-emerald-500/10 text-emerald-600",
    lost: "bg-destructive/10 text-destructive",
    archived: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold",
        tone[value] ?? "bg-muted text-muted-foreground",
      )}
    >
      {STATUS_LABEL[value] ?? value}
    </span>
  );
}

export function PriorityPill({ value }: { value: string }) {
  const tone: Record<string, string> = {
    High: "bg-destructive/10 text-destructive",
    Medium: "bg-amber-500/10 text-amber-600",
    Low: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold",
        tone[value] ?? "bg-muted text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-background p-5", className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold tracking-tight text-ink">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
  onClick,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  onClick?: () => void;
}) {
  const isClickable = Boolean(href || onClick);
  const content = (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border bg-background p-4 transition",
        isClickable &&
          "hover:border-primary/50 hover:shadow-sm cursor-pointer hover:bg-secondary/20",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {isClickable ? <span className="text-xs text-muted-foreground">→</span> : null}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-[0.7rem] text-muted-foreground">{hint}</p> : null}
    </div>
  );

  return content;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body ? <p className="mt-1 text-xs text-muted-foreground">{body}</p> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-destructive">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDestructive = true,
  busy = false,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  isDestructive?: boolean | undefined;
  busy?: boolean | undefined;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50",
              isDestructive
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-primary hover:bg-primary/90",
            )}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
