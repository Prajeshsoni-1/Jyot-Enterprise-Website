"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Star,
  Play,
  MapPin,
  Clock,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Hero } from "@/components/site/Hero";
import { Reveal, SectionHeading, Magnetic } from "@/components/site/primitives";
import { InquiryForm } from "@/components/site/InquiryForm";
import { OneSolution } from "@/components/site/sections/OneSolution";
import { Partners } from "@/components/site/sections/Partners";
import { WhyJyot } from "@/components/site/sections/WhyJyot";
import { Industries } from "@/components/site/sections/Industries";
import { Products } from "@/components/site/sections/Products";
import { AISection } from "@/components/site/sections/AISection";
import { CaseStudies } from "@/components/site/sections/CaseStudies";
import { StatsCards } from "@/components/site/sections/StatsCards";
import { BusinessOverview } from "@/components/site/sections/BusinessOverview";
import { WhoWeHelp } from "@/components/site/sections/WhoWeHelp";
import { BusinessSolutions } from "@/components/site/sections/BusinessSolutions";
import { SuccessProcess } from "@/components/site/sections/SuccessProcess";
import { WhyStay } from "@/components/site/sections/WhyStay";
import { FaqGroups } from "@/components/site/sections/FaqGroups";
import { Resources } from "@/components/site/sections/Resources";
import { FinalCta } from "@/components/site/sections/FinalCta";
import { SERVICES, SOLUTIONS, TESTIMONIALS, PRODUCTS, POSTS, CONTACT } from "@/data/site";
import { BLOG_POSTS } from "@/data/blog";
import { FAQ_GROUPS, OFFICES } from "@/data/site";
import { canonical, faqSchema, jsonLd, pageMeta } from "@/lib/seo";
import {
  loadBlogPosts,
  loadCmsFaqs,
  loadPage,
  loadProducts,
  loadTestimonials,
} from "@/lib/cms-loaders";
import { cmsFaqs, type ProductItem, type TestimonialItem } from "@/lib/cms-content";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const [faqRows, page, products, testimonials, posts] = await Promise.all([
        loadCmsFaqs().catch(() => []),
        loadPage("home").catch(() => null),
        loadProducts().catch(() => PRODUCTS),
        loadTestimonials().catch(() => TESTIMONIALS),
        loadBlogPosts().catch(() => BLOG_POSTS),
      ]);
      return {
        faqs: cmsFaqs(faqRows),
        products: Array.isArray(products) ? products : PRODUCTS,
        testimonials: Array.isArray(testimonials) ? testimonials : TESTIMONIALS,
        posts: Array.isArray(posts) ? posts : BLOG_POSTS,
        hero: {
          title: page?.text ? page.text("hero_title", "") : "",
          body: page?.text ? page.text("hero_description", "") : "",
          ctaLabel: page?.text ? page.text("cta_label", "") : "",
        },
      };
    } catch (err) {
      console.warn("[index.loader] Fallback to static defaults:", err);
      return {
        faqs: [],
        products: PRODUCTS,
        testimonials: TESTIMONIALS,
        posts: BLOG_POSTS,
        hero: {
          title: "",
          body: "",
          ctaLabel: "",
        },
      };
    }
  },
  head: () => ({
    meta: pageMeta({
      title: "Jyot Enterprise — Financial, IT, Legal & Engineering Partner",
      description:
        "Jyot Enterprise delivers financial, IT, legal and engineering services under one accountable partnership. Book a free consultation today.",
      path: "/",
    }),
    links: [canonical("/")],
    scripts: [jsonLd(faqSchema(FAQ_GROUPS.flatMap((g) => g.items)))],
  }),
  component: Index,
});

