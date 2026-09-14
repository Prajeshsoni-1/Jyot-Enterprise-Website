"use client";

import { useRef, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { RelatedGrid } from "@/components/site/RelatedGrid";
import { SectionHeading } from "@/components/site/primitives";
import { type Job } from "@/data/careers";
import { loadJob, loadJobs } from "@/lib/cms-loaders";
import type { JobExtras } from "@/lib/cms-content";
import { LeadError, submitLead } from "@/lib/leads";
import { MAX_UPLOAD_BYTES, uploadLeadFile, type UploadedAttachment } from "@/lib/lead-uploads";
import { useHydrated } from "@/hooks/use-hydrated";
import { canonical, breadcrumbSchema, jsonLd, pageMeta, SITE_NAME } from "@/lib/seo";

export const Route = createFileRoute("/careers/$slug")({
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } => {
    const isP =
      search["preview"] === true ||
      search["preview"] === "true" ||
      search["preview"] === "1";
    return isP ? { preview: true } : {};
  },
  loaderDeps: ({ search }) => ({ preview: Boolean(search.preview) }),
  loader: async ({ params, deps }) => {
    const [{ job, extras }, jobs] = await Promise.all([
      loadJob(params.slug, deps.preview),
      loadJobs(),
    ]);
    if (!job) throw notFound();
    return { job, extras, jobs, preview: deps.preview };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Role not found" }, { name: "robots", content: "noindex" }] };
    }
    const job = loaderData.job as Job;
    const path = `/careers/${params.slug}`;
    return {
      meta: pageMeta({
        title: `${job.title} (${job.employmentType === "internship" ? "Internship" : "Job"}) — Careers | ${SITE_NAME}`,
        description: job.summary,
        path,
      }),
      links: [canonical(path)],
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: job.title,
          description: job.summary,
          datePosted: job.posted,
          employmentType: job.employmentType === "internship" ? "INTERN" : "FULL_TIME",
          hiringOrganization: { "@type": "Organization", name: SITE_NAME },
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Gandhinagar",
              addressRegion: "Gujarat",
              addressCountry: "IN",
            },
          },
          experienceRequirements: job.experience,
        }),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Careers", path: "/careers" },
            { name: job.title, path },
          ]),
        ),
      ],
    };
  },
  component: JobPage,
  notFoundComponent: () => (
    <section className="container-x py-32 text-center">
      <h1 className="font-display text-3xl font-extrabold text-ink">Role not found</h1>
      <Link to="/careers" className="mt-6 inline-block font-semibold text-primary">
        See all open roles
      </Link>
    </section>
  ),
});

