import type { LucideIcon } from "lucide-react";
import { Banknote, Cpu, Scale, Cog } from "lucide-react";

export type ServiceKey = "financial" | "it" | "legal" | "engineering";

export type Service = {
  slug: ServiceKey;
  name: string;
  short: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  items: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "financial",
    name: "Jyot Financial Services",
    short: "Financial",
    tagline: "Capital, structured correctly.",
    description:
      "Funding advisory and risk cover engineered around your balance sheet — from retail credit to structured project finance.",
    icon: Banknote,
    items: [
      "Home Loan",
      "Business Loan",
      "Mortgage Loan",
      "Personal Loan",
      "Vehicle Loan",
      "Education Loan",
      "MSME Loan",
      "Project Finance",
      "Working Capital",
      "Loan Against Property",
      "Insurance",
      "Investment Advisory",
    ],
  },
  {
    slug: "it",
    name: "Jyot IT Services",
    short: "IT",
    tagline: "Software that compounds.",
    description:
      "Product engineering, enterprise platforms and applied AI delivered by a team that ships to production, not to slide decks.",
    icon: Cpu,
    items: [
      "Website Development",
      "Software Development",
      "ERP",
      "CRM",
      "AI Automation",
      "AI Chatbots",
      "AI Voice Agents",
      "Cloud",
      "Hosting",
      "SEO",
      "Digital Marketing",
      "Branding",
      "Mobile Apps",
      "UI UX",
      "WhatsApp Automation",
      "API Integration",
      "Cyber Security",
    ],
  },
  {
    slug: "legal",
    name: "Jyot Legal Services",
    short: "Legal",
    tagline: "Compliance without friction.",
    description:
      "Incorporation, taxation and intellectual property handled end to end, with filing calendars that never slip.",
    icon: Scale,
    items: [
      "GST Registration",
      "GST Filing",
      "Income Tax Return",
      "Trademark",
      "Copyright",
      "Company Registration",
      "LLP",
      "Private Limited",
      "Partnership",
      "ISO Certification",
      "ROC Filing",
      "Agreements",
      "Legal Notices",
      "Compliance",
      "Professional Tax",
      "MSME",
      "Digital Signature",
    ],
  },
  {
    slug: "engineering",
    name: "Jyot Engineering Services",
    short: "Engineering",
    tagline: "Designed for the shop floor.",
    description:
      "Mechanical design, automation and manufacturing consultancy that moves concepts into validated, buildable hardware.",
    icon: Cog,
    items: [
      "Mechanical Design",
      "CAD",
      "SolidWorks",
      "AutoCAD",
      "Machine Design",
      "Product Design",
      "Industrial Automation",
      "Plant Layout",
      "Prototype Development",
      "Manufacturing Consultancy",
      "Engineering Documentation",
      "Reverse Engineering",
    ],
  },
];

