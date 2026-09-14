/** Resource library: guides, checklists and templates at /resources/$slug */

/** Type of resource. Expanded set (compatible with CMS resource_type field). */
export type ResourceCategory =
  | "Guide"
  | "Checklist"
  | "Template"
  | "Calculator"
  | "Report"
  | "Ebook"
  | "Whitepaper"
  | "Case Study"
  | "Other";

/** Division / practice. */
export type ResourcePractice = "Financial" | "IT" | "Legal" | "Engineering" | "Business" | "Other";

/**
 * A section / content block within a resource detail page.
 * When loaded from the CMS the `type` field specifies the block type;
 * legacy static content uses the simple heading+body+points shape.
 */
export type ResourceSection = {
  id?: string | undefined;
  type?: string | undefined;
  order?: number | undefined;
  heading: string;
  body: string;
  points?: string[] | undefined;
  /** For image+text blocks */
  imageUrl?: string | undefined;
  imageAlt?: string | undefined;
  /** For quote blocks */
  quote?: string | undefined;
  quoteBy?: string | undefined;
  /** For stats/metrics blocks */
  stats?: { label: string; value: string }[] | undefined;
  /** For FAQ blocks */
  faqs?: { q: string; a: string }[] | undefined;
  /** For checklist blocks */
  items?: string[] | undefined;
  /** For steps/process blocks */
  steps?: { step: string; body: string }[] | undefined;
  /** For table blocks */
  tableHeaders?: string[] | undefined;
  tableRows?: string[][] | undefined;
  /** For callout blocks */
  calloutType?: ("note" | "warning" | "tip" | "important") | undefined;
  /** For download-section blocks */
  downloadIds?: string[] | undefined;
  /** For video blocks */
  videoUrl?: string | undefined;
  videoCaption?: string | undefined;
  /** For CTA blocks */
  ctaHeading?: string | undefined;
  ctaBody?: string | undefined;
  ctaPrimaryText?: string | undefined;
  ctaPrimaryUrl?: string | undefined;
  /** Generic custom content */
  html?: string | undefined;
  /** enabled toggle */
  enabled?: boolean | undefined;
};

/**
 * A downloadable file attached to a resource.
 * Legacy static data uses name/format/size (strings).
 * CMS-loaded downloads additionally carry fileUrl, storagePath, mimeType, fileSize.
 */
export type ResourceDownload = {
  /** id from cms_resource_files (present when from CMS) */
  id?: string | undefined;
  name: string;
  format: string;
  size: string;
  /** Real public URL to the file in Supabase Storage */
  fileUrl?: string | undefined;
  storagePath?: string | undefined;
  mimeType?: string | undefined;
  /** Raw bytes */
  fileSize?: number | undefined;
  /** Optional override label for the download button */
  displayLabel?: string | undefined;
  /** Filename in storage */
  fileName?: string | undefined;
  /** Filename hint for browser Content-Disposition */
  downloadFilename?: string | undefined;
  isActive?: boolean | undefined;
};

/** CTA block configuration. */
export type ResourceCta = {
  enabled?: boolean | undefined;
  heading?: string | undefined;
  description?: string | undefined;
  primaryText?: string | undefined;
  primaryUrl?: string | undefined;
  secondaryText?: string | undefined;
  secondaryUrl?: string | undefined;
};

