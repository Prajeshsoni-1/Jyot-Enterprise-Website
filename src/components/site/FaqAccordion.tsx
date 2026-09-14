import { SectionHeading } from "./primitives";

/** Accessible FAQ list. Uses native disclosure so it works without JS. */
export function FaqAccordion({
  items,
  eyebrow = "FAQs",
  title = "Questions we are asked most.",
}: {
  items: { q: string; a: string }[];
  eyebrow?: string;
  title?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="border-t border-border bg-surface py-24">
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="mt-12 grid gap-3">
          {items.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-border bg-background px-6 py-5 transition-colors hover:border-primary/30"
            >
              <summary className="cursor-pointer list-none font-display text-base font-bold text-ink marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
