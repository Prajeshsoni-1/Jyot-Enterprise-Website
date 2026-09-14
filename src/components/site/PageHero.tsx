import { Reveal } from "./primitives";
import { Ambient } from "./Ambient";
import { cn } from "@/lib/utils";

type Variant = "default" | "gold" | "saas" | "seal" | "blueprint";

const OVERLAY: Record<Variant, string> = {
  default: "",
  gold: "linear-gradient(150deg, oklch(0.97 0.05 95 / 0.9), transparent 55%)",
  saas: "linear-gradient(150deg, oklch(0.95 0.03 256 / 0.9), transparent 55%)",
  seal: "linear-gradient(150deg, oklch(0.96 0.02 250 / 0.95), transparent 55%)",
  blueprint: "linear-gradient(150deg, oklch(0.95 0.02 230 / 0.95), transparent 55%)",
};

export function PageHero({
  eyebrow,
  title,
  body,
  variant = "default",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  variant?: Variant;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface pt-[76px]">
      <Ambient intensity="medium" />
      {variant === "blueprint" ? (
        <div
          className="blueprint-grid pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
        />
      ) : null}
      {variant !== "default" ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: OVERLAY[variant] }}
          aria-hidden="true"
        />
      ) : null}

      <div className={cn("container-x relative py-24 lg:py-32")}>
        <Reveal className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] text-ink sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {body ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{body}</p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
