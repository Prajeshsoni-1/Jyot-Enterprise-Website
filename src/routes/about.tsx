import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading, Counter } from "@/components/site/primitives";
import { STATS, WHY_US, PROCESS } from "@/data/site";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";
import { loadPage, loadTeamMembers } from "@/lib/cms-loaders";
import type { TeamMemberItem } from "@/lib/cms-content";

export const Route = createFileRoute("/about")({
  loader: async () => {
    const [page, teamMembers] = await Promise.all([loadPage("about"), loadTeamMembers()]);
    return {
      heroTitle: page.text(
        "hero_title",
        "A single partner for the four things every business needs.",
      ),
      heroBody: page.text(
        "hero_description",
        "Jyot Enterprise was founded in 2012 to end the fragmentation of vendors — a broker for capital, an agency for software, a consultant for compliance, a firm for engineering. We brought all four in-house.",
      ),
      seoTitle: page.text("seo_title", "About Jyot Enterprise — Our Story & Standards"),
      seoDescription: page.text(
        "seo_description",
        "Since 2012 Jyot Enterprise has advised Indian businesses across finance, technology, legal and engineering with a single accountable team.",
      ),
      teamMembers,
    };
  },
  head: ({ loaderData }) => ({
    meta: pageMeta({
      title: loaderData?.seoTitle ?? "About Jyot Enterprise — Our Story & Standards",
      description:
        loaderData?.seoDescription ??
        "Since 2012 Jyot Enterprise has advised Indian businesses across finance, technology, legal and engineering with a single accountable team.",
      path: "/about",
      type: "website",
    }),
    links: [canonical("/about")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About Jyot Enterprise", path: "/about" },
        ]),
      ),
    ],
  }),
  component: About,
});

function About() {
  const page = Route.useLoaderData();
  const team: TeamMemberItem[] = page.teamMembers ?? [];

  return (
    <>
      <PageHero eyebrow="About" title={page.heroTitle} body={page.heroBody} />

      <section className="bg-background py-24">
        <div className="container-x grid gap-16 lg:grid-cols-[1fr_1fr]">
          <SectionHeading
            eyebrow="Our position"
            title="Enterprise discipline, mid-market economics."
            body="We operate the way large consultancies do — written scope, named owners, independent quality review — without the overhead structure that makes them unaffordable for growing companies."
          />
          <div className="grid gap-8 sm:grid-cols-2">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <p className="font-display text-4xl font-extrabold text-ink">
                  <Counter value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Principles" title="What we hold ourselves to." />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((w) => (
              <div key={w.title} className="bg-background p-6 sm:p-8">
                <h3 className="text-lg leading-snug font-bold text-ink">{w.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {team.length > 0 ? (
        <section className="border-b border-border bg-background py-24">
          <div className="container-x">
            <SectionHeading
              eyebrow="Leadership"
              title="Senior practice leaders with domain authority."
              body="Every engagement is overseen by a named practice partner with direct accountability for the standard of work."
            />
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member, i) => (
                <Reveal key={member.name} delay={i * 0.08}>
                  <div className="group h-full rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft transition-all hover:border-primary/40 hover:shadow-lift">
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-primary">
                      {member.department || "Advisory"}
                    </span>
                    <h3 className="mt-4 font-display text-xl font-bold text-ink">{member.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {member.role}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {member.bio}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-background py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Method" title="The same seven stages, every mandate." />
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p, i) => (
              <Reveal key={p.step} delay={(i % 4) * 0.06}>
                <span className="font-display text-xs font-bold tracking-[0.2em] text-muted-foreground/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{p.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
