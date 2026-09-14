/** Blog system with categories and SEO-ready article pages at /blogs/$slug */

export const BLOG_CATEGORIES = [
  "Finance",
  "Technology",
  "AI",
  "Legal",
  "Engineering",
  "Business",
  "Marketing",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogSectionType =
  | "rich_text"
  | "heading_text"
  | "image_text"
  | "full_image"
  | "gallery"
  | "video"
  | "quote"
  | "stats"
  | "features"
  | "key_takeaways"
  | "challenges"
  | "solutions"
  | "results"
  | "technologies"
  | "faq"
  | "cta"
  | "custom";

export type BlogSection = {
  id: string;
  type: BlogSectionType;
  enabled: boolean;
  title: string;
  subtitle?: string | undefined;
  content?: string | undefined;
  images?: { url: string; caption?: string | undefined; alt?: string | undefined }[] | undefined;
  buttonText?: string | undefined;
  buttonUrl?: string | undefined;
  order: number;
  items?: { title: string; description?: string | undefined; icon?: string | undefined; badge?: string | undefined }[] | undefined;
  data?: Record<string, unknown> | undefined;
};

export type BlogPost = {
  slug: string;
  category: BlogCategory | string;
  title: string;
  excerpt: string;
  date: string;
  displayDate: string;
  read: string;
  author: string;
  authorRole: string;
  keywords: string[];
  body: { heading: string; paragraphs: string[]; points?: string[] | undefined }[];
  takeaway: string;
  // Extended fields for 100% editable Blog CMS
  subCategory?: string | undefined;
  industry?: string | undefined;
  authorPhoto?: string | undefined;
  authorBio?: string | undefined;
  authorSocialUrl?: string | undefined;
  featured?: boolean | undefined;
  published?: boolean | undefined;
  status?: "draft" | "published" | "archived" | undefined;
  sortOrder?: number | undefined;
  featuredImage?: string | undefined;
  heroImage?: string | undefined;
  thumbnailImage?: string | undefined;
  gallery?: { url: string; caption?: string | undefined; alt?: string | undefined }[] | undefined;
  beforeImage?: { url: string; label?: string | undefined } | undefined;
  afterImage?: { url: string; label?: string | undefined } | undefined;
  contentHtml?: string | undefined;
  rawBody?: string | undefined;
  sections?: BlogSection[] | undefined;
  keyTakeaways?: string[] | undefined;
  cta?: {
    enabled?: boolean | undefined;
    heading?: string | undefined;
    description?: string | undefined;
    primaryButtonText?: string | undefined;
    primaryButtonUrl?: string | undefined;
    secondaryButtonText?: string | undefined;
    secondaryButtonUrl?: string | undefined;
    image?: string | undefined;
    backgroundImage?: string | undefined;
  } | undefined;
  controls?: {
    showAuthorBio?: boolean | undefined;
    showTableOfContents?: boolean | undefined;
    showShare?: boolean | undefined;
    showTakeaway?: boolean | undefined;
    showGallery?: boolean | undefined;
    showRelated?: boolean | undefined;
    showCta?: boolean | undefined;
  } | undefined;
  relatedBlogSlugs?: string[] | undefined;
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
  updatedAt?: string | undefined;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "structure-working-capital-before-growth-quarter",
    category: "Finance",
    title: "How to structure working capital before your growth quarter",
    excerpt:
      "Most businesses request a working capital enhancement after the cash squeeze begins. The correct time is one quarter earlier — here is the calculation lenders expect.",
    date: "2026-02-18",
    displayDate: "18 February 2026",
    read: "6 min",
    author: "Hiren Patel",
    authorRole: "Head of Financial Advisory",
    keywords: ["working capital", "cash conversion cycle", "MPBF", "business loan India"],
    body: [
      {
        heading: "The mistake is timing, not size",
        paragraphs: [
          "A working capital enhancement takes three to five weeks from application to enhanced limit. If you apply when the squeeze has already started, you spend that period funding growth from your own pocket — usually by delaying supplier payments, which is the most expensive credit available to any business.",
          "The trigger for an enhancement is not a cash shortage. It is a confirmed order book that will lengthen your cycle.",
        ],
      },
      {
        heading: "Compute your actual cycle",
        paragraphs: [
          "Lenders assess the cash conversion cycle: debtor days plus inventory days minus creditor days. Most businesses quote a number from memory that is materially wrong, usually optimistic by two weeks.",
          "Pull twelve months of data and compute it properly. That number, multiplied by daily cost of sales, is your genuine funding requirement.",
        ],
        points: [
          "Debtor days = (Receivables ÷ Annual sales) × 365",
          "Inventory days = (Inventory ÷ COGS) × 365",
          "Creditor days = (Payables ÷ Purchases) × 365",
          "Requirement = (Debtor + Inventory − Creditor) × daily COGS",
        ],
      },
      {
        heading: "Fix the cycle before financing it",
        paragraphs: [
          "Financing a bad cycle is expensive forever. Before applying, check whether ten days can be removed by invoicing on dispatch instead of month-end, tightening credit terms for your slowest three customers, or negotiating supplier terms in exchange for on-time payment.",
          "In our experience most manufacturers can remove eight to fifteen days without losing a single customer. That reduces the facility you need and the interest you pay on it, permanently.",
        ],
      },
      {
        heading: "Present it properly",
        paragraphs: [
          "Bankers approve files, not businesses. A one-page cycle analysis, the computed MPBF working, twelve months of stock statements and a stated end use will move a file faster than a relationship visit.",
        ],
      },
    ],
    takeaway:
      "Apply one quarter before you need the money, fix the cycle before you finance it, and present the calculation rather than asking the banker to make it.",
  },
  {
    slug: "off-the-shelf-erp-vs-custom-platform",
    category: "Technology",
    title: "Choosing between an off-the-shelf ERP and a custom platform",
    excerpt:
      "The build-versus-buy debate is usually framed wrongly. The real question is where your competitive advantage lives, and whether software would flatten it.",
    date: "2026-02-04",
    displayDate: "4 February 2026",
    read: "8 min",
    author: "Rohan Bhatt",
    authorRole: "Head of Engineering, IT Practice",
    keywords: ["ERP", "custom software", "manufacturing ERP", "total cost of ownership"],
    body: [
      {
        heading: "Standard software standardises you",
        paragraphs: [
          "Off-the-shelf ERP encodes a best-practice process. For accounting, payroll and statutory reporting, that is exactly what you want — there is no advantage in a bespoke general ledger.",
          "For the process that actually wins you customers, standardisation is a cost. If your differentiator is quoting a complex configured product in four hours, software that forces a generic quotation workflow is removing the reason customers choose you.",
        ],
      },
      {
        heading: "Count five years, not one",
        paragraphs: [
          "Licence cost is the visible number. Implementation partner fees typically run one to two times licence value in year one, and customisation is billed at premium rates because the vendor knows switching is painful.",
          "Custom development front-loads cost and eliminates per-seat licensing entirely. Around year three, for teams above roughly forty users, the lines usually cross.",
        ],
        points: [
          "Licence per user per year, with escalation",
          "Implementation partner fees",
          "Mandatory upgrade projects",
          "Customisation billed at vendor rates",
          "Internal time during rollout — usually the biggest cost of all",
        ],
      },
      {
        heading: "Why rollouts fail",
        paragraphs: [
          "Almost never for technical reasons. They fail when the scope covers every department simultaneously, when the shop floor was never consulted on data entry, and when go-live happens without a parallel run.",
          "A phased rollout that starts with the single most painful module produces visible value in six weeks and buys the patience needed for the harder phases.",
        ],
      },
      {
        heading: "A practical answer",
        paragraphs: [
          "Buy for commodity functions. Build where you compete. Integrate the two properly. This hybrid is what most of our manufacturing clients end up with, and it is usually cheaper than either purist position.",
        ],
      },
    ],
    takeaway:
      "Buy commodity processes, build your differentiator, and phase the rollout so value arrives in weeks rather than quarters.",
  },
  {
    slug: "ai-voice-agent-production-cost",
    category: "AI",
    title: "What an AI voice agent actually costs to run in production",
    excerpt:
      "Vendor pricing pages quote per-minute rates that exclude telephony, orchestration and the human review you will need. Here is the full number.",
    date: "2026-01-22",
    displayDate: "22 January 2026",
    read: "5 min",
    author: "Foram Mehta",
    authorRole: "AI Solutions Lead",
    keywords: ["AI voice agent", "conversational AI cost", "call automation India"],
    body: [
      {
        heading: "The quoted rate is not the cost",
        paragraphs: [
          "Model inference is one line item. A production deployment also pays for telephony minutes, speech-to-text, text-to-speech, orchestration hosting and CRM integration calls. Realistically, all-in cost lands between ₹6 and ₹12 per connected minute for Indian-language deployments.",
        ],
      },
      {
        heading: "Where the money actually goes",
        paragraphs: [
          "Text-to-speech is usually the largest component for natural-sounding Indian voices, followed by telephony. Model inference is frequently the smallest line, which surprises most buyers.",
        ],
        points: [
          "Telephony: ₹0.60–₹1.20 per minute",
          "Speech-to-text: ₹0.80–₹1.50 per minute",
          "Text-to-speech: ₹2–₹4 per minute for premium voices",
          "Model inference: ₹1–₹3 per minute depending on turn count",
          "Orchestration and hosting: ₹15,000–₹40,000 per month fixed",
        ],
      },
      {
        heading: "Compare against the real alternative",
        paragraphs: [
          "A staffed calling desk in Gujarat costs roughly ₹25,000–₹35,000 per agent per month for around 120 productive call-minutes a day. That works out near ₹11–₹14 per minute before supervision, attrition and training.",
          "The agent is therefore roughly cost-neutral to modestly cheaper per minute — and dramatically cheaper at peak, because it scales to unlimited concurrent calls with no hiring lead time.",
        ],
      },
      {
        heading: "Budget for review",
        paragraphs: [
          "Plan for a human to review a sample of calls weekly for the first three months. Skipping this is how deployments quietly degrade. Budget four to six hours a week initially, tapering after the first quarter.",
        ],
      },
    ],
    takeaway:
      "Expect ₹6–₹12 per connected minute all-in. The economics work on availability and peak scaling, not on undercutting a human on unit cost.",
  },
  {
    slug: "compliance-calendar-private-limited-companies-miss",
    category: "Legal",
    title: "The compliance calendar every private limited company misses",
    excerpt:
      "AOC-4 and MGT-7 are well known. These six obligations generate most of the penalties we are asked to clean up.",
    date: "2026-01-09",
    displayDate: "9 January 2026",
    read: "7 min",
    author: "Sheetal Mehta",
    authorRole: "Head of Legal & Compliance",
    keywords: ["ROC compliance", "private limited company", "MCA filing", "DIR-3 KYC"],
    body: [
      {
        heading: "Penalties accrue per day, without a cap",
        paragraphs: [
          "Most Companies Act penalties run at ₹100 per day per form with no upper limit. A single forgotten form left for a year becomes ₹36,500. Directors carry personal liability for several of them.",
        ],
      },
      {
        heading: "The six most commonly missed",
        paragraphs: ["In cleanup engagements, the same obligations appear again and again."],
        points: [
          "DIR-3 KYC — every director, every year by 30 September. Non-filing deactivates the DIN.",
          "INC-20A — commencement of business declaration within 180 days of incorporation.",
          "ADT-1 — auditor appointment within 15 days of the AGM.",
          "MSME-1 — half-yearly return of payments outstanding to MSME suppliers beyond 45 days.",
          "DPT-3 — annual return of deposits and exempted deposits, including director loans.",
          "BEN-2 — significant beneficial ownership declaration, frequently ignored entirely.",
        ],
      },
      {
        heading: "Board meetings and minutes",
        paragraphs: [
          "Four board meetings a year with no more than 120 days between any two. Minutes must be recorded within 30 days and entered in a bound minute book. Backdated minutes produced during an inspection are a serious problem, not a fix.",
        ],
      },
      {
        heading: "Build the calendar in April",
        paragraphs: [
          "At the start of every financial year, list each applicable form against its due date and assign a named owner with a reminder ten days ahead. That single hour of work prevents almost every penalty we are later asked to regularise.",
        ],
      },
    ],
    takeaway:
      "Set the year's calendar in April with named owners. Late fees under the Companies Act have no ceiling, and cleanup always costs more than compliance.",
  },
  {
    slug: "reverse-engineering-legacy-tooling",
    category: "Engineering",
    title: "Reverse engineering legacy tooling without the guesswork",
    excerpt:
      "When the drawings are gone and the engineer has retired, worn geometry still carries the design intent — if you know how to read it.",
    date: "2025-12-16",
    displayDate: "16 December 2025",
    read: "9 min",
    author: "Alpesh Solanki",
    authorRole: "Principal Engineer",
    keywords: ["reverse engineering", "3D scanning", "GD&T", "legacy tooling"],
    body: [
      {
        heading: "Scanning is measurement, not engineering",
        paragraphs: [
          "A point cloud tells you what the part is today, including fourteen years of wear. It does not tell you what it was designed to be. Treating a scan as the answer reproduces the wear along with the geometry.",
          "The scan is an input. The engineering judgement about which surfaces are functional, which are cosmetic and which have degraded is where the value sits.",
        ],
      },
      {
        heading: "Read the mating parts",
        paragraphs: [
          "The most reliable evidence of original intent lives in the components the part touches. Bearing bores, register faces and locating pins carry the tolerances that mattered. Everything else is usually free.",
          "Wear patterns are informative too: a polished band on a guide surface tells you where load was carried, and often that the original clearance was tighter than what remains.",
        ],
      },
      {
        heading: "Rebuild parametrically",
        paragraphs: [
          "Surface-fitting a scan produces a model nobody can modify. Rebuilding parametrically from measured critical dimensions produces a model your team can iterate on for the next decade.",
          "It takes longer initially and pays back at the first revision.",
        ],
        points: [
          "Establish datums from functional surfaces first",
          "Rebuild features in manufacturing order",
          "Round nominal dimensions to sensible values where wear permits",
          "Document every assumption in the drawing notes",
        ],
      },
      {
        heading: "Document the assumptions",
        paragraphs: [
          "Every inferred dimension should be recorded with its basis. When the first article comes back out of specification, that record is what lets you find the wrong assumption in an hour instead of a week.",
        ],
      },
    ],
    takeaway:
      "Scan for measurement, engineer for intent, rebuild parametrically, and document every assumption you make along the way.",
  },
  {
    slug: "operating-rhythm-that-survives-fast-growth",
    category: "Business",
    title: "Building an operating rhythm that survives fast growth",
    excerpt:
      "The systems that carried you to ₹10 crore will actively obstruct you at ₹50 crore. What to change, and in what order.",
    date: "2025-12-02",
    displayDate: "2 December 2025",
    read: "6 min",
    author: "Rakesh Vora",
    authorRole: "Managing Partner",
    keywords: ["business operations", "scaling", "MSME growth", "management rhythm"],
    body: [
      {
        heading: "Founder memory stops scaling first",
        paragraphs: [
          "In most growing Indian businesses the operating system is the founder's memory. It works remarkably well up to a point, and then fails suddenly rather than gradually.",
          "The failure shows up as decisions waiting for one person, quality varying by who happened to handle the job, and new hires taking six months to become useful.",
        ],
      },
      {
        heading: "Write down the three processes that touch cash",
        paragraphs: [
          "Not everything needs documentation. Quotation to order, order to dispatch, and dispatch to collection cover most of what actually generates and protects cash. Document those three properly and leave the rest for later.",
        ],
      },
      {
        heading: "Install a weekly rhythm",
        paragraphs: [
          "A ninety-minute weekly meeting with the same agenda every week beats a quarterly review every time. Numbers first, exceptions second, decisions with named owners third.",
        ],
        points: [
          "Five numbers reviewed weekly, unchanged for a year",
          "Exceptions discussed only when a number is off",
          "Every decision assigned an owner and a date",
          "Last week's commitments reviewed first, always",
        ],
      },
      {
        heading: "Hire the layer before you need it",
        paragraphs: [
          "Managers take three to six months to become effective. Hiring at the point of pain means enduring the pain for another quarter. Growing businesses should hire the management layer roughly one quarter ahead of the volume that requires it.",
        ],
      },
    ],
    takeaway:
      "Document the three cash processes, run an unchanging weekly rhythm, and hire the management layer a quarter before the volume arrives.",
  },
  {
    slug: "measuring-marketing-that-produces-pipeline",
    category: "Marketing",
    title: "Measuring the marketing that actually produces pipeline",
    excerpt:
      "Impressions, clicks and engagement are inputs. Here is the attribution setup that tells you which spend produced revenue.",
    date: "2025-11-18",
    displayDate: "18 November 2025",
    read: "7 min",
    author: "Nidhi Sanghvi",
    authorRole: "Performance Marketing Lead",
    keywords: ["marketing attribution", "B2B lead generation", "CRM attribution", "ROAS"],
    body: [
      {
        heading: "Platform-reported conversions are not revenue",
        paragraphs: [
          "Every ad platform is incentivised to claim credit. Sum the conversions reported by Google, Meta and LinkedIn and you will routinely exceed the number of deals you actually closed.",
          "The only reliable ledger is your CRM, where a deal has a value and a close date that finance recognises.",
        ],
      },
      {
        heading: "Carry the source all the way through",
        paragraphs: [
          "The technical requirement is simple and usually missing: capture UTM parameters at first touch, store them on the lead record, and keep them attached through to the closed-won stage.",
        ],
        points: [
          "UTM parameters captured on landing and stored in a cookie",
          "Written to hidden form fields on every enquiry form",
          "Persisted on the CRM lead and copied to the deal",
          "Reported as cost per closed deal, by source",
        ],
      },
      {
        heading: "Judge on cost per closed deal",
        paragraphs: [
          "Cost per lead flatters channels that generate volume. In B2B, one channel producing ten expensive leads that close at 30% beats another producing sixty cheap leads that close at 2%. Only closed-deal cost exposes the difference.",
        ],
      },
      {
        heading: "Give it a fair window",
        paragraphs: [
          "With a ninety-day sales cycle, judging a campaign at thirty days measures nothing. Set the review window to match your actual cycle and resist reallocating spend before the data exists.",
        ],
      },
    ],
    takeaway:
      "Attribute in the CRM, judge on cost per closed deal, and review on a window that matches your real sales cycle.",
  },
  {
    slug: "msme-schemes-most-businesses-never-claim",
    category: "Finance",
    title: "The MSME schemes most eligible businesses never claim",
    excerpt:
      "Udyam registration unlocks more than a certificate. Several central and state benefits go unclaimed simply because nobody maps them.",
    date: "2025-11-04",
    displayDate: "4 November 2025",
    read: "6 min",
    author: "Hiren Patel",
    authorRole: "Head of Financial Advisory",
    keywords: ["MSME schemes", "Udyam registration", "CGTMSE", "subsidy India"],
    body: [
      {
        heading: "Registration is the gate",
        paragraphs: [
          "Udyam registration takes under a day and costs nothing. Without it, none of the benefits below are available — and a surprising number of eligible manufacturers and traders still have not registered.",
        ],
      },
      {
        heading: "What registration unlocks",
        paragraphs: [
          "The benefits fall into three groups: cheaper credit, faster payment rights and cost reimbursement.",
        ],
        points: [
          "CGTMSE — collateral-free credit guarantee up to ₹2 crore",
          "Interest subvention on incremental credit under eligible schemes",
          "45-day payment protection with statutory interest on delay",
          "Reimbursement of ISO certification and patent filing costs",
          "Preference and exemptions in government tenders",
          "State capital subsidies on plant and machinery investment",
        ],
      },
      {
        heading: "State schemes are where the money is",
        paragraphs: [
          "Gujarat, Maharashtra and Tamil Nadu each run capital subsidy and interest subvention schemes that frequently exceed the central benefit. They are also the least publicised, because claiming them requires paperwork nobody volunteers to explain.",
        ],
      },
      {
        heading: "Claim at the right moment",
        paragraphs: [
          "Most capital subsidies must be claimed within a defined window after commercial production begins. Miss it and the benefit is gone regardless of eligibility. Map the applicable schemes before the investment, not after.",
        ],
      },
    ],
    takeaway:
      "Register on Udyam, map the central and state schemes before you invest, and diarise every claim window.",
  },
];

export function getPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
