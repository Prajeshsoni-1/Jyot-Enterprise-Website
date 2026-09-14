import { cn } from "@/lib/utils";

export type LogoVariant = "default" | "compact" | "icon" | "hero-badge";

export interface LogoProps {
  className?: string;
  variant?: LogoVariant;
  invert?: boolean;
  alt?: string;
}

export function Logo({
  className,
  variant = "default",
  invert = false,
  alt = "Jyot Enterprise",
}: LogoProps) {
  if (variant === "icon") {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center select-none", className)}
      >
        <img
          src="/brand/logo-mark.png"
          alt={alt}
          className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
          loading="eager"
          decoding="async"
        />
      </span>
    );
  }

  if (variant === "hero-badge") {
    return (
      <div
        className={cn(
          "relative grid place-items-center rounded-full bg-background/90 dark:bg-card/90 text-center shadow-soft dark:shadow-lift select-none border border-border ring-2 ring-primary/20 dark:ring-primary/30 backdrop-blur-md",
          "h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36",
          className,
        )}
      >
        {/* Subtle theme-aware warm radial accent */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-primary)_10%,transparent)_0%,transparent_70%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center justify-center p-2.5 sm:p-3.5">
          <img
            src="/brand/logo-mark.png"
            alt={alt}
            className="h-8 sm:h-9.5 md:h-11 w-auto max-w-[70px] sm:max-w-[82px] md:max-w-[94px] object-contain transition-transform duration-300 hover:scale-105"
            loading="eager"
            decoding="async"
          />
          <span className="mt-1.5 font-display text-[0.62rem] sm:text-[0.68rem] md:text-[0.72rem] leading-tight font-extrabold tracking-[0.22em] text-ink dark:text-foreground uppercase">
            Jyot
            <span className="block text-[0.52rem] sm:text-[0.58rem] md:text-[0.62rem] font-bold tracking-[0.28em] text-primary">
              Enterprise
            </span>
          </span>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span className={cn("inline-flex shrink-0 items-center select-none", className)}>
        <img
          src={invert ? "/brand/logo-dark-mode.png" : "/brand/logo-cropped.png"}
          alt={alt}
          className="h-7 sm:h-8 w-auto max-w-[120px] sm:max-w-[145px] object-contain"
          loading="eager"
          decoding="async"
        />
      </span>
    );
  }

  // Default horizontal logo lockup with responsive height & width limits
  return (
    <span className={cn("inline-flex shrink-0 items-center select-none", className)}>
      <img
        src={invert ? "/brand/logo-dark-mode.png" : "/brand/logo-cropped.png"}
        alt={alt}
        className="h-8 sm:h-9.5 md:h-10.5 w-auto max-w-[130px] sm:max-w-[175px] md:max-w-[210px] object-contain"
        loading="eager"
        decoding="async"
      />
    </span>
  );
}
