import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { CONTACT } from "@/data/site";
import { canonical, breadcrumbSchema, jsonLd, pageMeta, SITE_NAME } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: pageMeta({
      title: "Privacy Policy — Jyot Enterprise",
      description:
        "Learn how Jyot Enterprise collects, uses, protects and manages personal and business information in compliance with Indian IT laws and global data standards.",
      path: "/privacy",
      type: "website",
    }),
    links: [canonical("/privacy")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ]),
      ),
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const lastUpdated = "September 9, 2026";

  return (
    <>
      <PageHero
        eyebrow="Legal & Compliance"
        title="Privacy Policy"
        body="How we collect, protect, process, and respect your confidential business records and personal data."
      />

      <section className="bg-background py-20 text-ink">
        <div className="container-x max-w-4xl space-y-12">
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-xs">
            <p>
              <strong className="text-ink">Effective Date:</strong> {lastUpdated} &bull;{" "}
              <strong className="text-ink">Entity:</strong> {SITE_NAME}
            </p>
            <p className="mt-2">
              This Privacy Policy explains how Jyot Enterprise (&quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;) collects, handles, stores, and protects personal information and
              corporate data gathered through our website, consultation desks, and client service
              portals.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information to provide multi-disciplinary professional advisory services
              across our four core divisions: Financial Advisory, Technology &amp; AI, Regulatory
              &amp; Legal Compliance, and Engineering Consultancy.
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
              <li>
                <strong className="text-ink">Contact &amp; Identity Details:</strong> Full name,
                official email address, phone number, company name, designation, city, and
                jurisdiction when submitting an enquiry or booking a consultation.
              </li>
              <li>
                <strong className="text-ink">Project &amp; Business Specifications:</strong>{" "}
                Financial statements, project reports, software requirements, engineering drawings,
                and regulatory documents uploaded to our secure document repository.
              </li>
              <li>
                <strong className="text-ink">Job Application Data:</strong> Curriculum vitae (CV),
                resume files, employment history, portfolios, and contact details submitted through
                our Careers portal.
              </li>
              <li>
                <strong className="text-ink">Technical &amp; Usage Metadata:</strong> IP address,
                browser type, referral URLs, device identifiers, and pages visited collected through
                analytical cookies to optimize performance.
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All personal and business data collected is utilized solely for legitimate
              professional purposes:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
              <li>Facilitating scheduled consultations and client advisory meetings.</li>
              <li>
                Preparing project proposals, loan syndication files, compliance audits, and custom
                software architectures.
              </li>
              <li>
                Processing recruitment applications and evaluating candidates for open positions.
              </li>
              <li>
                Communicating status updates, deliverables, milestone completions, and
                administrative notices.
              </li>
              <li>
                Complying with statutory reporting requirements under applicable Indian legislation.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-ink">
                We do not sell, rent, monetize, or trade your data.
              </strong>{" "}
              Client data is never disclosed to unauthorized third-party advertisers.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              3. Data Protection &amp; Confidentiality
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We treat corporate files and proprietary information with enterprise-grade security
              protocols:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
              <li>
                <strong className="text-ink">Access Control &amp; Row Level Security:</strong>{" "}
                Database records are strictly partitioned. Private documents, financial models, and
                resumes uploaded to our storage systems are accessible only by authorized team
                specialists bound by confidentiality agreements.
              </li>
              <li>
                <strong className="text-ink">Encryption:</strong> All data transmissions are
                encrypted in transit via Transport Layer Security (TLS 1.3 / HTTPS) and stored on
                secure cloud database clusters with encryption-at-rest.
              </li>
              <li>
                <strong className="text-ink">Data Minimization:</strong> We retain client and
                applicant files only as long as necessary to fulfill the relevant service agreement
                or comply with statutory retention laws.
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              4. Cookies &amp; Tracking Technologies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website uses essential cookies required for session persistence, authentication,
              and core security. We may also use non-essential performance tracking cookies (such as
              Google Analytics) to analyze aggregate site traffic. You can adjust your browser
              settings to decline non-essential cookies without affecting your access to public
              consultation resources.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              5. Legal Framework &amp; Compliance
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This Privacy Policy is formulated in accordance with the Information Technology Act,
              2000 (and its relevant amendments), the Information Technology (Reasonable Security
              Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, the
              Digital Personal Data Protection (DPDP) Act, 2023, and international privacy
              standards.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              6. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to request access to, update, rectify, or request the deletion of
              your personal contact records held in our databases. To exercise your rights, please
              reach out to our compliance officer using the contact details below.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              7. Contact &amp; Grievance Redressal
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data
              handling practices, please contact our administrative desk:
            </p>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-2 text-sm text-ink shadow-xs">
              <p className="font-semibold text-base">{SITE_NAME}</p>
              <p className="text-muted-foreground">Office: {CONTACT.address}</p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a href={`mailto:${CONTACT.email}`} className="text-primary hover:underline">
                  {CONTACT.email}
                </a>
              </p>
              <p className="text-muted-foreground">
                Telephone:{" "}
                <a href={CONTACT.phoneHref} className="text-primary hover:underline">
                  {CONTACT.phone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
