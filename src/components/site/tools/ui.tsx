"use client";

import type { ReactNode } from "react";

export const toolField =
  "w-full min-w-0 rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none";

export function ToolShell({ children, result }: { children: ReactNode; result: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="grid min-w-0 content-start gap-5">{children}</div>
      <div className="min-w-0 rounded-3xl border border-border bg-surface p-5 sm:p-8">{result}</div>
    </div>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  slider = true,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  slider?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center justify-between text-xs font-semibold text-ink">
        <span>{label}</span>
        {suffix && <span className="font-normal text-muted-foreground">{suffix}</span>}
      </label>
      <input
        type="number"
        className={toolField}
        value={Number.isFinite(value) ? value : 0}
        min={min}
        {...(max !== undefined ? { max } : {})}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {slider && max !== undefined && (
        <input
          type="range"
          aria-label={`${label} slider`}
          className="mt-3 w-full accent-[var(--color-primary)]"
          min={min}
          max={max}
          step={step}
          value={Math.min(Math.max(value, min), max)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}
    </div>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-ink">{label}</label>
      <select className={toolField} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckList({
  items,
  checked,
  toggle,
}: {
  items: string[];
  checked: string[];
  toggle: (item: string) => void;
}) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item}>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink transition-colors hover:border-primary/40">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
              checked={checked.includes(item)}
              onChange={() => toggle(item)}
            />
            <span className={checked.includes(item) ? "text-muted-foreground line-through" : ""}>
              {item}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-5 py-4">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-extrabold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ResultHeading({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-lg font-extrabold text-ink">{children}</h3>;
}
