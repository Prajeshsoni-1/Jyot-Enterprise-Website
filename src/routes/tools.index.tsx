"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Calculator } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { CtaBand } from "@/components/site/CtaBand";
import { TOOLS } from "@/components/site/tools/registry";
import { SERVICES } from "@/data/site";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/tools/")({
  head: () => ({
    meta: pageMeta({
      title: "Business Tools & Calculators — Jyot Enterprise",
      description:
        "Free EMI, loan eligibility, website cost, ERP, GST, trademark and engineering estimators built by the Jyot Enterprise practice desks.",
      path: "/tools",
      type: "website",
    }),
    links: [canonical("/tools")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Business Tools", path: "/tools" },
        ]),
      ),
    ],
  }),
  component: ToolsIndex,
});

function ToolsIndex() {
  return (
    <>
      <PageHero
        eyebrow="Business Tools"
        title="Answer the money question before the meeting."
        body="Sixteen calculators and assessments built from the same models our desks use internally. Free, instant, no sign-up."
        variant="saas"
      />

      <section className="bg-background py-24">
        <div className="container-x grid gap-16">
          {SERVICES.map((service) => {
            const items = TOOLS.filter((t) => t.division === service.slug);
            if (items.length === 0) return null;
            return (
              <div key={service.slug}>
                <SectionHeading eyebrow={service.short} title={`${service.short} tools`} />
                <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((tool, i) => (
                    <Reveal key={tool.slug} delay={i * 0.05}>
                      <Link
                        to="/tools/$slug"
                        params={{ slug: tool.slug }}
                        className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-7 transition-colors hover:border-primary/35"
                      >
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/10">
                          <Calculator className="h-5 w-5" strokeWidth={1.7} />
                        </span>
                        <p className="mt-5 font-display text-base font-bold text-ink">
                          {tool.name}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {tool.summary}
                        </p>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                          Open tool
                          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
