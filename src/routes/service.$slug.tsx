"use client";

import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Check, HelpCircle, Quote, Clock, IndianRupee } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { ConsultationForm } from "@/components/site/ConsultationForm";
import { getSub, pair } from "@/data/catalog";
import { loadSubServices } from "@/lib/cms-loaders";
import { breadcrumbSchema, canonical, faqSchema, jsonLd, pageMeta, serviceSchema } from "@/lib/seo";
import { SERVICES, SERVICE_THEMES } from "@/data/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/service/$slug")({
  loader: async ({ params }) => {
    const all = await loadSubServices();
    const sub = all.find((s) => s.slug === params.slug) ?? getSub(params.slug);
    if (!sub) throw notFound();
    return {
      sub,
      siblings: all.filter((s) => s.parent === sub.parent && s.slug !== sub.slug).slice(0, 6),
      slug: sub.slug,
      name: sub.name,
      tagline: sub.tagline,
      overview: sub.overview,
      parent: sub.parent,
      faqs: sub.faqs.map(pair).map((f) => ({ q: f.a, a: f.b })),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Service unavailable — Jyot Enterprise" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const description = `${loaderData.tagline} ${loaderData.overview}`.slice(0, 155);
    const path = `/service/${loaderData.slug}`;
    return {
      meta: pageMeta({
        title: `${loaderData.name} in Gandhinagar & across India — Jyot Enterprise`,
        description,
        path,
      }),
      links: [canonical(path)],
      scripts: [
        jsonLd(serviceSchema({ name: loaderData.name, description, path })),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: `/services/${loaderData.parent}` },
            { name: loaderData.name, path },
          ]),
        ),
        ...(loaderData.faqs.length ? [jsonLd(faqSchema(loaderData.faqs))] : []),
      ],
    };
  },
  component: SubServicePage,
});

function SubServicePage() {
  const { sub, siblings } = Route.useLoaderData();
  const parent = SERVICES.find((s) => s.slug === sub.parent)!;
  const theme = SERVICE_THEMES[sub.parent];
  const testimonial = pair(sub.testimonial);

  return (
    <>
      <PageHero
        eyebrow={`${parent.short} Services`}
        title={sub.name}
        body={sub.tagline}
        variant={theme.pattern}
      />

      {/* overview + quick facts */}
      <section className="border-b border-border bg-background py-20">
        <div className="container-x grid gap-14 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <p className="eyebrow">Overview</p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{sub.overview}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-ember transition-colors hover:bg-primary-hover"
              >
                Book a consultation <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services/$slug"
                params={{ slug: sub.parent }}
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-primary/40"
              >
                All {parent.short.toLowerCase()} services
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid gap-4 rounded-3xl border border-border bg-surface p-7">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.7} />
                <div>
                  <p className="font-display text-xs font-bold tracking-[0.16em] text-muted-foreground/70 uppercase">
                    Timeline
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{sub.timeline}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-border pt-4">
                <IndianRupee className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.7} />
                <div>
                  <p className="font-display text-xs font-bold tracking-[0.16em] text-muted-foreground/70 uppercase">
                    Engagement
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {sub.pricing
                      ? "Published indicative pricing"
                      : "Quoted after a free scoping call"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-border pt-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-growth-foreground" strokeWidth={2} />
                <div>
                  <p className="font-display text-xs font-bold tracking-[0.16em] text-muted-foreground/70 uppercase">
                    Includes
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    A named specialist owning your file end to end
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* benefits */}
      <section className="bg-surface py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Benefits" title="What you actually get." />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sub.benefits.map((raw, i) => {
              const { a, b } = pair(raw);
              return (
                <Reveal key={a} delay={(i % 4) * 0.06}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="h-full rounded-3xl border border-border bg-background p-7 shadow-soft transition-colors hover:border-primary/25"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-growth/20 text-growth-foreground">
                      <Check className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <h3 className="mt-5 text-base font-bold text-ink">{a}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* process + timeline */}
      <section className="border-y border-border bg-background py-24">
        <div className="container-x">
          <SectionHeading
            eyebrow="Process"
            title="How the engagement runs."
            body={`Typical duration: ${sub.timeline}.`}
          />
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {sub.process.map((raw, i) => {
              const { a, b } = pair(raw);
              return (
                <Reveal key={a} delay={i * 0.07}>
                  <div className="group h-full rounded-3xl border border-border bg-card p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-lift">
                    <span className="font-display text-xs font-bold tracking-[0.2em] text-muted-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold text-ink">{a}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</p>
                    <span className="mt-6 block h-0.5 w-8 bg-primary transition-all duration-500 group-hover:w-16" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* pricing */}
      {sub.pricing ? (
        <section className="bg-surface py-24">
          <div className="container-x">
            <SectionHeading
              eyebrow="Indicative pricing"
              title="Published, so you can plan."
              body="Final pricing is confirmed in writing after a free scoping call. Government fees, where applicable, are charged at actuals."
            />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {sub.pricing.map((tier, i) => (
                <Reveal key={tier.tier} delay={i * 0.07}>
                  <div className="flex h-full flex-col rounded-3xl border border-border bg-background p-8 shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/30">
                    <p className="font-display text-xs font-bold tracking-[0.16em] text-muted-foreground/70 uppercase">
                      {tier.tier}
                    </p>
                    <p className="mt-3 font-display text-2xl font-extrabold text-ink">
                      {tier.price}
                    </p>
                    <ul className="mt-6 grid gap-3">
                      {tier.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-growth-foreground" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/book"
                      className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-ink transition-colors hover:text-primary"
                    >
                      Get an exact quote <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* testimonial + faqs */}
      <section className="border-y border-border bg-background py-24">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="h-full rounded-3xl border border-border bg-ink p-9 text-background">
              <Quote className="h-8 w-8 text-primary" />
              <p className="mt-6 text-xl leading-relaxed font-medium">
                &ldquo;{testimonial.a}&rdquo;
              </p>
              <p className="mt-6 font-display text-sm font-bold text-background/70">
                {testimonial.b}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-3xl border border-border bg-surface p-8">
              <p className="eyebrow inline-flex items-center gap-2">
                <HelpCircle className="h-4 w-4" /> Frequently asked
              </p>
              <Accordion type="single" collapsible className="mt-4 w-full">
                {sub.faqs.map((raw, i) => {
                  const { a, b } = pair(raw);
                  return (
                    <AccordionItem key={a} value={`faq-${i}`} className="border-border">
                      <AccordionTrigger className="text-left font-display text-sm font-bold text-ink hover:no-underline">
                        {a}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                        {b}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </Reveal>
        </div>
      </section>

      {/* related + form */}
      <section className="bg-surface py-24">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <SectionHeading
              eyebrow="Related services"
              title={`More from our ${parent.short.toLowerCase()} practice.`}
            />
            <div className="mt-10 grid gap-3">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  to="/service/$slug"
                  params={{ slug: s.slug }}
                  className="group flex items-center justify-between gap-6 rounded-2xl border border-border bg-background px-6 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft"
                >
                  <span>
                    <span className="font-display text-base font-bold text-ink">{s.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{s.tagline}</span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              ))}
            </div>
          </div>
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-border bg-background p-8 shadow-soft sm:p-10">
              <h2 className="text-xl font-extrabold text-ink">Enquire about {sub.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Free consultation. Written scope within three working days.
              </p>
              <div className="mt-8">
                <ConsultationForm defaultService={sub.slug} compact />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