import {
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

function ApplicationForm({ job }: { job: Job }) {
  const navigate = useNavigate();
  const renderedAt = useRef(Date.now());
  const hydrated = useHydrated();
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const resume = form.get("resume");
    const resumeFile = resume instanceof File && resume.size > 0 ? resume : null;
    if (resumeFile && resumeFile.size > MAX_UPLOAD_BYTES) {
      setError("Your resume is larger than 10 MB. Please upload a smaller file.");
      return;
    }
    setStatus("sending");
    try {
      const attachments: UploadedAttachment[] = resumeFile
        ? [await uploadLeadFile("careers", resumeFile)]
        : [];
      await submitLead(
        {
          attachments,
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          service: `Application — ${job.title}`,
          jobSlug: job.slug,
          jobTitle: job.title,
          careerId: job.id,
          positionType:
            job.positionType || (job.employmentType === "internship" ? "internship" : "job"),
          employmentType:
            job.employmentType || (job.type === "Internship" ? "internship" : "job"),
          message: String(form.get("message") ?? ""),
          source: "careers",
          pageUrl: typeof window === "undefined" ? "" : window.location.href,
          submittedAt: new Date().toISOString(),
          attachmentName: resume instanceof File && resume.name ? resume.name : undefined,
        },
        { honeypot: String(form.get("company_website") ?? ""), renderedAt: renderedAt.current },
      );
      void navigate({ to: "/application-submitted" });
    } catch (err) {
      const message =
        err instanceof LeadError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please check your details and try again.";
      setError(message);
      setStatus("idle");
    }
  }

  const isInternship =
    job.positionType === "internship" ||
    (!job.positionType && (job.employmentType === "internship" || job.type === "Internship"));

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-soft"
    >
      <div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
            isInternship
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              : "bg-primary/15 text-primary border border-primary/30"
          }`}
        >
          {isInternship ? "Internship Application" : "Job Application"}
        </span>
        <p className="mt-2 font-display text-lg font-bold text-ink">Apply for this role</p>
        <p className="text-xs text-muted-foreground">{job.title} · {job.department}</p>
      </div>

      {job.applicationInstructions ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-ink/90">
          <span className="font-bold text-ink block mb-1">Application Instructions:</span>
          <p className="whitespace-pre-line leading-relaxed">{job.applicationInstructions}</p>
        </div>
      ) : null}

      <label className="hidden" aria-hidden="true">
        Company website
        <input name="company_website" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-ink">
          Full name
          <input name="name" required maxLength={80} className={field} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-ink">
          Phone
          <input name="phone" required maxLength={20} inputMode="tel" className={field} />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold text-ink">
        Email
        <input name="email" type="email" required maxLength={120} className={field} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-ink">
        {isInternship ? "Why this internship & your availability?" : "Why this role?"}
        <textarea name="message" rows={4} required maxLength={1500} className={field} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-ink">
        Resume (PDF or DOC, max 10 MB)
        <input
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx"
          className="w-full overflow-hidden rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-primary">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending" || !hydrated}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-70"
      >
        {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {status === "sending" ? "Submitting…" : isInternship ? "Submit Internship Application" : "Submit Job Application"}
      </button>
      <p className="text-xs text-muted-foreground">
        We reply to every application within five working days.
      </p>
    </form>
  );
}

function JobPage() {
  const { job, extras, jobs, preview } = Route.useLoaderData() as {
    job: Job;
    extras: JobExtras | null;
    jobs: Job[];
    preview?: boolean;
  };
  const path = `/careers/${job.slug}`;
  const isInternship =
    job.positionType === "internship" ||
    (!job.positionType && (job.employmentType === "internship" || job.type === "Internship"));

  const related = jobs
    .filter((j) => j.slug !== job.slug)
    .slice(0, 3)
    .map((j) => ({
      title: j.title,
      meta: `${j.department} · ${j.positionType === "internship" || j.employmentType === "internship" || j.type === "Internship" ? "Internship" : "Job"}`,
      href: `/careers/${j.slug}`,
      body: j.summary,
    }));

  const allSkills = (job.skills?.length ? job.skills : extras?.skills) ?? [];
  const benefitsList = (job.benefits?.length ? job.benefits : extras?.benefits) ?? [];

  return (
    <>
      {preview ? (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 text-center text-xs font-semibold text-amber-500 flex items-center justify-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Draft Preview Mode — This role is currently unpublished. You are viewing how it appears once live.
        </div>
      ) : null}

      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Careers", path: "/careers" },
          { name: job.title, path },
        ]}
      />

      <header className="border-b border-border bg-surface py-16 lg:py-20">
        <div className="container-x max-w-3xl">
          {job.logo ? (
            <div className="mb-4">
              <img
                src={job.logo}
                alt=""
                className="h-12 w-12 rounded-xl object-contain border border-border bg-background p-1.5 shadow-2xs"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="eyebrow text-primary">
              {job.department}
            </p>
            <span className="text-muted-foreground/40">·</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                isInternship
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : "bg-primary/15 text-primary border border-primary/30"
              }`}
            >
              {isInternship ? "Internship" : "Full-Time Job"}
            </span>
          </div>

          <h1 className="mt-4 text-3xl leading-[1.1] font-extrabold tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl">
            {job.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{job.summary}</p>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" /> {job.location}
            </li>
            {isInternship ? (
              <li className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" /> Duration: {job.duration || "6 Months"}
              </li>
            ) : (
              <li className="inline-flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" /> {job.experience}
              </li>
            )}
            {job.showSalary !== false && job.salary ? (
              <li className="inline-flex items-center gap-2">
                <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" />
                {isInternship ? `Stipend: ${job.salary}` : `Salary: ${job.salary}`}
              </li>
            ) : null}
            {job.workMode || extras?.workMode ? (
              <li className="inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                {job.workMode || extras?.workMode}
              </li>
            ) : null}
            {(job.openings ?? extras?.openings) ? (
              <li className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                {(job.openings ?? extras?.openings)} opening{Number(job.openings ?? extras?.openings) > 1 ? "s" : ""}
              </li>
            ) : null}
            {job.deadline || extras?.deadline ? (
              <li className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                Apply by {job.deadline || extras?.deadline}
              </li>
            ) : null}
            {job.education ? (
              <li className="inline-flex items-center gap-2">
                <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
                {job.education}
              </li>
            ) : null}
          </ul>
          {allSkills.length ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold text-ink shadow-xs"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <section className="bg-background py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="min-w-0">
            <SectionHeading eyebrow="The role" title="What you will do." />
            <ul className="mt-8 grid gap-3">
              {job.responsibilities.map((r) => (
                <li key={r} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-growth"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>

            <h2 className="mt-12 font-display text-xl font-bold text-ink">What we need from you</h2>
            <ul className="mt-5 grid gap-3">
              {job.requirements.map((r) => (
                <li key={r} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>

            {job.body || extras?.body ? (
              <>
                <h2 className="mt-12 font-display text-xl font-bold text-ink">About this role</h2>
                <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {job.body || extras?.body}
                </p>
              </>
            ) : null}

            {job.qualifications && job.qualifications.length > 0 ? (
              <>
                <h2 className="mt-12 font-display text-xl font-bold text-ink">Qualifications</h2>
                <ul className="mt-5 grid gap-3">
                  {job.qualifications.map((q) => (
                    <li key={q} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <GraduationCap
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {q}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {isInternship && job.learningOpportunities && job.learningOpportunities.length > 0 ? (
              <>
                <h2 className="mt-12 font-display text-xl font-bold text-ink">Learning Opportunities</h2>
                <ul className="mt-5 grid gap-3">
                  {job.learningOpportunities.map((lo) => (
                    <li
                      key={lo}
                      className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      <Sparkles
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {lo}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {benefitsList.length ? (
              <>
                <h2 className="mt-12 font-display text-xl font-bold text-ink">
                  {isInternship ? "Perks & Benefits" : "Benefits & What We Offer"}
                </h2>
                <ul className="mt-5 grid gap-3">
                  {benefitsList.map((b) => (
                    <li
                      key={b}
                      className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-growth"
                        aria-hidden="true"
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {((job.preferredSkills && job.preferredSkills.length > 0) || (job.niceToHave && job.niceToHave.length > 0)) ? (
              <>
                <h2 className="mt-12 font-display text-xl font-bold text-ink">
                  {job.preferredSkills?.length ? "Preferred Skills & Nice to Have" : "Nice to have"}
                </h2>
                <ul className="mt-5 grid gap-3">
                  {Array.from(new Set((job.preferredSkills ?? []).concat(job.niceToHave ?? []))).map((r) => (
                    <li
                      key={r}
                      className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-border"
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {(job.workingHours || job.reportingTo) ? (
              <div className="mt-10 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground grid gap-3 sm:grid-cols-2">
                {job.workingHours ? (
                  <div>
                    <span className="font-semibold text-ink">Working Hours:</span> {job.workingHours}
                  </div>
                ) : null}
                {job.reportingTo ? (
                  <div>
                    <span className="font-semibold text-ink">Reporting To:</span> {job.reportingTo}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <ApplicationForm job={job} />
          </div>
        </div>
      </section>

      <RelatedGrid items={related} eyebrow="Other roles" title="Also hiring for." tone="surface" />
      <CtaBand
        eyebrow="Questions first?"
        title="Talk to the practice lead before applying."
        body="If you want to understand the work before you send a resume, ask us directly."
      />
    </>
  );
}
