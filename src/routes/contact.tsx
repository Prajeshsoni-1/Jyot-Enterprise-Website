"use client";

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { MapPin, Clock, Mail, Phone, MessageCircle, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/primitives";
import { SmartInquiryForm } from "@/components/site/SmartInquiryForm";
import { Ecosystem } from "@/components/site/Ecosystem";
import { telHref, useSiteSettings } from "@/lib/site-settings";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";
import { loadPage } from "@/lib/cms-loaders";

export const Route = createFileRoute("/contact")({
  loader: async () => {
    const page = await loadPage("contact");
    return {
      heroTitle: page.text("hero_title", "Start with a conversation."),
      heroBody: page.text(
        "hero_description",
        "Tell us the objective. We will tell you honestly whether we are the right partner for it — and what it should cost.",
      ),
      seoTitle: page.text("seo_title", "Contact Jyot Enterprise — Book a Free Consultation"),
      seoDescription: page.text(
        "seo_description",
        "Talk to a senior advisor at Jyot Enterprise about financial, IT, legal or engineering requirements. Response within one business day.",
      ),
    };
  },
  head: ({ loaderData }) => ({
    meta: pageMeta({
      title: loaderData?.seoTitle ?? "Contact Jyot Enterprise — Book a Free Consultation",
      description:
        loaderData?.seoDescription ??
        "Talk to a senior advisor at Jyot Enterprise about financial, IT, legal or engineering requirements. Response within one business day.",
      path: "/contact",
      type: "website",
    }),
    links: [canonical("/contact")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact Jyot Enterprise", path: "/contact" },
        ]),
      ),
    ],
  }),
  component: Contact,
});

function Contact() {
  const page = Route.useLoaderData();
  const settings = useSiteSettings();
  const { contact, offices } = settings;
  const rows = [
    ...offices.map((o) => ({ icon: MapPin, label: o.title, value: o.address, href: o.maps })),
    {
      icon: Clock,
      label: "Working hours",
      value: contact.hours,
      href: undefined as string | undefined,
    },
    { icon: Phone, label: "Phone", value: contact.phone, href: telHref(contact.phone) },
    {
      icon: Phone,
      label: "Phone (alternate)",
      value: contact.phone2,
      href: telHref(contact.phone2),
    },
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: `${contact.phone} · Chat with a consultant`,
      href: contact.whatsapp,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp (alternate)",
      value: `${contact.phone2} · Chat with a consultant`,
      href: contact.whatsapp2,
    },
  ];

  return (
    <>
      <PageHero eyebrow="Contact" title={page.heroTitle} body={page.heroBody} />

      <section className="bg-background py-24">
        <div className="container-x grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <div className="grid gap-6">
              <div className="grid gap-2 rounded-3xl border border-border bg-surface p-4 sm:p-6">
                {rows.map((row, i) => (
                  <motion.div
                    key={row.label}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="group flex gap-4 rounded-2xl px-4 py-3.5 transition-colors hover:bg-background"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-background text-primary ring-1 ring-border transition-transform duration-300 group-hover:scale-110">
                      <row.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {row.label}
                      </p>
                      {row.href ? (
                        <a
                          href={row.href}
                          {...(row.href.startsWith("http")
                            ? { target: "_blank", rel: "noreferrer noopener" }
                            : {})}
                          className="text-sm font-medium text-ink hover:text-primary break-words"
                        >
                          {row.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-ink break-words">{row.value}</p>
                      )}
                    </div>
                    <span className="ml-auto self-center font-display text-[0.6rem] font-bold tracking-[0.18em] text-muted-foreground/40 uppercase">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6">
                <Ecosystem />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  One conversation reaches all four practices.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {offices.map((o) => (
                  <div key={o.city} className="overflow-hidden rounded-3xl border border-border">
                    <iframe
                      title={`Jyot Enterprise ${o.title} location`}
                      src={o.embed}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-64 w-full border-0 grayscale-[0.35] transition-all duration-500 hover:grayscale-0"
                    />
                    <a
                      href={o.maps}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-2 bg-surface px-5 py-3 text-xs font-semibold text-ink transition-colors hover:text-primary"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Open {o.city} office in Google
                      Maps
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="sticky top-28 rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
              <h2 className="text-xl font-extrabold text-ink">Request a consultation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Response within one business day, guaranteed.
              </p>
              <div className="mt-8">
                <SmartInquiryForm source="contact-page" />
              </div>
              <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-growth" /> No obligation · NDA on request
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
