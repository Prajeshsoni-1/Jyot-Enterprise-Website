/** Long-form case studies at /case-studies/$slug */

export type CaseStudy = {
  slug: string;
  client: string;
  practice: string;
  industry: string;
  title: string;
  summary: string;
  problem: string;
  research: string[];
  solution: string[];
  implementation: { phase: string; body: string }[];
  timeline: { label: string; body: string }[];
  roi: { k: string; v: string }[];
  roiSummary: string;
  feedback: string;
  person: string;
  hue: number;
};

export const CASE_DETAILS: CaseStudy[] = [
  {
    slug: "meridian-polymers",
    client: "Meridian Polymers",
    practice: "IT · Financial",
    industry: "Manufacturing",
    title: "Turning eleven spreadsheets into one operating system",
    summary:
      "A three-plant polymer manufacturer with a 47-day cash cycle rebuilt its operating backbone and its credit structure at the same time.",
    problem:
      "Meridian ran three plants on eleven spreadsheets maintained by five people. Stock figures disagreed between production and finance, margin was calculated monthly and retrospectively, and a 47-day order-to-cash cycle meant every rupee of sanctioned working capital was permanently drawn. Growth was capped not by demand but by cash.",
    research: [
      "Two weeks on site across all three plants, shadowing dispatch, stores and accounts to document the process as it actually ran rather than as the SOP described it.",
      "Ninety days of transaction data analysed to locate where the cash cycle was actually lost — 19 of the 47 days sat between dispatch and invoice generation.",
      "Existing bank facilities reviewed against a properly computed MPBF working, which showed the limit had been sized on a formula rather than on the operating cycle.",
      "Interviews with eight floor supervisors established which data they would realistically enter, which shaped every screen we later built.",
    ],
    solution: [
      "A phased custom ERP rather than an off-the-shelf rollout, so the plant did not have to re-engineer itself around software during a growth year.",
      "Phase one targeted dispatch-to-invoice — the single largest cash-cycle loss — and went live in six weeks.",
      "Two-way Tally integration preserved the finance team's existing workflow instead of forcing an accounting migration mid-year.",
      "In parallel, an ₹18 Cr working capital facility was restructured with limits sized to the measured cycle and a monthly stock-statement discipline attached.",
    ],
    implementation: [
      {
        phase: "Phase 1 · Dispatch & invoicing",
        body: "Live in six weeks. Invoice generation moved from a two-day manual process to same-shift automatic generation on dispatch confirmation.",
      },
      {
        phase: "Phase 2 · Inventory & BOM",
        body: "Stores digitised across three plants with barcode issue and receipt. Physical and system stock reconciled within 1.2%.",
      },
      {
        phase: "Phase 3 · Production & quality",
        body: "Shop-floor scheduling, batch traceability and quality logs replaced paper travellers.",
      },
      {
        phase: "Phase 4 · Finance & analytics",
        body: "Tally sync, GST reconciliation and live margin, ageing and plant dashboards delivered to management.",
      },
    ],
    timeline: [
      { label: "Weeks 1–2", body: "On-site process mapping and data analysis" },
      {
        label: "Weeks 3–8",
        body: "Phase 1 build and go-live; parallel credit restructuring begins",
      },
      { label: "Weeks 9–14", body: "Inventory and production modules rolled out plant by plant" },
      {
        label: "Weeks 15–18",
        body: "Finance module, dashboards, training and hypercare through first close",
      },
      { label: "Month 6", body: "Post-implementation review; cash cycle measured at 21 days" },
    ],
    roi: [
      { k: "4.2x", v: "Return in year one" },
      { k: "26 days", v: "Removed from cash cycle" },
      { k: "₹2.4 Cr", v: "Working capital released" },
      { k: "1.2%", v: "Stock variance, from 9%" },
    ],
    roiSummary:
      "Total engagement cost was recovered within five months on released working capital alone, before counting the reduction in reconciliation effort or the margin visibility that changed pricing decisions in the second half of the year.",
    feedback:
      "We had been told for years that we needed SAP. What we actually needed was someone to sit on our floor for two weeks and then build only what mattered. One team, one point of contact, zero excuses.",
    person: "Rakesh Mehta · Director",
    hue: 24,
  },
  {
    slug: "shah-interio",
    client: "Shah Interio",
    practice: "IT · AI",
    industry: "Interior Design",
    title: "An AI front desk that never misses an enquiry",
    summary:
      "A design studio losing high-intent buyers inside a flood of inbound calls now qualifies 70% of enquiries before a human is involved.",
    problem:
      "Shah Interio generated strong inbound demand and converted poorly. Sales consultants spent about 60% of their day repeating the same qualification questions, and roughly a third of calls arrived outside business hours and were never returned. There was no record of what had been discussed with whom.",
    research: [
      "Four hundred recorded calls and two months of WhatsApp threads were reviewed and categorised by intent, language and outcome.",
      "Only 18% of inbound conversations involved a buyer with a defined budget and timeline — the rest were price-checking or early browsing.",
      "Language analysis showed 54% of callers switched between Gujarati, Hindi and English within a single conversation, which ruled out single-language automation.",
      "Response-time analysis showed conversion collapsing after 20 minutes, and after-hours enquiries converting at near zero purely because nobody replied.",
    ],
    solution: [
      "A voice agent handling inbound calls in all three languages with mid-sentence code switching, disclosed as AI at the start of every call.",
      "A parallel WhatsApp flow using the official Business API for enquiries arriving by message, sharing the same qualification logic.",
      "Scoring on budget band, timeline, property type and location, with high-intent conversations warm-transferred to a consultant immediately.",
      "Every conversation written to CRM with transcript, score and next action, so no context is lost at handoff.",
    ],
    implementation: [
      {
        phase: "Week 1 · Call design",
        body: "Scripts, objection paths, escalation rules and disclosure language written with the sales head.",
      },
      {
        phase: "Weeks 2–3 · Build",
        body: "Voice agent, WhatsApp flow, telephony routing and CRM write-back configured and tested internally.",
      },
      {
        phase: "Week 4 · Shadow pilot",
        body: "20% of inbound traffic routed to the agent with every call human-reviewed and scored.",
      },
      {
        phase: "Weeks 5–6 · Scale and tune",
        body: "Full traffic, weekly transcript review, refusal and escalation thresholds tightened.",
      },
    ],
    timeline: [
      { label: "Week 1", body: "Discovery and conversation design" },
      { label: "Weeks 2–3", body: "Development and internal testing" },
      { label: "Week 4", body: "Live pilot on partial traffic" },
      { label: "Weeks 5–6", body: "Full rollout and tuning" },
      { label: "Month 8", body: "Measured review against the pre-launch baseline" },
    ],
    roi: [
      { k: "3.6x", v: "Return in eight months" },
      { k: "70%", v: "Enquiries handled autonomously" },
      { k: "-50%", v: "Conversations per closed deal" },
      { k: "100%", v: "After-hours enquiries answered" },
    ],
    roiSummary:
      "The agent costs less per month than a single junior consultant and handles a volume that would require four. The larger gain was conversion: qualified buyers now reach a human within minutes instead of the following morning.",
    feedback:
      "I was sceptical about disclosing it as AI. It turned out customers preferred it — they ask blunter questions and waste less time. Our sales team only speaks to people who are ready to buy.",
    person: "Anita Shah · Founder",
    hue: 280,
  },
  {
    slug: "arva-industries",
    client: "Arva Industries",
    practice: "Engineering",
    industry: "Precision Engineering",
    title: "Rebuilding a fixture nobody had drawings for",
    summary:
      "An undocumented assembly fixture was reverse engineered, redesigned and validated — removing 22% of cycle time and two-thirds of rejections.",
    problem:
      "Arva's main assembly cell depended on a fixture built in-house fourteen years earlier. Tolerances had drifted, final inspection rejection sat near 9%, and throughput could not be raised. No drawings existed and the engineer who built it had retired.",
    research: [
      "The fixture was 3D scanned and critical interfaces verified on a CMM to establish actual versus intended geometry.",
      "Three months of inspection data was analysed to correlate rejection modes with specific fixture features rather than operator variation.",
      "Time study across two shifts isolated where the 42-second cycle was actually consumed — 11 seconds sat in clamping and repositioning.",
      "Mating component drawings were reviewed to infer the original design intent and the tolerances that genuinely mattered.",
    ],
    solution: [
      "A ground-up redesign in SolidWorks with a revised clamping scheme replacing four manual clamps with two pneumatic units.",
      "FEA validation of the base structure under clamping load, which identified the deflection responsible for most tolerance drift.",
      "Correct GD&T applied against measured process capability rather than inherited nominal tolerances.",
      "The surrounding cell layout was reworked to remove two material-handling movements per cycle.",
    ],
    implementation: [
      {
        phase: "Weeks 1–2 · Capture",
        body: "Scanning, CMM verification and inspection-data analysis completed on site.",
      },
      {
        phase: "Weeks 3–5 · Design",
        body: "Concept selection, detailed modelling, FEA and design review with the plant team.",
      },
      {
        phase: "Weeks 6–9 · Build",
        body: "Fabrication supervised at a partner shop with in-process inspection at each stage.",
      },
      {
        phase: "Weeks 10–11 · Commission",
        body: "Installation, first-article inspection, operator training and documentation handover.",
      },
    ],
    timeline: [
      { label: "Weeks 1–2", body: "Reverse engineering and data analysis" },
      { label: "Weeks 3–5", body: "Design and simulation" },
      { label: "Weeks 6–9", body: "Fabrication and inspection" },
      { label: "Weeks 10–11", body: "Commissioning and handover" },
      { label: "Month 12", body: "Post-implementation audit of cycle time and reject rate" },
    ],
    roi: [
      { k: "2.9x", v: "Return in year one" },
      { k: "22%", v: "Cycle-time reduction" },
      { k: "-67%", v: "Final inspection rejects" },
      { k: "9 → 3%", v: "Rejection rate" },
    ],
    roiSummary:
      "Reduced rejection alone paid for the engagement in seven months. The throughput gain removed the need for a second shift that had been planned for the following quarter.",
    feedback:
      "We expected a new fixture. We got a documented, revision-controlled design with an inspection plan that our quality team now uses as a template. The documentation alone was worth the engagement.",
    person: "Pranav Desai · Plant Head",
    hue: 210,
  },
];

export function getCaseStudy(slug: string) {
  return CASE_DETAILS.find((c) => c.slug === slug);
}
