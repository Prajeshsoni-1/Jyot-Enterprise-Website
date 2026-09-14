"use client";

import { useState, useId } from "react";
import { CheckList, Metric, NumberInput, ResultHeading, SelectInput, ToolShell } from "./ui";

/* ------------------------- Currency Formatter --------------------------- */
export function formatLakhRupee(val: number): string {
  if (!Number.isFinite(val)) return "₹0";
  const rounded = Math.round(val);
  const isNeg = rounded < 0;
  const abs = Math.abs(rounded);
  let formatted = "";

  if (abs >= 10_000_000) {
    formatted = `₹${(abs / 10_000_000).toFixed(2)} Cr`;
  } else if (abs >= 100_000) {
    formatted = `₹${(abs / 100_000).toFixed(2)} L`;
  } else {
    formatted = `₹${abs.toLocaleString("en-IN")}`;
  }

  return isNeg ? `-${formatted}` : formatted;
}

/* ---------------------- 1. WEBSITE COST CALCULATOR ----------------------- */

const SITE_TYPE_CONFIG = {
  "Landing / Single page": { base: 16000, includedPages: 1, extraPageRate: 1500 },
  "Basic Business Website": { base: 32000, includedPages: 5, extraPageRate: 1500 },
  "Professional Business Website": { base: 45000, includedPages: 8, extraPageRate: 1800 },
  "CMS / Lead Generation Website": { base: 65000, includedPages: 10, extraPageRate: 1800 },
  "Custom Web Application": { base: 220000, includedPages: 12, extraPageRate: 4500 },
  "Advanced SaaS / Enterprise Platform": { base: 550000, includedPages: 16, extraPageRate: 6000 },
};

const DESIGN_APPROACH = {
  "Standard / Template-aligned": 0.85,
  "Professional / Semi-custom": 1.0,
  "Custom Bespoke UI/UX & Motion": 1.3,
};

const WEBSITE_ADDONS: Record<string, number> = {
  "CMS Content Management (Dynamic Updates)": 12000,
  "Lead Capture & Instant WhatsApp Integration": 6500,
  "Custom Database Architecture (PostgreSQL/Supabase)": 22000,
  "Admin Operations Dashboard": 25000,
  "User Authentication & Role-Based Access": 18000,
  "Third-Party API Integrations": 15000,
  "Payment Gateway Integration (Razorpay/Cashfree)": 8000,
  "CRM Integration & Pipeline Sync": 10000,
  "E-commerce Catalog & Checkout": 38000,
  "AI Assistant / Chatbot Integration": 24000,
  "Custom Business Workflow Automation": 26000,
  "Advanced On-Page SEO & Speed Optimization": 7500,
};

