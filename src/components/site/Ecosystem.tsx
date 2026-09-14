"use client";

import { motion } from "motion/react";
import { Banknote, Cpu, Scale, Cog } from "lucide-react";
import { Logo } from "./Logo";

const NODES = [
  { icon: Banknote, label: "Financial", angle: -90 },
  { icon: Cpu, label: "IT", angle: 0 },
  { icon: Scale, label: "Legal", angle: 90 },
  { icon: Cog, label: "Engineering", angle: 180 },
] as const;

const R = 38; // orbit radius in %

/**
 * Premium animated ecosystem: Jyot at the centre, four practices in slow orbit,
 * connected by animated hairlines that pulse toward the core.
 */
export function Ecosystem() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[32rem]">
      {/* orbit rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[6%] rounded-full border border-dashed border-border"
        aria-hidden="true"
      />
      <div
        className="absolute inset-[22%] rounded-full border border-border/70"
        aria-hidden="true"
      />
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-[30%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 30%, transparent), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* connecting lines */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="eco-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-growth)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {NODES.map((n, i) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = 50 + R * Math.cos(rad);
          const y = 50 + R * Math.sin(rad);
          return (
            <g key={n.label}>
              <line x1="50" y1="50" x2={x} y2={y} stroke="url(#eco-line)" strokeWidth="0.35" />
              <motion.circle
                r="0.9"
                fill="var(--color-primary)"
                initial={{ cx: x, cy: y, opacity: 0 }}
                animate={{ cx: [x, 50], cy: [y, 50], opacity: [0, 1, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, delay: i * 0.85, ease: "easeInOut" }}
              />
            </g>
          );
        })}
        <motion.circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="0.25"
          strokeDasharray="1 3"
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "50% 50%" }}
        />
      </svg>

      {/* centre */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <Logo variant="hero-badge" />
      </motion.div>

      {/* orbiting nodes */}
      {NODES.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180;
        const left = `${50 + R * Math.cos(rad)}%`;
        const top = `${50 + R * Math.sin(rad)}%`;
        return (
          <motion.div
            key={node.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.3 + i * 0.12 },
              scale: { duration: 0.6, delay: 0.3 + i * 0.12 },
              y: { duration: 7 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
            }}
            whileHover={{ scale: 1.06 }}
            style={{ left, top }}
            className="glass-card absolute -translate-x-1/2 -translate-y-1/2 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-3 shadow-soft"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="grid h-7 w-7 sm:h-9 sm:w-9 place-items-center rounded-lg sm:rounded-xl bg-primary/10 text-primary shrink-0">
                <node.icon className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" strokeWidth={1.7} />
              </span>
              <span className="font-display text-xs sm:text-sm font-bold whitespace-nowrap text-ink">
                {node.label}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
