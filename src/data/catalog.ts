import type { ServiceKey } from "./site";

/**
 * Sub-service catalog. Each entry powers a dedicated landing page at
 * /service/$slug with hero, overview, benefits, process, timeline,
 * pricing, FAQs, testimonial, CTA and related services.
 *
 * Compact tuple-ish strings ("Title | body") are split at render time
 * with the `pair()` helper below.
 */

export type PricingTier = { tier: string; price: string; items: string[] };

export type SubService = {
  slug: string;
  parent: ServiceKey;
  name: string;
  tagline: string;
  overview: string;
  benefits: string[];
  process: string[];
  timeline: string;
  pricing?: PricingTier[];
  faqs: string[];
  testimonial: string;
};

export function pair(value: string): { a: string; b: string } {
  const idx = value.indexOf("|");
  if (idx === -1) return { a: value.trim(), b: "" };
  return { a: value.slice(0, idx).trim(), b: value.slice(idx + 1).trim() };
}

export const SUB_SERVICES: SubService[] = [
  /* ---------------------------- FINANCIAL ---------------------------- */
  {
    slug: "home-loan",
    parent: "financial",
    name: "Home Loan",
    tagline: "The right lender, the right rate, the paperwork handled.",
    overview:
      "We compare sanction terms across 30+ banks and NBFCs, structure your income profile for the strongest eligibility, and run the file end to end — from login to disbursement — so you are not chasing a branch manager between work calls.",
    benefits: [
      "Best available rate | We negotiate on your behalf across lenders instead of accepting the first offer.",
      "Higher eligibility | Income structuring and co-applicant planning that lifts your sanction amount.",
      "Zero paperwork stress | Document collection, valuation and legal coordination handled by your file manager.",
      "Faster disbursement | Pre-checked files clear underwriting without the usual back-and-forth.",
    ],
    process: [
      "Eligibility review | Income, obligations and credit profile assessed in a 30-minute call.",
      "Lender shortlist | Three to five offers compared on rate, tenure and hidden charges.",
      "File login | Documentation, valuation and legal verification coordinated by us.",
      "Sanction & disbursement | Terms explained line by line before you sign anything.",
    ],
    timeline: "7–21 days from document submission to disbursement",
    pricing: [
      {
        tier: "Salaried",
        price: "From 8.35% p.a.",
        items: ["Up to 90% funding", "Tenure up to 30 years", "Balance transfer supported"],
      },
      {
        tier: "Self-employed",
        price: "From 8.75% p.a.",
        items: ["Banking-based programs", "Low-doc options", "Income structuring advisory"],
      },
      {
        tier: "NRI",
        price: "From 8.90% p.a.",
        items: ["Remote documentation", "POA coordination", "Repatriation guidance"],
      },
    ],
    faqs: [
      "What documents do I need? | KYC, three years of income proof, six months of banking and the property chain documents. We share a single checklist and collect everything once.",
      "Do you charge a fee? | Advisory is free for retail home loans; we are compensated by the lender on disbursement. Any exception is disclosed in writing upfront.",
      "Can you help if a bank rejected me? | Yes. Most rejections are file-quality issues, not credit issues. We re-profile and re-present the case.",
    ],
    testimonial:
      "They got us 0.45% below the rate our own bank offered, and we signed everything from home. | Nirav Patel · Surat",
  },
  {
    slug: "business-loan",
    parent: "financial",
    name: "Business Loan",
    tagline: "Unsecured capital, sanctioned on the strength of your numbers.",
    overview:
      "Unsecured business funding for expansion, inventory or hiring. We build a lender-ready financial story from your GST returns, banking and balance sheet, then place the file with the lenders whose credit policy actually fits your profile.",
    benefits: [
      "No collateral | Funding based on turnover, banking conduct and GST discipline.",
      "Lender-fit placement | We know which credit policies accept your industry and vintage.",
      "Clean cost comparison | Processing fees, insurance and foreclosure terms compared side by side.",
      "Repeat facility planning | Structured so your next round is easier, not harder.",
    ],
    process: [
      "Financial review | GST, banking and ITR analysed for eligibility and red flags.",
      "Structuring | Loan amount, tenure and EMI matched to your cash-flow cycle.",
      "Placement | File presented to shortlisted lenders simultaneously.",
      "Sanction support | Terms negotiated, conditions cleared, disbursement tracked.",
    ],
    timeline: "5–14 days from document submission",
    pricing: [
      {
        tier: "Up to ₹25 L",
        price: "From 13.5% p.a.",
        items: ["12–36 month tenure", "Minimal documentation", "Disbursement in a week"],
      },
      {
        tier: "₹25 L – ₹1 Cr",
        price: "From 11.9% p.a.",
        items: ["Up to 60 months", "GST + banking program", "Part-prepayment allowed"],
      },
      {
        tier: "Above ₹1 Cr",
        price: "Negotiated",
        items: ["Structured facility", "Multi-lender syndication", "Covenant advisory"],
      },
    ],
    faqs: [
      "What turnover do I need? | Most unsecured programs start at ₹40 L annual turnover with two years of vintage. Below that we look at MSME and secured routes.",
      "Will multiple applications hurt my credit score? | We present a controlled shortlist rather than mass-applying, which protects your bureau report.",
      "Can I prepay? | Yes, most facilities allow part-prepayment after 6 EMIs. We compare foreclosure terms before you sign.",
    ],
    testimonial:
      "Sanctioned in nine days when our own bank had taken six weeks to say no. | Kiran Joshi · Director, Ahmedabad",
  },
  {
    slug: "mortgage-loan",
    parent: "financial",
    name: "Mortgage Loan",
    tagline: "Secured funding at rates unsecured credit cannot touch.",
    overview:
      "A mortgage against residential, commercial or industrial property gives you the lowest cost of capital available to a private business. We handle valuation, title diligence and lender negotiation so the security you pledge earns you the best possible terms.",
    benefits: [
      "Lowest borrowing cost | Secured pricing typically 4–6% below unsecured business credit.",
      "Long tenure | Up to 15 years, keeping EMI pressure off monthly cash flow.",
      "High ticket size | Funding scaled to property value, not just turnover.",
      "Title clarity | Legal and technical diligence completed before you commit.",
    ],
    process: [
      "Property assessment | Market value, title chain and lender acceptability checked.",
      "Structuring | Loan-to-value, tenure and drawdown planned around your use case.",
      "Legal & technical | Valuation and title search coordinated with the lender panel.",
      "Sanction & mortgage | Documentation, registration and disbursement managed end to end.",
    ],
    timeline: "15–30 days including legal and valuation",
    faqs: [
      "What LTV can I expect? | 60–75% of market value for residential, 50–65% for commercial and industrial property.",
      "Can I mortgage a property with an existing loan? | Yes, through a takeover plus top-up structure. We arrange the balance transfer alongside.",
      "Is rental income considered? | Yes. Lease rental discounting can materially improve eligibility, and we model both routes.",
    ],
    testimonial:
      "We refinanced three costly facilities into one mortgage and freed ₹4 lakh a month. | Hetal Shah · Partner",
  },
  {
    slug: "project-finance",
    parent: "financial",
    name: "Project Finance",
    tagline: "Capital structured around the project, not just the promoter.",
    overview:
      "For new plants, expansions and infrastructure builds, we prepare the techno-economic viability report, model the debt-service coverage a lender will underwrite, and syndicate term debt with the right mix of banks, NBFCs and government schemes.",
    benefits: [
      "Bankable project report | DPR and financial model built to lender appraisal standards.",
      "Subsidy capture | Central and state incentive schemes identified and claimed.",
      "Syndication | Multiple lenders coordinated for large or phased requirements.",
      "Drawdown discipline | Tranches aligned to construction and commissioning milestones.",
    ],
    process: [
      "Feasibility | Capex, revenue model and sensitivity analysis validated.",
      "DPR preparation | Detailed project report, financials and compliance annexures.",
      "Appraisal support | Lender queries, site visits and technical reviews managed.",
      "Sanction & monitoring | Drawdowns, covenants and reporting maintained post-disbursement.",
    ],
    timeline: "45–90 days from mandate to first drawdown",
    faqs: [
      "What promoter contribution is expected? | Typically 25–30% of project cost, though subsidy-linked schemes can reduce the effective outlay.",
      "Do you help with government schemes? | Yes — CGTMSE, PMEGP, state capital subsidies and interest subvention are assessed as part of the mandate.",
      "Can you take over a stalled project? | We restructure stalled files regularly, usually by rebuilding the financial model and re-presenting to a different lender class.",
    ],
    testimonial:
      "The DPR passed appraisal without a single revision. That has never happened to us before. | Pranav Desai · Plant Head",
  },
  {
    slug: "loan-against-property",
    parent: "financial",
    name: "Loan Against Property",
    tagline: "Unlock idle property value without selling it.",
    overview:
      "LAP converts owned property into long-tenure working capital at secured rates. We assess whether LAP, lease rental discounting or an overdraft facility gives you the cheapest effective cost, then run the file to disbursement.",
    benefits: [
      "Retain ownership | Raise capital without exiting an appreciating asset.",
      "Flexible end use | Business expansion, debt consolidation or personal needs.",
      "Overdraft option | Pay interest only on what you actually draw.",
      "Consolidation | Expensive facilities refinanced into one lower EMI.",
    ],
    process: [
      "Property & profile review | Value, title and income assessed together.",
      "Structure selection | Term loan, overdraft or LRD compared on true cost.",
      "Documentation | Legal, technical and KYC coordinated in one pass.",
      "Disbursement | Mortgage registration and payout tracked to completion.",
    ],
    timeline: "15–25 days",
    faqs: [
      "Is a rented property eligible? | Yes, and rental income often improves eligibility through lease rental discounting.",
      "Can two owners apply together? | All co-owners must be applicants or co-applicants. We coordinate the documentation.",
      "What if the title has a minor defect? | Most defects are curable. We flag them early and guide the rectification before lender submission.",
    ],
    testimonial:
      "One facility replaced four. Our interest outgo dropped by a third. | Mehul Trivedi · Proprietor",
  },
  {
    slug: "working-capital",
    parent: "financial",
    name: "Working Capital",
    tagline: "Fund the gap between what you spend and what you collect.",
    overview:
      "Cash credit, overdraft, bill discounting and buyer's credit sized to your actual operating cycle. We build the MPBF working, negotiate limits with your banker, and set up a renewal calendar so the limit never lapses mid-quarter.",
    benefits: [
      "Right-sized limits | Assessed on your operating cycle, not a generic multiple.",
      "Interest on usage | Overdraft and CC structures charge only on utilisation.",
      "Renewal discipline | Stock statements and renewals tracked so limits never lapse.",
      "Cycle improvement | Receivable and inventory advice that reduces the need itself.",
    ],
    process: [
      "Cycle analysis | Debtor, inventory and creditor days mapped to the real funding gap.",
      "Limit assessment | MPBF working prepared to banker's format.",
      "Negotiation | Rate, margin and collateral terms negotiated with the panel.",
      "Ongoing management | Monthly stock statements and annual renewal handled.",
    ],
    timeline: "20–35 days for a new facility, 10 days for enhancement",
    faqs: [
      "Can I enhance an existing limit? | Yes. Enhancements are faster than new facilities and often only need updated financials and stock statements.",
      "Do you handle stock statement filing? | Yes, monthly filing and drawing-power computation are part of the retainer.",
      "Is collateral always required? | CGTMSE-covered facilities can go up to ₹2 Cr without collateral for eligible MSMEs.",
    ],
    testimonial: "Our limit finally matches how the business actually runs. | Sanjay Rana · CFO",
  },
  {
    slug: "msme-loan",
    parent: "financial",
    name: "MSME Loan",
    tagline: "Government-backed credit at concessional cost.",
    overview:
      "MSME registration unlocks CGTMSE guarantees, interest subvention and priority-sector pricing. We complete the Udyam registration, identify every scheme you qualify for, and place the file where the subsidy actually gets passed through.",
    benefits: [
      "Collateral-free | CGTMSE cover up to ₹2 Cr for eligible units.",
      "Subsidised interest | Subvention and state schemes claimed on your behalf.",
      "Faster approvals | Priority-sector norms shorten sanction timelines.",
      "Registration included | Udyam registration and scheme mapping handled with the file.",
    ],
    process: [
      "Udyam registration | Classification confirmed and certificate issued.",
      "Scheme mapping | Central and state benefits matched to your unit.",
      "Application | Documentation prepared to scheme-specific requirements.",
      "Sanction & claim | Subsidy claims filed and tracked after disbursement.",
    ],
    timeline: "10–20 days",
    faqs: [
      "Do I need Udyam registration first? | Yes, and we complete it within a day at no additional cost when it accompanies a funding mandate.",
      "Which schemes apply to me? | It depends on sector, investment and turnover. We share a written scheme map before you apply.",
      "Are trading businesses eligible? | Many schemes now include retail and wholesale trade under Udyam. We confirm eligibility upfront.",
    ],
    testimonial:
      "We had no idea we qualified for two state subsidies. That paid for the entire engagement. | Bhavesh Kotak · Owner",
  },

  /* ------------------------------------ IT ------------------------------------ */
  {
    slug: "website-development",
    parent: "it",
    name: "Website Development",
    tagline: "A corporate site that loads fast and converts.",
    overview:
      "We design and build marketing sites and web platforms on a modern stack — server-rendered, accessible and search-optimised from the first commit. Every build ships with analytics, structured data and a CMS your team can actually operate.",
    benefits: [
      "Core Web Vitals | 95+ Lighthouse targets baked into the build, not patched later.",
      "SEO foundation | Semantic markup, metadata, sitemaps and schema on every page.",
      "Editable content | A CMS your marketing team runs without calling a developer.",
      "You own it | Source code, design files and hosting credentials handed over.",
    ],
    process: [
      "Discovery | Audience, goals and conversion paths defined in a working session.",
      "Design | Wireframes then high-fidelity UI, reviewed before a line of code.",
      "Build | Component-driven development with weekly staging previews.",
      "Launch | Performance audit, analytics, redirects and handover documentation.",
    ],
    timeline: "3–6 weeks depending on page count",
    pricing: [
      {
        tier: "Starter",
        price: "₹45,000",
        items: ["Up to 7 pages", "Responsive + SEO basics", "Contact form + analytics"],
      },
      {
        tier: "Business",
        price: "₹1,25,000",
        items: ["Up to 20 pages", "CMS + blog", "Schema, speed and SEO pack"],
      },
      {
        tier: "Enterprise",
        price: "Custom",
        items: ["Multi-language", "Integrations & portals", "Ongoing retainer"],
      },
    ],
    faqs: [
      "Do you provide content and images? | We provide structure, copy editing and licensed imagery. Full copywriting is available as an add-on.",
      "Can you redesign without losing SEO? | Yes. We map every existing URL, preserve rankings with redirects and monitor for four weeks post-launch.",
      "What about maintenance? | Optional retainers cover updates, backups, security patches and monthly performance reports.",
    ],
    testimonial: "Enquiries doubled in the first quarter after launch. | Anita Shah · Founder",
  },
  {
    slug: "erp-development",
    parent: "it",
    name: "ERP Development",
    tagline: "One ledger for production, inventory and finance.",
    overview:
      "Custom ERP for manufacturers and distributors who have outgrown spreadsheets but do not want to bend their operation around a rigid off-the-shelf product. We map your actual process first, then build only the modules that earn their keep.",
    benefits: [
      "Built around your process | No forced re-engineering to fit generic software.",
      "Single source of truth | Production, stock, purchase and finance on one dataset.",
      "Live visibility | Plant, margin and ageing dashboards updated continuously.",
      "Phased rollout | Highest-pain module first, so value arrives in weeks.",
    ],
    process: [
      "Process mapping | Two weeks on site documenting how work actually flows.",
      "Module blueprint | Scope, data model and integration plan signed off.",
      "Phased build | Module by module, each in production before the next starts.",
      "Adoption | Floor training, SOPs and hypercare through the first close.",
    ],
    timeline: "10–20 weeks for a phased multi-module rollout",
    faqs: [
      "Can it integrate with Tally? | Yes. Two-way Tally, GST portal and banking integrations are standard requirements we handle.",
      "What about existing data? | Migration of masters, opening balances and history is scoped into phase one.",
      "Who owns the system? | You do — source code, database and deployment. There is no per-seat licence trap.",
    ],
    testimonial:
      "Eleven spreadsheets became one system. Order-to-cash fell from 47 days to 21. | Rakesh Mehta · Director",
  },
  {
    slug: "crm-development",
    parent: "it",
    name: "CRM Development",
    tagline: "Pipeline discipline your sales team will actually use.",
    overview:
      "A CRM tuned to how Indian B2B sales really works — WhatsApp-first, quotation-heavy and follow-up driven. Leads captured from every channel, scored, assigned and chased until they close or die honestly.",
    benefits: [
      "WhatsApp built in | Conversations, catalogues and reminders inside the pipeline.",
      "Quotation engine | Branded quotes generated in seconds with approval workflow.",
      "No leakage | Every enquiry captured, assigned and time-bounded.",
      "Manager visibility | Funnel, ageing and rep performance without asking for reports.",
    ],
    process: [
      "Pipeline design | Stages, ownership rules and SLAs defined with your sales head.",
      "Build | Capture, scoring, quotations and automations configured.",
      "Integration | Website, IndiaMART, WhatsApp and telephony wired in.",
      "Rollout | Rep training, adoption tracking and a 30-day tune-up.",
    ],
    timeline: "4–8 weeks",
    faqs: [
      "Will the sales team adopt it? | Adoption is a design problem. We keep data entry under 30 seconds per lead and run a 30-day adoption review.",
      "Can it send WhatsApp automatically? | Yes, through the official WhatsApp Business API with approved templates.",
      "Is it mobile-friendly? | Field reps get a mobile-first interface with offline-tolerant entry.",
    ],
    testimonial:
      "Nothing falls through now. Follow-ups happen whether the rep remembers or not. | Devang Patel · Sales Head",
  },
  {
    slug: "ai-automation",
    parent: "it",
    name: "AI Automation",
    tagline: "Remove the back-office work nobody should be doing.",
    overview:
      "We identify the repetitive, rules-heavy work draining your team's hours — invoice entry, document extraction, reconciliation, reporting — and replace it with monitored AI workflows that run continuously and escalate exceptions to a human.",
    benefits: [
      "Hours returned | Typically 15–25 staff hours per week recovered per workflow.",
      "Fewer errors | Deterministic checks around every AI step.",
      "Human in the loop | Exceptions escalate rather than fail silently.",
      "Measured payback | ROI modelled before build, verified after.",
    ],
    process: [
      "Audit | Tasks logged and ranked by hours, error rate and automatability.",
      "Pilot | One workflow automated and measured against the manual baseline.",
      "Scale | Proven pattern extended across adjacent processes.",
      "Monitor | Dashboards, alerting and monthly accuracy review.",
    ],
    timeline: "2–4 weeks per workflow after the audit",
    faqs: [
      "Is our data used to train models? | No. We use enterprise endpoints with training disabled and can deploy in your own cloud tenancy.",
      "What if the AI gets it wrong? | Confidence thresholds route uncertain cases to a human queue; nothing posts unreviewed below threshold.",
      "Where should we start? | Whichever process has the most hours and clearest rules. The audit answers this in a week.",
    ],
    testimonial:
      "Two full-time roles of data entry disappeared without a single layoff — they moved to real work. | Foram Mehta · Operations",
  },
  {
    slug: "ai-chatbots",
    parent: "it",
    name: "AI Chatbots",
    tagline: "Answers from your catalogue, not from the internet.",
    overview:
      "Chatbots grounded strictly in your products, pricing and policies. They qualify enquiries, answer product questions in English, Hindi and Gujarati, and hand off to a human with the full conversation attached.",
    benefits: [
      "Grounded answers | Retrieval from your documents only — no invented facts.",
      "Multilingual | English, Hindi and Gujarati out of the box.",
      "Qualification | Budget, timeline and intent captured before handoff.",
      "Always on | Enquiries answered outside business hours instead of lost.",
    ],
    process: [
      "Knowledge base | Catalogue, pricing and policy documents structured and indexed.",
      "Conversation design | Intents, guardrails and escalation rules defined.",
      "Deployment | Website, WhatsApp and app channels launched together.",
      "Tuning | Weekly transcript review and answer improvement for a month.",
    ],
    timeline: "2–3 weeks",
    pricing: [
      {
        tier: "Website bot",
        price: "₹35,000 setup",
        items: ["Trained on your docs", "Lead capture", "Monthly hosting from ₹4,000"],
      },
      {
        tier: "Omnichannel",
        price: "₹75,000 setup",
        items: ["Web + WhatsApp", "CRM handoff", "Analytics dashboard"],
      },
    ],
    faqs: [
      "Will it invent answers? | No. Retrieval grounding plus refusal rules mean it says it does not know and offers a human instead.",
      "Can it take orders? | Yes, with payment links and CRM order creation where the catalogue supports it.",
      "How is it trained on our data? | We index your documents; the model reads them at answer time rather than memorising them.",
    ],
    testimonial:
      "It handles the same forty questions we used to answer by hand every day. | Ruchi Shah · Customer Care",
  },
  {
    slug: "ai-voice-agents",
    parent: "it",
    name: "AI Voice Agents",
    tagline: "Every call answered, in the language the caller speaks.",
    overview:
      "Human-sounding inbound and outbound voice agents that qualify leads, confirm appointments, chase payments and log everything into your CRM. Built for Indian telephony, accents and language switching mid-sentence.",
    benefits: [
      "No missed calls | Unlimited concurrent lines, day and night.",
      "Natural conversation | Interruption handling and code-switching between languages.",
      "CRM logged | Transcript, outcome and next action written back automatically.",
      "Cost per call | A fraction of a staffed calling desk at the same volume.",
    ],
    process: [
      "Call design | Scripts, objection paths and escalation rules written with your team.",
      "Voice build | Voice, language mix and telephony integration configured.",
      "Pilot | Live on a slice of traffic with human review of every call.",
      "Scale | Full traffic with weekly quality scoring.",
    ],
    timeline: "3–4 weeks",
    faqs: [
      "Do callers know it is AI? | We disclose it, which testing shows increases trust without reducing completion rates.",
      "What does it cost per minute? | Typically ₹6–₹12 per connected minute all-in, depending on language and volume.",
      "Can it transfer to a person? | Yes, warm transfer with context is standard for high-intent or escalated calls.",
    ],
    testimonial:
      "Seventy percent of enquiries never touch a human now, and sales only speaks to buyers. | Anita Shah · Founder",
  },
  {
    slug: "mobile-apps",
    parent: "it",
    name: "Mobile Apps",
    tagline: "One codebase, both stores, production quality.",
    overview:
      "Cross-platform iOS and Android apps for customer portals, field teams and dealer networks. Offline tolerance, push notifications and store submission handled — plus the backend to support it.",
    benefits: [
      "Both platforms | Single codebase, native feel, half the maintenance.",
      "Works offline | Field data captured without signal and synced later.",
      "Store handled | Listings, review responses and release management included.",
      "Backed properly | APIs, auth and admin console built alongside the app.",
    ],
    process: [
      "Scope | User journeys, offline rules and platform requirements defined.",
      "Prototype | Clickable build reviewed on real devices before development.",
      "Build | Two-week sprints with TestFlight and Play internal releases.",
      "Launch | Store submission, monitoring and a post-launch stabilisation window.",
    ],
    timeline: "8–16 weeks",
    faqs: [
      "React Native or native? | Cross-platform unless you need deep hardware access; we advise honestly based on the feature list.",
      "Who publishes to the stores? | Accounts are registered in your name; we manage the submission process.",
      "What about updates? | Retainers cover OS compatibility, store policy changes and feature releases.",
    ],
    testimonial:
      "Our dealers finally have one place to order and track. | Jignesh Amin · Distribution Head",
  },
  {
    slug: "digital-marketing",
    parent: "it",
    name: "Digital Marketing",
    tagline: "Spend judged on pipeline, not impressions.",
    overview:
      "Performance marketing across Google, Meta and LinkedIn with the tracking discipline to prove what actually produced revenue. Creative, landing pages and CRM attribution managed as one system rather than three vendors.",
    benefits: [
      "Revenue attribution | Spend tied to closed business, not vanity metrics.",
      "Creative included | Ad, landing page and copy production in the retainer.",
      "Channel honesty | We recommend cutting channels that do not pay back.",
      "Transparent reporting | Live dashboard plus a monthly written review.",
    ],
    process: [
      "Audit | Existing spend, tracking and funnel leaks assessed.",
      "Setup | Conversion tracking, CRM attribution and campaign architecture.",
      "Launch | Structured tests across audiences, creative and offers.",
      "Optimise | Weekly reallocation toward what converts to pipeline.",
    ],
    timeline: "Ongoing retainer, first results in 3–6 weeks",
    pricing: [
      {
        tier: "Growth",
        price: "₹35,000/month",
        items: ["Two channels", "Monthly creative set", "Live dashboard"],
      },
      {
        tier: "Scale",
        price: "₹75,000/month",
        items: ["Multi-channel", "Landing page production", "Weekly optimisation calls"],
      },
    ],
    faqs: [
      "Is ad spend included? | No, media spend is billed to your own accounts so you retain full ownership and history.",
      "What is the minimum budget? | We recommend ₹60,000 per month in media before performance marketing becomes measurable.",
      "Do you handle SEO too? | Yes, and it is usually the better long-term investment alongside a smaller paid budget.",
    ],
    testimonial:
      "They told us to stop spending on one channel entirely. That honesty saved us ₹2 lakh a month. | Nidhi Sanghvi · Marketing Lead",
  },
  {
    slug: "seo",
    parent: "it",
    name: "SEO",
    tagline: "Compounding traffic from the buyers already searching.",
    overview:
      "Technical SEO, content architecture and authority building for businesses that want inbound enquiries without paying per click. We fix the foundations first, then build topical depth around the terms that convert.",
    benefits: [
      "Technical foundation | Crawlability, speed, schema and indexation resolved first.",
      "Intent-led content | Pages built for buying queries, not traffic vanity.",
      "Local dominance | Google Business Profile and location pages for regional demand.",
      "Reported honestly | Rankings, traffic and enquiries in one monthly review.",
    ],
    process: [
      "Technical audit | Crawl, index and Core Web Vitals issues catalogued.",
      "Keyword mapping | Commercial-intent terms mapped to pages and gaps.",
      "Execution | Fixes, content and internal linking shipped monthly.",
      "Authority | Digital PR, citations and profile building.",
    ],
    timeline: "First movement in 6–10 weeks, compounding from month four",
    faqs: [
      "How long until results? | Meaningful movement in two to three months for most competitive local terms; national terms take longer.",
      "Do you guarantee rankings? | No credible agency does. We commit to the work, the reporting and the leading indicators.",
      "Can you fix a traffic drop? | Yes. Drops are usually technical, algorithmic or content-decay related, and the audit identifies which.",
    ],
    testimonial:
      "We rank ahead of two national players for our main term now. | Parth Vora · Director",
  },
  {
    slug: "cloud",
    parent: "it",
    name: "Cloud",
    tagline: "Infrastructure that scales without surprising your CFO.",
    overview:
      "Cloud migration, architecture and cost optimisation on AWS, Azure and Google Cloud. We design for the load you actually have, secure it properly, and instrument spend so bills never arrive as a shock.",
    benefits: [
      "Right-sized cost | Typical 25–40% reduction versus a lift-and-shift baseline.",
      "Secure by default | Network isolation, least privilege and encryption at rest.",
      "Resilient | Backups, failover and tested recovery procedures.",
      "Documented | Architecture diagrams and runbooks your team can operate.",
    ],
    process: [
      "Assessment | Current workloads, dependencies and cost baseline mapped.",
      "Architecture | Target design, security model and migration sequence agreed.",
      "Migration | Workload by workload with rollback at every step.",
      "Optimise | Cost, autoscaling and monitoring tuned after stabilisation.",
    ],
    timeline: "4–12 weeks depending on workload count",
    faqs: [
      "Which cloud should we use? | Whichever fits your workloads and existing licences. We are not tied to a single vendor.",
      "Will there be downtime? | Migrations are staged with cutover windows planned outside business hours.",
      "Can you manage it afterwards? | Yes, managed cloud retainers cover monitoring, patching and incident response.",
    ],
    testimonial:
      "Same performance, forty percent less spend, and we finally understand the bill. | Rohan Bhatt · CTO",
  },
  {
    slug: "hosting",
    parent: "it",
    name: "Hosting",
    tagline: "Managed hosting with someone who answers the phone.",
    overview:
      "Managed hosting for websites, portals and business applications — uptime monitoring, daily backups, SSL, security patching and a support line that reaches an engineer rather than a ticket queue.",
    benefits: [
      "99.9% uptime | Monitored continuously with alerting before users notice.",
      "Daily backups | Thirty-day retention with tested restores.",
      "Security patching | OS, runtime and CMS updates applied on schedule.",
      "Real support | Phone and WhatsApp access to an engineer, not a bot.",
    ],
    process: [
      "Provision | Environment sized and hardened for your workload.",
      "Migrate | Zero-downtime cutover with DNS and SSL handled.",
      "Monitor | Uptime, performance and security alerting activated.",
      "Maintain | Monthly patching and a quarterly performance review.",
    ],
    timeline: "Live in 2–5 days",
    pricing: [
      {
        tier: "Website",
        price: "₹1,500/month",
        items: ["Managed WordPress or static", "SSL + CDN", "Daily backups"],
      },
      {
        tier: "Application",
        price: "₹6,500/month",
        items: ["Dedicated resources", "Staging environment", "Priority support"],
      },
    ],
    faqs: [
      "Can you migrate our existing site? | Yes, migration is free and performed with a zero-downtime cutover.",
      "Do you host in India? | Yes, Indian data-centre regions are available where data residency matters.",
      "What if the site goes down? | Alerting reaches an on-call engineer immediately; the SLA target is under 30 minutes to response.",
    ],
    testimonial: "Three years, zero unplanned downtime. | Sagar Mistry · IT Manager",
  },

  /* ---------------------------------- LEGAL ---------------------------------- */
  {
    slug: "gst-registration",
    parent: "legal",
    name: "GST Registration",
    tagline: "GSTIN issued without the portal frustration.",
    overview:
      "End-to-end GST registration — documentation, application, officer queries and clarification responses — with the structural advice that matters: which state, composition or regular, and how many registrations you actually need.",
    benefits: [
      "Fast issuance | Most GSTINs issued within 7 working days.",
      "Query handling | Officer clarifications drafted and filed by us.",
      "Right structure | Composition versus regular advised before you commit.",
      "Post-registration setup | Invoice formats, HSN and filing calendar configured.",
    ],
    process: [
      "Eligibility | Turnover, state presence and scheme selection reviewed.",
      "Documentation | KYC, premises proof and authorisations assembled.",
      "Filing | Application submitted and tracked on the portal.",
      "Issuance | GSTIN delivered with an invoicing and filing setup pack.",
    ],
    timeline: "5–10 working days",
    pricing: [
      {
        tier: "Proprietorship",
        price: "₹1,999",
        items: ["Application + tracking", "Query handling", "Invoice format pack"],
      },
      {
        tier: "Company / LLP",
        price: "₹3,499",
        items: ["Multi-director KYC", "Authorised signatory setup", "Filing calendar"],
      },
    ],
    faqs: [
      "Is registration mandatory for me? | Above ₹40 L goods or ₹20 L services turnover, or for any inter-state supply and most e-commerce selling.",
      "How many registrations do I need? | One per state where you have a place of business. We map this before applying.",
      "What if my application is rejected? | Rejections are almost always documentation issues. We re-file at no additional professional fee.",
    ],
    testimonial:
      "Registered in six days including a departmental query. | Alkesh Doshi · Proprietor",
  },
  {
    slug: "gst-filing",
    parent: "legal",
    name: "GST Filing",
    tagline: "A filing calendar that never slips.",
    overview:
      "Monthly and annual GST compliance — GSTR-1, 3B, reconciliation against 2B, annual return and notice handling. Managed on a fixed calendar with reminders, so you never discover a missed return through a penalty notice.",
    benefits: [
      "Never late | Fixed calendar with reminders three days before every due date.",
      "Full ITC | 2B reconciliation that recovers the credit most businesses lose.",
      "Notice handling | Departmental notices drafted and responded to inside the retainer.",
      "Audit ready | Working papers maintained month by month, not reconstructed later.",
    ],
    process: [
      "Data collection | Sales and purchase data received in your existing format.",
      "Reconciliation | Books matched against GSTR-2B with mismatches flagged to you.",
      "Filing | GSTR-1 and 3B filed with a confirmation summary.",
      "Review | Quarterly compliance health report and ITC recovery summary.",
    ],
    timeline: "Monthly retainer, filed 3+ days before due date",
    pricing: [
      {
        tier: "Small",
        price: "₹1,500/month",
        items: ["Up to 50 invoices", "GSTR-1 + 3B", "2B reconciliation"],
      },
      {
        tier: "Growing",
        price: "₹3,500/month",
        items: ["Up to 300 invoices", "Notice handling", "Annual return included"],
      },
      {
        tier: "Enterprise",
        price: "Custom",
        items: ["Multi-GSTIN", "E-invoicing + e-way bills", "Dedicated compliance manager"],
      },
    ],
    faqs: [
      "Do you file the annual return? | GSTR-9 and 9C are included in the Growing and Enterprise retainers.",
      "What if we get a notice? | Drafting and response are included; only departmental appearance is billed separately.",
      "Can you clean up past defaults? | Yes. We regularise pending returns and compute the late fee exposure before you commit.",
    ],
    testimonial:
      "They recovered ₹3.8 lakh of input credit we had simply been leaving behind. | Mansi Gandhi · Accounts Head",
  },
  {
    slug: "company-registration",
    parent: "legal",
    name: "Company Registration",
    tagline: "Incorporated correctly the first time.",
    overview:
      "Private limited incorporation with DSC, DIN, name approval, MOA/AOA drafting, PAN, TAN and the post-incorporation compliance most consultants forget to mention. Shareholding and structuring advice comes before the filing, not after.",
    benefits: [
      "Structuring first | Shareholding, classes and founder terms advised upfront.",
      "Complete filing | DSC, DIN, SPICe+, PAN, TAN and bank account support.",
      "Post-incorporation | INC-20A, first board meeting and registers set up.",
      "One coordinator | A single named person handles the entire process.",
    ],
    process: [
      "Structure | Entity type, shareholding and capital decided with you.",
      "Name approval | RUN/SPICe+ name reservation filed.",
      "Incorporation | MOA, AOA and SPICe+ filed with the ROC.",
      "Activation | PAN, TAN, bank account and statutory registers completed.",
    ],
    timeline: "10–15 working days",
    pricing: [
      {
        tier: "Private Limited",
        price: "₹11,999 + govt fees",
        items: ["2 DSC + DIN", "MOA/AOA drafting", "PAN, TAN, registers"],
      },
      {
        tier: "LLP",
        price: "₹8,999 + govt fees",
        items: ["2 DSC + DPIN", "LLP agreement", "PAN + TAN"],
      },
    ],
    faqs: [
      "Private limited or LLP? | Private limited if you plan to raise capital or issue ESOPs; LLP for lower compliance and professional practices.",
      "How much capital do I need? | There is no minimum. Authorised capital of ₹1 lakh is typical and costs nothing extra.",
      "Can I register at my home address? | Yes, with a utility bill and an NOC from the owner.",
    ],
    testimonial:
      "The shareholding advice before we filed saved us a painful restructuring later. | Krish Solanki · Co-founder",
  },
  {
    slug: "llp-registration",
    parent: "legal",
    name: "LLP Registration",
    tagline: "Partnership flexibility with limited liability.",
    overview:
      "LLP incorporation including DPIN, name reservation, FiLLiP filing and a properly drafted LLP agreement — the document that decides what happens when partners disagree, which template agreements handle badly.",
    benefits: [
      "Limited liability | Personal assets protected from business obligations.",
      "Lower compliance | No board meetings, lighter annual filing burden.",
      "Real agreement | Profit sharing, exit and deadlock clauses drafted for your case.",
      "Tax efficient | No dividend distribution tax on partner withdrawals.",
    ],
    process: [
      "Planning | Partner roles, capital and profit sharing agreed.",
      "Name & DPIN | Reservation and partner identification filed.",
      "FiLLiP | Incorporation application submitted to the ROC.",
      "Agreement | LLP agreement drafted, stamped and filed in Form 3.",
    ],
    timeline: "12–18 working days",
    faqs: [
      "Can an LLP convert to a private limited later? | Yes, and we plan the agreement so conversion stays straightforward.",
      "Is an audit required? | Only above ₹40 L turnover or ₹25 L contribution.",
      "Can a foreign national be a partner? | Yes, subject to FDI rules and at least one resident designated partner.",
    ],
    testimonial:
      "The agreement actually covers what happens if one of us leaves. | Dhruv Kapadia · Designated Partner",
  },
  {
    slug: "trademark-registration",
    parent: "legal",
    name: "Trademark Registration",
    tagline: "Own your name before someone else claims it.",
    overview:
      "Trademark search, class selection, filing and objection handling. The search matters more than the filing — most rejections are avoidable, and we tell you honestly when a mark is not worth pursuing.",
    benefits: [
      "Honest search | Conflicts identified before you spend on a doomed filing.",
      "Right classes | Protection scoped to what you actually sell, now and next.",
      "™ immediately | Use the symbol from the day of filing.",
      "Objection handling | Examination replies and hearings managed by us.",
    ],
    process: [
      "Search | Public register and phonetic conflicts assessed.",
      "Class selection | Nice classification mapped to your business lines.",
      "Filing | TM-A filed with the specimen and user affidavit.",
      "Prosecution | Examination reply, publication and opposition handled.",
    ],
    timeline: "Filing in 3 days; registration typically 12–24 months",
    pricing: [
      {
        tier: "Individual / MSME",
        price: "₹5,499 + ₹4,500 govt",
        items: ["One class", "Search report", "Filing + ™ usage"],
      },
      {
        tier: "Company",
        price: "₹6,999 + ₹9,000 govt",
        items: ["One class", "Search report", "Objection reply included"],
      },
    ],
    faqs: [
      "How long until I can use ™? | Immediately upon filing. ® follows registration.",
      "What if my application is objected? | Examination reports are common. Reply drafting is included in the Company package.",
      "Should I register a logo or a word? | A word mark is broader; a device mark protects the visual. Many clients file both.",
    ],
    testimonial:
      "The search told us not to file on our first choice. That saved us a rebrand two years in. | Priya Nanda · Founder",
  },
  {
    slug: "copyright-registration",
    parent: "legal",
    name: "Copyright Registration",
    tagline: "Evidence of ownership for the work you created.",
    overview:
      "Copyright registration for software, designs, literary work, music and artistic material. Registration is not required for protection to exist, but it is what makes protection enforceable without argument.",
    benefits: [
      "Enforceable proof | Registration certificate as prima facie evidence of ownership.",
      "Long protection | Lifetime plus 60 years for most categories.",
      "Software covered | Source code and documentation registrable as literary work.",
      "Assignment support | Ownership transfers drafted correctly for investors and buyers.",
    ],
    process: [
      "Classification | Work category and authorship established.",
      "Documentation | NOC, specimens and applicant declarations prepared.",
      "Filing | Form XIV filed with the Copyright Office.",
      "Follow-through | Objection window monitored and registration collected.",
    ],
    timeline: "6–10 months for the certificate",
    faqs: [
      "Do I need registration to have copyright? | No, copyright exists on creation. Registration makes it far easier to prove and enforce.",
      "Can software be copyrighted? | Yes, as a literary work, with source-code extracts submitted as the specimen.",
      "What about work done by a contractor? | Ownership must be assigned in writing. We draft the assignment alongside the filing.",
    ],
    testimonial:
      "Our investors asked for IP proof in diligence. We had it on file. | Arjun Rathod · CTO",
  },
  {
    slug: "roc-filing",
    parent: "legal",
    name: "ROC Filing",
    tagline: "Annual compliance closed before the penalty window opens.",
    overview:
      "Annual and event-based ROC compliance — AOC-4, MGT-7, DIR-3 KYC, ADT-1, board minutes and statutory registers. Penalties under the Companies Act accrue per day, which makes calendar discipline the entire value of this service.",
    benefits: [
      "No day-rate penalties | Filings closed well before statutory deadlines.",
      "Registers maintained | Minutes and statutory registers kept current, not backdated.",
      "Director compliance | DIR-3 KYC tracked for every director every year.",
      "Event filings | Charges, allotments and director changes filed on time.",
    ],
    process: [
      "Calendar | Every applicable form mapped to a due date at year start.",
      "Preparation | Financials, minutes and resolutions drafted for approval.",
      "Filing | Forms filed with SRN confirmations shared to you.",
      "Records | Register and minute book updated and archived.",
    ],
    timeline: "Annual retainer with per-event filings as required",
    pricing: [
      {
        tier: "Small company",
        price: "₹12,000/year",
        items: ["AOC-4 + MGT-7", "ADT-1 + DIR-3 KYC", "Minutes and registers"],
      },
      {
        tier: "Full retainer",
        price: "₹28,000/year",
        items: ["All annual filings", "Event-based filings", "Compliance calendar dashboard"],
      },
    ],
    faqs: [
      "What happens if we file late? | ₹100 per day per form with no cap. Regularising early is always cheaper than waiting.",
      "Do dormant companies need to file? | Yes, annual filings apply even with zero turnover.",
      "Can you clean up past defaults? | Yes. We compute exposure first so you can decide with the number in front of you.",
    ],
    testimonial:
      "First year in a decade we did not pay a single late fee. | Vivek Trivedi · Director",
  },
  {
    slug: "iso-certification",
    parent: "legal",
    name: "ISO Certification",
    tagline: "Certification your customers can actually audit.",
    overview:
      "ISO 9001, 14001, 45001 and 27001 implementation with accredited certification bodies. We build the management system your operation can sustain, not a binder of documents that fails the first surveillance audit.",
    benefits: [
      "Accredited bodies only | Certificates that survive customer scrutiny.",
      "Real systems | Procedures written around how your team actually works.",
      "Audit support | Internal audit, gap closure and stage-1/2 attendance.",
      "Tender eligibility | Qualification for contracts that mandate certification.",
    ],
    process: [
      "Gap analysis | Current practice mapped against the standard.",
      "Documentation | Manual, procedures and records designed and rolled out.",
      "Internal audit | Findings closed before the certification body arrives.",
      "Certification | Stage 1 and 2 audits attended with you.",
    ],
    timeline: "8–14 weeks to certificate",
    faqs: [
      "Which standard do we need? | 9001 for quality, 14001 environment, 45001 safety, 27001 information security. Tenders usually specify.",
      "Are cheap online certificates valid? | Non-accredited certificates are commonly rejected in audits. We only work with accredited bodies.",
      "What happens after certification? | Annual surveillance audits. Our retainer keeps the system live between them.",
    ],
    testimonial:
      "We passed stage two with zero major non-conformities. | Nilesh Chauhan · QA Manager",
  },
  {
    slug: "income-tax-return",
    parent: "legal",
    name: "Income Tax Return",
    tagline: "Filed accurately, planned in advance.",
    overview:
      "ITR filing for individuals, firms and companies with the tax planning that should happen before March, not during July. Capital gains, foreign income, presumptive schemes and notice handling all covered.",
    benefits: [
      "Planned, not reactive | Advance tax and deductions reviewed each quarter.",
      "Accurate | 26AS and AIS reconciled before filing, which prevents most notices.",
      "Complex cases | Capital gains, ESOPs, foreign assets and NRI status handled.",
      "Notice support | Response drafting included for returns we filed.",
    ],
    process: [
      "Data collection | Income, investment and AIS data assembled.",
      "Computation | Regime comparison and deduction optimisation.",
      "Filing | Return filed with a computation summary shared to you.",
      "Post-filing | Refund tracking and notice handling as needed.",
    ],
    timeline: "3–7 days for individuals, 10–15 for companies",
    pricing: [
      {
        tier: "Salaried",
        price: "₹1,499",
        items: ["ITR-1/2", "Regime comparison", "AIS reconciliation"],
      },
      {
        tier: "Business",
        price: "₹4,999",
        items: ["ITR-3/4", "Balance sheet + P&L", "Advance tax planning"],
      },
      {
        tier: "Company",
        price: "₹14,999",
        items: ["ITR-6", "Tax audit coordination", "Notice support"],
      },
    ],
    faqs: [
      "Old regime or new? | We compute both and file whichever leaves you better off, with the comparison shared to you.",
      "I received a notice. Can you help? | Yes, including for returns filed elsewhere, on a separate engagement.",
      "Do you handle NRI returns? | Yes, including residential status determination and DTAA relief.",
    ],
    testimonial:
      "The quarterly planning call saved us more than the fee, twice over. | Sheetal Mehta · Consultant",
  },

  /* ------------------------------- ENGINEERING ------------------------------- */
  {
    slug: "cad-services",
    parent: "engineering",
    name: "CAD Services",
    tagline: "Drawings the shop floor can build from.",
    overview:
      "2D drafting and 3D modelling with correct GD&T, tolerance stacks and manufacturing notes. Drawings are produced to be manufactured from, which means dimension schemes chosen for how the part will actually be made and inspected.",
    benefits: [
      "Manufacturable | Tolerances set against real process capability.",
      "Standards compliant | ISO and ASME GD&T applied correctly.",
      "Revision controlled | Version history and change notes maintained.",
      "Native files | Editable source files delivered, not just PDFs.",
    ],
    process: [
      "Input review | Sketches, samples or legacy drawings assessed.",
      "Modelling | Parametric 3D model built with a clean feature tree.",
      "Detailing | Production drawings with GD&T and inspection dimensions.",
      "Release | Native files, PDFs and a revision log handed over.",
    ],
    timeline: "3–15 working days depending on part count",
    faqs: [
      "Which formats do you deliver? | SLDPRT/SLDDRW, DWG, STEP, IGES and PDF as standard.",
      "Can you work from a physical sample? | Yes, through our reverse engineering service with scanning or manual measurement.",
      "Do you sign drawings? | Yes, certified drawings are issued where required for approvals.",
    ],
    testimonial:
      "First drawing set we have received that needed no shop-floor clarification. | Pranav Desai · Plant Head",
  },
  {
    slug: "autocad-drafting",
    parent: "engineering",
    name: "AutoCAD Drafting",
    tagline: "Layouts, GA drawings and as-built documentation.",
    overview:
      "AutoCAD drafting for plant layouts, general arrangement drawings, fabrication details and as-built documentation. Layer discipline, standard title blocks and dimension conventions applied consistently across the set.",
    benefits: [
      "Consistent standards | Layers, blocks and title blocks standardised across drawings.",
      "Fast turnaround | Dedicated drafting capacity for volume work.",
      "Conversion work | Paper, scanned and PDF drawings digitised accurately.",
      "As-built accuracy | Site-verified documentation for existing installations.",
    ],
    process: [
      "Scope | Drawing list, standards and title block agreed.",
      "Drafting | Drawings produced against your CAD standard.",
      "Check | Internal drawing check before submission.",
      "Delivery | DWG and PDF sets with a drawing register.",
    ],
    timeline: "2–10 working days per drawing set",
    faqs: [
      "Can you match our CAD standard? | Yes, we adopt your layer naming, blocks and title block from the first drawing.",
      "Do you handle scanned paper drawings? | Yes, redrawing to scale with dimension verification.",
      "What about site measurement? | Available in Gujarat and Maharashtra for as-built documentation.",
    ],
    testimonial:
      "Two hundred legacy drawings digitised without a single error in the register. | Sanjay Rana · Maintenance Head",
  },
  {
    slug: "solidworks-design",
    parent: "engineering",
    name: "SolidWorks Design",
    tagline: "Parametric models built to be changed.",
    overview:
      "3D part and assembly modelling in SolidWorks with clean feature trees, configurations and design tables — so the third revision does not require rebuilding the model from scratch. Simulation and rendering available alongside.",
    benefits: [
      "Robust models | Feature trees that survive dimensional changes without breaking.",
      "Configurations | Variants driven from design tables rather than duplicated files.",
      "Simulation ready | FEA-prepared geometry for structural and thermal checks.",
      "Assembly checks | Interference, motion and BOM validated before release.",
    ],
    process: [
      "Concept | Requirements, envelope and load cases established.",
      "Modelling | Parts and assemblies built with design intent captured.",
      "Validation | Interference, mass properties and simulation checks.",
      "Documentation | Drawings, BOM and native files released.",
    ],
    timeline: "1–6 weeks depending on assembly complexity",
    faqs: [
      "Which version do you deliver? | We deliver in your installed version plus neutral STEP files.",
      "Do you run FEA? | Static structural, thermal and basic fatigue analysis with a written report.",
      "Can you take over a half-finished model? | Yes, including a feature-tree cleanup pass before extending it.",
    ],
    testimonial:
      "We changed a key dimension in revision three and nothing broke. | Alpesh Solanki · Design Lead",
  },
  {
    slug: "product-design",
    parent: "engineering",
    name: "Product Design",
    tagline: "Concept to validated, manufacturable hardware.",
    overview:
      "Full product development — industrial design, mechanical engineering, DFM, prototyping and pilot production support. We design against the manufacturing process and cost target from the first sketch rather than discovering both at tooling.",
    benefits: [
      "Cost designed in | Target cost modelled before geometry is frozen.",
      "DFM from day one | Process selection drives the design, not the reverse.",
      "Prototype validated | Functional prototypes tested before tooling spend.",
      "Vendor ready | Complete tech pack for tooling and pilot production.",
    ],
    process: [
      "Discovery | User needs, constraints and cost target defined.",
      "Concept | Multiple directions modelled and evaluated against criteria.",
      "Engineering | Detailed design, material selection and DFM review.",
      "Prototype & release | Build, test, iterate, then release the production pack.",
    ],
    timeline: "10–24 weeks concept to production release",
    faqs: [
      "Do you handle tooling? | We design for tooling and manage the vendor; tooling cost is billed at actuals.",
      "Who owns the IP? | You do, entirely, including all CAD and design documentation.",
      "Can you improve an existing product? | Yes. Cost-down and redesign programmes are a large part of our work.",
    ],
    testimonial:
      "They took eighteen percent out of the unit cost before we cut a single tool. | Rajesh Modi · Managing Director",
  },
  {
    slug: "machine-design",
    parent: "engineering",
    name: "Machine Design",
    tagline: "Special-purpose machines designed for your line.",
    overview:
      "Design of special-purpose machines, fixtures, conveyors and material-handling systems — mechanical design, drive sizing, pneumatics and control philosophy, delivered as a complete build package with safety compliance.",
    benefits: [
      "Purpose built | Designed for your part, cycle time and floor constraints.",
      "Correctly sized | Drives, actuators and structures calculated, not guessed.",
      "Safety compliant | Guarding and interlocks designed to standard.",
      "Buildable package | Fabrication drawings, BOM and control philosophy included.",
    ],
    process: [
      "Requirement study | Cycle time, part variation and layout constraints captured.",
      "Concept design | Mechanism selection with a cycle-time simulation.",
      "Detail design | Structures, drives, pneumatics and safety detailed.",
      "Build support | Fabrication supervision and commissioning assistance.",
    ],
    timeline: "6–16 weeks design; build support as required",
    faqs: [
      "Do you also build the machine? | We design and supervise; fabrication runs through vetted partners or your own shop.",
      "Can you improve an existing machine? | Yes, retrofit and debottlenecking work is common and usually the cheapest win.",
      "What about controls? | We provide the control philosophy and IO list, and can deliver PLC programming through our automation service.",
    ],
    testimonial:
      "Cycle time dropped twenty-two percent on the first commissioned run. | Pranav Desai · Plant Head",
  },
  {
    slug: "industrial-automation",
    parent: "engineering",
    name: "Industrial Automation",
    tagline: "PLC, SCADA and machine data that reaches the office.",
    overview:
      "Automation and control system integration — PLC programming, HMI and SCADA development, VFD and drive integration, plus OEE and production data flowing from the shop floor into your ERP instead of dying on a display.",
    benefits: [
      "Vendor agnostic | Siemens, Allen-Bradley, Delta and Mitsubishi platforms.",
      "Visible data | OEE, downtime and production counts reported automatically.",
      "ERP connected | Shop-floor data written into your business system.",
      "Documented code | Commented programs and IO lists so you are not locked in.",
    ],
    process: [
      "Study | Process, IO and control requirements documented.",
      "Design | Control architecture, panel design and IO schedule.",
      "Development | PLC, HMI and SCADA built and simulated offline.",
      "Commissioning | On-site loop checks, tuning, training and handover.",
    ],
    timeline: "4–14 weeks depending on IO count",
    faqs: [
      "Can you work with our existing PLC? | Yes, including retrofits and extensions of installed systems.",
      "Do you supply panels? | Panel design is ours; build is through partners or your preferred supplier.",
      "Will we get the source code? | Yes, commented and documented, with no licence lock-in.",
    ],
    testimonial:
      "For the first time we know our real OEE instead of arguing about it. | Nilesh Chauhan · Production Head",
  },
  {
    slug: "reverse-engineering",
    parent: "engineering",
    name: "Reverse Engineering",
    tagline: "From a worn part to a manufacturable drawing set.",
    overview:
      "Physical components converted into accurate CAD models and production drawings — for obsolete spares, unavailable imports and undocumented legacy tooling. Material identification and tolerance inference included, not guessed at.",
    benefits: [
      "Obsolete parts revived | Manufacture spares no longer available from the OEM.",
      "Import substitution | Local production of costly imported components.",
      "Accurate capture | 3D scanning and CMM measurement where geometry demands it.",
      "Function preserved | Critical fits and tolerances inferred from wear and mating parts.",
    ],
    process: [
      "Inspection | Part measured by scanning, CMM or manual metrology.",
      "Modelling | Parametric CAD rebuilt from the point cloud or measurements.",
      "Engineering review | Material, heat treatment and tolerances established.",
      "Release | Production drawings and a first-article inspection plan.",
    ],
    timeline: "1–4 weeks per component",
    faqs: [
      "What if the part is worn? | Wear patterns and mating components let us infer original geometry; we document every assumption.",
      "Can you identify the material? | Yes, through hardness testing and spectroscopy via partner labs where required.",
      "Is this legal? | For spares and repair of equipment you own, generally yes. We flag any active patent concerns.",
    ],
    testimonial:
      "A part the OEM had discontinued is now made locally at a third of the import cost. | Sagar Mistry · Maintenance Head",
  },
];

export const SUBS_BY_PARENT: Record<ServiceKey, SubService[]> = {
  financial: SUB_SERVICES.filter((s) => s.parent === "financial"),
  it: SUB_SERVICES.filter((s) => s.parent === "it"),
  legal: SUB_SERVICES.filter((s) => s.parent === "legal"),
  engineering: SUB_SERVICES.filter((s) => s.parent === "engineering"),
};

export function getSub(slug: string): SubService | undefined {
  return SUB_SERVICES.find((s) => s.slug === slug);
}
