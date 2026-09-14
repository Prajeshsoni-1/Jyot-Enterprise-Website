"use client";

import { cn } from "@/lib/utils";

/**
 * Ambient background layer: subtle grid, drifting brand glows and noise.
 * Purely decorative — never interactive.
 */
export function Ambient({
  className,
  grid = true,
  intensity = "soft",
}: {
  className?: string;
  grid?: boolean;
  intensity?: "soft" | "medium" | "strong";
}) {
  const strength = intensity === "strong" ? 26 : intensity === "medium" ? 18 : 11;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {grid ? <div className="hairline-grid absolute inset-0" /> : null}
      <div
        className="animate-drift absolute -top-48 -right-40 h-[42rem] w-[42rem] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, var(--color-primary) ${strength}%, transparent), transparent 68%)`,
        }}
      />
      <div
        className="animate-drift-alt absolute -bottom-56 -left-40 h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, var(--color-growth) ${Math.round(strength * 0.7)}%, transparent), transparent 68%)`,
        }}
      />
      <div className="noise-layer absolute inset-0" />
    </div>
  );
}

export function GradientDivider({ className }: { className?: string }) {
  return <div className={cn("gradient-divider", className)} aria-hidden="true" />;
}
