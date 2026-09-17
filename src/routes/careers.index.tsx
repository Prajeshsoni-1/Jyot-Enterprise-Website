import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Banknote, Briefcase, Clock, MapPin } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal, SectionHeading } from "@/components/site/primitives";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { CAREER_BENEFITS, DEPARTMENTS, type Job } from "@/data/careers";
import { loadJobs, loadPage } from "@/lib/cms-loaders";
import type { PageContent } from "@/lib/cms-content";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/careers/")({
  loader: async () => {
    const [jobs, page] = await Promise.all([loadJobs(), loadPage("careers")]);
    return { jobs, page };
  },
  head: () => ({
    meta: pageMeta({
      title: "Careers & Internships at Jyot Enterprise",
      description:
        "Open roles and internships across finance, technology, legal and engineering at Jyot Enterprise. Salary ranges published, senior mentorship on real mandates.",
      path: "/careers",
      type: "website",
    }),
    links: [canonical("/careers")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Careers", path: "/careers" },
        ]),
      ),
    ],
  }),
  component: Careers,
});

function JobRow({ job }: { job: Job }) {
  const isInternship =
    job.positionType === "internship" ||
    (!job.positionType && job.employmentType === "internship");

  return (
    <Link
      to="/careers/$slug"
      params={{ slug: job.slug }}
      className="group grid gap-3 rounded-2xl border border-border bg-card px-7 py-6 transition-colors hover:border-primary/30 sm:grid-cols-[1fr_auto] sm:items-center"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {job.logo ? (
            <img
              src={job.logo}
              alt=""
              className="h-6 w-6 rounded-md object-contain border border-border/50 bg-background p-0.5"
            />
          ) : null}
          <h3 className="font-display text-lg font-bold text-ink">{job.title}</h3>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${
              isInternship
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            {job.type || (isInternship ? "Internship" : "Full-time")}
          </span>
          {job.featured ? (
            <span className="rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[0.65rem] font-bold">
              Featured
            </span>
          ) : null}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="font-semibold text-ink">{job.department}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {job.location}
          </span>
          {job.workMode ? (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {job.workMode}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" /> {job.experience}
          </span>
          {job.duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {job.duration}
            </span>
          ) : null}
          {job.showSalary !== false && job.salary ? (
            <span className="inline-flex items-center gap-1 font-medium text-ink">
              <Banknote className="h-3.5 w-3.5 text-primary" /> {job.salary}
            </span>
          ) : null}
        </p>
      </div>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink group-hover:text-primary transition-colors">
        View role <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function Careers() {
  const loaderData = Route.useLoaderData();
  const jobs = (Array.isArray(loaderData?.jobs) ? loaderData.jobs : []) as Job[];
  const page = loaderData?.page as PageContent;

  const jobsList = jobs.filter((j) =>
    j.positionType ? j.positionType === "job" : j.employmentType !== "internship"
  );
  const internships = jobs.filter((j) =>
    j.positionType ? j.positionType === "internship" : j.employmentType === "internship"
  );

  const heroTitle = page?.text?.("hero_title", "Work where the standard is the point.") ?? "Work where the standard is the point.";
  const heroBody = page?.text?.(
    "hero_body",
    "We hire people who would rather do it properly than quickly — and then give them the time to.",
  ) ?? "We hire people who would rather do it properly than quickly — and then give them the time to.";

  const jobsEyebrow = page?.text?.("jobs_eyebrow", "Jobs") ?? "Jobs";
  const jobsTitle = page?.text?.(
    "jobs_title",
    "Jobs & Full-Time Opportunities",
  ) ?? "Jobs & Full-Time Opportunities";

  const internshipsEyebrow = page?.text?.("internships_eyebrow", "Internships") ?? "Internships";
  const internshipsTitle = page?.text?.(
    "internships_title",
    "Six-month programmes with real mandates.",
  ) ?? "Six-month programmes with real mandates.";

  return (
    <>
      <PageHero eyebrow="Careers" title={heroTitle} body={heroBody} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Careers", path: "/careers" },
        ]}
      />

      <section className="bg-background py-24">
        <div className="container-x space-y-20">
          {/* SECTION 1: JOBS */}
          <div>
            <SectionHeading eyebrow={jobsEyebrow} title={jobsTitle} />
            {jobsList.length > 0 ? (
              <div className="mt-14 grid gap-4">
                {jobsList.map((job, i) => (
                  <Reveal key={job.slug} delay={(i % 3) * 0.05}>
                    <JobRow job={job} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
                <p className="text-sm font-semibold text-muted-foreground">
                  No active job openings right now — we are always looking for exceptional talent. Submit your details below for future consideration.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 2: INTERNSHIPS */}
          <div>
            <SectionHeading eyebrow={internshipsEyebrow} title={internshipsTitle} />
            {internships.length > 0 ? (
              <div className="mt-14 grid gap-4">
                {internships.map((job, i) => (
                  <Reveal key={job.slug} delay={(i % 3) * 0.05}>
                    <JobRow job={job} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
                <p className="text-sm font-semibold text-muted-foreground">
                  No active internship openings right now — check back soon or submit your profile below.
                </p>
              </div>
            )}
          </div>

          {internships.length === 0 && jobsList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
              <h3 className="font-display text-xl font-bold text-ink">
                No active openings right now
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We are always looking for exceptional talent. Submit your details below for future
                consideration.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t border-border bg-surface py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Departments" title="Where you could sit." />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {DEPARTMENTS.map((d) => (
              <div key={d.name} className="bg-background p-8">
                <h3 className="font-display text-lg font-bold text-ink">{d.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <SectionHeading eyebrow="Why here" title="What you get in return." />
            <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {CAREER_BENEFITS.map((b) => (
                <div key={b.title} className="bg-background p-8">
                  <h3 className="text-lg leading-snug font-bold text-ink">{b.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Nothing matching?"
        title="Send us your work anyway."
        body="We keep strong applications on file and open roles for people worth hiring."
      />
    </>
  );
}
