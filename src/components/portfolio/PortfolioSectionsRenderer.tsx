import { Link } from "@tanstack/react-router";
import {
  ExternalLink,
  CheckCircle2,
  Quote,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { PortfolioSection } from "@/data/projects";

export function PortfolioSectionsRenderer({ sections }: { sections?: PortfolioSection[] }) {
  if (!sections || sections.length === 0) return null;

  const enabledSections = sections
    .filter((s) => s.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (enabledSections.length === 0) return null;

  return (
    <div className="space-y-16 lg:space-y-24">
      {enabledSections.map((section) => (
        <RenderSection key={section.id} section={section} />
      ))}
    </div>
  );
}

function RenderSection({ section }: { section: PortfolioSection }) {
  const { type, title, subtitle, content, images, buttonText, buttonUrl, items } = section;

  switch (type) {
    case "heading_text":
      return (
        <section className="container-x">
          <div className="max-w-3xl">
            {subtitle ? <p className="eyebrow text-primary mb-3">{subtitle}</p> : null}
            {title ? (
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl lg:text-4xl">
                {title}
              </h2>
            ) : null}
            {content ? (
              <div className="mt-4 text-base leading-relaxed text-muted-foreground whitespace-pre-line sm:text-lg">
                {content}
              </div>
            ) : null}
            {buttonText && buttonUrl ? (
              <div className="mt-6">
                <ButtonLink href={buttonUrl} text={buttonText} />
              </div>
            ) : null}
          </div>
        </section>
      );

    case "rich_text":
      return (
        <section className="container-x">
          <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-2xs">
            {title ? (
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl mb-4">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="text-sm font-semibold text-primary mb-4">{subtitle}</p>
            ) : null}
            <div className="prose prose-slate max-w-none text-base leading-relaxed text-muted-foreground whitespace-pre-line">
              {content}
            </div>
            {buttonText && buttonUrl ? (
              <div className="mt-6">
                <ButtonLink href={buttonUrl} text={buttonText} />
              </div>
            ) : null}
          </div>
        </section>
      );

    case "image_text": {
      const img = images?.[0];
      return (
        <section className="container-x">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {img ? (
              <div className="overflow-hidden rounded-3xl border border-border bg-secondary shadow-xs">
                <img
                  src={img.url}
                  alt={img.alt || img.caption || title || "Project image"}
                  className="h-full w-full object-cover max-h-[460px]"
                  loading="lazy"
                />
                {img.caption ? (
                  <p className="border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
                    {img.caption}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-4">
              {subtitle ? <p className="eyebrow text-primary">{subtitle}</p> : null}
              {title ? (
                <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  {title}
                </h2>
              ) : null}
              {content ? (
                <div className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                  {content}
                </div>
              ) : null}
              {buttonText && buttonUrl ? (
                <div className="pt-2">
                  <ButtonLink href={buttonUrl} text={buttonText} />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      );
    }

    case "full_image": {
      const img = images?.[0];
      if (!img) return null;
      return (
        <section className="container-x">
          <figure className="overflow-hidden rounded-3xl border border-border bg-secondary shadow-xs">
            <img
              src={img.url}
              alt={img.alt || img.caption || title || "Full width display"}
              className="w-full object-cover max-h-[560px]"
              loading="lazy"
            />
            {img.caption || title ? (
              <figcaption className="border-t border-border bg-card px-5 py-3 text-xs text-muted-foreground flex items-center justify-between">
                <span>{img.caption || title}</span>
                {subtitle ? <span className="text-primary font-semibold">{subtitle}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        </section>
      );
    }

    case "gallery":
      return (
        <section className="container-x">
          {title ? (
            <div className="mb-8">
              {subtitle ? <p className="eyebrow text-primary mb-2">{subtitle}</p> : null}
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {title}
              </h2>
              {content ? (
                <p className="mt-2 text-base text-muted-foreground">{content}</p>
              ) : null}
            </div>
          ) : null}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images?.map((img, i) => (
              <figure
                key={i}
                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-xs transition hover:border-primary"
              >
                <div className="aspect-4/3 overflow-hidden bg-secondary">
                  <img
                    src={img.url}
                    alt={img.alt || img.caption || `Gallery photo ${i + 1}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                {img.caption ? (
                  <figcaption className="border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground">
                    {img.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      );

    case "video":
      return (
        <section className="container-x">
          <div className="mx-auto max-w-4xl space-y-4">
            {title ? (
              <div>
                {subtitle ? <p className="eyebrow text-primary mb-2">{subtitle}</p> : null}
                <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
              </div>
            ) : null}
            {content?.includes("<iframe") ? (
              <div
                className="aspect-video w-full overflow-hidden rounded-3xl border border-border shadow-md"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : content?.startsWith("http") ? (
              <div className="aspect-video w-full overflow-hidden rounded-3xl border border-border shadow-md">
                <iframe
                  src={content}
                  title={title || "Project Video"}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{content}</p>
            )}
          </div>
        </section>
      );

    case "quote":
      return (
        <section className="container-x">
          <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-primary/5 p-8 sm:p-12 text-center shadow-xs">
            <Quote className="mx-auto h-8 w-8 text-primary/60 mb-4" />
            <blockquote className="font-display text-xl sm:text-2xl font-bold leading-snug text-ink italic">
              “{content || title}”
            </blockquote>
            {subtitle ? (
              <p className="mt-4 text-sm font-semibold text-primary">{subtitle}</p>
            ) : null}
            {images?.[0] ? (
              <img
                src={images[0].url}
                alt={subtitle || "Client quote photo"}
                className="mx-auto mt-4 h-14 w-14 rounded-full object-cover border-2 border-primary/30"
              />
            ) : null}
          </div>
        </section>
      );

    case "stats":
      return (
        <section className="container-x">
          {title ? (
            <div className="mb-8 text-center max-w-2xl mx-auto">
              {subtitle ? <p className="eyebrow text-primary mb-2">{subtitle}</p> : null}
              <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h2>
              {content ? <p className="mt-2 text-sm text-muted-foreground">{content}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items?.map((item, i) => (
              <div
                key={i}
                className="rounded-3xl border border-border bg-card p-6 shadow-2xs text-center"
              >
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-growth">
                  {item.title}
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">{item.description}</p>
                {item.badge ? (
                  <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-primary">
                    {item.badge}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );

    case "features":
      return (
        <section className="container-x">
          {title ? (
            <div className="mb-10 max-w-2xl">
              {subtitle ? <p className="eyebrow text-primary mb-2">{subtitle}</p> : null}
              <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h2>
              {content ? <p className="mt-2 text-base text-muted-foreground">{content}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items?.map((item, i) => (
              <div
                key={i}
                className="rounded-3xl border border-border bg-card p-6 shadow-2xs hover:border-primary/50 transition"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-ink">{item.title}</h3>
                {item.description ? (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );

    case "challenges":
    case "solutions":
    case "results":
      return (
        <section className="container-x">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                {type === "challenges" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : type === "solutions" ? (
                  <Zap className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {subtitle || type}
                </p>
                <h2 className="text-xl font-extrabold text-ink sm:text-2xl">{title}</h2>
              </div>
            </div>
            {content ? (
              <p className="text-base text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
                {content}
              </p>
            ) : null}
            {items && items.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((pt, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-ink bg-secondary/40 rounded-2xl p-3.5 border border-border/60"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt.title || pt.description}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      );

    case "technologies":
      return (
        <section className="container-x">
          {title ? (
            <div className="mb-6">
              {subtitle ? <p className="eyebrow text-primary mb-1">{subtitle}</p> : null}
              <h2 className="text-xl font-bold text-ink">{title}</h2>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2.5">
            {items?.map((tech, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-ink shadow-2xs"
              >
                <Layers className="h-3 w-3 text-primary" />
                {tech.title}
              </span>
            ))}
          </div>
        </section>
      );

    case "timeline":
      return (
        <section className="container-x">
          {title ? (
            <div className="mb-10 text-center max-w-2xl mx-auto">
              {subtitle ? <p className="eyebrow text-primary mb-2">{subtitle}</p> : null}
              <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h2>
              {content ? <p className="mt-2 text-sm text-muted-foreground">{content}</p> : null}
            </div>
          ) : null}
          <div className="space-y-4 max-w-3xl mx-auto">
            {items?.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-2xs"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground font-bold text-xs shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-ink text-sm sm:text-base">{step.title}</h3>
                    {step.badge ? (
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.68rem] font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {step.badge}
                      </span>
                    ) : null}
                  </div>
                  {step.description ? (
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "cta":
      return (
        <section className="container-x">
          <div className="rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-8 sm:p-12 text-center shadow-xs">
            {subtitle ? <p className="eyebrow text-primary mb-2">{subtitle}</p> : null}
            <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
              {title || "Ready to build something impactful?"}
            </h2>
            {content ? (
              <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">{content}</p>
            ) : null}
            {buttonText && buttonUrl ? (
              <div className="mt-6 flex justify-center">
                <ButtonLink href={buttonUrl} text={buttonText} isCta />
              </div>
            ) : null}
          </div>
        </section>
      );

    case "custom":
    default:
      return (
        <section className="container-x">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xs">
            {title ? <h2 className="text-xl font-bold text-ink mb-2">{title}</h2> : null}
            {subtitle ? <p className="text-xs font-semibold text-primary mb-3">{subtitle}</p> : null}
            {content ? (
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {content}
              </div>
            ) : null}
            {buttonText && buttonUrl ? (
              <div className="mt-4">
                <ButtonLink href={buttonUrl} text={buttonText} />
              </div>
            ) : null}
          </div>
        </section>
      );
  }
}

function ButtonLink({
  href,
  text,
  isCta = false,
}: {
  href: string;
  text: string;
  isCta?: boolean;
}) {
  const isExternal = href.startsWith("http://") || href.startsWith("https://");

  const className = isCta
    ? "inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
    : "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-ink hover:bg-secondary transition";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {text} <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {text} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}
