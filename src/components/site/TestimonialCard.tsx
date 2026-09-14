import { Star } from "lucide-react";

export type Testimonial = {
  name: string;
  company?: string;
  role?: string;
  rating?: number;
  quote: string;
  service?: string;
  videoUrl?: string;
  initials?: string;
};

/** Reusable testimonial card used on service, industry and case-study pages. */
export function TestimonialCard({ t }: { t: Testimonial }) {
  const rating = t.rating ?? 5;
  const initials =
    t.initials ??
    t.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("");

  return (
    <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft">
      <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={i < rating ? "h-4 w-4 fill-growth text-growth" : "h-4 w-4 text-border"}
            aria-hidden="true"
          />
        ))}
      </div>
      <blockquote className="mt-5 flex-1 text-base leading-relaxed text-ink">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      {t.videoUrl ? (
        <a
          href={t.videoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 w-fit text-sm font-semibold text-primary hover:underline"
        >
          Watch the video testimonial
        </a>
      ) : null}
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-bold text-ink">{t.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {[t.role, t.company].filter(Boolean).join(" · ")}
          </span>
        </span>
        {t.service ? (
          <span className="ml-auto shrink-0 rounded-full bg-surface px-3 py-1 text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
            {t.service}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
