"use client";

import { useState } from "react";
import { Reveal, SectionHeading } from "../primitives";
import { FAQ_GROUPS } from "@/data/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type Faq = { q: string; a: string };

/** `extra` carries published FAQs managed from the admin panel. */
export function FaqGroups({
  extra = [],
}: {
  extra?: { q: string; a: string; category: string }[];
}) {
  const groups = (() => {
    const map = new Map<string, Faq[]>(FAQ_GROUPS.map((g) => [g.category, [...g.items]]));
    for (const item of extra) {
      const key = map.has(item.category) ? item.category : FAQ_GROUPS[0]!.category;
      map.set(key, [...(map.get(key) ?? []), { q: item.q, a: item.a }]);
    }
    return [...map.entries()].map(([category, items]) => ({ category, items }));
  })();
  const [active, setActive] = useState(groups[0]!.category);
  const group = groups.find((g) => g.category === active) ?? groups[0]!;

  return (
    <section className="border-t border-border bg-surface py-28 lg:py-36">
      <div className="container-x grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <SectionHeading
            eyebrow="FAQ"
            title="Questions we are asked before every signature."
            body="Straight answers on fees, ownership, timelines and who is accountable when something slips."
          />
          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap gap-2">
              {groups.map((g) => (
                <button
                  key={g.category}
                  type="button"
                  onClick={() => setActive(g.category)}
                  className={cn(
                    "rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors",
                    g.category === active
                      ? "border-primary bg-primary text-primary-foreground shadow-ember"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-ink",
                  )}
                >
                  {g.category}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.05}>
          <Accordion type="single" collapsible className="w-full" key={group.category}>
            {group.items.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-display text-base font-bold text-ink hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
