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
  HelpCircle,
  Lightbulb,
  Check,
} from "lucide-react";
import type { BlogSection } from "@/data/blog";

export function BlogSectionsRenderer({ sections }: { sections?: BlogSection[] }) {
  if (!sections || sections.length === 0) return null;

  const enabledSections = sections
    .filter((s) => s.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (enabledSections.length === 0) return null;

  return (
    <div className="space-y-12 lg:space-y-16 mt-12">
      {enabledSections.map((section) => (
        <RenderSection key={section.id} section={section} />
      ))}
    </div>
  );
}

function RenderSection({ section }: { section: BlogSection }) {
  const { type, title, subtitle, content, images, buttonText, buttonUrl, items } = section;

  switch (type) {
    case "heading_text":
      return (
        <section className="scroll-mt-28">
          {subtitle ? <p className="eyebrow text-primary mb-2">{subtitle}</p> : null}
          {title ? (
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {title}
            </h2>
          ) : null}
          {content ? (
            <div className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
              {content}
            </div>
          ) : null}
          {buttonText && buttonUrl ? (
            <div className="mt-6">
              <ButtonLink href={buttonUrl} text={buttonText} />
            </div>
          ) : null}
        </section>
      );

    case "rich_text":
      return (
        <section className="prose prose-slate max-w-none text-muted-foreground leading-relaxed">
          {title ? <h2 className="font-display text-2xl font-bold text-ink">{title}</h2> : null}
          {content ? <div className="whitespace-pre-line mt-4 text-base">{content}</div> : null}
        </section>
      );

    case "image_text":
      return (
        <section className="grid gap-8 md:grid-cols-2 items-center rounded-3xl border border-border bg-card p-6 sm:p-8">
          {images && images[0]?.url ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                src={images[0].url}
                alt={images[0].alt || title || "Article illustration"}
                className="w-full h-auto object-cover max-h-80"
                loading="lazy"
              />
              {images[0].caption ? (
                <p className="p-3 text-xs text-muted-foreground bg-secondary/50 text-center italic">
                  {images[0].caption}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-4">
            {subtitle ? <p className="eyebrow text-primary">{subtitle}</p> : null}
            {title ? <h3 className="font-display text-2xl font-bold text-ink">{title}</h3> : null}
            {content ? (
              <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {content}
              </div>
            ) : null}
            {buttonText && buttonUrl ? (
              <div className="pt-2">
                <ButtonLink href={buttonUrl} text={buttonText} />
              </div>
            ) : null}
          </div>
        </section>
      );

    case "full_image":
      return (
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          {images && images[0]?.url ? (
            <img
              src={images[0].url}
              alt={images[0].alt || title || "Article graphic"}
              className="w-full h-auto max-h-[500px] object-cover"
              loading="lazy"
            />
          ) : null}
          {(title || content || (images && images[0]?.caption)) ? (
            <div className="p-6 bg-secondary/30 border-t border-border">
              {title ? <h3 className="font-bold text-ink text-base sm:text-lg">{title}</h3> : null}
              {content ? (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{content}</p>
              ) : null}
              {images && images[0]?.caption ? (
                <p className="mt-1 text-xs text-muted-foreground italic">{images[0].caption}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      );

    case "gallery":
      return (
        <section className="space-y-6">
          {title ? (
            <div>
              {subtitle ? <p className="eyebrow text-primary mb-1">{subtitle}</p> : null}
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">{title}</h3>
              {content ? <p className="mt-2 text-sm text-muted-foreground">{content}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images?.map((img, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition hover:shadow-soft"
              >
                <img
                  src={img.url}
                  alt={img.alt || `Gallery image ${i + 1}`}
                  className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {img.caption ? (
                  <div className="p-3 text-xs text-muted-foreground bg-card/90 border-t border-border">
                    {img.caption}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );

    case "video":
      return (
        <section className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          {title ? (
            <div>
              {subtitle ? <p className="eyebrow text-primary">{subtitle}</p> : null}
              <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
            </div>
          ) : null}
          {buttonUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
              {buttonUrl.includes("youtube.com") || buttonUrl.includes("youtu.be") || buttonUrl.includes("vimeo.com") ? (
                <iframe
                  src={buttonUrl}
                  title={title || "Video presentation"}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={buttonUrl} controls className="h-full w-full object-contain" />
              )}
            </div>
          ) : null}
          {content ? <p className="text-sm text-muted-foreground leading-relaxed">{content}</p> : null}
        </section>
      );

    case "quote":
      return (
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-8 sm:p-10">
          <Quote className="absolute -top-2 right-4 h-24 w-24 text-primary/10 pointer-events-none" />
          <p className="font-serif text-lg sm:text-xl italic leading-relaxed text-ink">
            “{content || title}”
          </p>
          {(subtitle || (items && items[0])) ? (
            <div className="mt-4 flex items-center gap-3">
              {items && items[0]?.icon ? (
                <img
                  src={items[0].icon}
                  alt={subtitle || "Author"}
                  className="h-10 w-10 rounded-full object-cover border border-primary/20"
                />
              ) : null}
              <div>
                <p className="font-bold text-sm text-ink">{subtitle || items?.[0]?.title}</p>
                {items?.[0]?.description ? (
                  <p className="text-xs text-muted-foreground">{items[0].description}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      );

    case "stats":
      return (
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          {title ? (
            <div>
              {subtitle ? <p className="eyebrow text-primary mb-1">{subtitle}</p> : null}
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">{title}</h3>
              {content ? <p className="mt-2 text-sm text-muted-foreground">{content}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items?.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/80 bg-secondary/30 p-5 text-center"
              >
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-primary">
                  {item.badge || item.title}
                </p>
                <p className="mt-1 font-semibold text-sm text-ink">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );

    case "features":
      return (
        <section className="space-y-6">
          {title ? (
            <div>
              {subtitle ? <p className="eyebrow text-primary mb-1">{subtitle}</p> : null}
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">{title}</h3>
              {content ? <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{content}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {items?.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-5 shadow-xs"
              >
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">{item.title}</h4>
                  {item.description ? (
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "key_takeaways":
      return (
        <section className="rounded-3xl border border-primary/20 bg-primary/5 p-7 sm:p-9 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Lightbulb className="h-5 w-5" />
            <span className="eyebrow text-primary">{subtitle || "Key Takeaways"}</span>
          </div>
          {title ? <h3 className="font-display text-xl font-bold text-ink">{title}</h3> : null}
          {content ? <p className="text-base text-ink leading-relaxed">{content}</p> : null}
          {items && items.length > 0 ? (
            <ul className="mt-4 space-y-2.5">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink leading-relaxed">
                  <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-[0.6rem] font-bold">
                    ✓
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    {item.description ? ` — ${item.description}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      );

    case "challenges":
    case "solutions":
    case "results": {
      const isChallenge = type === "challenges";
      const isResult = type === "results";
      return (
        <section
          className={`rounded-3xl border p-6 sm:p-8 space-y-4 ${
            isChallenge
              ? "border-amber-500/20 bg-amber-500/5"
              : isResult
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-primary/20 bg-primary/5"
          }`}
        >
          <div className="flex items-center gap-2">
            {isResult ? (
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            ) : isChallenge ? (
              <ShieldCheck className="h-5 w-5 text-amber-600" />
            ) : (
              <Zap className="h-5 w-5 text-primary" />
            )}
            <p
              className={`eyebrow font-bold ${
                isChallenge
                  ? "text-amber-700"
                  : isResult
                  ? "text-emerald-700"
                  : "text-primary"
              }`}
            >
              {subtitle || (isChallenge ? "The Challenge" : isResult ? "The Result" : "The Solution")}
            </p>
          </div>
          {title ? <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">{title}</h3> : null}
          {content ? (
            <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
              {content}
            </p>
          ) : null}
          {items && items.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                  <span>
                    <strong>{item.title}</strong>
                    {item.description ? `: ${item.description}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      );
    }

    case "technologies":
      return (
        <section className="space-y-4">
          {title ? (
            <div>
              {subtitle ? <p className="eyebrow text-primary mb-1">{subtitle}</p> : null}
              <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
              {content ? <p className="text-sm text-muted-foreground mt-1">{content}</p> : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {items?.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-ink shadow-xs"
              >
                {item.icon ? (
                  <img src={item.icon} alt={item.title} className="h-4 w-4 object-contain" />
                ) : (
                  <Layers className="h-3.5 w-3.5 text-primary" />
                )}
                {item.title}
              </span>
            ))}
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="space-y-6">
          {title ? (
            <div>
              {subtitle ? <p className="eyebrow text-primary mb-1">{subtitle}</p> : null}
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">{title}</h3>
              {content ? <p className="text-sm text-muted-foreground mt-1">{content}</p> : null}
            </div>
          ) : null}
          <div className="space-y-3">
            {items?.map((item, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-ink">{item.title}</h4>
                    {item.description ? (
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "cta":
      return (
        <section className="overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-secondary/30 p-8 sm:p-12 text-center shadow-lift space-y-4">
          {subtitle ? <p className="eyebrow text-primary">{subtitle}</p> : null}
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            {title || "Accelerate your growth with Jyot Enterprise"}
          </h3>
          {content ? (
            <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              {content}
            </p>
          ) : null}
          {buttonText && buttonUrl ? (
            <div className="pt-2">
              <ButtonLink href={buttonUrl} text={buttonText} isPrimary />
            </div>
          ) : null}
        </section>
      );

    case "custom":
    default:
      return (
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
          {subtitle ? <p className="eyebrow text-primary">{subtitle}</p> : null}
          {title ? <h3 className="font-display text-xl font-bold text-ink">{title}</h3> : null}
          {content ? (
            <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
              {content}
            </div>
          ) : null}
          {buttonText && buttonUrl ? (
            <div className="pt-2">
              <ButtonLink href={buttonUrl} text={buttonText} />
            </div>
          ) : null}
        </section>
      );
  }
}

function ButtonLink({
  href,
  text,
  isPrimary = false,
}: {
  href: string;
  text: string;
  isPrimary?: boolean;
}) {
  const isExternal = href.startsWith("http://") || href.startsWith("https://");
  const baseClasses = isPrimary
    ? "inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-ember hover:bg-primary-hover transition"
    : "inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink hover:border-primary/40 hover:text-primary transition";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClasses}>
        <span>{text}</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }

  return (
    <Link to={href} className={baseClasses}>
      <span>{text}</span>
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
