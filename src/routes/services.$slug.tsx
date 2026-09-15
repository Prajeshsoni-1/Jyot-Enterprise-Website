import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useTrackedView } from "@/lib/track";
import { ArrowUpRight, Check, FileText } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { SmartInquiryForm } from "@/components/site/SmartInquiryForm";
import { FinancialShowcase } from "@/components/site/service/FinancialShowcase";
import { ITShowcase } from "@/components/site/service/ITShowcase";
import { LegalShowcase } from "@/components/site/service/LegalShowcase";
import { EngineeringShowcase } from "@/components/site/service/EngineeringShowcase";
import { DownloadCenter } from "@/components/site/DownloadCenter";
import { SERVICES, SERVICE_THEMES } from "@/data/site";
import { breadcrumbSchema, canonical, faqSchema, jsonLd, pageMeta, serviceSchema } from "@/lib/seo";
import { loadServiceOverrides } from "@/lib/cms-loaders";
import { getFinancialShowcaseConfig } from "@/lib/financial.functions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params }) => {
    const service = SERVICES.find((s) => s.slug === params.slug);
    if (!service) throw notFound();
    const overrides = (await loadServiceOverrides())[service.slug] ?? {};
    const financialConfig =
      service.slug === "financial" ? await getFinancialShowcaseConfig() : undefined;
    return {
      slug: service.slug,
      name: overrides.name ?? service.name,
      tagline: overrides.tagline ?? service.tagline,
      description: overrides.description ?? service.description,
      items: overrides.items ?? service.items,
      faqs: SERVICE_THEMES[service.slug].faqs,
      financialConfig,
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
    const path = `/services/${loaderData.slug}`;
    return {
      meta: pageMeta({
        title: `${loaderData.name} — Jyot Enterprise`,
        description: loaderData.description,
        path,
      }),
      links: [canonical(path)],
      scripts: [
        jsonLd(serviceSchema({ name: loaderData.name, description: loaderData.description, path })),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: loaderData.name, path },
          ]),
        ),
        ...(loaderData.faqs?.length ? [jsonLd(faqSchema(loaderData.faqs))] : []),
      ],
    };
  },
  component: ServicePage,
});

function ServicePage() {
  const { slug } = Route.useParams();
  const cms = Route.useLoaderData();
  const base = SERVICES.find((s) => s.slug === slug)!;
  const service = {
    ...base,
    name: cms.name,
    tagline: cms.tagline,
    description: cms.description,
    items: cms.items,
  };
  const theme = SERVICE_THEMES[service.slug];
  const others = SERVICES.filter((s) => s.slug !== slug);

  useTrackedView("service_view", { service_slug: slug });

  return (
    <>
      <PageHero
        eyebrow={theme.label}
        title={service.name}
        body={service.description}
        variant={theme.pattern}
      />

      {/* practice metrics */}
      <section className="border-b border-border bg-background">
        <div className="container-x grid gap-px overflow-hidden bg-border sm:grid-cols-2 lg:grid-cols-4">
          {(slug === "financial" && cms.financialConfig?.statistics
            ? [
                {
                  k: cms.financialConfig.statistics.funding_facilitated || "₹150 Cr",
                  v: "Funding facilitated",
                },
                {
                  k: cms.financialConfig.statistics.median_sanction_time || "15 days",
                  v: "Median sanction time",
                },
                {
                  k: cms.financialConfig.statistics.lender_relationships || "86+",
                  v: "Lender relationships",
                },
                {
                  k: cms.financialConfig.statistics.best_secured_rate || "7.5%",
                  v: "Best secured rate",
                },
              ]
            : theme.highlights
          ).map((h, i) => (
            <Reveal key={h.v} delay={i * 0.06}>
              <div className="h-full bg-background px-6 py-8">
                <p className="font-display text-3xl font-extrabold text-ink">{h.k}</p>
                <p className="mt-2 text-sm text-muted-foreground">{h.v}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* division-specific showcase */}
      {slug === "financial" ? <FinancialShowcase config={cms.financialConfig} /> : null}
      {slug === "it" ? <ITShowcase /> : null}
      {slug === "legal" ? <LegalShowcase /> : null}
      {slug === "engineering" ? <EngineeringShowcase /> : null}

      <section className="bg-background py-24">
        <div className="container-x grid gap-16 lg:grid-cols-[1fr_1.15fr]">
          <SectionHeading
            eyebrow="Capabilities"
            title={service.tagline}
            body="Every capability below is delivered by in-house specialists with a named lead on your account."
          />
          <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2">
            {service.items.map((item, i) => (
              <Reveal key={item} delay={(i % 4) * 0.04}>
                <div className="group flex h-full items-center gap-3 bg-background px-6 py-5 transition-colors hover:bg-surface">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-growth/25 text-growth-foreground transition-transform duration-300 group-hover:scale-110">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium text-ink">{item}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* process + checklist */}
      <section className="border-y border-border bg-surface py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Engagement" title="How the work runs." />
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {theme.flow.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.07}>
                <div className="group h-full rounded-3xl border border-border bg-background p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-lift">
                  <span className="font-display text-xs font-bold tracking-[0.2em] text-muted-foreground/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{p.step}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  <span className="mt-6 block h-0.5 w-8 bg-primary transition-all duration-500 group-hover:w-16" />
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Reveal>
              <div className="h-full rounded-3xl border border-border bg-background p-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">
                  <FileText className="h-3.5 w-3.5" />
                  {slug === "it" ? "Technology stack" : "What we need from you"}
                </span>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {theme.checklist.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-sm text-ink">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-growth-foreground" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="h-full rounded-3xl border border-border bg-background p-8">
                <p className="eyebrow">FAQ</p>
                <Accordion type="single" collapsible className="mt-4 w-full">
                  {theme.faqs.map((f, i) => (
                    <AccordionItem key={f.q} value={`f-${i}`} className="border-border">
                      <AccordionTrigger className="text-left font-display text-sm font-bold text-ink hover:no-underline">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* practice downloads */}
      <section className="border-b border-border bg-background py-20">
        <div className="container-x">
          <SectionHeading
            eyebrow="Resources"
            title="Downloads for this practice"
            body={`Official capability brochures, project readiness checklists, delivery frameworks, and FAQ documentation for Jyot ${service.short}.`}
          />
          <div className="mt-10">
            <DownloadCenter division={service.slug} />
          </div>
        </div>
      </section>

      <section className="bg-background py-24">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Other practices"
              title="Consolidate the rest while you are here."
            />
            <div className="mt-10 grid gap-4">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  to="/services/$slug"
                  params={{ slug: o.slug }}
                  className="group flex items-center justify-between gap-6 rounded-2xl border border-border bg-card px-6 py-5 transition-all duration-400 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft"
                >
                  <span>
                    <span className="font-display text-base font-bold text-ink">{o.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{o.tagline}</span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              ))}
            </div>
          </div>
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-border bg-surface p-8 shadow-soft sm:p-10">
              <h3 className="text-xl font-extrabold text-ink">
                Speak to {/^[aeiou]/i.test(service.short) ? "an" : "a"}{" "}
                {service.short.toLowerCase()} specialist
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Free 30-minute consultation, no obligation.
              </p>
              <div className="mt-8">
                <SmartInquiryForm division={service.slug} source={`service-${service.slug}`} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
