import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { CONTACT } from "@/data/site";
import { canonical, breadcrumbSchema, jsonLd, pageMeta, SITE_NAME } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: pageMeta({
      title: "Terms of Service — Jyot Enterprise",
      description:
        "Read the terms, conditions, and service standards governing your engagement with Jyot Enterprise across Financial, Technology, Legal, and Engineering advisory.",
      path: "/terms",
      type: "website",
    }),
    links: [canonical("/terms")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms" },
        ]),
      ),
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const lastUpdated = "September 9, 2026";

  return (
    <>
      <PageHero
        eyebrow="Legal & Standards"
        title="Terms of Service"
        body="The standards, terms, and mutual responsibilities governing advisory engagements, software deliverables, and consultation services."
      />

      <section className="bg-background py-20 text-ink">
        <div className="container-x max-w-4xl space-y-12">
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-xs">
            <p>
              <strong className="text-ink">Effective Date:</strong> {lastUpdated} &bull;{" "}
              <strong className="text-ink">Entity:</strong> {SITE_NAME}
            </p>
            <p className="mt-2">
              Please read these Terms of Service (&quot;Terms&quot;) carefully before utilizing the
              website, digital consultation portals, or engaging the professional services of Jyot
              Enterprise.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              1. Scope of Services
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Jyot Enterprise provides integrated business solutions through dedicated
              multidisciplinary practices:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
              <li>
                <strong className="text-ink">Financial Services:</strong> Project financing, working
                capital syndication, CMA data preparation, debt restructuring, and subsidy advisory.
              </li>
              <li>
                <strong className="text-ink">Technology &amp; AI:</strong> Custom enterprise ERP,
                CRM solutions, cloud automation, AI agent workflows, and system integrations.
              </li>
              <li>
                <strong className="text-ink">Legal &amp; Regulatory:</strong> Corporate
                registrations, trademark filing, statutory compliance calendars, contract
                structuring, and ROC filings.
              </li>
              <li>
                <strong className="text-ink">Engineering Consultancy:</strong> Plant layout design,
                manufacturing process optimization, prototyping guidance, and industrial
                documentation.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              All formal engagements require an executed Statement of Work (SOW), Proposal, or
              Engagement Letter defining specific deliverables, timelines, and commercial terms.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              2. Consultations &amp; Bookings
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Consultation requests submitted through our website are subject to availability and
              preliminary conflict-of-interest review. While we strive to honor scheduled slots,
              Jyot Enterprise reserves the right to reschedule consultation times due to operational
              requirements, giving clients prompt advance notice.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              3. Client Responsibilities &amp; Accuracy of Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Successful advisory outcomes depend on the completeness and veracity of corporate
              documents provided. Clients agree to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
              <li>
                Provide accurate, authentic, and complete financial, technical, and corporate data.
              </li>
              <li>
                Maintain appropriate internal authorizations before sharing sensitive third-party or
                shareholder records.
              </li>
              <li>
                Promptly review deliverables, feedback requests, and sign-offs necessary for
                milestone completion.
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              4. Intellectual Property
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
              <li>
                <strong className="text-ink">Client Ownership:</strong> Upon receipt of full
                contractual payment, clients retain exclusive ownership of bespoke software code,
                custom architecture documents, and specific deliverables created under their SOW.
              </li>
              <li>
                <strong className="text-ink">Jyot Enterprise IP:</strong> Pre-existing frameworks,
                proprietary platforms (e.g., Jyot ERP core modules, calculation tools, reusable UI
                components), and advisory methodologies remain the intellectual property of Jyot
                Enterprise.
              </li>
              <li>
                <strong className="text-ink">Website Content:</strong> All branding, graphics,
                articles, case studies, guides, and tools on this website are protected under
                copyright and trademark laws. Unauthorized reproduction is prohibited.
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              5. Confidentiality &amp; Non-Disclosure
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Both parties agree to hold all technical, financial, commercial, and operational
              information exchanged in strict confidence. Jyot Enterprise will not disclose
              proprietary client business plans or trade secrets to any third party without explicit
              prior consent, except as mandated by statutory judicial authorities.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              6. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Advisory opinions, financial modeling, and projections are prepared with utmost
              diligence based on available facts and regulatory standards; however, financial
              sanctions, statutory approvals, and market outcomes ultimately depend on external
              lenders and government bodies.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by applicable law, Jyot Enterprise shall not be liable
              for any indirect, consequential, punitive, or incidental damages. Our aggregate
              liability under any engagement shall not exceed the professional fees actually
              received by us for the specific service in dispute.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              7. Governing Law &amp; Jurisdiction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms and any contractual disputes arising out of our engagements shall be
              governed by and construed in accordance with the laws of the Republic of India. The
              courts situated in Gandhinagar, Gujarat shall have exclusive jurisdiction over all
              proceedings.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              8. Inquiries &amp; Modifications
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Jyot Enterprise reserves the right to amend these Terms from time to time to reflect
              regulatory or service updates. For legal inquiries or formal notices, please contact:
            </p>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-2 text-sm text-ink shadow-xs">
              <p className="font-semibold text-base">{SITE_NAME}</p>
              <p className="text-muted-foreground">Corporate Office: {CONTACT.address}</p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a href={`mailto:${CONTACT.email}`} className="text-primary hover:underline">
                  {CONTACT.email}
                </a>
              </p>
              <p className="text-muted-foreground">
                Phone:{" "}
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
