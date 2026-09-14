import type { ServiceKey } from "./site";

/** Industry landing pages at /industries/$slug */

export type IndustryPage = {
  slug: string;
  name: string;
  icon: string;
  headline: string;
  intro: string;
  painPoints: string[];
  solutions: { title: string; body: string }[];
  services: { name: string; parent: ServiceKey; sub?: string }[];
  caseSlug?: string;
  stat: { k: string; v: string };
};

export const INDUSTRY_PAGES: IndustryPage[] = [
  {
    slug: "healthcare",
    name: "Healthcare",
    icon: "HeartPulse",
    headline: "Clinics and diagnostics running on equipment finance and clean records.",
    intro:
      "Healthcare businesses carry heavy equipment capex, strict licensing obligations and patient data that must be handled properly. We fund the machines, build the systems that manage patients, and keep the registrations current.",
    painPoints: [
      "Equipment finance approved slowly, delaying revenue-generating installations",
      "Patient records split between paper files and disconnected software",
      "Licence and NABH renewals discovered late, often during an inspection",
      "No visibility on doctor-wise or department-wise profitability",
    ],
    solutions: [
      {
        title: "Equipment and expansion finance",
        body: "Machinery loans and lease structures sized against realistic utilisation, not optimistic projections.",
      },
      {
        title: "Clinic and hospital management software",
        body: "Appointments, EMR, billing, pharmacy and insurance claims in one system with role-based access.",
      },
      {
        title: "Licensing and compliance calendar",
        body: "Clinical establishment registration, biomedical waste authorisation and renewals tracked on a monitored calendar.",
      },
      {
        title: "Patient acquisition",
        body: "Local SEO, Google Business Profile and WhatsApp reminders that reduce no-shows.",
      },
    ],
    services: [
      { name: "Project Finance", parent: "financial", sub: "project-finance" },
      { name: "ERP Development", parent: "it", sub: "erp-development" },
      { name: "GST Filing", parent: "legal", sub: "gst-filing" },
      { name: "AI Chatbots", parent: "it", sub: "ai-chatbots" },
    ],
    stat: { k: "22%", v: "Average no-show reduction after reminder automation" },
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    icon: "Factory",
    headline: "Plant systems, tooling and working capital under one contract.",
    intro:
      "Manufacturers are our largest client group. We work across the whole picture — the machine on the floor, the ERP that schedules it, the compliance around it and the credit facility that funds the inventory.",
    painPoints: [
      "Stock figures that differ between stores, production and finance",
      "Working capital limits sized on a formula rather than the real operating cycle",
      "Undocumented legacy tooling with knowledge held by retiring staff",
      "OEE discussed in meetings but never actually measured",
    ],
    solutions: [
      {
        title: "Manufacturing ERP",
        body: "Production scheduling, BOM control, stores and quality on one ledger with live plant dashboards.",
      },
      {
        title: "Working capital restructuring",
        body: "Limits recomputed against measured debtor, inventory and creditor days.",
      },
      {
        title: "Machine and fixture design",
        body: "Special-purpose machines, fixtures and layout work that lift throughput on existing lines.",
      },
      {
        title: "Automation and OEE",
        body: "PLC, SCADA and shop-floor data flowing into the business system automatically.",
      },
    ],
    services: [
      { name: "Working Capital", parent: "financial", sub: "working-capital" },
      { name: "ERP Development", parent: "it", sub: "erp-development" },
      { name: "Machine Design", parent: "engineering", sub: "machine-design" },
      { name: "ISO Certification", parent: "legal", sub: "iso-certification" },
    ],
    caseSlug: "meridian-polymers",
    stat: { k: "26 days", v: "Typical cash-cycle reduction across ERP mandates" },
  },
  {
    slug: "construction",
    name: "Construction",
    icon: "HardHat",
    headline: "Project finance and site compliance that keep the build moving.",
    intro:
      "Construction businesses lose money to funding gaps and paperwork, not to bricks. We arrange staged project finance, hold the compliance calendar and build the systems that track site progress against billing.",
    painPoints: [
      "Drawdowns delayed while lenders wait on documentation",
      "Labour, safety and environmental compliance managed reactively",
      "Site progress reported informally, disconnected from billing milestones",
      "Subcontractor bills and material costs reconciled weeks late",
    ],
    solutions: [
      {
        title: "Staged project finance",
        body: "Facilities structured against construction milestones with drawdown documentation prepared in advance.",
      },
      {
        title: "Site and billing software",
        body: "Progress, material issue and running-account bills tracked in one place.",
      },
      {
        title: "Statutory compliance desk",
        body: "Labour licences, EPF, ESIC, safety and environmental filings on a monitored calendar.",
      },
      {
        title: "Structural and layout support",
        body: "Engineering documentation and drawing management for approvals and as-builts.",
      },
    ],
    services: [
      { name: "Project Finance", parent: "financial", sub: "project-finance" },
      { name: "Loan Against Property", parent: "financial", sub: "loan-against-property" },
      { name: "AutoCAD Drafting", parent: "engineering", sub: "autocad-drafting" },
      { name: "ROC Filing", parent: "legal", sub: "roc-filing" },
    ],
    stat: { k: "38 days", v: "Fastest project finance sanction delivered" },
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    icon: "Building2",
    headline: "RERA discipline, buyer CRM and funding for developers.",
    intro:
      "Developers juggle regulatory filings, buyer expectations and lumpy cash flows. We handle RERA and ROC obligations, fund the project, and give the sales team a CRM built for site visits and booking follow-ups.",
    painPoints: [
      "RERA quarterly updates and escrow reporting handled at the last minute",
      "Buyer enquiries lost between site staff, brokers and phone numbers",
      "Land due diligence completed after commercial terms are already agreed",
      "Collection follow-ups tracked in spreadsheets across multiple projects",
    ],
    solutions: [
      {
        title: "RERA and ROC compliance",
        body: "Registration, quarterly updates, escrow discipline and annual filings owned by a named manager.",
      },
      {
        title: "Buyer CRM",
        body: "Enquiry capture from portals and walk-ins through to booking, agreement and collection tracking.",
      },
      {
        title: "Project and land funding",
        body: "Construction finance, LRD and loan against property structured for phased requirements.",
      },
      {
        title: "Sales enablement",
        body: "Project microsites, virtual walkthroughs and WhatsApp nurture for site-visit conversion.",
      },
    ],
    services: [
      { name: "Project Finance", parent: "financial", sub: "project-finance" },
      { name: "CRM Development", parent: "it", sub: "crm-development" },
      { name: "Company Registration", parent: "legal", sub: "company-registration" },
      { name: "Website Development", parent: "it", sub: "website-development" },
    ],
    stat: { k: "0", v: "RERA filing defaults across managed portfolios" },
  },
  {
    slug: "retail",
    name: "Retail",
    icon: "ShoppingBag",
    headline: "Omnichannel selling with GST that keeps up.",
    intro:
      "Retailers operate on thin margins and high transaction volume, which makes billing accuracy and input credit recovery worth real money. We build the systems and hold the filing calendar.",
    painPoints: [
      "Store, marketplace and website stock counted separately",
      "Input tax credit lost to unreconciled purchase invoices",
      "Inventory funding tied up in slow-moving stock",
      "No customer data captured at the counter, so repeat marketing is impossible",
    ],
    solutions: [
      {
        title: "Omnichannel POS and inventory",
        body: "One stock pool across store, marketplace and online with GST-compliant billing.",
      },
      {
        title: "GST reconciliation",
        body: "Monthly 2B matching that recovers credit most retailers quietly write off.",
      },
      {
        title: "Inventory and expansion finance",
        body: "Working capital and business loans sized to seasonal buying cycles.",
      },
      {
        title: "Customer retention",
        body: "Loyalty capture, WhatsApp campaigns and review generation tied to the POS.",
      },
    ],
    services: [
      { name: "GST Filing", parent: "legal", sub: "gst-filing" },
      { name: "Working Capital", parent: "financial", sub: "working-capital" },
      { name: "Digital Marketing", parent: "it", sub: "digital-marketing" },
      { name: "Mobile Apps", parent: "it", sub: "mobile-apps" },
    ],
    stat: { k: "₹3.8 L", v: "Input credit recovered for one retail client in year one" },
  },
  {
    slug: "education",
    name: "Education",
    icon: "GraduationCap",
    headline: "Admissions, fees and trust compliance in one place.",
    intro:
      "Schools, colleges and coaching institutes run on admission cycles and fee collection. We build the systems that manage both, fund infrastructure expansion and keep trust or society compliance current.",
    painPoints: [
      "Admission enquiries handled on personal phones with no follow-up record",
      "Fee collection and reconciliation consuming the accounts team each month",
      "Infrastructure expansion stalled for want of appropriate funding",
      "Trust and society filings handled by a part-time consultant",
    ],
    solutions: [
      {
        title: "Admission CRM",
        body: "Enquiry to enrolment tracked with automated follow-up across WhatsApp and calls.",
      },
      {
        title: "Fee and ERP platform",
        body: "Online payment, receipting, dues tracking and parent communication built in.",
      },
      {
        title: "Infrastructure finance",
        body: "Term loans and lease structures for buildings, labs and transport fleets.",
      },
      {
        title: "Trust compliance",
        body: "12A, 80G, annual filings and audit coordination on a fixed calendar.",
      },
    ],
    services: [
      { name: "CRM Development", parent: "it", sub: "crm-development" },
      { name: "Project Finance", parent: "financial", sub: "project-finance" },
      { name: "Income Tax Return", parent: "legal", sub: "income-tax-return" },
      { name: "Website Development", parent: "it", sub: "website-development" },
    ],
    stat: { k: "31%", v: "Average lift in enquiry-to-admission conversion" },
  },
  {
    slug: "hospital",
    name: "Hospital",
    icon: "Stethoscope",
    headline: "Multi-department operations without the paperwork drag.",
    intro:
      "Hospitals carry the operational complexity of a factory and the compliance load of a regulated institution. We handle equipment funding, the HMS platform, insurance claim workflows and the licensing calendar.",
    painPoints: [
      "Insurance claims rejected or delayed for documentation reasons",
      "Pharmacy, OT and IPD billing recorded in separate systems",
      "Biomedical waste and fire safety renewals surfacing during inspections",
      "Equipment purchase decisions made without a funding plan in place",
    ],
    solutions: [
      {
        title: "Hospital management system",
        body: "OPD, IPD, OT, pharmacy, lab and billing on one platform with role-based access.",
      },
      {
        title: "Claims workflow",
        body: "TPA and insurance documentation standardised to reduce rejection and delay.",
      },
      {
        title: "Equipment and expansion finance",
        body: "Medical equipment loans and structured facilities for new departments.",
      },
      {
        title: "Licence and accreditation support",
        body: "Registrations, renewals and NABH documentation maintained continuously.",
      },
    ],
    services: [
      { name: "Project Finance", parent: "financial", sub: "project-finance" },
      { name: "ERP Development", parent: "it", sub: "erp-development" },
      { name: "ISO Certification", parent: "legal", sub: "iso-certification" },
      { name: "AI Voice Agents", parent: "it", sub: "ai-voice-agents" },
    ],
    stat: { k: "-40%", v: "Claim rejection after documentation standardisation" },
  },
  {
    slug: "finance",
    name: "Finance",
    icon: "Landmark",
    headline: "NBFC and broking platforms built for audit day.",
    intro:
      "Financial services businesses are judged on their systems and their records. We build lending and advisory platforms with the audit trail regulators expect, and keep statutory compliance ahead of schedule.",
    painPoints: [
      "Loan origination and collections tracked across spreadsheets and WhatsApp",
      "Audit preparation consuming weeks of the finance team's year",
      "KYC documentation stored inconsistently across branches",
      "Customer communication manual and impossible to evidence",
    ],
    solutions: [
      {
        title: "Lending platform",
        body: "Origination, KYC, sanction, disbursement and collections with a complete audit trail.",
      },
      {
        title: "Compliance automation",
        body: "Statutory filings, board minutes and regulatory returns on a monitored calendar.",
      },
      {
        title: "Collections automation",
        body: "Reminders, payment links and escalation paths through WhatsApp and voice.",
      },
      {
        title: "Data security",
        body: "Access control, encryption and ISO 27001 readiness for the systems holding customer data.",
      },
    ],
    services: [
      { name: "ERP Development", parent: "it", sub: "erp-development" },
      { name: "ROC Filing", parent: "legal", sub: "roc-filing" },
      { name: "Cloud", parent: "it", sub: "cloud" },
      { name: "ISO Certification", parent: "legal", sub: "iso-certification" },
    ],
    stat: { k: "1 day", v: "Audit preparation, from three weeks" },
  },
  {
    slug: "automobile",
    name: "Automobile",
    icon: "Car",
    headline: "Dealer networks and component design under one roof.",
    intro:
      "From dealerships managing service pipelines to component manufacturers designing tooling, the automobile sector needs both software and engineering. We are unusual in providing both.",
    painPoints: [
      "Service reminders and follow-ups depending on individual advisors",
      "Quotation turnaround measured in days because tooling data is undocumented",
      "Spare parts inventory funded without regard to turnover",
      "Dealer and distributor ordering handled over phone and WhatsApp",
    ],
    solutions: [
      {
        title: "Dealer and service CRM",
        body: "Enquiry, booking, service reminders and insurance renewals automated end to end.",
      },
      {
        title: "Component and tooling design",
        body: "CAD, reverse engineering and fixture design with production-grade documentation.",
      },
      {
        title: "Dealer ordering portal",
        body: "Distributor apps for ordering, credit limits and dispatch visibility.",
      },
      {
        title: "Inventory finance",
        body: "Working capital sized against spare-parts turnover rather than a flat multiple.",
      },
    ],
    services: [
      { name: "CRM Development", parent: "it", sub: "crm-development" },
      { name: "Reverse Engineering", parent: "engineering", sub: "reverse-engineering" },
      { name: "Product Design", parent: "engineering", sub: "product-design" },
      { name: "Business Loan", parent: "financial", sub: "business-loan" },
    ],
    caseSlug: "arva-industries",
    stat: { k: "4 hours", v: "Quotation turnaround achieved at Vertex Auto" },
  },
  {
    slug: "hospitality",
    name: "Hospitality",
    icon: "UtensilsCrossed",
    headline: "Bookings, billing and guest communication automated.",
    intro:
      "Hotels and restaurants live on occupancy, table turns and reviews. We build the booking and billing systems, automate guest communication and fund property upgrades.",
    painPoints: [
      "Direct bookings lost to aggregators charging heavy commission",
      "Table and room availability managed manually across channels",
      "Guest feedback collected inconsistently, reviews left to chance",
      "Renovation and expansion funded through expensive short-term credit",
    ],
    solutions: [
      {
        title: "Direct booking engine",
        body: "Commission-free booking on your own site with channel-manager synchronisation.",
      },
      {
        title: "POS and property management",
        body: "Rooms, restaurant, banquets and inventory billed and reported together.",
      },
      {
        title: "Guest automation",
        body: "WhatsApp confirmations, pre-arrival messages and post-stay review requests.",
      },
      {
        title: "Renovation finance",
        body: "Property-backed term loans priced far below the short-term credit most operators use.",
      },
    ],
    services: [
      { name: "Website Development", parent: "it", sub: "website-development" },
      { name: "AI Chatbots", parent: "it", sub: "ai-chatbots" },
      { name: "Loan Against Property", parent: "financial", sub: "loan-against-property" },
      { name: "Digital Marketing", parent: "it", sub: "digital-marketing" },
    ],
    stat: { k: "+27%", v: "Direct bookings after launching an owned booking engine" },
  },
];

export function getIndustry(slug: string) {
  return INDUSTRY_PAGES.find((i) => i.slug === slug);
}
