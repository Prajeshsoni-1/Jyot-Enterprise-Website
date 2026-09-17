"use client";

import { Loader2, ArrowUpRight } from "lucide-react";
import { isValidElement, type ComponentType, type ReactNode } from "react";
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

export function StatusPill({ value, className }: { value: string; className?: string }) {
  const tone: Record<string, string> = {
    new: "bg-primary/10 text-primary border-primary/25",
    assigned: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    contacted: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    qualified: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    follow_up: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    proposal: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    won: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    lost: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    archived: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide",
        tone[value] ?? "bg-slate-100 text-slate-600 border-slate-200",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          value === "won" ? "bg-emerald-500" :
          value === "new" ? "bg-primary animate-pulse" :
          value === "lost" ? "bg-rose-500" :
          value === "high" || value === "qualified" ? "bg-amber-500" : "bg-current opacity-60"
        )}
      />
      {STATUS_LABEL[value] ?? value}
    </span>
  );
}

export function PriorityPill({ value, className }: { value: string; className?: string }) {
  const tone: Record<string, string> = {
    High: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    Low: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide",
        tone[value] ?? "bg-slate-100 text-slate-600 border-slate-200",
        className,
      )}
    >
      {value}
    </span>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/80 bg-card p-6 shadow-2xs transition-all", className)}>
      {title || action ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            {title && <h2 className="text-sm font-bold tracking-tight text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
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
  icon,
  trend,
  href,
  onClick,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: ComponentType<{ className?: string }> | ReactNode;
  trend?: { value: string; isPositive?: boolean };
  href?: string;
  onClick?: () => void;
  accent?: "primary" | "emerald" | "amber" | "indigo" | "rose" | undefined;
}) {
  const isClickable = Boolean(href || onClick);

  const accentStyles = {
    primary: "border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/[0.03] to-transparent",
    emerald: "border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-br from-emerald-500/[0.03] to-transparent",
    amber: "border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-br from-amber-500/[0.03] to-transparent",
    indigo: "border-indigo-500/30 hover:border-indigo-500/60 bg-gradient-to-br from-indigo-500/[0.03] to-transparent",
    rose: "border-rose-500/30 hover:border-rose-500/60 bg-gradient-to-br from-rose-500/[0.03] to-transparent",
  };

  const iconBgStyles = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  };

  // Determine if icon is a Component or ReactNode
  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as any;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-2xs transition-all duration-200",
        isClickable && "cursor-pointer hover:-translate-y-0.5 hover:shadow-soft",
        accent ? accentStyles[accent] : "hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[0.72rem] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            {value}
          </p>
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
              accent ? iconBgStyles[accent] : "bg-secondary text-primary",
            )}
          >
            {renderIcon()}
          </div>
        ) : isClickable ? (
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      {(hint || trend) && (
        <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/40 text-[0.72rem]">
          {hint && <span className="text-muted-foreground truncate">{hint}</span>}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center font-bold",
                trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" /> {label}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-secondary/15 px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-3">
        <span className="text-xl">✦</span>
      </div>
      <p className="text-sm font-bold text-ink">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-destructive">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
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