function Index() {
  const data = Route.useLoaderData();
  const faqs = data?.faqs ?? [];
  const hero = data?.hero;
  const products = data?.products ?? [];
  const testimonials = data?.testimonials ?? [];
  const posts = data?.posts ?? [];

  return (
    <>
      <Hero title={hero?.title} body={hero?.body} ctaLabel={hero?.ctaLabel} />
      <BusinessOverview />
      <OneSolution />
      <Partners />
      <ServicesSection />
      <BusinessSolutions />
      <WhoWeHelp />
      <WhyJyot />
      <Industries />
      <SuccessProcess />
      <Products items={products} />
      <SolutionsSection />
      <AISection />
      <CaseStudies />
      <StatsCards />
      <WhyStay />
      <TestimonialsSection items={testimonials} />
      <Resources />
      <BlogSection items={posts} />
      <FaqGroups extra={faqs} />
      <FinalCta />
      <ContactSection />
    </>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-24 border-t border-border bg-background py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="Service Lines"
          title="Four disciplines. One accountable partner."
          body="Each practice runs with its own senior leadership and delivery standard — coordinated so a single conversation moves capital, software, compliance and hardware forward together."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {SERVICES.map((service, i) => (
            <Reveal key={service.slug} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift sm:p-8 md:p-10"
              >
                <div
                  className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 26%, transparent), transparent 70%)",
                  }}
                />
                <div className="relative">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/12">
                    <service.icon className="h-6 w-6" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-7 text-2xl font-extrabold text-ink">{service.name}</h3>
                  <p className="mt-2 font-display text-sm font-semibold text-primary">
                    {service.tagline}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>

                  <ul className="mt-7 flex flex-wrap gap-2">
                    {service.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors group-hover:border-primary/20 group-hover:text-ink"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/services/$slug"
                    params={{ slug: service.slug }}
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-primary"
                  >
                    Explore {service.short} <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionsSection() {
  return (
    <section className="border-t border-border bg-ink py-28 text-background">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Featured Solutions</p>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl md:text-[2.75rem] md:leading-[1.08]">
            Productised engagements, ready to deploy.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-background/60">
            Proven builds we have shipped repeatedly — scoped, priced and de-risked before you sign.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-background/10 sm:grid-cols-2 lg:grid-cols-4">
          {SOLUTIONS.map((s, i) => (
            <motion.a
              key={s.name}
              href="/contact"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
              className="group relative bg-ink p-6 sm:p-8 transition-colors hover:bg-background/[0.04]"
            >
              <h3 className="font-display text-lg font-bold">{s.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-background/55">{s.body}</p>
              <ArrowUpRight className="mt-6 h-5 w-5 text-primary transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ items }: { items?: TestimonialItem[] }) {
  const list = items && items.length > 0 ? items : TESTIMONIALS;
  const displayItems = list.slice(0, 6);

  return (
    <section className="border-t border-border bg-surface py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="Testimonials"
          title="What the people who signed the contract say."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((t, i) => (
            <Reveal key={t.name + i} delay={(i % 3) * 0.08}>
              <motion.figure
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group flex h-full flex-col rounded-3xl border border-border bg-background p-5 sm:p-7 shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="font-display text-[0.65rem] font-bold tracking-[0.16em] text-muted-foreground/60 uppercase">
                    Google Review
                  </span>
                </div>
                <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-ink">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary ring-1 ring-primary/15">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span>
                    <span className="block font-display text-sm font-bold text-ink">{t.name}</span>
                  </span>
                </figcaption>
              </motion.figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

type BlogItem = {
  title: string;
  category?: string;
  slug?: string;
  read?: string;
  readTime?: string;
};

function BlogSection({ items }: { items?: BlogItem[] }) {
  const list: BlogItem[] = items && items.length > 0 ? items.slice(0, 3) : POSTS;

  return (
    <section className="border-t border-border bg-background py-28">
      <div className="container-x">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <SectionHeading eyebrow="Insights" title="Notes from the desks that do the work." />
          <Reveal>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary"
            >
              All articles <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => {
            const articleContent = (
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="w-fit rounded-full bg-primary/8 px-3 py-1 text-[0.7rem] font-bold tracking-wide text-primary uppercase">
                  {p.category}
                </span>
                <h3 className="mt-6 flex-1 text-lg leading-snug font-bold text-ink">{p.title}</h3>
                <div className="mt-7 flex items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
                  <span>{p.read || p.readTime || "5 min"} read</span>
                  <ArrowUpRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </motion.article>
            );
            return (
              <Reveal key={p.title} delay={(i % 3) * 0.07}>
                {p.slug ? (
                  <Link to="/blogs/$slug" params={{ slug: p.slug }} className="block h-full">
                    {articleContent}
                  </Link>
                ) : (
                  <Link to="/blogs" className="block h-full">
                    {articleContent}
                  </Link>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-24 border-t border-border bg-background py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="Contact"
          title="Start with a conversation, not a contract."
          body="Tell us the objective. We will tell you honestly whether we are the right partner for it."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <div className="grid h-full gap-6">
              <div className="grid gap-5 rounded-3xl border border-border bg-surface p-8">
                {[
                  ...OFFICES.map((o) => ({
                    icon: MapPin,
                    label: o.label,
                    value: o.address,
                    href: o.maps,
                  })),
                  {
                    icon: Clock,
                    label: "Working hours",
                    value: CONTACT.hours,
                    href: undefined as string | undefined,
                  },
                  { icon: Phone, label: "Phone", value: CONTACT.phone, href: CONTACT.phoneHref },
                  {
                    icon: Phone,
                    label: "Phone (alternate)",
                    value: CONTACT.phone2,
                    href: CONTACT.phoneHref2,
                  },
                  {
                    icon: Mail,
                    label: "Email",
                    value: CONTACT.email,
                    href: `mailto:${CONTACT.email}`,
                  },
                  {
                    icon: MessageCircle,
                    label: "WhatsApp",
                    value: `${CONTACT.phone} · Chat with a consultant`,
                    href: CONTACT.whatsapp,
                  },
                  {
                    icon: MessageCircle,
                    label: "WhatsApp (alternate)",
                    value: `${CONTACT.phone2} · Chat with a consultant`,
                    href: CONTACT.whatsapp2,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-background text-primary ring-1 ring-border">
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
                          className="text-sm font-medium text-ink hover:text-primary"
                        >
                          {row.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-ink">{row.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-3xl border border-border">
                <iframe
                  title="Jyot Enterprise Gandhinagar office location"
                  src={OFFICES[0]!.embed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-72 w-full border-0 grayscale-[0.35]"
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
              <h3 className="text-xl font-extrabold text-ink">Request a consultation</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Response within one business day, guaranteed.
              </p>
              <div className="mt-8">
                <InquiryForm />
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-ink px-5 py-12 text-center sm:px-12 sm:py-16">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(90% 120% at 50% 0%, color-mix(in oklab, var(--color-primary) 30%, transparent), transparent 62%)",
              }}
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-extrabold text-background sm:text-[2.5rem] sm:leading-[1.1]">
                Ready to consolidate your partners into one?
              </h2>
              <p className="mt-5 text-base text-background/65">
                Book a free 30-minute consultation with a senior advisor across any service line.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Magnetic>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-ember transition-colors hover:bg-primary-hover"
                  >
                    Book Free Consultation <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Magnetic>
                <a
                  href={CONTACT.phoneHref}
                  className="inline-flex items-center gap-2 rounded-full border border-background/20 px-7 py-4 text-sm font-semibold text-background transition-colors hover:bg-background/10"
                >
                  <Phone className="h-4 w-4" /> {CONTACT.phone}
                </a>
              </div>
              <p className="mt-8 inline-flex items-center gap-2 text-xs text-background/50">
                <Check className="h-3.5 w-3.5 text-growth" /> No obligation · NDA on request
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
