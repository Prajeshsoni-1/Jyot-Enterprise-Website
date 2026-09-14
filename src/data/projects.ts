/** Portfolio projects with full detail pages at /portfolio/$slug */

export type PortfolioSectionType =
  | "rich_text"
  | "heading_text"
  | "image_text"
  | "full_image"
  | "gallery"
  | "video"
  | "quote"
  | "stats"
  | "features"
  | "challenges"
  | "solutions"
  | "results"
  | "technologies"
  | "timeline"
  | "cta"
  | "custom";

export type PortfolioSection = {
  id: string;
  type: PortfolioSectionType;
  enabled: boolean;
  title: string;
  subtitle?: string;
  content?: string;
  images?: { url: string; caption?: string; alt?: string }[];
  buttonText?: string;
  buttonUrl?: string;
  order: number;
  items?: { title: string; description?: string; icon?: string; badge?: string }[];
  data?: Record<string, unknown>;
};

export type Project = {
  slug: string;
  client: string;
  industry: string;
  practice: string;
  title: string;
  summary: string;
  challenge: string;
  solution: string;
  outcome: string;
  metrics: { k: string; v: string; label?: string }[];
  tech: string[];
  gallery: { caption: string; hue: number; url?: string | undefined; alt?: string | undefined }[];
  duration: string;
  year: string;
  hue: number;
  quote?: string;
  quoteBy?: string;
  // Extended fields for 100% editable CMS
  body?: string;
  subCategory?: string;
  clientLocation?: string;
  projectUrl?: string;
  projectStatus?: "completed" | "in_progress" | "maintenance" | "archived";
  featured?: boolean;
  published?: boolean;
  featuredImage?: string;
  heroImage?: string;
  thumbnailImage?: string;
  beforeImage?: { url: string; label?: string };
  afterImage?: { url: string; label?: string };
  clientLogo?: string;
  screenshots?: { url: string; caption?: string; alt?: string }[];
  additionalMedia?: { url: string; title: string; type: string }[];
  challengeDetails?: {
    title?: string;
    description?: string;
    points?: string[];
  };
  solutionDetails?: {
    title?: string;
    description?: string;
    points?: string[];
  };
  resultDetails?: {
    title?: string;
    description?: string;
    metrics?: { k: string; v: string; label?: string }[];
  };
  technologiesDetailed?: {
    name: string;
    icon?: string;
  }[];
  clientQuote?: {
    quote: string;
    name: string;
    designation: string;
    company: string;
    photoUrl?: string;
    source?: string;
  };
  cta?: {
    enabled: boolean;
    heading: string;
    description: string;
    primaryButtonText: string;
    primaryButtonUrl: string;
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;
  };
  sections?: PortfolioSection[];
  controls?: {
    showProject?: boolean;
    showRelated?: boolean;
    showTechnologies?: boolean;
    showClientQuote?: boolean;
    showCta?: boolean;
    showGallery?: boolean;
  };
  relatedProjectSlugs?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noindex?: boolean;
  nofollow?: boolean;
};