export type ResourceItem = {
  slug: string;
  title: string;
  /** Type of resource: Guide, Checklist, Template, etc. */
  category: ResourceCategory;
  /** Division / practice area */
  practice: ResourcePractice;
  icon: string;
  summary: string;
  /** Full introduction / description */
  description?: string | undefined;
  readTime: string;
  updated: string;
  /** Sub-category (optional) */
  subCategory?: string | undefined;
  /** Industry tag (optional) */
  industry?: string | undefined;
  /** Author name */
  author?: string | undefined;
  /** Author role / designation */
  authorRole?: string | undefined;
  /** Author photo URL */
  authorImage?: string | undefined;
  /** Published date string (ISO) */
  publishedAt?: string | undefined;
  /** Featured image URL */
  featuredImage?: string | undefined;
  thumbnailImage?: string | undefined;
  /** Content blocks (CMS-driven or legacy heading+body+points) */
  sections: ResourceSection[];
  /** Downloadable files */
  downloads: ResourceDownload[];
  faqs: { q: string; a: string }[];
  /** CTA configuration */
  cta?: ResourceCta | undefined;
  /** SEO */
  seoTitle?: string | undefined;
  seoDescription?: string | undefined;
  seoKeywords?: string[] | undefined;
  canonicalUrl?: string | undefined;
  ogTitle?: string | undefined;
  ogDescription?: string | undefined;
  ogImage?: string | undefined;
  twitterTitle?: string | undefined;
  twitterDescription?: string | undefined;
  twitterImage?: string | undefined;
  noindex?: boolean | undefined;
  nofollow?: boolean | undefined;
  /** CMS lifecycle */
  featured?: boolean | undefined;
  status?: ("draft" | "published" | "archived") | undefined;
  sortOrder?: number | undefined;
  updatedAt?: string | undefined;
};