export const NAV = [
  { label: "Home", to: "/" },
  { label: "Financial", to: "/services/financial" },
  { label: "IT", to: "/services/it" },
  { label: "Legal", to: "/services/legal" },
  { label: "Engineering", to: "/services/engineering" },
  { label: "Tools", to: "/tools" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Blogs", to: "/blogs" },
  { label: "Careers", to: "/careers" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

export const CONTACT = {
  phone: "+91 95374 30101",
  phoneHref: "tel:+919537430101",
  whatsapp: "https://wa.me/919537430101",
  phone2: "+91 77780 08999",
  phoneHref2: "tel:+917778008999",
  whatsapp2: "https://wa.me/917778008999",
  email: "jyotenterpriseofficial@gmail.com",
  address:
    "B2 Building, 6th Floor, Office B-616, The Landmark, Near Kudasan, Gandhinagar, Gujarat 382419, India",
  hours: "Mon – Sat · 09:30 – 19:00 IST",
};

export const OFFICES = [
  {
    city: "Gandhinagar",
    label: "Gandhinagar Office",
    address:
      "B2 Building, 6th Floor, Office B-616, The Landmark, Near Kudasan, Gandhinagar, Gujarat – 382419",
    maps: "https://maps.app.goo.gl/EQVGn84UQ1WEL81n8",
    embed:
      "https://www.google.com/maps?q=The+Landmark+Kudasan+Gandhinagar+Gujarat+382419&output=embed",
  },
  {
    city: "Palanpur",
    label: "Palanpur Office",
    address: "47, Sanskrit Complex, Abu Highway, Palanpur – 385001",
    maps: "https://maps.app.goo.gl/UyqfmrF2ohsvhKTn9",
    embed:
      "https://www.google.com/maps?q=Sanskrit+Complex+Abu+Highway+Palanpur+385001&output=embed",
  },
];

export const WHY_US = [
  {
    title: "One Stop Business Partner",
    body: "Finance, technology, legal and engineering under a single accountable contract.",
  },
  {
    title: "Expert Team",
    body: "Chartered advisors, senior engineers and product designers on every engagement.",
  },
  {
    title: "Transparent Process",
    body: "Fixed scope, published milestones and no invoice you did not approve first.",
  },
  {
    title: "Latest Technology",
    body: "Modern cloud, applied AI and automation as default infrastructure.",
  },
  {
    title: "Affordable Solutions",
    body: "Enterprise rigour priced for growing Indian businesses.",
  },
  {
    title: "Fast Turnaround",
    body: "Two week delivery cycles with weekly written progress reviews.",
  },
  {
    title: "Dedicated Support",
    body: "A named relationship manager reachable on phone and WhatsApp.",
  },
  {
    title: "Customer First",
    body: "Advice we would take ourselves, even when it shrinks the invoice.",
  },
];

export const PROCESS = [
  { step: "Consultation", body: "We map the commercial objective before touching a tool." },
  { step: "Planning", body: "Scope, dependencies, owners and a dated delivery calendar." },
  { step: "Strategy", body: "The route chosen on cost, risk and time to value." },
  { step: "Execution", body: "Cross-functional pods deliver in reviewable increments." },
  { step: "Quality Check", body: "Independent review across code, compliance and documentation." },
  { step: "Delivery", body: "Handover with training, credentials and full source ownership." },
  { step: "Support", body: "SLA-backed maintenance and continuous improvement." },
];

export const SOLUTIONS = [
  { name: "ERP", body: "Unified operations, inventory and finance for mid-market manufacturers." },
  { name: "CRM", body: "Pipeline, quotation and after-sales tracking with WhatsApp built in." },
  { name: "Business Websites", body: "Fast, accessible, search-optimised corporate presence." },
  { name: "AI Agents", body: "Voice and chat agents that qualify, answer and book — 24/7." },
  { name: "Automation", body: "Back-office workflows removed from spreadsheets entirely." },
  { name: "Loan Consultancy", body: "Lender matching, documentation and sanction management." },
  { name: "GST Solutions", body: "Registration, reconciliation and monthly filing on autopilot." },
  { name: "Legal Compliance", body: "ROC, tax and IP calendars monitored by a dedicated desk." },
];

export const STATS = [
  { value: 65, suffix: "+", label: "Projects Completed" },
  { value: 100, suffix: "+", label: "Happy Clients" },
  { value: 14, suffix: "", label: "Years of Experience" },
  { value: 99, suffix: "%", label: "Customer Satisfaction" },
];

export const TESTIMONIALS = [
  {
    quote:
      "They restructured our working capital and rebuilt our ERP in the same quarter. One team, one point of contact, zero excuses.",
    name: "Rakesh Mehta",
    role: "",
  },
  {
    quote:
      "The AI voice agent now handles 70% of our inbound enquiries. Our sales team only speaks to qualified buyers.",
    name: "Anita Shah",
    role: "",
  },
  {
    quote:
      "GST, ROC and trademark work that used to consume a full week each month is now entirely off my desk.",
    name: "Vivek Nair",
    role: "",
  },
  {
    quote:
      "Their engineering team redesigned our assembly fixture and cut cycle time by 22%. Documentation was immaculate.",
    name: "Pranav Desai",
    role: "",
  },
  {
    quote:
      "From term loan sanctioning to customized inventory software, Jyot handled everything seamlessly without vendor friction.",
    name: "Sanjay Patel",
    role: "",
  },
  {
    quote:
      "Secured our project finance and completed all corporate compliance in record time. Transparent, proactive, and exceptionally reliable.",
    name: "Meera Iyer",
    role: "",
  },
];

export const POSTS = [
  {
    category: "Loan Tips",
    title: "How to structure working capital before your growth quarter",
    read: "6 min",
  },
  {
    category: "Technology",
    title: "Choosing between an off-the-shelf ERP and a custom platform",
    read: "8 min",
  },
  {
    category: "AI",
    title: "What an AI voice agent actually costs to run in production",
    read: "5 min",
  },
  {
    category: "Legal",
    title: "The compliance calendar every private limited company misses",
    read: "7 min",
  },
  {
    category: "Engineering",
    title: "Reverse engineering legacy tooling without the guesswork",
    read: "9 min",
  },
  {
    category: "Business",
    title: "Building an operating rhythm that survives fast growth",
    read: "6 min",
  },
];

export const FAQS = [
  {
    q: "Can we engage Jyot for only one service line?",
    a: "Yes. Most clients start with a single mandate — a loan, a website, a GST filing cycle — and expand once the working relationship is proven.",
  },
  {
    q: "How quickly can a project start?",
    a: "Consultation within 24 hours, a written scope within three working days, and kickoff in the same week for most engagements.",
  },
  {
    q: "Who owns the code and documentation you produce?",
    a: "You do, entirely. Source code, design files, CAD and filings are handed over with full ownership at delivery.",
  },
  {
    q: "Do you work with clients outside Gujarat?",
    a: "We serve clients across India and support NRI promoters, with remote onboarding and digitally executed documentation.",
  },
];

/* ------------------------------------------------------------------ */
/* Upgrade content: partners, industries, products, AI, case studies   */
/* ------------------------------------------------------------------ */

export const PARTNERS = [
  { name: "Google", tint: "#4285F4" },
  { name: "Microsoft", tint: "#00A4EF" },
  { name: "Meta", tint: "#0866FF" },
  { name: "Hostinger", tint: "#673DE6" },
  { name: "AWS", tint: "#FF9900" },
  { name: "OpenAI", tint: "#10A37F" },
  { name: "Zoho", tint: "#E42527" },
  { name: "Odoo", tint: "#714B67" },
  { name: "Tally", tint: "#1B75BB" },
  { name: "Razorpay", tint: "#0C2451" },
  { name: "GST", tint: "#F04A23" },
  { name: "MSME", tint: "#0F7B3E" },
  { name: "Government", tint: "#B7860B" },
];

export const FRAGMENTED_CHAIN = [
  "Loan Consultant",
  "Software Company",
  "Legal Consultant",
  "Engineering Consultant",
];

export const FRAGMENTED_COST = ["Multiple vendors", "Higher cost", "Communication issues"];

export const INDUSTRIES = [
  { name: "Healthcare", icon: "HeartPulse", body: "Clinics, diagnostics and device makers." },
  { name: "Manufacturing", icon: "Factory", body: "Plant systems, tooling and finance." },
  { name: "Construction", icon: "HardHat", body: "Project finance and site compliance." },
  { name: "Real Estate", icon: "Building2", body: "RERA, CRM and buyer journeys." },
  { name: "Retail", icon: "ShoppingBag", body: "Omnichannel POS and GST at scale." },
  { name: "Education", icon: "GraduationCap", body: "Admissions, ERP and loan desks." },
  { name: "Finance", icon: "Landmark", body: "NBFC platforms and audit readiness." },
  { name: "Automobile", icon: "Car", body: "Dealer CRM and component design." },
  { name: "Hospitality", icon: "UtensilsCrossed", body: "Bookings, billing and automation." },
  { name: "Startups", icon: "Rocket", body: "Incorporation to first enterprise deal." },
];

export const PRODUCTS = [
  {
    name: "Jyot ERP",
    icon: "Boxes",
    body: "Inventory, production, finance and reporting in one ledger.",
    tags: ["Manufacturing", "Multi-plant"],
  },
  {
    name: "Jyot CRM",
    icon: "Users",
    body: "Pipeline, quotations and after-sales with WhatsApp built in.",
    tags: ["Sales", "Service"],
  },
  {
    name: "Website Development",
    icon: "Globe",
    body: "Fast, accessible, search-optimised corporate presence.",
    tags: ["SEO", "Core Web Vitals"],
  },
  {
    name: "Loan Management",
    icon: "Banknote",
    body: "Applications, documents and sanction tracking in one desk.",
    tags: ["Lenders", "Docs"],
  },
  {
    name: "Jyot EMI Calculator",
    icon: "Calculator",
    body: "Instant loan EMI, interest schedule and tenure planning tool.",
    tags: ["Finance", "Planning"],
  },
  {
    name: "Manufacturing ERP",
    icon: "Cog",
    body: "Shop-floor scheduling, BOM control and quality logs.",
    tags: ["MES", "Quality"],
  },
];

export const AI_FEATURES = [
  {
    name: "AI Chatbots",
    icon: "MessagesSquare",
    body: "Trained on your catalogue, policies and pricing.",
  },
  {
    name: "AI Voice Agents",
    icon: "PhoneCall",
    body: "Human-sounding inbound and outbound calling in Hindi, Gujarati and English.",
  },
  {
    name: "Business Automation",
    icon: "Workflow",
    body: "Back-office workflows removed from spreadsheets entirely.",
  },
  {
    name: "WhatsApp Automation",
    icon: "MessageCircle",
    body: "Catalogues, reminders and payment links on the channel India uses.",
  },
  {
    name: "Lead Qualification",
    icon: "Filter",
    body: "Scored, enriched and routed before a human picks up.",
  },
  {
    name: "Personal AI Assistants",
    icon: "Sparkles",
    body: "A private assistant for founders across mail, docs and data.",
  },
];

export const CASE_STUDIES = [
  {
    client: "Meridian Polymers",
    practice: "IT · Financial",
    problem:
      "Eleven disconnected spreadsheets and a 47-day order-to-cash cycle strangling working capital.",
    solution:
      "Custom ERP rollout across three plants alongside an ₹18 Cr working capital restructure.",
    result: "Order-to-cash down to 21 days with real-time plant visibility.",
    roi: "4.2x in year one",
    feedback: "One team, one point of contact, zero excuses.",
    person: "Rakesh Mehta · Director",
  },
  {
    client: "Shah Interio",
    practice: "IT · AI",
    problem:
      "Sales team spending 60% of the day on unqualified inbound calls and WhatsApp enquiries.",
    solution:
      "AI voice agent plus WhatsApp qualification flow wired directly into the CRM pipeline.",
    result: "70% of enquiries handled autonomously; only qualified buyers reach sales.",
    roi: "3.6x in eight months",
    feedback: "Our sales team only speaks to people who are ready to buy.",
    person: "Anita Shah · Founder",
  },
  {
    client: "Arva Industries",
    practice: "Engineering",
    problem:
      "A legacy assembly fixture creating bottlenecks and inconsistent tolerances on the line.",
    solution: "Full redesign in SolidWorks with revised plant layout and validated prototype run.",
    result: "22% cycle-time reduction and immaculate handover documentation.",
    roi: "2.9x in year one",
    feedback: "The documentation alone was worth the engagement.",
    person: "Pranav Desai · Plant Head",
  },
];

export const PORTFOLIO_WORK = [
  {
    client: "Meridian Polymers",
    industry: "Polymer Manufacturing",
    practice: "IT · Financial",
    title: "ERP rollout and ₹18 Cr working capital restructure",
    challenge:
      "Three plants running on disconnected spreadsheets with a 47-day order-to-cash cycle.",
    solution:
      "Unified ERP with live production, inventory and finance modules plus a restructured credit facility.",
    result: "Order-to-cash cut from 47 to 21 days",
    tech: ["React", "PostgreSQL", "Power BI", "Tally Sync"],
    hue: 24,
  },
  {
    client: "Northline Logistics",
    industry: "Logistics",
    practice: "Legal",
    title: "Multi-state GST and ROC compliance desk",
    challenge: "Filings across nine states with recurring penalties and no single owner.",
    solution:
      "Dedicated compliance desk with a monitored calendar, reconciliation engine and notice handling.",
    result: "Zero late filings across 3 financial years",
    tech: ["GST API", "Automation", "Document Vault"],
    hue: 150,
  },
  {
    client: "Arva Industries",
    industry: "Precision Engineering",
    practice: "Engineering",
    title: "Assembly fixture redesign and plant layout",
    challenge: "Legacy fixture causing tolerance drift and a hard ceiling on line throughput.",
    solution:
      "Ground-up mechanical redesign, simulation, prototype validation and revised floor layout.",
    result: "22% reduction in cycle time",
    tech: ["SolidWorks", "FEA", "AutoCAD", "GD&T"],
    hue: 210,
  },
  {
    client: "Shah Interio",
    industry: "Interior Design",
    practice: "IT · AI",
    title: "AI voice agent and WhatsApp qualification flow",
    challenge: "Sales team drowning in unqualified inbound calls and message threads.",
    solution:
      "Multilingual voice agent and WhatsApp flow scoring and routing every enquiry into CRM.",
    result: "70% of enquiries handled autonomously",
    tech: ["OpenAI", "Twilio", "WhatsApp API", "Node"],
    hue: 280,
  },
  {
    client: "Kalp Textiles",
    industry: "Textiles",
    practice: "Financial",
    title: "Project finance for a second production line",
    challenge: "Expansion stalled while four lenders asked for four different document sets.",
    solution: "Single structured proposal, lender matching and end-to-end sanction management.",
    result: "₹9.4 Cr sanctioned in 38 days",
    tech: ["Financial Modelling", "Lender Network", "DSCR"],
    hue: 45,
  },
  {
    client: "Vertex Auto",
    industry: "Automotive Components",
    practice: "IT · Engineering",
    title: "CRM plus reverse-engineered tooling library",
    challenge: "Quotations took days because tooling data lived in retired engineers' heads.",
    solution: "Digitised, reverse-engineered tooling library connected to a quotation-first CRM.",
    result: "Quotation turnaround down to 4 hours",
    tech: ["CRM", "Reverse Engineering", "CAD Library"],
    hue: 190,
  },
];

/* Per-division visual identity + unique content */
export type ServiceTheme = {
  accent: string;
  soft: string;
  label: string;
  pattern: "gold" | "saas" | "seal" | "blueprint";
  highlights: { k: string; v: string }[];
  flow: { step: string; body: string }[];
  checklist: string[];
  faqs: { q: string; a: string }[];
};

export const SERVICE_THEMES: Record<ServiceKey, ServiceTheme> = {
  financial: {
    accent: "oklch(0.78 0.15 85)",
    soft: "oklch(0.96 0.05 95)",
    label: "Professional Banking",
    pattern: "gold",
    highlights: [
      { k: "₹380 Cr", v: "Funding facilitated" },
      { k: "15 days", v: "Median sanction time" },
      { k: "86+", v: "Lender relationships" },
      { k: "7.5%", v: "Best secured rate" },
    ],
    flow: [
      {
        step: "Eligibility review",
        body: "Balance sheet, banking conduct and CIBIL read in one sitting.",
      },
      {
        step: "Lender matching",
        body: "Shortlist by rate, tenure and covenant tolerance — not by commission.",
      },
      {
        step: "Documentation",
        body: "One document set, formatted to each lender's credit template.",
      },
      { step: "Sanction & disbursal", body: "Credit committee follow-through until money lands." },
    ],
    checklist: [
      "PAN & Aadhaar of promoters",
      "3 years audited financials",
      "12 months bank statements",
      "GST returns (last 4 quarters)",
      "Property or collateral papers",
      "Company incorporation documents",
    ],
    faqs: [
      {
        q: "Do you charge before sanction?",
        a: "No. Advisory begins free; fees are tied to a sanctioned and disbursed facility.",
      },
      {
        q: "Can you improve an existing rate?",
        a: "Yes — balance transfer and re-negotiation are among our most common mandates.",
      },
      {
        q: "Which lenders do you work with?",
        a: "Public and private banks, NBFCs and co-lending platforms — 24 active relationships.",
      },
    ],
  },
  it: {
    accent: "oklch(0.62 0.19 256)",
    soft: "oklch(0.96 0.02 256)",
    label: "Modern SaaS Engineering",
    pattern: "saas",
    highlights: [
      { k: "180+", v: "Products shipped" },
      { k: "99.95%", v: "Uptime across managed cloud" },
      { k: "2 weeks", v: "Delivery cycle" },
      { k: "95+", v: "Median Lighthouse score" },
    ],
    flow: [
      {
        step: "Discovery",
        body: "Workflows mapped, success metrics agreed, scope frozen in writing.",
      },
      { step: "Design", body: "Clickable prototype signed off before a line of production code." },
      { step: "Build & QA", body: "Two-week increments with automated tests and staged review." },
      { step: "Launch & scale", body: "Monitoring, SLA support and a roadmap you own outright." },
    ],
    checklist: [
      "React · Next · TypeScript",
      "Node · Python · PostgreSQL",
      "AWS · Cloudflare · Hostinger",
      "OpenAI · LangChain · Vector DB",
      "React Native · Flutter",
      "Razorpay · Stripe · Payment APIs",
      "ERP & Business Platforms",
      "Odoo · Zoho · Tally",
    ],
    faqs: [
      {
        q: "Do we own the source code?",
        a: "Entirely. Repositories, design files and infrastructure are transferred at delivery.",
      },
      {
        q: "Can you take over an existing codebase?",
        a: "Yes. We start with a written audit before committing to any rewrite.",
      },
      {
        q: "How is AI priced?",
        a: "Build fee plus transparent pass-through of model usage — no margin on tokens.",
      },
    ],
  },
  legal: {
    accent: "oklch(0.55 0.12 250)",
    soft: "oklch(0.96 0.02 250)",
    label: "Compliance & Verification",
    pattern: "seal",
    highlights: [
      { k: "3,200+", v: "Filings completed" },
      { k: "0", v: "Late filings in 3 years" },
      { k: "7 days", v: "Median incorporation" },
      { k: "100%", v: "Trademark applications accepted" },
    ],
    flow: [
      {
        step: "Verification",
        body: "Documents validated against the registry before anything is filed.",
      },
      {
        step: "Drafting",
        body: "Applications, agreements and resolutions prepared by qualified counsel.",
      },
      { step: "Filing", body: "Submitted with acknowledgement numbers shared the same day." },
      {
        step: "Monitoring",
        body: "A live calendar tracks every renewal, return and hearing date.",
      },
    ],
    checklist: [
      "PAN & Aadhaar of directors",
      "Passport-size photographs",
      "Registered office proof",
      "NOC from property owner",
      "Digital signature certificates",
      "Board resolution (where applicable)",
    ],
    faqs: [
      {
        q: "Do you handle notices and scrutiny?",
        a: "Yes — drafting replies, representation and follow-through are included in the retainer.",
      },
      {
        q: "Is the compliance calendar shared?",
        a: "You receive a live calendar plus reminders seven days before every due date.",
      },
      {
        q: "Can you take over mid-year?",
        a: "Yes. We begin with a compliance health check and regularise any open items first.",
      },
    ],
  },
  engineering: {
    accent: "oklch(0.55 0.09 230)",
    soft: "oklch(0.95 0.02 230)",
    label: "Industrial Design & Automation",
    pattern: "blueprint",
    highlights: [
      { k: "150+", v: "Designs released to production" },
      { k: "22%", v: "Best cycle-time reduction" },
      { k: "GD&T", v: "Drawings to ASME Y14.5" },
      { k: "48 hrs", v: "Concept turnaround" },
    ],
    flow: [
      {
        step: "Requirement study",
        body: "Load cases, duty cycle and shop-floor constraints captured on site.",
      },
      {
        step: "Concept & CAD",
        body: "Multiple concepts modelled, weighed on cost, tooling and manufacturability.",
      },
      { step: "Validation", body: "FEA, tolerance stack-up and prototype trials before release." },
      {
        step: "Production release",
        body: "Drawings, BOM and process sheets handed to your vendors.",
      },
    ],
    checklist: [
      "Mechanical design & CAD",
      "SolidWorks · AutoCAD · Inventor",
      "FEA & tolerance analysis",
      "Jigs, fixtures & machine design",
      "Plant layout & line balancing",
      "Reverse engineering & documentation",
    ],
    faqs: [
      {
        q: "Do you support manufacturing?",
        a: "Yes — vendor identification, first-article inspection and process validation.",
      },
      {
        q: "Which formats are delivered?",
        a: "Native CAD, STEP, and fully dimensioned 2D drawings with GD&T.",
      },
      {
        q: "Can you work from a physical sample?",
        a: "Yes. Reverse engineering from a sample or worn part is a standard mandate.",
      },
    ],
  },
};

/* ---------- Conversion & storytelling content ---------- */

export const OVERVIEW_FRAGMENTS = [
  { title: "Loan Consultant", body: "Separate fees, separate follow-ups." },
  { title: "Software Company", body: "No context on your finances." },
  { title: "Legal Firm", body: "Compliance handled in isolation." },
  { title: "Engineering Consultant", body: "Another contract, another timeline." },
];

export const OVERVIEW_UNIFIED = [
  "One consultant who understands the whole business",
  "One proposal covering funding, software, legal and engineering",
  "One invoice and one accountable delivery owner",
  "One roadmap that keeps every workstream in sequence",
];

export const WHO_WE_HELP = [
  {
    name: "Individuals",
    icon: "Users",
    body: "Home, personal and education loans with paperwork handled end to end.",
  },
  {
    name: "Startups",
    icon: "Rocket",
    body: "Incorporation, funding readiness, MVP build and go-to-market in one track.",
  },
  {
    name: "MSMEs",
    icon: "Boxes",
    body: "Working capital, GST discipline and affordable automation.",
  },
  {
    name: "Manufacturing",
    icon: "Factory",
    body: "Machinery finance, ERP, plant layout and statutory compliance.",
  },
  {
    name: "Builders",
    icon: "HardHat",
    body: "Project finance, RERA filings, structural design and sales portals.",
  },
  {
    name: "Real Estate Developers",
    icon: "Building2",
    body: "Land due diligence, funding structures and buyer CRM.",
  },
  {
    name: "Hospitals",
    icon: "HeartPulse",
    body: "Equipment loans, HMS software and licensing renewals.",
  },
  {
    name: "Schools",
    icon: "GraduationCap",
    body: "Infrastructure funding, fee portals and trust compliance.",
  },
  {
    name: "Retail Businesses",
    icon: "ShoppingBag",
    body: "POS, billing, inventory software and merchant credit lines.",
  },
  {
    name: "Professionals",
    icon: "Landmark",
    body: "Practice websites, tax planning and equipment finance.",
  },
  {
    name: "Large Enterprises",
    icon: "Cog",
    body: "Multi-entity compliance, custom platforms and vendor consolidation.",
  },
];

export const SOLUTION_PACKAGES = [
  {
    name: "Start Your Business",
    outcome: "From idea to legally trading in weeks, not months.",
    includes: [
      "Company Registration",
      "GST",
      "Trademark",
      "Website",
      "Business Email",
      "Digital Marketing",
      "Loan Assistance",
    ],
  },
  {
    name: "Fund Your Growth",
    outcome: "Sanction-ready files matched to the right lender.",
    includes: [
      "Project Report",
      "CMA Data",
      "Lender Matching",
      "Documentation",
      "Sanction Follow-up",
      "Subsidy Advisory",
    ],
  },
  {
    name: "Digitise Your Operations",
    outcome: "Move the business off spreadsheets and WhatsApp notes.",
    includes: ["ERP", "CRM", "Inventory", "Billing Integration", "Staff Training", "AMC Support"],
  },
  {
    name: "Stay Compliant",
    outcome: "A calendar nobody in your office has to remember.",
    includes: [
      "GST Filing",
      "ROC Compliance",
      "Income Tax",
      "Labour Law",
      "Audit Support",
      "Notice Handling",
    ],
  },
  {
    name: "Build Your Brand",
    outcome: "A market presence that matches your ambition.",
    includes: ["Brand Identity", "Website", "SEO", "Social Media", "Content", "Performance Ads"],
  },
  {
    name: "Launch a Product",
    outcome: "Ship a real product with real users behind it.",
    includes: [
      "Product Strategy",
      "UI/UX Design",
      "Web & Mobile App",
      "Cloud Setup",
      "QA",
      "Post-launch Support",
    ],
  },
  {
    name: "Set Up a Factory",
    outcome: "Land to production line with one coordinating partner.",
    includes: [
      "Machinery Loan",
      "Plant Layout",
      "Structural Design",
      "Licences & NOCs",
      "Vendor Selection",
      "ERP Rollout",
    ],
  },
  {
    name: "Automate With AI",
    outcome: "Cut manual hours out of the highest-friction workflows.",
    includes: [
      "Process Audit",
      "AI Chat & Voice Agents",
      "Document Automation",
      "CRM Integration",
      "Dashboards",
      "Team Enablement",
    ],
  },
  {
    name: "Protect Your IP",
    outcome: "Own what your business actually created.",
    includes: [
      "Trademark",
      "Copyright",
      "Design Registration",
      "Agreements",
      "NDA Framework",
      "Dispute Support",
    ],
  },
];

export const SUCCESS_PROCESS = [
  {
    step: "Consultation",
    body: "A free 45-minute conversation about the commercial objective — no pitch deck.",
  },
  {
    step: "Requirement Analysis",
    body: "We interview your team, audit current systems and document what actually matters.",
  },
  {
    step: "Proposal",
    body: "Fixed scope, fixed price, dated milestones and named owners in writing.",
  },
  { step: "Execution", body: "Cross-functional pods deliver in two-week reviewable increments." },
  {
    step: "Testing",
    body: "Independent review across code, filings, drawings and financial documentation.",
  },
  {
    step: "Delivery",
    body: "Handover with training, credentials and full ownership of everything produced.",
  },
  { step: "Support", body: "SLA-backed support and a named manager who stays with your account." },
];

export const STAY_REASONS = [
  {
    title: "One Point of Contact",
    icon: "Users",
    body: "A named relationship manager who knows your business — not a ticket queue.",
    metric: "1 manager per account",
  },
  {
    title: "Long Term Partnership",
    icon: "Sparkles",
    body: "Most clients start with one mandate and stay for years across service lines.",
    metric: "92% retention",
  },
  {
    title: "Cross-Service Expertise",
    icon: "Workflow",
    body: "Finance, technology, legal and engineering advise each other before advising you.",
    metric: "4 practices, one table",
  },
  {
    title: "Dedicated Support",
    icon: "PhoneCall",
    body: "Phone and WhatsApp access with response commitments written into the contract.",
    metric: "Under 4h response",
  },
  {
    title: "Transparent Pricing",
    icon: "ReceiptText",
    body: "Fixed quotes approved before work starts. No surprise line items, ever.",
    metric: "0 hidden fees",
  },
  {
    title: "AI Driven Solutions",
    icon: "Bot",
    body: "Automation applied where it removes cost, not where it looks impressive.",
    metric: "-38% manual hours",
  },
];

export const FAQ_GROUPS = [
  {
    category: "Financial",
    items: [
      {
        q: "Which loans can you actually arrange?",
        a: "Business and working capital loans, machinery and equipment finance, project finance, home and mortgage loans, and government subsidy-linked schemes across public and private lenders.",
      },
      {
        q: "Do you charge before a loan is sanctioned?",
        a: "Our advisory fee is disclosed upfront and the success-linked component is payable only after sanction. Nothing is invoiced that you have not approved in writing.",
      },
      {
        q: "How long does a typical sanction take?",
        a: "Documentation is usually ready within a week. Sanction timelines depend on the lender, but most MSME cases close in three to six weeks.",
      },
    ],
  },
  {
    category: "IT",
    items: [
      {
        q: "Do we own the source code?",
        a: "Entirely. Source code, repositories, design files and cloud accounts are transferred to you at delivery with no lock-in.",
      },
      {
        q: "Can you work with our existing software?",
        a: "Yes. We integrate with Tally, Zoho, SAP, Shopify and most standard platforms rather than forcing a rebuild.",
      },
      {
        q: "What happens after launch?",
        a: "An AMC covering hosting, security patches, bug fixes and a monthly improvement window, with response times in the contract.",
      },
    ],
  },
  {
    category: "Legal",
    items: [
      {
        q: "Can you handle all compliance for a private limited company?",
        a: "Yes — incorporation, ROC filings, GST, TDS, income tax, labour law registrations and annual audit coordination on a managed calendar.",
      },
      {
        q: "What if we receive a notice?",
        a: "Our compliance desk drafts the response, coordinates with your auditor and represents the filing position. Notice handling is included in managed plans.",
      },
      {
        q: "How long does trademark registration take?",
        a: "Filing within 48 hours of documents, with the objection-free registration cycle typically running 12 to 18 months as per registry timelines.",
      },
    ],
  },
  {
    category: "Engineering",
    items: [
      {
        q: "Do you provide stamped structural drawings?",
        a: "Yes. Structural and layout drawings are issued by licensed engineers with the certifications your approvals require.",
      },
      {
        q: "Can you manage approvals and NOCs?",
        a: "We prepare and pursue municipal, fire, pollution board and factory licence approvals as part of project engineering mandates.",
      },
      {
        q: "Do you supervise execution on site?",
        a: "Site supervision, vendor evaluation and quality checks are available as a scoped add-on with weekly written reports.",
      },
    ],
  },
  {
    category: "General",
    items: [
      {
        q: "Can we engage Jyot for only one service line?",
        a: "Yes. Most clients start with a single mandate — a loan, a website, a GST cycle — and expand once the working relationship is proven.",
      },
      {
        q: "How quickly can a project start?",
        a: "Consultation within 24 hours, a written scope within three working days, and kickoff in the same week for most engagements.",
      },
      {
        q: "Do you work with clients outside Gujarat?",
        a: "We serve clients across India and support NRI promoters with remote onboarding and digitally executed documentation.",
      },
      {
        q: "How is pricing decided?",
        a: "Fixed-scope quotes for defined projects and monthly retainers for managed services. Every rupee is approved before it is spent.",
      },
    ],
  },
];

export const RESOURCES = [
  {
    name: "Guides",
    icon: "Globe",
    body: "Step-by-step explainers on loans, GST, incorporation and ERP selection.",
    count: "24 guides",
  },
  {
    name: "Downloads",
    icon: "ReceiptText",
    body: "Project report formats, CMA templates and compliance kits.",
    count: "18 files",
  },
  {
    name: "Checklists",
    icon: "Filter",
    body: "Pre-sanction, pre-launch and annual compliance checklists.",
    count: "12 checklists",
  },
  {
    name: "Blogs",
    icon: "MessagesSquare",
    body: "Field notes from the desks delivering the mandates.",
    count: "Updated weekly",
  },
  {
    name: "Templates",
    icon: "AppWindow",
    body: "Agreements, NDAs, quotations and vendor evaluation sheets.",
    count: "30 templates",
  },
  {
    name: "Business Insights",
    icon: "Sparkles",
    body: "Sector benchmarks and lending trends for Indian SMEs.",
    count: "Quarterly",
  },
];
