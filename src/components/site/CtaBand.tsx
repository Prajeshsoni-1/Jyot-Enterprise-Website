import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MessageCircle, PhoneCall } from "lucide-react";
import { Reveal } from "./primitives";
import { CONTACT } from "@/data/site";
import { trackCtaClick } from "@/lib/track";

/**
 * Enterprise CTA band. Dropped at the bottom of every content template so the
 * next step is always one click away.
 */
export function CtaBand({
  eyebrow = "Next step",
  title = "Tell us the problem. We will tell you what it takes.",
  body = "A 30-minute consultation with the practice lead who would actually run your mandate — no sales layer in between.",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
}) {
  return (
    <section className="relative overflow-hidden border-t border-border bg-ink py-24 text-background">
      <div
        className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.12]"
        aria-hidden="true"
      />
      <div className="container-x relative">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-primary">{eyebrow}</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">{title}</h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-background/70">{body}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/book"
              onClick={() => trackCtaClick("book_consultation", "cta_band")}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Book a consultation <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href={CONTACT.phoneHref}
              onClick={() => trackCtaClick("call", "cta_band")}
              className="inline-flex items-center gap-2 rounded-full border border-background/25 px-6 py-3 text-sm font-semibold transition-colors hover:border-background/60"
            >
              <PhoneCall className="h-4 w-4" /> {CONTACT.phone}
            </a>
            <a
              href={CONTACT.phoneHref2}
              onClick={() => trackCtaClick("call", "cta_band")}
              className="inline-flex items-center gap-2 rounded-full border border-background/25 px-6 py-3 text-sm font-semibold transition-colors hover:border-background/60"
            >
              <PhoneCall className="h-4 w-4" /> {CONTACT.phone2}
            </a>
            <a
              href={CONTACT.whatsapp}
              onClick={() => trackCtaClick("whatsapp", "cta_band")}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full border border-background/25 px-6 py-3 text-sm font-semibold transition-colors hover:border-background/60"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