export const RESOURCE_LIBRARY: ResourceItem[] = [
  {
    slug: "gst-guide",
    title: "The Practical GST Guide for Indian Businesses",
    category: "Guide",
    practice: "Legal",
    icon: "ReceiptText",
    summary:
      "Registration thresholds, return calendar, input credit recovery and the three mistakes that generate most departmental notices.",
    readTime: "12 min",
    updated: "January 2026",
    sections: [
      {
        heading: "Do you need to register?",
        body: "Registration is mandatory above ₹40 lakh turnover for goods and ₹20 lakh for services, but thresholds are not the only trigger. Inter-state supply, e-commerce selling and reverse-charge liability all force registration regardless of turnover.",
        points: [
          "₹40 L goods / ₹20 L services in most states",
          "Any inter-state outward supply of goods",
          "Selling through e-commerce operators",
          "Casual taxable persons and non-resident suppliers",
        ],
      },
      {
        heading: "Composition versus regular",
        body: "Composition offers a lower rate and quarterly filing but blocks input credit and inter-state supply. It suits B2C businesses with low input costs. Any B2B seller whose buyers claim credit should stay regular — composition makes you a more expensive supplier.",
      },
      {
        heading: "The monthly calendar",
        body: "GSTR-1 by the 11th, GSTR-3B by the 20th, and annual GSTR-9 by 31 December. QRMP filers submit quarterly with monthly tax payment. Late fees accrue daily and interest runs at 18% per annum on tax paid late.",
        points: [
          "11th — GSTR-1 outward supplies",
          "20th — GSTR-3B summary and payment",
          "13th — GSTR-1 quarterly under QRMP",
          "31 December — GSTR-9 annual return",
        ],
      },
      {
        heading: "Recovering input credit you are losing",
        body: "Most businesses leave credit on the table because purchase invoices are not reconciled against GSTR-2B. If your supplier has not filed, you cannot claim. Monthly reconciliation with supplier follow-up typically recovers between 2% and 6% of annual purchase value.",
      },
      {
        heading: "Three mistakes that generate notices",
        body: "First, 3B and 1 not matching each other. Second, claiming credit not reflected in 2B. Third, e-way bill values diverging from invoice values. Each is avoidable with reconciliation before filing rather than after.",
      },
    ],
    downloads: [
      { name: "GST filing calendar 2026-27", format: "PDF", size: "180 KB" },
      { name: "Input credit reconciliation template", format: "XLSX", size: "62 KB" },
      { name: "GST registration document checklist", format: "PDF", size: "94 KB" },
    ],
    faqs: [
      {
        q: "Can I claim credit if my supplier has not filed?",
        a: "No. Credit is available only when the invoice appears in your GSTR-2B, which depends on your supplier filing GSTR-1.",
      },
      {
        q: "What is the penalty for a late return?",
        a: "₹50 per day (₹20 for nil returns) per return, plus 18% annual interest on any tax paid late.",
      },
      {
        q: "Can I have more than one GSTIN?",
        a: "Yes — one per state where you have a place of business, and optionally separate registrations for distinct business verticals.",
      },
    ],
  },
  {
    slug: "loan-guide",
    title: "Business Loan Readiness Guide",
    category: "Guide",
    practice: "Financial",
    icon: "Banknote",
    summary:
      "What lenders actually assess, how to strengthen a file before applying, and why most rejections are documentation problems rather than credit problems.",
    readTime: "10 min",
    updated: "February 2026",
    sections: [
      {
        heading: "What the lender is really assessing",
        body: "Beyond your credit score, underwriters look at banking conduct, GST turnover consistency, existing obligations and the quality of your documentation. A clean file with modest numbers frequently beats a strong business with messy paperwork.",
        points: [
          "Bureau score and repayment history",
          "Average bank balance and cheque returns",
          "GST turnover versus declared turnover",
          "Existing EMI obligations against income",
        ],
      },
      {
        heading: "Preparing six months in advance",
        body: "Route business receipts through one account, avoid cheque returns entirely, keep GST filings current and reduce credit-card utilisation below 30%. These four habits move eligibility more than any negotiation at application time.",
      },
      {
        heading: "Choosing the right product",
        body: "Unsecured business loans are fast but expensive. Mortgage-backed facilities cost 4–6% less. Working capital limits suit recurring cycles; term loans suit one-time capex. Matching product to purpose is the single biggest cost decision.",
      },
      {
        heading: "Why files get rejected",
        body: "In our experience the majority of rejections are avoidable: mismatched turnover across GST and ITR, unexplained large cash deposits, or applying simultaneously to eight lenders and triggering bureau alarm. Present a controlled shortlist instead.",
      },
    ],
    downloads: [
      { name: "Loan document checklist", format: "PDF", size: "120 KB" },
      { name: "EMI and eligibility calculator", format: "XLSX", size: "48 KB" },
      { name: "Working capital assessment template", format: "XLSX", size: "71 KB" },
    ],
    faqs: [
      {
        q: "Does applying to many lenders hurt my score?",
        a: "Yes. Each application triggers a hard enquiry. Multiple enquiries in a short window signal distress to underwriters.",
      },
      {
        q: "How much can I borrow?",
        a: "Unsecured facilities typically reach 15–25% of annual turnover. Secured facilities are driven by property value instead.",
      },
      {
        q: "Can a new business get funding?",
        a: "Usually only with collateral, a guarantee or an MSME scheme. Most unsecured programs need two years of vintage.",
      },
    ],
  },
  {
    slug: "website-checklist",
    title: "Pre-Launch Website Checklist",
    category: "Checklist",
    practice: "IT",
    icon: "Globe",
    summary:
      "Forty-two checks across performance, SEO, accessibility, analytics and security to run before any corporate site goes live.",
    readTime: "8 min",
    updated: "January 2026",
    sections: [
      {
        heading: "Performance",
        body: "Core Web Vitals decide both ranking and conversion. Test on a throttled mobile connection, not on office wifi.",
        points: [
          "Largest Contentful Paint under 2.5 seconds",
          "Cumulative Layout Shift below 0.1",
          "Images served as WebP or AVIF with explicit dimensions",
          "Fonts preloaded with a fallback that avoids layout shift",
        ],
      },
      {
        heading: "SEO",
        body: "Metadata and structure must be right at launch. Retrofitting after indexing costs months of ranking recovery.",
        points: [
          "Unique title under 60 characters on every page",
          "Meta description under 160 characters",
          "One H1 per page with a logical heading hierarchy",
          "XML sitemap, robots.txt and canonical tags in place",
          "Organisation and LocalBusiness structured data",
        ],
      },
      {
        heading: "Accessibility",
        body: "Accessibility is a legal expectation for enterprise buyers and a usability win for everyone.",
        points: [
          "Alt text on every meaningful image",
          "Contrast ratio of at least 4.5:1 for body text",
          "Full keyboard navigation with visible focus states",
          "Form fields with associated labels and error messages",
        ],
      },
      {
        heading: "Analytics and security",
        body: "Launching without measurement means the first month of data is lost permanently.",
        points: [
          "Analytics with conversion goals configured",
          "Search Console and Bing Webmaster verified",
          "HTTPS enforced with HSTS enabled",
          "Form spam protection and rate limiting active",
          "Automated daily backups with a tested restore",
        ],
      },
    ],
    downloads: [
      { name: "42-point launch checklist", format: "PDF", size: "210 KB" },
      { name: "SEO metadata planning sheet", format: "XLSX", size: "38 KB" },
    ],
    faqs: [
      {
        q: "How long should a launch audit take?",
        a: "Half a day for a small site, two days for a platform with many templates and integrations.",
      },
      {
        q: "What Lighthouse score should we target?",
        a: "90+ on mobile performance and 95+ on accessibility, SEO and best practices.",
      },
      {
        q: "Do we need structured data?",
        a: "Yes. It is the cheapest way to improve how your listing appears in search results.",
      },
    ],
  },
  {
    slug: "erp-guide",
    title: "Choosing Between Off-the-Shelf and Custom ERP",
    category: "Guide",
    practice: "IT",
    icon: "Boxes",
    summary:
      "A decision framework covering true cost of ownership, implementation risk, and the process-fit question that decides most failures.",
    readTime: "11 min",
    updated: "December 2025",
    sections: [
      {
        heading: "The real question",
        body: "It is not build versus buy. It is whether your competitive advantage lives inside a process that standard software would flatten. If it does, customise there and buy everywhere else.",
      },
      {
        heading: "Total cost over five years",
        body: "Off-the-shelf looks cheaper in year one and often is not by year three. Count licences per seat, mandatory upgrades, implementation partner fees and the customisation you will inevitably commission.",
        points: [
          "Licence cost per user per year, escalated",
          "Implementation partner fees, typically 1–2x licence",
          "Customisation and integration work",
          "Internal time during rollout — the largest hidden cost",
        ],
      },
      {
        heading: "Why ERP projects fail",
        body: "Rarely for technical reasons. They fail when scope covers everything at once, when the floor was never consulted, and when go-live happens without parallel running. Phased rollouts with one painful module first have a dramatically better record.",
      },
      {
        heading: "A workable rollout sequence",
        body: "Start with the module tied to cash. Dispatch-to-invoice or purchase-to-payment produces measurable value in weeks, which buys organisational patience for the harder modules that follow.",
      },
    ],
    downloads: [
      { name: "ERP requirement template", format: "XLSX", size: "88 KB" },
      { name: "Five-year TCO comparison model", format: "XLSX", size: "56 KB" },
      { name: "Vendor evaluation scorecard", format: "PDF", size: "140 KB" },
    ],
    faqs: [
      {
        q: "How long does an ERP rollout take?",
        a: "Ten to twenty weeks for a phased custom rollout; large off-the-shelf implementations frequently run past a year.",
      },
      {
        q: "Can we integrate with Tally?",
        a: "Yes. Two-way Tally synchronisation is a standard requirement and should never be a reason to delay.",
      },
      {
        q: "What about data migration?",
        a: "Masters and opening balances should be in phase one. Full transaction history is rarely worth the cost.",
      },
    ],
  },
  {
    slug: "crm-guide",
    title: "CRM Adoption Guide for Indian Sales Teams",
    category: "Guide",
    practice: "IT",
    icon: "Users",
    summary:
      "Why CRM rollouts fail at adoption rather than implementation, and the pipeline design that survives contact with a real sales floor.",
    readTime: "9 min",
    updated: "January 2026",
    sections: [
      {
        heading: "Adoption is a design problem",
        body: "Sales teams abandon CRMs that cost them time. If logging a lead takes longer than thirty seconds, it will not happen consistently. Design the entry path first and the reporting second.",
      },
      {
        heading: "WhatsApp is the pipeline",
        body: "In Indian B2B, most conversations happen on WhatsApp. A CRM that cannot see those threads is recording a fiction. Official Business API integration is the difference between a live pipeline and a monthly data-entry ritual.",
      },
      {
        heading: "Stages that mean something",
        body: "Five to seven stages, each with an objective exit criterion. 'Interested' is not a stage. 'Requirement documented' and 'Quotation issued' are, because a manager can verify them.",
        points: [
          "New enquiry — captured with source",
          "Contacted — first conversation logged",
          "Requirement documented — needs confirmed in writing",
          "Quotation issued — priced and sent",
          "Negotiation — commercial discussion active",
          "Won or Lost — with a recorded reason",
        ],
      },
      {
        heading: "The thirty-day review",
        body: "Measure adoption, not activity. Percentage of enquiries logged within an hour, percentage of deals with a next action set, and stage-ageing outliers. Fix the friction those numbers expose.",
      },
    ],
    downloads: [
      { name: "Pipeline stage definition template", format: "XLSX", size: "44 KB" },
      { name: "CRM adoption scorecard", format: "PDF", size: "112 KB" },
    ],
    faqs: [
      {
        q: "Should we buy or build a CRM?",
        a: "Buy if your sales process is conventional. Build when quotation logic or product configuration is your differentiator.",
      },
      {
        q: "How do we get reps to use it?",
        a: "Reduce entry to under thirty seconds, remove the parallel spreadsheet entirely, and review adoption weekly for a month.",
      },
      {
        q: "Can it send WhatsApp automatically?",
        a: "Yes, through the official Business API with pre-approved templates.",
      },
    ],
  },
  {
    slug: "ai-guide",
    title: "AI Adoption Guide for Mid-Sized Businesses",
    category: "Guide",
    practice: "IT",
    icon: "Bot",
    summary:
      "Where AI genuinely pays back today, how to run a pilot with a measurable baseline, and the governance to put around it.",
    readTime: "10 min",
    updated: "February 2026",
    sections: [
      {
        heading: "Start where the hours are",
        body: "AI pays back fastest on high-volume, rules-heavy, low-judgement work: document extraction, first-line support, lead qualification, reconciliation. Strategic use cases sound better in a board meeting and deliver later.",
      },
      {
        heading: "Measure the baseline first",
        body: "Record how long the task takes today, its error rate and its cost. Without that number, no honest ROI claim is possible afterwards — and the pilot becomes a matter of opinion.",
      },
      {
        heading: "Keep a human in the loop",
        body: "Set a confidence threshold. Above it the system acts, below it a person reviews. Track the review queue: if it shrinks over time the system is learning your edge cases correctly.",
      },
      {
        heading: "Data governance",
        body: "Use enterprise endpoints with training disabled. Know which data leaves your network. For sensitive workloads, deploy inside your own cloud tenancy. Write the policy before the pilot, not after an incident.",
        points: [
          "Training disabled on all vendor endpoints",
          "PII redaction before any external call",
          "Audit log of every automated decision",
          "Documented escalation path for failures",
        ],
      },
    ],
    downloads: [
      { name: "AI use-case prioritisation matrix", format: "XLSX", size: "52 KB" },
      { name: "AI governance policy template", format: "DOCX", size: "96 KB" },
    ],
    faqs: [
      {
        q: "Is our data used to train models?",
        a: "Not on enterprise endpoints with training disabled, which is what we deploy by default.",
      },
      {
        q: "What does a pilot cost?",
        a: "Typically ₹1.5–4 lakh for a single workflow including the audit, build and measurement.",
      },
      {
        q: "How do we know it worked?",
        a: "Compare against the pre-pilot baseline on hours, error rate and cost per transaction. Nothing else counts.",
      },
    ],
  },
  {
    slug: "engineering-guide",
    title: "Engineering Documentation Standards Guide",
    category: "Guide",
    practice: "Engineering",
    icon: "Cog",
    summary:
      "Drawing standards, GD&T discipline, revision control and the handover pack that keeps knowledge in the company when people leave.",
    readTime: "9 min",
    updated: "December 2025",
    sections: [
      {
        heading: "Drawings are manufacturing instructions",
        body: "A drawing exists so a specific process can produce a specific part and a specific inspection can accept it. Dimension schemes should follow how the part will be made and measured, not how it was modelled.",
      },
      {
        heading: "Tolerance against real capability",
        body: "Tolerances tighter than your process capability guarantee rejections and rework. Measure capability, then specify. Blanket ±0.1 across a drawing is a decision not to think.",
      },
      {
        heading: "Revision control that survives audits",
        body: "Every issued drawing needs a revision letter, a change description, a date and an approver. Superseded revisions must be withdrawn from the floor, because the most expensive drawing in any factory is the obsolete one still pinned near a machine.",
        points: [
          "Revision letter and date on every sheet",
          "Change description recorded in the revision block",
          "Named approver for each release",
          "Controlled withdrawal of superseded prints",
        ],
      },
      {
        heading: "The handover pack",
        body: "A complete pack contains native CAD, neutral STEP files, production drawings, bill of materials, an inspection plan and assembly notes. If any element is missing, the knowledge is still in someone's head — and that person eventually retires.",
      },
    ],
    downloads: [
      { name: "Drawing standard template", format: "PDF", size: "260 KB" },
      { name: "GD&T quick reference", format: "PDF", size: "180 KB" },
      { name: "First article inspection template", format: "XLSX", size: "64 KB" },
    ],
    faqs: [
      {
        q: "Which GD&T standard should we follow?",
        a: "ISO 1101 is standard in India and Europe; ASME Y14.5 where you supply US customers. Pick one and apply it consistently.",
      },
      {
        q: "Do we need native files from a vendor?",
        a: "Always. Without editable source you pay for a full remodel at the first revision.",
      },
      {
        q: "How long should drawings be retained?",
        a: "For the product lifetime plus any statutory liability period, typically a minimum of ten years.",
      },
    ],
  },
  {
    slug: "business-templates",
    title: "Business Document Templates",
    category: "Template",
    practice: "Business",
    icon: "FileText",
    summary:
      "Ready-to-use agreements, checklists and models our consultants issue on live mandates — free to download and adapt.",
    readTime: "3 min",
    updated: "February 2026",
    sections: [
      {
        heading: "What is included",
        body: "These are working documents, not marketing artefacts. Each has been used on a real engagement and stripped of client detail. Review with your own advisor before relying on any of them commercially.",
        points: [
          "Non-disclosure agreement, mutual and one-way",
          "Service agreement with milestone payment schedule",
          "Vendor evaluation scorecard",
          "Monthly compliance calendar",
          "Cash flow projection model",
          "Project scope and change request form",
        ],
      },
      {
        heading: "How to use them",
        body: "Adapt the commercial terms and governing jurisdiction, then have a professional review anything you intend to sign. Templates reduce drafting time; they do not replace advice on the deal in front of you.",
      },
    ],
    downloads: [
      { name: "Mutual NDA", format: "DOCX", size: "42 KB" },
      { name: "Service agreement", format: "DOCX", size: "68 KB" },
      { name: "Cash flow projection model", format: "XLSX", size: "94 KB" },
      { name: "Compliance calendar", format: "XLSX", size: "58 KB" },
    ],
    faqs: [
      { q: "Are these free?", a: "Yes, entirely. No registration or email required." },
      {
        q: "Can we use them commercially?",
        a: "Yes, with your own professional review of the specific transaction.",
      },
      { q: "Are they India-specific?", a: "Yes, drafted for Indian law and business practice." },
    ],
  },
];

export function getResource(slug: string) {
  return RESOURCE_LIBRARY.find((r) => r.slug === slug);
}
