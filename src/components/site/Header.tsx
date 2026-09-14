"use client";

import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Menu, X, Phone, ArrowUpRight } from "lucide-react";
import { NAV } from "@/data/site";
import { telHref, useSiteSettings } from "@/lib/site-settings";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const settings = useSiteSettings();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "glass-panel shadow-soft" : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-x flex h-[76px] items-center justify-between gap-3 xl:gap-4">
        <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 xl:flex 2xl:gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/"}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary font-semibold after:scale-x-100" }}
              className="relative shrink-0 rounded-full px-2.5 py-1.5 text-[0.8rem] font-medium text-muted-foreground transition-colors after:absolute after:bottom-0.5 after:left-2.5 after:h-px after:w-[calc(100%-1.25rem)] after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:text-ink hover:after:origin-bottom-left hover:after:scale-x-100 2xl:px-3 2xl:text-[0.83rem]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {settings.website.headerContactVisible ? (
            <a
              href={telHref(settings.contact.phone)}
              className="hidden h-9 shrink-0 whitespace-nowrap items-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-semibold text-ink transition-all hover:border-ink/30 hover:bg-secondary active:scale-[0.98] sm:inline-flex"
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>Call Now</span>
            </a>
          ) : null}
          {settings.website.headerCtaVisible ? (
            <Link
              to={settings.website.ctaHref as "/contact"}
              className="hidden h-9 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full bg-primary px-4.5 text-xs font-semibold text-primary-foreground shadow-ember transition-all hover:bg-primary-hover active:scale-[0.98] sm:inline-flex"
            >
              <span>{settings.website.ctaLabel || "Book Consultation"}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-ink xl:hidden"
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            id="mobile-nav"
            className="overflow-hidden border-t border-border bg-background xl:hidden"
          >
            <div className="container-x grid gap-1 py-5">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as "/"}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={telHref(settings.contact.phone)}
                className="mt-2 rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Call {settings.contact.phone}
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
