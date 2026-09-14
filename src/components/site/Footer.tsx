import { Link } from "@tanstack/react-router";
import {
  Instagram,
  Facebook,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { SERVICES, INDUSTRIES, PRODUCTS } from "@/data/site";
import { telHref, useSiteSettings } from "@/lib/site-settings";
import { Logo } from "./Logo";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-xs font-bold tracking-[0.18em] text-background/50 uppercase">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

const linkClass =
  "relative inline-block text-sm text-background/70 transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100";

export function Footer() {
  const settings = useSiteSettings();
  return (
    <footer className="relative overflow-hidden bg-ink text-background">
      <div
        className="animate-drift pointer-events-none absolute -top-40 right-0 h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent 68%)",
        }}
        aria-hidden="true"
      />
      <div className="container-x relative py-20">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_2.2fr]">
          <div>
            <Link to="/" aria-label="Jyot Enterprise Home" className="inline-block">
              <Logo invert className="[&_img]:h-10 sm:[&_img]:h-12" />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-background/60">
              {settings.website.footerText || settings.brand.description}
            </p>

            <ul className="mt-8 space-y-3 text-sm text-background/65">
              {[
                ...settings.offices.map((o) => ({ icon: MapPin, value: o.address, href: o.maps })),
                {
                  icon: Clock,
                  value: settings.contact.hours,
                  href: undefined as string | undefined,
                },
                {
                  icon: Phone,
                  value: settings.contact.phone,
                  href: telHref(settings.contact.phone),
                },
                {
                  icon: Phone,
                  value: settings.contact.phone2,
                  href: telHref(settings.contact.phone2),
                },
                {
                  icon: Mail,
                  value: settings.contact.email,
                  href: `mailto:${settings.contact.email}`,
                },
              ].map((row) => (
                <li key={row.value} className="flex gap-3">
                  <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {row.href ? (
                    <a
                      href={row.href}
                      {...(row.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                      className="hover:text-background"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span>{row.value}</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <p className="font-display text-xs font-bold tracking-[0.18em] text-background/50 uppercase">
                Newsletter
              </p>
              <form
                className="mt-3 flex max-w-sm items-center gap-2 rounded-full border border-background/15 p-1.5 transition-colors focus-within:border-primary/50"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  required
                  placeholder="Work email"
                  aria-label="Work email"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-background placeholder:text-background/40 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="group grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <Column title="Services">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link to="/services/$slug" params={{ slug: s.slug }} className={linkClass}>
                    {s.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/portfolio"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  See our work <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </Column>

            <Column title="Industries">
              {INDUSTRIES.slice(0, 8).map((i) => (
                <li key={i.name}>
                  <Link to="/contact" className={linkClass}>
                    {i.name}
                  </Link>
                </li>
              ))}
            </Column>

            <Column title="Products">
              {PRODUCTS.slice(0, 8).map((p) => (
                <li key={p.name}>
                  <Link to="/contact" className={linkClass}>
                    {p.name}
                  </Link>
                </li>
              ))}
            </Column>

            <div className="space-y-10">
              <Column title="Quick Links">
                {[
                  { label: "Home", to: "/" as const },
                  { label: "Portfolio", to: "/portfolio" as const },
                  { label: "Careers", to: "/careers" as const },
                  { label: "About", to: "/about" as const },
                  { label: "Contact", to: "/contact" as const },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </Column>

              <Column title="Resources">
                <li>
                  <Link to="/blogs" className={linkClass}>
                    Blogs &amp; Insights
                  </Link>
                </li>
                {settings.contact.whatsapp ? (
                  <li>
                    <a
                      href={settings.contact.whatsapp}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={linkClass}
                    >
                      WhatsApp · {settings.contact.phone}
                    </a>
                  </li>
                ) : null}
                {settings.contact.whatsapp2 ? (
                  <li>
                    <a
                      href={settings.contact.whatsapp2}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={linkClass}
                    >
                      WhatsApp · {settings.contact.phone2}
                    </a>
                  </li>
                ) : null}
                <li>
                  <Link to={settings.website.ctaHref as "/contact"} className={linkClass}>
                    {settings.website.ctaLabel || "Book a Consultation"}
                  </Link>
                </li>
                <li>
                  <Link to="/sitemap" className={linkClass}>
                    Sitemap
                  </Link>
                </li>
              </Column>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 border-t border-background/10 pt-8 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm text-background/55">
            Follow {settings.brand.companyName || "Jyot Enterprise"} for notes from the desks that
            do the work.
          </p>
          <div className="flex items-center gap-2">
            {[
              { Icon: Instagram, href: settings.social.instagram, label: "Instagram" },
              { Icon: Facebook, href: settings.social.facebook, label: "Facebook" },
            ]
              .filter((s) => Boolean(s.href))
              .map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-background/15 text-background/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                >
                  <s.Icon className="h-4 w-4" />
                </a>
              ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-background/40">
          <p>
            {settings.website.copyright ||
              `© ${new Date().getFullYear()} ${settings.brand.companyName}. All rights reserved.`}
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-background/70">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-background/70">
              Terms of Service
            </Link>
            <Link to="/sitemap" className="hover:text-background/70">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