export const PROJECTS: Project[] = [
  {
    slug: "meridian-polymers-erp",
    client: "Meridian Polymers",
    industry: "Polymer Manufacturing",
    practice: "IT · Financial",
    title: "ERP rollout and ₹18 Cr working capital restructure",
    summary:
      "Three plants, eleven spreadsheets and a 47-day order-to-cash cycle replaced with one system and one credit facility.",
    challenge:
      "Production, dispatch and finance each maintained their own records. Nobody could state stock or margin with confidence, and a 47-day order-to-cash cycle was consuming every rupee of available working capital.",
    solution:
      "A phased custom ERP covering production, inventory, dispatch and finance across all three plants, integrated with Tally and the GST portal — delivered alongside a restructured ₹18 Cr working capital facility sized to the real operating cycle.",
    outcome:
      "Order-to-cash fell to 21 days within two quarters. Live plant dashboards replaced weekly reconciliation meetings, and the restructured facility released roughly ₹2.4 Cr of trapped cash.",
    metrics: [
      { k: "21 days", v: "Order-to-cash, from 47" },
      { k: "₹2.4 Cr", v: "Working capital released" },
      { k: "4.2x", v: "First-year return" },
      { k: "3 plants", v: "On one live ledger" },
    ],
    tech: ["React", "PostgreSQL", "Power BI", "Tally Sync", "GST API"],
    gallery: [
      { caption: "Production dashboard", hue: 24 },
      { caption: "Inventory & BOM module", hue: 40 },
      { caption: "Finance and ageing view", hue: 12 },
    ],
    duration: "18 weeks",
    year: "2024",
    quote: "One team, one point of contact, zero excuses.",
    quoteBy: "Rakesh Mehta · Director",
    hue: 24,
  },
  {
    slug: "northline-compliance-desk",
    client: "Northline Logistics",
    industry: "Logistics",
    practice: "Legal",
    title: "Multi-state GST and ROC compliance desk",
    summary:
      "Nine state registrations, recurring penalties and no single owner — consolidated into one monitored compliance desk.",
    challenge:
      "Filings across nine states were split between three consultants and an internal accountant. Late fees had become a budgeted line item and input credit was leaking every quarter.",
    solution:
      "A single compliance desk with a monitored filing calendar, automated GSTR-2B reconciliation, a document vault and a named manager owning every due date including ROC and TDS.",
    outcome:
      "Zero late filings across three financial years, ₹11 lakh of previously unclaimed input credit recovered, and audit preparation reduced from weeks to a single day.",
    metrics: [
      { k: "0", v: "Late filings in 3 years" },
      { k: "₹11 L", v: "Input credit recovered" },
      { k: "9 states", v: "Single desk coverage" },
      { k: "1 day", v: "Audit preparation" },
    ],
    tech: ["GST API", "Automation", "Document Vault", "Compliance Calendar"],
    gallery: [
      { caption: "Compliance calendar", hue: 150 },
      { caption: "Reconciliation engine", hue: 165 },
      { caption: "Notice tracker", hue: 140 },
    ],
    duration: "Ongoing retainer since 2022",
    year: "2022",
    quote: "We stopped budgeting for penalties.",
    quoteBy: "Mansi Gandhi · Accounts Head",
    hue: 150,
  },
  {
    slug: "arva-fixture-redesign",
    client: "Arva Industries",
    industry: "Precision Engineering",
    practice: "Engineering",
    title: "Assembly fixture redesign and plant layout",
    summary:
      "A legacy fixture causing tolerance drift was redesigned from the ground up, lifting line throughput by 22%.",
    challenge:
      "An undocumented assembly fixture was producing inconsistent tolerances and capping line throughput. The original designer had retired and no drawings existed.",
    solution:
      "The existing fixture was reverse engineered, then redesigned in SolidWorks with FEA validation, a revised clamping scheme and correct GD&T. Plant layout around the cell was reworked to remove two material-handling steps.",
    outcome:
      "Cycle time dropped 22% and rejection at final inspection fell by two-thirds. The full drawing set, GD&T scheme and inspection plan are now documented and revision controlled.",
    metrics: [
      { k: "22%", v: "Cycle-time reduction" },
      { k: "-67%", v: "Final inspection rejects" },
      { k: "2.9x", v: "First-year return" },
      { k: "100%", v: "Documented and controlled" },
    ],
    tech: ["SolidWorks", "FEA", "AutoCAD", "GD&T", "3D Scanning"],
    gallery: [
      { caption: "Fixture assembly model", hue: 210 },
      { caption: "FEA stress plot", hue: 225 },
      { caption: "Revised cell layout", hue: 200 },
    ],
    duration: "11 weeks",
    year: "2024",
    quote: "The documentation alone was worth the engagement.",
    quoteBy: "Pranav Desai · Plant Head",
    hue: 210,
  },
  {
    slug: "shah-interio-voice-agent",
    client: "Shah Interio",
    industry: "Interior Design",
    practice: "IT · AI",
    title: "AI voice agent and WhatsApp qualification flow",
    summary:
      "A multilingual voice agent now handles 70% of inbound enquiries, so sales only speaks to qualified buyers.",
    challenge:
      "The sales team spent roughly 60% of each day on unqualified inbound calls and WhatsApp threads. High-intent enquiries were being missed inside the noise, especially after hours.",
    solution:
      "An AI voice agent answering in English, Hindi and Gujarati, paired with a WhatsApp qualification flow. Both score budget, timeline and project type, then write the enriched lead straight into the CRM with a full transcript.",
    outcome:
      "70% of enquiries are now resolved or qualified without a human. Sales conversations per closed deal fell by half, and after-hours enquiries — previously lost entirely — became a measurable pipeline source.",
    metrics: [
      { k: "70%", v: "Enquiries handled autonomously" },
      { k: "-50%", v: "Conversations per closed deal" },
      { k: "24/7", v: "Coverage including holidays" },
      { k: "3.6x", v: "Return in eight months" },
    ],
    tech: ["OpenAI", "Twilio", "WhatsApp API", "Node", "CRM Integration"],
    gallery: [
      { caption: "Conversation designer", hue: 280 },
      { caption: "Qualification scoring", hue: 295 },
      { caption: "CRM handoff view", hue: 265 },
    ],
    duration: "6 weeks",
    year: "2025",
    quote: "Our sales team only speaks to people who are ready to buy.",
    quoteBy: "Anita Shah · Founder",
    hue: 280,
  },
  {
    slug: "kalp-textiles-project-finance",
    client: "Kalp Textiles",
    industry: "Textiles",
    practice: "Financial",
    title: "Project finance for a second production line",
    summary:
      "₹9.4 Cr sanctioned in 38 days after four lenders had stalled the expansion for seven months.",
    challenge:
      "An expansion had been stalled for seven months while four lenders each requested a different document set. No single financial model existed that could survive an appraisal committee.",
    solution:
      "One detailed project report with a lender-grade financial model, sensitivity analysis and subsidy mapping, presented simultaneously to a shortlist of three lenders whose credit policy actually fit the sector and ticket size.",
    outcome:
      "₹9.4 Cr sanctioned in 38 days at 1.1% below the best previously indicated rate, with a state capital subsidy claim filed alongside that funded a further ₹64 lakh.",
    metrics: [
      { k: "₹9.4 Cr", v: "Sanctioned" },
      { k: "38 days", v: "Mandate to sanction" },
      { k: "-1.1%", v: "Below best prior offer" },
      { k: "₹64 L", v: "Subsidy claimed" },
    ],
    tech: ["Financial Modelling", "DPR", "Lender Network", "DSCR Analysis"],
    gallery: [
      { caption: "Financial model", hue: 45 },
      { caption: "Sensitivity analysis", hue: 55 },
      { caption: "Drawdown schedule", hue: 35 },
    ],
    duration: "38 days",
    year: "2025",
    quote: "Seven months of nothing, then five weeks to sanction.",
    quoteBy: "Bhavesh Kotak · Managing Partner",
    hue: 45,
  },
  {
    slug: "vertex-auto-tooling-crm",
    client: "Vertex Auto",
    industry: "Automotive Components",
    practice: "IT · Engineering",
    title: "CRM plus reverse-engineered tooling library",
    summary:
      "Tooling knowledge locked in retired engineers' heads became a digital library feeding a quotation-first CRM.",
    challenge:
      "Quotations took three to four days because tooling specifications lived in the memory of two engineers approaching retirement, with no drawings for most legacy fixtures.",
    solution:
      "Sixty legacy tools were reverse engineered into parametric CAD with costing parameters attached, then connected to a quotation-first CRM that prices a new enquiry from the nearest matching tool.",
    outcome:
      "Quotation turnaround dropped to four hours, win rate improved as responses arrived before competitors', and thirty years of undocumented tooling knowledge is now an asset the company owns.",
    metrics: [
      { k: "4 hours", v: "Quotation turnaround, from 4 days" },
      { k: "60", v: "Tools digitised" },
      { k: "+18%", v: "Quotation win rate" },
      { k: "0", v: "Knowledge lost to retirement" },
    ],
    tech: ["CRM", "Reverse Engineering", "CAD Library", "Costing Engine"],
    gallery: [
      { caption: "Tooling library", hue: 190 },
      { caption: "Quotation builder", hue: 205 },
      { caption: "Costing parameters", hue: 180 },
    ],
    duration: "14 weeks",
    year: "2024",
    quote: "Thirty years of knowledge is finally written down.",
    quoteBy: "Jignesh Amin · Works Manager",
    hue: 190,
  },
];

export function getProject(slug: string) {
  return PROJECTS.find((p) => p.slug === slug);
}
