"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { Reveal, Magnetic } from "../primitives";
import { Ambient } from "../Ambient";
import { CONTACT } from "@/data/site";
import { telHref, useSiteSettings } from "@/lib/site-settings";

export function FinalCta() {
  const settings = useSiteSettings();
  const phone1 = settings.contact.phone || CONTACT.phone;
  const phone2 = settings.contact.phone2 || CONTACT.phone2;
  const whatsapp1 = settings.contact.whatsapp || CONTACT.whatsapp;
  const whatsapp2 = settings.contact.whatsapp2 || CONTACT.whatsapp2;
  const hours = settings.contact.hours || CONTACT.hours;
  const ctaLabel = settings.website.ctaLabel || "Book Consultation";
  const ctaHref = settings.website.ctaHref || "/contact";

  return (
    <section className="relative overflow-hidden border-t border-border bg-ink py-28 text-background lg:py-36">
      <Ambient intensity="medium" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 80% at 50% 100%, color-mix(in oklab, var(--color-primary) 28%, transparent), transparent 62%)",
        }}
        aria-hidden="true"
      />
      <div className="container-x relative">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="eyebrow">Next Step</p>
          <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
            Let&rsquo;s Build Your Business <span className="text-gradient-ember">Together</span>
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-background/65">
            Whether you need funding, technology, legal compliance, or engineering expertise —
            {settings.brand.companyName || "Jyot Enterprise"} is ready to help.
          </p>

          <div className="mt-11 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
            <Magnetic>
              <Link
                to={ctaHref as "/contact"}
                className="group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-ember transition-colors hover:bg-primary-hover"
              >
                <span>{ctaLabel}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            {phone1 ? (
              <a
                href={telHref(phone1)}
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-background/25 px-5 text-sm font-semibold text-background transition-colors hover:border-background/60"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{phone1}</span>
              </a>
            ) : null}
            {phone2 ? (
              <a
                href={telHref(phone2)}
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-background/25 px-5 text-sm font-semibold text-background transition-colors hover:border-background/60"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{phone2}</span>
              </a>
            ) : null}
            {whatsapp1 ? (
              <a
                href={whatsapp1}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-growth px-5 text-sm font-semibold text-growth-foreground transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>WhatsApp · {phone1}</span>
              </a>
            ) : null}
            {whatsapp2 ? (
              <a
                href={whatsapp2}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-growth px-5 text-sm font-semibold text-growth-foreground transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>WhatsApp · {phone2}</span>
              </a>
            ) : null}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 text-xs text-background/45"
          >
            Free 45-minute consultation · Response within 24 hours · {hours}
          </motion.p>
        </Reveal>
      </div>
    </section>
  );
}