export function WebsiteCostCalculator() {
  const [type, setType] = useState<keyof typeof SITE_TYPE_CONFIG>("Professional Business Website");
  const [design, setDesign] = useState<keyof typeof DESIGN_APPROACH>("Professional / Semi-custom");
  const [pages, setPages] = useState(8);
  const [extras, setExtras] = useState<string[]>([
    "CMS Content Management (Dynamic Updates)",
    "Lead Capture & Instant WhatsApp Integration",
  ]);

  const cfg = SITE_TYPE_CONFIG[type] ?? SITE_TYPE_CONFIG["Professional Business Website"];
  const designMultiplier = DESIGN_APPROACH[design] ?? 1.0;
  const extraPages = Math.max(pages - cfg.includedPages, 0);

  const baseBuild = Math.round(cfg.base * designMultiplier + extraPages * cfg.extraPageRate);
  const addOnsTotal = extras.reduce((sum, item) => sum + (WEBSITE_ADDONS[item] ?? 0), 0);
  const total = baseBuild + addOnsTotal;

  const minRange = Math.round((total * 0.88) / 500) * 500;
  const maxRange = Math.round((total * 1.15) / 500) * 500;

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Indicative Website Investment</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric
              label="Estimated range"
              value={`${formatLakhRupee(minRange)} – ${formatLakhRupee(maxRange)}`}
              hint="Benchmarked for Ahmedabad / Gujarat SMB planning"
            />
            <Metric label="Base build cost" value={formatLakhRupee(baseBuild)} />
            <Metric label="Selected add-ons" value={formatLakhRupee(addOnsTotal)} />
          </div>
          <div className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>
              Includes responsive mobile design, high-performance clean code, QA testing, on-page security, and production deployment. Domain &amp; hosting infrastructure billed at actuals.
            </p>
            <p className="border-t border-border/70 pt-2 text-[0.72rem] text-muted-foreground/80 italic">
              Indicative estimate for planning purposes only. Actual pricing depends on scope, requirements, integrations and implementation complexity.
            </p>
          </div>
        </>
      }
    >
      <SelectInput
        label="Type of build"
        value={type}
        onChange={(v) => setType(v as keyof typeof SITE_TYPE_CONFIG)}
        options={Object.keys(SITE_TYPE_CONFIG)}
      />
      <SelectInput
        label="Design approach"
        value={design}
        onChange={(v) => setDesign(v as keyof typeof DESIGN_APPROACH)}
        options={Object.keys(DESIGN_APPROACH)}
      />
      <NumberInput
        label="Number of pages / screens"
        value={pages}
        onChange={setPages}
        min={1}
        max={80}
      />
      <div>
        <span className="mb-2 block text-xs font-semibold text-ink">Features &amp; Add-ons</span>
        <CheckList
          items={Object.keys(WEBSITE_ADDONS)}
          checked={extras}
          toggle={(i) => setExtras((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
        />
      </div>
    </ToolShell>
  );
}

/* ------------------------- 2. ERP COST ESTIMATOR ------------------------ */

const ERP_MODULES = [
  "Finance & Accounting",
  "Inventory",
  "Production / MRP",
  "Purchase",
  "Sales & CRM",
  "HR & Payroll",
  "Quality",
  "Maintenance",
  "Custom Workflows & Reporting",
];

const DEPLOYMENT_MODELS: Record<string, number> = {
  "Cloud (managed)": 1.0,
  Hybrid: 1.15,
  "On-premise": 1.3,
};

const MIGRATION_MODELS: Record<string, number> = {
  "None (fresh start)": 1.0,
  "Basic (master data spreadsheets)": 1.08,
  "Moderate (Tally / legacy accounting balances)": 1.15,
  "Complex (multi-branch legacy ERP / historical ledger)": 1.3,
};

export function ErpCostEstimator() {
  const [users, setUsers] = useState(25);
  const [modules, setModules] = useState<string[]>(["Finance & Accounting", "Inventory"]);
  const [deployment, setDeployment] = useState("Cloud (managed)");
  const [migration, setMigration] = useState("Moderate (Tally / legacy accounting balances)");

  // Calibrated for Ahmedabad SMB benchmarks:
  // Base configuration: ₹1,40,000
  // Per module: ₹60,000
  // Per user: ₹2,500
  // For 25 users, 2 modules, Moderate migration (1.15x), Cloud:
  // Subtotal = 140k + 120k + 62.5k = 322.5k * 1.15 = ~371k. Range (0.90x - 1.25x) = ₹3.34L – ₹4.64L (Matches ₹3.3L – ₹4.6L!)
  const baseFramework = 140000;
  const moduleTotal = modules.length * 60000;
  const userSetup = Math.max(users, 5) * 2500;

  const deployMultiplier = DEPLOYMENT_MODELS[deployment] ?? 1.0;
  const migrationMultiplier = MIGRATION_MODELS[migration] ?? 1.15;

  const totalMidpoint = (baseFramework + moduleTotal + userSetup) * deployMultiplier * migrationMultiplier;
  const minImplementation = Math.round((totalMidpoint * 0.9) / 5000) * 5000;
  const maxImplementation = Math.round((totalMidpoint * 1.25) / 5000) * 5000;
  const annualAmc = Math.round((totalMidpoint * 0.18) / 1000) * 1000;

  const minWeeks = Math.max(6, Math.round(modules.length * 2.8));
  const maxWeeks = Math.max(10, Math.round(modules.length * 3.8));

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>ERP Planning Budget</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric
              label="Implementation estimate"
              value={`${formatLakhRupee(minImplementation)} – ${formatLakhRupee(maxImplementation)}`}
              hint="Benchmarked for Ahmedabad / Gujarat SMB planning"
            />
            <Metric
              label="Estimated annual support (AMC)"
              value={`${formatLakhRupee(annualAmc)} / yr`}
              hint="Optional: 15–18% of implementation for upgrades & support"
            />
            <Metric
              label="Rollout time"
              value={`${minWeeks} – ${maxWeeks} weeks`}
              hint="Phased discovery, data migration, UAT & go-live"
            />
          </div>
          <div className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>
              Includes requirement mapping, module configuration, data migration support, team training, and launch assistance. Cloud hosting infrastructure billed directly at actuals.
            </p>
            <p className="border-t border-border/70 pt-2 text-[0.72rem] text-muted-foreground/80 italic">
              Indicative estimate for planning purposes only. Actual pricing depends on scope, requirements, integrations and implementation complexity.
            </p>
          </div>
        </>
      }
    >
      <NumberInput
        label="Named users"
        value={users}
        onChange={setUsers}
        min={5}
        max={500}
        step={5}
      />
      <SelectInput
        label="Deployment model"
        value={deployment}
        onChange={setDeployment}
        options={Object.keys(DEPLOYMENT_MODELS)}
      />
      <SelectInput
        label="Data migration complexity"
        value={migration}
        onChange={setMigration}
        options={Object.keys(MIGRATION_MODELS)}
      />
      <div>
        <span className="mb-2 block text-xs font-semibold text-ink">Required Modules</span>
        <CheckList
          items={ERP_MODULES}
          checked={modules}
          toggle={(i) => setModules((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
        />
      </div>
    </ToolShell>
  );
}

/* ----------------------- 3. CRM RECOMMENDATION ------------------------- */

const CRM_LEAD_VOLUMES = [
  "Under 100 leads / month",
  "100 – 500 leads / month",
  "500 – 2,000 leads / month",
  "2,000+ leads / month",
];

const CRM_CHANNELS = [
  "WhatsApp Business API",
  "Phone / Click-to-call telephony",
  "Email tracking & automated sequences",
  "Website forms & landing pages",
  "Custom ERP / Inventory integration",
  "Field sales tracking & geo-checkins",
];

export function CrmRecommendation() {
  const [team, setTeam] = useState(8);
  const [leadsVolume, setLeadsVolume] = useState("100 – 500 leads / month");
  const [cycle, setCycle] = useState("Weeks (consultative)");
  const [need, setNeed] = useState("Automate follow-ups & WhatsApp triggers");
  const [channels, setChannels] = useState<string[]>([
    "WhatsApp Business API",
    "Phone / Click-to-call telephony",
    "Website forms & landing pages",
  ]);

  // Strategic scoring
  const hasCustomErp = channels.includes("Custom ERP / Inventory integration");
  const isHighLeadVolume = leadsVolume === "2,000+ leads / month";
  const isLargeTeam = team >= 20;
  const isEnterpriseCycle = cycle.startsWith("Months");

  let recommendation: {
    title: string;
    model: string;
    range: string;
    timeline: string;
    why: string;
  };

  if (hasCustomErp || (isHighLeadVolume && isLargeTeam) || need.includes("proprietary")) {
    recommendation = {
      title: "Custom CRM Development",
      model: "Bespoke Platform (Full Source Ownership)",
      range: "₹2.50 L – ₹6.00 L",
      timeline: "6 – 10 weeks",
      why: "Your specialized integration requirements, high transaction volume, and desire for zero per-seat recurring user licenses make a tailored, proprietary CRM engine the most cost-effective long-term investment.",
    };
  } else if (team > 6 || leadsVolume !== "Under 100 leads / month" || channels.length >= 3) {
    recommendation = {
      title: "CRM Configuration & Workflow Integration",
      model: "SaaS Implementation (Zoho / HubSpot / Freshsales)",
      range: "₹75,000 – ₹1.80 L",
      timeline: "3 – 5 weeks",
      why: "Your growing sales team benefits most from an established CRM foundation configured with custom stage pipelines, WhatsApp Business API triggers, telephony logging, and automated manager alerts.",
    };
  } else {
    recommendation = {
      title: "SaaS CRM / Streamlined Setup",
      model: "Standard SaaS Setup (HubSpot / Zoho Starter)",
      range: "₹25,000 – ₹60,000",
      timeline: "1 – 2 weeks",
      why: "For small sales teams with straightforward lead tracking, starting with a streamlined SaaS setup minimizes capital outgo while organizing deal flow and customer contact history.",
    };
  }

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>CRM Recommendation</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric
              label="Recommended path"
              value={recommendation.title}
              hint={recommendation.model}
            />
            <Metric
              label="Indicative implementation range"
              value={recommendation.range}
              hint="Benchmarked for Ahmedabad / Gujarat SMB planning"
            />
            <Metric label="Estimated deployment" value={recommendation.timeline} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{recommendation.why}</p>
          <p className="border-t border-border/70 pt-2 text-[0.72rem] text-muted-foreground/80 italic">
            Indicative Ahmedabad market estimate. Final pricing depends on CRM platform, integrations, data migration and workflow complexity.
          </p>
        </>
      }
    >
      <NumberInput
        label="Sales team size (Users)"
        value={team}
        onChange={setTeam}
        min={1}
        max={200}
      />
      <SelectInput
        label="Monthly inbound lead volume"
        value={leadsVolume}
        onChange={setLeadsVolume}
        options={CRM_LEAD_VOLUMES}
      />
      <SelectInput
        label="Typical sales cycle"
        value={cycle}
        onChange={setCycle}
        options={["Days (fast turnaround)", "Weeks (consultative)", "Months (enterprise / high-ticket)"]}
      />
      <SelectInput
        label="Primary objective"
        value={need}
        onChange={setNeed}
        options={[
          "Track leads reliably & stop leakage",
          "Automate follow-ups & WhatsApp triggers",
          "Multi-team pipeline & revenue forecasting",
          "Custom ERP workflows & proprietary business logic",
        ]}
      />
      <div>
        <span className="mb-2 block text-xs font-semibold text-ink">Channels &amp; Integrations Required</span>
        <CheckList
          items={CRM_CHANNELS}
          checked={channels}
          toggle={(i) => setChannels((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
        />
      </div>
    </ToolShell>
  );
}

/* -------------------- 4. AI READINESS ASSESSMENT ------------------------ */

const AI_CRITERIA = [
  { id: "digital_data", label: "Core business data is already digital (not kept on paper registers)", weight: 12 },
  { id: "centralized", label: "Data sits in centralized systems (CRM, ERP, database) that can be queried", weight: 14 },
  { id: "repeatable_sop", label: "Standard Operating Procedures (SOPs) are documented and repeatable", weight: 12 },
  { id: "api_available", label: "Existing software provides accessible APIs, database connectors, or export webhooks", weight: 14 },
  { id: "bottleneck", label: "We have a specific, high-volume operational bottleneck or manual task identified", weight: 14 },
  { id: "leadership", label: "Leadership has dedicated budget and an internal champion to own adoption", weight: 12 },
  { id: "staff_comfort", label: "Operational staff and managers are receptive to using modern software tools", weight: 10 },
  { id: "security", label: "Data privacy, security guidelines, and role permissions are understood", weight: 12 },
];

export function AiReadinessAssessment() {
  const [checkedIds, setCheckedIds] = useState<string[]>([
    "digital_data",
    "repeatable_sop",
    "bottleneck",
    "leadership",
  ]);

  const score = checkedIds.reduce((sum, id) => {
    const item = AI_CRITERIA.find((c) => c.id === id);
    return sum + (item?.weight ?? 0);
  }, 0);

  let band: {
    tier: string;
    status: string;
    useCases: string[];
    indicativeBudget: string;
    explanation: string;
  };

  if (score >= 86) {
    band = {
      tier: "86–100 Score",
      status: "Advanced AI Ready",
      useCases: [
        "Autonomous AI task agents across ERP & CRM",
        "Predictive inventory demand & cash flow forecasting",
        "Proprietary AI knowledge assistant trained on company docs",
        "Intelligent document extraction & automated reconciliations",
      ],
      indicativeBudget: "₹3.50 L – ₹8.00 L+ (Bespoke AI Platform)",
      explanation: "Your organization has excellent data hygiene, active APIs, and structured workflows. You are ideally positioned to deploy custom AI agents and deep operational automations with rapid ROI.",
    };
  } else if (score >= 71) {
    band = {
      tier: "71–85 Score",
      status: "AI Implementation Ready",
      useCases: [
        "AI customer support & lead qualification agent",
        "Document intelligence (invoice / PO parsing)",
        "Automated data extraction & CRM record updates",
        "Internal staff assistant for policy & product lookups",
      ],
      indicativeBudget: "₹1.50 L – ₹4.00 L (Workflow Integration)",
      explanation: "You have sound digital processes and clear bottlenecks. Production pilots can be scoped, trained on company documents, and deployed in 4–6 weeks.",
    };
  } else if (score >= 51) {
    band = {
      tier: "51–70 Score",
      status: "AI Pilot Ready",
      useCases: [
        "Website & WhatsApp conversational lead qualifier",
        "Basic document OCR & structured data entry",
        "Internal prompt templates for sales & customer replies",
      ],
      indicativeBudget: "₹50,000 – ₹1.80 L (Targeted Pilot)",
      explanation: "You can pilot AI on a single isolated bottleneck (like customer enquiry handling or document summaries) while standardizing broader operational data.",
    };
  } else if (score >= 31) {
    band = {
      tier: "31–50 Score",
      status: "Foundation Required",
      useCases: [
        "Digitize paper files and spreadsheet records into an ERP/CRM",
        "Standardize customer and product master data",
        "Define repeatable business workflows before automating them",
      ],
      indicativeBudget: "₹25,000 – ₹75,000 (Data & Process Prep)",
      explanation: "AI models cannot reason over scattered spreadsheets or missing records. Focus first on clean data capture and a centralized operational system.",
    };
  } else {
    band = {
      tier: "0–30 Score",
      status: "Not Ready Yet",
      useCases: [
        "Implement basic digital records and core CRM/ERP software",
        "Establish email, WhatsApp, and digital invoicing processes",
      ],
      indicativeBudget: "Operational Digitization First",
      explanation: "Your business will get vastly higher ROI by first transitioning core sales, billing, and inventory processes to reliable digital software before exploring AI.",
    };
  }

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>AI Readiness Scorecard</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric
              label="AI Readiness Score"
              value={`${score} / 100`}
              hint={band.status}
            />
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span>Readiness Progress</span>
                <span className="text-primary font-bold">{score}%</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(score, 4), 100)}%` }}
                />
              </div>
            </div>
            <Metric
              label="Indicative implementation range"
              value={band.indicativeBudget}
              hint="Benchmarked for Ahmedabad / Gujarat SMB planning"
            />
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold text-ink uppercase tracking-wider">Recommended Use Cases</p>
            <ul className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
              {band.useCases.map((uc) => (
                <li key={uc} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{uc}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground border-t border-border/70 pt-3">
            {band.explanation}
          </p>

          <p className="mt-2 text-[0.72rem] text-muted-foreground/80 italic">
            AI implementation and API/model usage costs may vary by provider, usage volume and solution complexity.
          </p>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-ink">Evaluate Your Current Foundation</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select the statements that accurately describe your business operations today:
          </p>
        </div>

        <CheckList
          items={AI_CRITERIA.map((c) => c.label)}
          checked={AI_CRITERIA.filter((c) => checkedIds.includes(c.id)).map((c) => c.label)}
          toggle={(label) => {
            const found = AI_CRITERIA.find((c) => c.label === label);
            if (!found) return;
            setCheckedIds((prev) =>
              prev.includes(found.id) ? prev.filter((id) => id !== found.id) : [...prev, found.id],
            );
          }}
        />
      </div>
    </ToolShell>
  );
}

/* -------------------- 5. DIGITAL MARKETING ROI ------------------------- */

type IndustryBenchmark = {
  name: string;
  defaultCpl: number;
  cplRange: string;
  defaultDealValue: number;
  defaultConversion: number;
  defaultMargin: number;
};

const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  "Real Estate": {
    name: "Real Estate",
    defaultCpl: 950,
    cplRange: "₹700 – ₹1,500 (Qualified buyer inquiry)",
    defaultDealValue: 120000,
    defaultConversion: 4,
    defaultMargin: 60,
  },
  "Finance & Loans": {
    name: "Finance & Loans",
    defaultCpl: 550,
    cplRange: "₹350 – ₹1,100 (Loan eligibility file)",
    defaultDealValue: 45000,
    defaultConversion: 7,
    defaultMargin: 50,
  },
  Insurance: {
    name: "Insurance",
    defaultCpl: 450,
    cplRange: "₹300 – ₹900 (Policy quote intent)",
    defaultDealValue: 22000,
    defaultConversion: 8,
    defaultMargin: 45,
  },
  "Healthcare & Clinics": {
    name: "Healthcare & Clinics",
    defaultCpl: 350,
    cplRange: "₹250 – ₹750 (Consultation booking)",
    defaultDealValue: 15000,
    defaultConversion: 12,
    defaultMargin: 55,
  },
  "Education & Coaching": {
    name: "Education & Coaching",
    defaultCpl: 280,
    cplRange: "₹200 – ₹600 (Course admission inquiry)",
    defaultDealValue: 35000,
    defaultConversion: 10,
    defaultMargin: 40,
  },
  "Manufacturing & Industrial B2B": {
    name: "Manufacturing & Industrial B2B",
    defaultCpl: 650,
    cplRange: "₹350 – ₹1,400 (Commercial buyer RFP)",
    defaultDealValue: 180000,
    defaultConversion: 5,
    defaultMargin: 30,
  },
  "IT / Software & SaaS": {
    name: "IT / Software & SaaS",
    defaultCpl: 800,
    cplRange: "₹400 – ₹1,600 (Demo / Consultation lead)",
    defaultDealValue: 90000,
    defaultConversion: 6,
    defaultMargin: 65,
  },
  "Professional Services (Legal/CA/Consulting)": {
    name: "Professional Services (Legal/CA/Consulting)",
    defaultCpl: 500,
    cplRange: "₹300 – ₹1,000 (Retainer inquiry)",
    defaultDealValue: 40000,
    defaultConversion: 9,
    defaultMargin: 50,
  },
  "Retail & Local Consumer": {
    name: "Retail & Local Consumer",
    defaultCpl: 220,
    cplRange: "₹150 – ₹500 (Store visit / Order intent)",
    defaultDealValue: 8500,
    defaultConversion: 14,
    defaultMargin: 35,
  },
  "Other / General Business": {
    name: "Other / General Business",
    defaultCpl: 400,
    cplRange: "₹200 – ₹900 (General inquiry)",
    defaultDealValue: 30000,
    defaultConversion: 8,
    defaultMargin: 40,
  },
};

export function MarketingRoiCalculator() {
  const [industry, setIndustry] = useState<string>("Manufacturing & Industrial B2B");
  const benchmark = INDUSTRY_BENCHMARKS[industry] ?? INDUSTRY_BENCHMARKS["Manufacturing & Industrial B2B"]!;

  // Monthly Ad Budget (strictly ad spend)
  const [adBudget, setAdBudget] = useState(50000);
  // Separate management/agency fee
  const [agencyFee, setAgencyFee] = useState(15000);
  // Average Cost Per Lead (CPL)
  const [cpl, setCpl] = useState(650);
  // Lead-to-Customer conversion %
  const [conversionRate, setConversionRate] = useState(5);
  // Average customer transaction / deal value
  const [dealValue, setDealValue] = useState(180000);
  // Gross margin %
  const [margin, setMargin] = useState(30);

  function handleIndustryChange(ind: string) {
    setIndustry(ind);
    const bm = INDUSTRY_BENCHMARKS[ind];
    if (bm) {
      setCpl(bm.defaultCpl);
      setConversionRate(bm.defaultConversion);
      setDealValue(bm.defaultDealValue);
      setMargin(bm.defaultMargin);
    }
  }

  // Calculations
  const cleanAdBudget = Math.max(adBudget, 0);
  const cleanAgencyFee = Math.max(agencyFee, 0);
  const cleanCpl = Math.max(cpl, 1);
  const cleanConversion = Math.min(Math.max(conversionRate, 0), 100);
  const cleanDealValue = Math.max(dealValue, 0);
  const cleanMargin = Math.min(Math.max(margin, 0), 100);

  const totalMarketingInvestment = cleanAdBudget + cleanAgencyFee;
  const estimatedLeads = Math.floor(cleanAdBudget / cleanCpl);
  const estimatedCustomers = Math.max(Number(((estimatedLeads * cleanConversion) / 100).toFixed(1)), 0);
  const projectedRevenue = Math.round(estimatedCustomers * cleanDealValue);
  const grossProfit = Math.round((projectedRevenue * cleanMargin) / 100);
  const netProfitAfterMarketing = grossProfit - totalMarketingInvestment;

  const roas = cleanAdBudget > 0 ? projectedRevenue / cleanAdBudget : 0;
  const roi =
    totalMarketingInvestment > 0
      ? Math.round((netProfitAfterMarketing / totalMarketingInvestment) * 100)
      : 0;

  const cpa = estimatedCustomers > 0 ? Math.round(totalMarketingInvestment / estimatedCustomers) : 0;

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Projected Marketing Returns</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric
              label="Estimated monthly leads"
              value={estimatedLeads.toLocaleString("en-IN")}
              hint={`@ ₹${cleanCpl} CPL from ₹${cleanAdBudget.toLocaleString("en-IN")} ad spend`}
            />
            <Metric
              label="Estimated customers"
              value={estimatedCustomers.toString()}
              hint={`At ${cleanConversion}% lead-to-client conversion`}
            />
            <Metric
              label="Projected revenue"
              value={formatLakhRupee(projectedRevenue)}
              hint={`ROAS: ${roas.toFixed(1)}x on ad spend`}
            />
            <Metric
              label="Net profit after marketing"
              value={formatLakhRupee(netProfitAfterMarketing)}
              hint={`Total marketing cost: ${formatLakhRupee(totalMarketingInvestment)}/mo`}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-secondary/50 p-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[0.7rem]">Customer Acquisition Cost</span>
              <span className="font-bold text-ink font-mono">{formatLakhRupee(cpa)} / customer</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[0.7rem]">Marketing ROI</span>
              <span className={`font-bold font-mono ${roi >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {roi > 0 ? `+${roi}%` : `${roi}%`}
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Ad budget (₹{cleanAdBudget.toLocaleString("en-IN")}) is deployed directly onto ad platforms. Agency management fee (₹{cleanAgencyFee.toLocaleString("en-IN")}) covers strategy, creative design, copywriting, tracking, and campaign optimization.
          </p>

          <p className="border-t border-border/70 pt-2 text-[0.72rem] text-muted-foreground/80 italic">
            Advertising costs and lead costs vary by industry, campaign quality, seasonality and platform auction dynamics. Indicative estimate for planning purposes only. Benchmarked for Ahmedabad / Gujarat SMB and mid-market business planning.
          </p>
        </>
      }
    >
      <SelectInput
        label="Target industry vertical"
        value={industry}
        onChange={handleIndustryChange}
        options={Object.keys(INDUSTRY_BENCHMARKS)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberInput
          label="Monthly ad budget (₹)"
          value={adBudget}
          onChange={setAdBudget}
          min={10000}
          max={2000000}
          step={5000}
          suffix="Ad spend only"
        />

        <NumberInput
          label="Agency / Management fee (₹)"
          value={agencyFee}
          onChange={setAgencyFee}
          min={0}
          max={500000}
          step={2500}
          suffix="Management"
        />
      </div>

      <div>
        <NumberInput
          label="Average Cost Per Lead (CPL) (₹)"
          value={cpl}
          onChange={setCpl}
          min={50}
          max={5000}
          step={25}
          suffix={`Benchmark: ${benchmark.cplRange}`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberInput
          label="Lead-to-client conversion (%)"
          value={conversionRate}
          onChange={setConversionRate}
          min={0.5}
          max={50}
          step={0.5}
        />

        <NumberInput
          label="Gross business margin (%)"
          value={margin}
          onChange={setMargin}
          min={5}
          max={95}
          step={1}
        />
      </div>

      <NumberInput
        label="Average customer / deal value (₹)"
        value={dealValue}
        onChange={setDealValue}
        min={1000}
        max={10000000}
        step={5000}
      />
    </ToolShell>
  );
}
