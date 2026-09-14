"use client";

import { useState, useMemo } from "react";
import { CheckList, Metric, NumberInput, ResultHeading, SelectInput, ToolShell } from "./ui";
import { formatINR } from "@/lib/lead-scoring";

/* ----------------------- Currency / Number Formatter -------------------- */
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

const COMMON_DISCLAIMER =
  "Indicative guidance only for general planning purposes. Rules, thresholds, statutory fees and compliance requirements are subject to government amendments. Please verify with the relevant government portal (gst.gov.in, mca.gov.in, ipindia.gov.in) or a qualified professional before taking action.";

/* ========================================================================
   1. GST REGISTRATION WIZARD
   ======================================================================== */

const GST_BUSINESS_TYPES = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited Company",
  "One Person Company (OPC)",
  "Other / Trust / Society",
];

const GST_STATES = [
  "Gujarat (Normal state)",
  "Maharashtra (Normal state)",
  "Delhi (Normal state)",
  "Karnataka (Normal state)",
  "Tamil Nadu (Normal state)",
  "Rajasthan (Normal state)",
  "Special Category States (NE, UK, HP, J&K)",
  "Other Indian States / UTs",
];

const GST_TURNOVER_BRACKETS = [
  "Below ₹10 lakh",
  "₹10 – ₹20 lakh",
  "₹20 – ₹40 lakh",
  "₹40 lakh – ₹1.5 crore",
  "Above ₹1.5 crore",
];

const GST_ACTIVITIES = [
  "Goods (Exclusive supply of goods)",
  "Services (Exclusive supply of services)",
  "Goods + Services (Mixed supply)",
  "Exempt / Nil-rated supplies only",
];

export function GstWizard() {
  const [businessType, setBusinessType] = useState("Private Limited Company");
  const [state, setState] = useState("Gujarat (Normal state)");
  const [turnoverBracket, setTurnoverBracket] = useState("₹20 – ₹40 lakh");
  const [activity, setActivity] = useState("Goods + Services (Mixed supply)");
  const [interstate, setInterstate] = useState("No");
  const [ecommerce, setEcommerce] = useState("No");
  const [ecomOperator, setEcomOperator] = useState("No");
  const [rcmOrSpecial, setRcmOrSpecial] = useState("No");
  const [voluntary, setVoluntary] = useState("No");

  // Determine applicable threshold under Sec 22 of CGST Act
  const isSpecialState = state.startsWith("Special Category");
  let thresholdAmount = 4000000; // 40 Lakh for exclusive goods in normal states like Gujarat
  let thresholdLabel = "₹40 Lakh (Goods in Gujarat)";

  if (activity.startsWith("Services") || activity.startsWith("Goods + Services")) {
    thresholdAmount = isSpecialState ? 1000000 : 2000000;
    thresholdLabel = isSpecialState ? "₹10 Lakh (Special state services)" : "₹20 Lakh (Services / Mixed in Gujarat)";
  } else if (isSpecialState) {
    thresholdAmount = 2000000;
    thresholdLabel = "₹20 Lakh (Special category state goods)";
  } else if (activity.startsWith("Exempt")) {
    thresholdAmount = 0;
    thresholdLabel = "Exempt from registration (Sec 23)";
  }

  // Section 24 Compulsory Registration Triggers
  const triggers: string[] = [];

  if (interstate === "Yes") {
    triggers.push("Inter-state taxable supply of goods/services (Sec 24 compulsory trigger)");
  }
  if (ecommerce === "Yes") {
    triggers.push("Supplying goods/services through e-commerce operator");
  }
  if (ecomOperator === "Yes") {
    triggers.push("E-commerce operator liable to collect TCS (Sec 24(x))");
  }
  if (rcmOrSpecial === "Yes") {
    triggers.push("Liable under Reverse Charge Mechanism (RCM) or special taxpayer status");
  }

  // Turnover trigger
  const turnoverCrossed =
    (turnoverBracket === "₹20 – ₹40 lakh" && thresholdAmount <= 2000000) ||
    turnoverBracket === "₹40 lakh – ₹1.5 crore" ||
    turnoverBracket === "Above ₹1.5 crore";

  if (turnoverCrossed && !activity.startsWith("Exempt")) {
    triggers.push(`Aggregate turnover crosses the applicable threshold of ${thresholdLabel}`);
  }

  // Result state
  let resultState: {
    status: string;
    badgeColor: string;
    summary: string;
    triggers: string[];
    scheme: string;
    nextSteps: string[];
    exampleContext: string;
  };

  if (activity.startsWith("Exempt")) {
    resultState = {
      status: "GST registration may not currently be mandatory",
      badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      summary: "Businesses exclusively engaged in supplying non-taxable, nil-rated, or exempt goods/services are generally exempt from GST registration under Section 23 of the CGST Act.",
      triggers: ["Exclusively engaged in exempt/nil-rated supplies"],
      scheme: "Exempt / Not required",
      nextSteps: [
        "Maintain proper invoices and zero-rated supply records",
        "Monitor whether you introduce any incidental taxable goods or services",
        "Verify HSN/SAC codes for exemption status",
      ],
      exampleContext: "Common for agricultural produce traders in APMCs (e.g. Unjha, Rajkot) or pure healthcare/education institutions.",
    };
  } else if (triggers.length > 0) {
    const isSpecialCondition = interstate === "Yes" || ecommerce === "Yes" || ecomOperator === "Yes" || rcmOrSpecial === "Yes";
    resultState = {
      status: isSpecialCondition ? "Special conditions require GST registration" : "GST registration may be required",
      badgeColor: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      summary: isSpecialCondition
        ? "Your business profile satisfies one or more compulsory registration conditions under Section 24 of the CGST Act, which apply regardless of annual turnover."
        : `Your turnover appears to exceed the applicable statutory threshold (${thresholdLabel}) for ${businessType} in ${state.split(" ")[0]}.`,
      triggers,
      scheme:
        interstate === "No" && ecommerce === "No" && turnoverBracket !== "Above ₹1.5 crore" && !activity.startsWith("Services")
          ? "Composition Scheme may be eligible (under ₹1.5 Cr for goods)"
          : "Regular Scheme (Eligible to collect GST and pass on Input Tax Credit)",
      nextSteps: [
        "Apply for GST registration on gst.gov.in within 30 days of becoming liable",
        "Prepare Aadhaar, PAN, Electricity bill/NOC for principal place of business, and bank details",
        "Select correct HSN/SAC codes for your key goods and services",
        "Ensure timely monthly GSTR-1 and GSTR-3B filings post-registration",
      ],
      exampleContext: interstate === "Yes"
        ? "Typical for Ahmedabad manufacturers (Sanand, Changodar, Vatva) or traders dispatching goods to clients in other states."
        : "Standard for Ahmedabad software agencies, consultants, or retail suppliers reaching the ₹20L/₹40L threshold.",
    };
  } else if (rcmOrSpecial === "Not sure" || ecomOperator === "Not sure") {
    resultState = {
      status: "Professional review recommended",
      badgeColor: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      summary: "Your specific reverse charge or e-commerce operator status requires detailed review by a tax professional to determine if compulsory registration rules apply.",
      triggers: ["Uncertainty regarding RCM or e-commerce operator provisions"],
      scheme: "To be evaluated based on transaction flows",
      nextSteps: [
        "Review supplier contracts for inward goods/services subject to reverse charge",
        "Examine marketplace terms (Amazon/Flipkart/Meesho/Shopify TCS rules)",
        "Consult a qualified GST professional or tax consultant",
      ],
      exampleContext: "Relevant for businesses receiving goods transport agency (GTA) services, legal retainers, or import of services.",
    };
  } else if (voluntary === "Yes") {
    resultState = {
      status: "Voluntary GST registration suitable",
      badgeColor: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      summary: "While your turnover is below statutory limits and no compulsory conditions are triggered, voluntary registration enables you to claim Input Tax Credit (ITC) and work smoothly with B2B corporate buyers.",
      triggers: ["Opted for voluntary business credibility & ITC benefits"],
      scheme: "Regular Scheme (Voluntary)",
      nextSteps: [
        "Ensure preparedness for monthly/quarterly return filings (GSTR-1, GSTR-3B)",
        "Open a current bank account linked with GSTIN",
        "Issue tax invoices to enable GST credit for your B2B customers",
      ],
      exampleContext: "Ideal for early-stage Ahmedabad startups, sub-contractors, and tech agencies serving corporate clients that demand valid GST invoices.",
    };
  } else {
    resultState = {
      status: "GST registration may not currently be mandatory",
      badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      summary: `Your aggregate turnover is below the ${thresholdLabel} statutory limit, and no Section 24 compulsory conditions were indicated.`,
      triggers: ["Turnover currently within statutory threshold", "No inter-state taxable supplies reported"],
      scheme: "Not applicable unless voluntarily opted",
      nextSteps: [
        "Track monthly cumulative turnover as your business scales",
        "Apply for registration within 30 days once you approach the threshold",
        "Consider voluntary registration if your corporate clients demand input tax credit",
      ],
      exampleContext: "Common for local neighbourhood retail stores, freelance consultants, and early-stage small service providers operating strictly within Gujarat.",
    };
  }

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>GST Assessment Summary</ResultHeading>
          <div className="mt-5 grid gap-3">
            <div className={`rounded-2xl border p-4 ${resultState.badgeColor}`}>
              <p className="text-xs font-bold uppercase tracking-wider">Assessment Status</p>
              <p className="mt-1 font-display text-lg font-bold">{resultState.status}</p>
            </div>

            <Metric label="Applicable threshold" value={thresholdLabel} />
            <Metric label="Filing scheme guidance" value={resultState.scheme} />
            <Metric label="Typical processing timeline" value="3 – 7 working days" hint="Post Aadhaar authentication on portal" />
          </div>

          <div className="mt-5 space-y-3 text-xs leading-relaxed text-muted-foreground">
            <div>
              <p className="font-bold text-ink uppercase tracking-wider text-[0.7rem]">Evaluation Factors</p>
              <ul className="mt-1.5 list-disc pl-4 space-y-1">
                {resultState.triggers.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-bold text-ink uppercase tracking-wider text-[0.7rem]">Recommended Next Steps</p>
              <ul className="mt-1.5 list-disc pl-4 space-y-1">
                {resultState.nextSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-secondary/50 p-2.5">
              <span className="font-bold text-ink text-[0.7rem]">Ahmedabad / Gujarat Context: </span>
              <span>{resultState.exampleContext}</span>
            </div>

            <p className="border-t border-border/70 pt-2 text-[0.72rem] text-muted-foreground/80 italic">
              {COMMON_DISCLAIMER}
            </p>
          </div>
        </>
      }
    >
      <SelectInput
        label="Business structure"
        value={businessType}
        onChange={setBusinessType}
        options={GST_BUSINESS_TYPES}
      />

      <SelectInput
        label="Principal state of business"
        value={state}
        onChange={setState}
        options={GST_STATES}
      />

      <SelectInput
        label="Annual aggregate turnover bracket"
        value={turnoverBracket}
        onChange={setTurnoverBracket}
        options={GST_TURNOVER_BRACKETS}
      />

      <SelectInput
        label="Main business activity"
        value={activity}
        onChange={setActivity}
        options={GST_ACTIVITIES}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput
          label="Inter-state taxable supply of goods/services?"
          value={interstate}
          onChange={setInterstate}
          options={["No", "Yes"]}
        />

        <SelectInput
          label="Selling through e-commerce portals?"
          value={ecommerce}
          onChange={setEcommerce}
          options={["No", "Yes"]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput
          label="E-commerce operator / TCS situation?"
          value={ecomOperator}
          onChange={setEcomOperator}
          options={["No", "Yes", "Not sure"]}
        />

        <SelectInput
          label="Reverse charge (RCM) or special condition?"
          value={rcmOrSpecial}
          onChange={setRcmOrSpecial}
          options={["No", "Yes", "Not sure"]}
        />
      </div>

      <SelectInput
        label="Considering voluntary registration for B2B input tax credit?"
        value={voluntary}
        onChange={setVoluntary}
        options={["No", "Yes"]}
      />
    </ToolShell>
  );
}

/* ========================================================================
   2. COMPANY REGISTRATION SELECTOR
   ======================================================================== */

const FOUNDER_OPTIONS = ["1 founder", "2 co-founders", "3–5 co-founders", "6+ founders"];

const OBJECTIVE_OPTIONS = [
  "Small / Local trading or retail",
  "Professional services / Consulting",
  "Technology / SaaS & digital startup",
  "Manufacturing & Engineering industrial",
  "Family-owned business",
  "High-growth startup / Investor-oriented",
];

const FUNDING_OPTIONS = [
  "No external funding (Bootstrapped)",
  "Bank loans / NBFC credit lines",
  "Angel / Venture Capital equity investors",
  "Maybe equity investors in 1–3 years",
];

type EntityStructure = {
  name: string;
  category: string;
  govtFeesInfo: string;
  profFeesRange: string;
  timeline: string;
  liability: string;
  complianceLevel: string;
  scalability: string;
  fundraising: string;
  bestSuitedFor: string;
  typicalGujaratUseCase: string;
  mainLimitation: string;
};

const STRUCTURES: Record<string, EntityStructure> = {
  "Private Limited Company": {
    name: "Private Limited Company (Pvt Ltd)",
    category: "Corporate Body",
    govtFeesInfo: "₹1,000 – ₹3,500 statutory name approval & stamp duty (Gujarat MCA)",
    profFeesRange: "₹6,500 – ₹14,000 (Assistance, DSC, drafting, DIN, PAN, TAN)",
    timeline: "7 – 12 working days",
    liability: "Limited to unpaid share capital",
    complianceLevel: "Moderate to High (Statutory audit, ROC annual filings, board meetings)",
    scalability: "Highest (Clean equity splitting, ESOPs, multiple share classes)",
    fundraising: "Ideal (The mandatory legal vehicle for VC, angel and institutional funding)",
    bestSuitedFor: "High-growth startups, technology companies, scalable manufacturing units, and businesses seeking external equity investment.",
    typicalGujaratUseCase: "Fintech, SaaS, industrial manufacturing, and tech hubs across Ahmedabad (SG Highway, GIFT City, Sanand).",
    mainLimitation: "Requires annual statutory audit by an independent CA regardless of turnover; strict corporate compliance rules.",
  },
  "Limited Liability Partnership": {
    name: "Limited Liability Partnership (LLP)",
    category: "Hybrid Body",
    govtFeesInfo: "₹1,000 – ₹2,500 MCA filing fee & Gujarat LLP agreement stamp duty",
    profFeesRange: "₹5,500 – ₹10,000 (Drafting deed, DPIN, registration)",
    timeline: "8 – 14 working days",
    liability: "Limited to agreed capital contribution",
    complianceLevel: "Moderate (Form 11 & Form 8 annual filing; audit required only if turnover > ₹40L or capital > ₹25L)",
    scalability: "High for partners; limited for venture capital",
    fundraising: "Debt & partner loans suitable; not suitable for venture equity or ESOPs",
    bestSuitedFor: "Professional service firms, consulting agencies, trading businesses, and collaborative partnerships wanting limited liability without corporate audit overhead.",
    typicalGujaratUseCase: "Widely favoured by CA firms, architects, software consultancies, and textile trading houses in Ahmedabad & Surat.",
    mainLimitation: "Cannot issue shares or stock options (ESOPs) to employees or equity investors.",
  },
  "One Person Company": {
    name: "One Person Company (OPC)",
    category: "Single-Member Corporate",
    govtFeesInfo: "₹1,000 – ₹2,500 statutory filing fees & Gujarat stamp duty",
    profFeesRange: "₹6,000 – ₹11,000 (DSC, nominee consent, SPICe+ filing)",
    timeline: "7 – 10 working days",
    liability: "Limited to shareholding",
    complianceLevel: "Moderate (Lighter than Pvt Ltd, but requires annual ROC return & audit)",
    scalability: "Moderate (Can convert to regular Pvt Ltd as business expands)",
    fundraising: "Bank loans and personal debt; cannot add equity co-investors while an OPC",
    bestSuitedFor: "Solo entrepreneurs who desire limited liability protection and corporate credibility while retaining 100% control.",
    typicalGujaratUseCase: "Solo tech consultants, e-commerce brand owners, and independent professionals in Ahmedabad.",
    mainLimitation: "Mandatory requirement to name a nominee director; can only have one shareholder at a time.",
  },
  "Sole Proprietorship": {
    name: "Sole Proprietorship",
    category: "Unincorporated Entity",
    govtFeesInfo: "Zero central MCA fee; ₹500 – ₹1,500 for Gujarat Shops & Establishments (Gumasta) or Udyam",
    profFeesRange: "₹1,500 – ₹3,500 (Udyam, Gumasta, and bank account setup)",
    timeline: "2 – 4 working days",
    liability: "Unlimited personal liability (Personal assets exposed to business claims)",
    complianceLevel: "Lowest (Only income tax ITR-3/4 on personal PAN & GST if applicable)",
    scalability: "Low (Tied directly to the proprietor's individual identity)",
    fundraising: "Personal bank loans / MSME overdraft only; no equity issuance",
    bestSuitedFor: "Local retail shops, freelance service providers, and micro businesses testing a local market with minimal startup cost.",
    typicalGujaratUseCase: "Local traders, retail merchants, and individual service providers across Ahmedabad markets.",
    mainLimitation: "No legal separation between owner and business; personal assets are at risk in case of business debts.",
  },
  "Partnership Firm": {
    name: "Partnership Firm (Registered / Unregistered)",
    category: "Unincorporated Association",
    govtFeesInfo: "₹1,000 – ₹2,500 for Gujarat Registrar of Firms (ROF) stamp duty & deed",
    profFeesRange: "₹3,500 – ₹7,500 (Partnership deed drafting & ROF filing)",
    timeline: "5 – 10 working days",
    liability: "Unlimited joint and several liability among all partners",
    complianceLevel: "Low to Moderate (Partnership deed, PAN, tax return)",
    scalability: "Moderate within trusted partners",
    fundraising: "Bank credit and partner equity only",
    bestSuitedFor: "Traditional family businesses, trading partnerships, and small ventures between trusted partners where limited liability is not critical.",
    typicalGujaratUseCase: "Generational wholesale trading, textile brokerage, and distribution agencies in older commercial hubs.",
    mainLimitation: "Each partner is personally liable for the debts and actions incurred by other partners in the ordinary course of business.",
  },
};

export function CompanyRegistrationSelector() {
  const [founders, setFounders] = useState("2 co-founders");
  const [objective, setObjective] = useState("Technology / SaaS & digital startup");
  const [funding, setFunding] = useState("Angel / Venture Capital equity investors");
  const [needLiability, setNeedLiability] = useState("Yes");
  const [separateEntity, setSeparateEntity] = useState("Yes");
  const [scale, setScale] = useState("Growing SME / Regional player");

  // Selection recommendation algorithm
  const isSolo = founders === "1 founder";
  const wantsVC = funding.includes("Angel / Venture Capital") || funding.includes("Maybe equity investors");
  const isTechOrStartup = objective.includes("Technology / SaaS") || objective.includes("High-growth");
  const wantsLimitedLiability = needLiability !== "No";

  let recommendedKey = "Private Limited Company";

  if (wantsVC || (isTechOrStartup && !isSolo)) {
    recommendedKey = "Private Limited Company";
  } else if (isSolo) {
    if (wantsLimitedLiability && separateEntity === "Yes") {
      recommendedKey = "One Person Company";
    } else {
      recommendedKey = "Sole Proprietorship";
    }
  } else if (wantsLimitedLiability) {
    recommendedKey = "Limited Liability Partnership";
  } else if (objective.includes("Family-owned") || objective.includes("trading")) {
    recommendedKey = "Partnership Firm";
  } else {
    recommendedKey = "Limited Liability Partnership";
  }

  const fallbackStructure = STRUCTURES["Private Limited Company"]!;
  const rec = STRUCTURES[recommendedKey] ?? fallbackStructure;

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Entity Structure Recommendation</ResultHeading>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-primary">
                Recommended Structure
              </span>
              <h3 className="mt-1 font-display text-xl font-extrabold text-ink">{rec.name}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{rec.bestSuitedFor}</p>
            </div>

            <Metric label="Liability protection" value={rec.liability} />
            <Metric label="Statutory compliance burden" value={rec.complianceLevel} />
            <Metric label="Equity & fundraising capacity" value={rec.fundraising} />
            <Metric label="Typical incorporation turnaround" value={rec.timeline} />
          </div>

          <div className="mt-5 space-y-3 text-xs leading-relaxed text-muted-foreground">
            {/* Fee Transparency */}
            <div className="rounded-2xl border border-border bg-secondary/40 p-3 space-y-1.5">
              <p className="font-bold text-ink uppercase tracking-wider text-[0.7rem]">Fee Breakdown Transparency</p>
              <div className="flex justify-between border-b border-border/60 pb-1">
                <span>Government / Statutory Fee:</span>
                <span className="font-semibold text-ink font-mono">{rec.govtFeesInfo}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Professional Assistance:</span>
                <span className="font-semibold text-ink font-mono">{rec.profFeesRange}</span>
              </div>
            </div>

            <div>
              <p className="font-bold text-ink uppercase tracking-wider text-[0.7rem]">Ahmedabad / Gujarat Business Context</p>
              <p className="mt-1">{rec.typicalGujaratUseCase}</p>
            </div>

            <div className="rounded-xl bg-destructive/5 border border-destructive/15 p-2.5 text-ink">
              <span className="font-bold text-[0.7rem] text-destructive">Primary Consideration: </span>
              <span className="text-xs">{rec.mainLimitation}</span>
            </div>

            <p className="border-t border-border/70 pt-2 text-[0.72rem] text-muted-foreground/80 italic">
              {COMMON_DISCLAIMER}
            </p>
          </div>
        </>
      }
    >
      <SelectInput
        label="Number of founders / equity owners"
        value={founders}
        onChange={setFounders}
        options={FOUNDER_OPTIONS}
      />

      <SelectInput
        label="Primary business objective & industry"
        value={objective}
        onChange={setObjective}
        options={OBJECTIVE_OPTIONS}
      />

      <SelectInput
        label="Do you expect external investors or equity fundraising?"
        value={funding}
        onChange={setFunding}
        options={FUNDING_OPTIONS}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput
          label="Need limited liability protection?"
          value={needLiability}
          onChange={setNeedLiability}
          options={["Yes", "No", "Not sure"]}
        />

        <SelectInput
          label="Desire separate legal corporate entity?"
          value={separateEntity}
          onChange={setSeparateEntity}
          options={["Yes", "No", "Not sure"]}
        />
      </div>

      <SelectInput
        label="Planned scale of operations"
        value={scale}
        onChange={setScale}
        options={[
          "Small / Local scale",
          "Growing SME / Regional player",
          "High-growth startup / Pan-India scale",
          "Large enterprise / Multi-state expansion",
        ]}
      />
    </ToolShell>
  );
}

/* ========================================================================
   3. TRADEMARK GUIDE
   ======================================================================== */

const TM_APPLICANT_TYPES = [
  "Individual / Sole Proprietor",
  "Startup (DPIIT recognized)",
  "Small Enterprise / MSME (Udyam registered)",
  "Private Limited Company / Corporate",
  "Partnership Firm / LLP",
  "Other / Trust / Society",
];

const TM_PROTECTION_TYPES = [
  "Brand name / Wordmark",
  "Logo / Device mark",
  "Brand name + Logo combined",
  "Product name / Sub-brand",
  "Tagline / Slogan",
];

const TM_CATEGORIES = [
  { label: "IT / Software & SaaS", classes: "Class 9, Class 42" },
  { label: "AI / Technology & Digital", classes: "Class 9, Class 42" },
  { label: "Finance & Legal Services", classes: "Class 36, Class 45" },
  { label: "Real Estate & Construction", classes: "Class 36, Class 37" },
  { label: "Textile, Apparel & Garments (Gujarat Hub)", classes: "Class 24, Class 25" },
  { label: "Chemicals, Dyes & Pharma (Gujarat Hub)", classes: "Class 1, Class 5" },
  { label: "Manufacturing & Machinery", classes: "Class 7, Class 9, Class 11" },
  { label: "Food, Snacks & Agro (FMCG)", classes: "Class 29, Class 30, Class 43" },
  { label: "Retail, Wholesale & E-commerce", classes: "Class 35" },
  { label: "Education & Coaching Institutes", classes: "Class 41" },
  { label: "Healthcare & Diagnostics", classes: "Class 10, Class 44" },
  { label: "Professional Services / Consulting", classes: "Class 35, Class 42" },
];

export function TrademarkGuide() {
  const [applicantType, setApplicantType] = useState("Small Enterprise / MSME (Udyam registered)");
  const [protectionType, setProtectionType] = useState("Brand name + Logo combined");
  const [sector, setSector] = useState("IT / Software & SaaS");
  const [classCount, setClassCount] = useState(1);
  const [filingType, setFilingType] = useState("Standard e-filing (TM-A)");
  const [usageStatus, setUsageStatus] = useState("Proposed to be used (Fresh mark)");

  // Official IP India Statutory Filing Fees (Form TM-A)
  // Individual / Startup / MSME = ₹4,500 per class per mark
  // Others (Large companies / non-MSME) = ₹9,000 per class per mark
  const isConcessionApplicant =
    applicantType.startsWith("Individual") ||
    applicantType.startsWith("Startup") ||
    applicantType.startsWith("Small Enterprise");

  const govtFeePerClass = isConcessionApplicant ? 4500 : 9000;
  const expeditedGovtFeePerClass = isConcessionApplicant ? 20000 : 40000;
  const isExpedited = filingType.includes("Expedited");

  const effectiveGovtFeePerClass = isExpedited ? expeditedGovtFeePerClass : govtFeePerClass;
  const totalGovtFilingFee = effectiveGovtFeePerClass * classCount;

  // Professional / Service Fee (Separate and transparent)
  const profFeePerClass = isExpedited ? 6000 : 3500;
  const totalProfFee = profFeePerClass * classCount;
  const totalPlanningEstimate = totalGovtFilingFee + totalProfFee;

  const currentSectorObj = TM_CATEGORIES.find((c) => c.label === sector) ?? TM_CATEGORIES[0]!;

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Trademark Filing Plan</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric
              label="Statutory Government Filing Fee"
              value={formatINR(totalGovtFilingFee)}
              hint={`Strictly government fee: ${formatINR(effectiveGovtFeePerClass)} × ${classCount} class(es)`}
            />

            <Metric
              label="Professional Assistance Fee"
              value={formatINR(totalProfFee)}
              hint="Search, drafting specification, filing & tracking"
            />

            <Metric
              label="Total Planning Estimate"
              value={formatINR(totalPlanningEstimate)}
              hint="Government fee + professional assistance"
            />

            <Metric
              label="Symbol usage timeline"
              value="™ from filing date"
              hint="® strictly after registration certificate is issued (typically 8–18 months)"
            />
          </div>

          <div className="mt-5 space-y-3 text-xs leading-relaxed text-muted-foreground">
            {/* Suggested Classes */}
            <div className="rounded-2xl border border-border bg-secondary/40 p-3">
              <span className="font-bold text-ink uppercase tracking-wider text-[0.7rem]">Recommended Nice Classes:</span>
              <p className="mt-1 font-semibold text-primary">{currentSectorObj.classes}</p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                Class selection defines the legal perimeter of your monopoly. Filing in the wrong class leaves your core commercial activity unprotected.
              </p>
            </div>

            {/* Mandatory Search & Process */}
            <div>
              <p className="font-bold text-ink uppercase tracking-wider text-[0.7rem]">Statutory Filing Lifecycle</p>
              <ol className="mt-1.5 list-decimal pl-4 space-y-1">
                <li><strong className="text-ink">Comprehensive Public Search:</strong> Check phonetic and visual conflicts on IP India registry before paying government fees.</li>
                <li><strong className="text-ink">Filing Form TM-A:</strong> Generation of application number enabling immediate legal use of the ™ symbol.</li>
                <li><strong className="text-ink">Examination Stage:</strong> Trademark examiner inspects mark for distinctiveness (Sec 9) and similarity (Sec 11).</li>
                <li><strong className="text-ink">Journal Publication:</strong> Mark advertised in the official Trademark Journal for 4 months for public scrutiny.</li>
                <li><strong className="text-ink">Registration Certificate:</strong> Valid for 10 years across all states in India, renewable indefinitely.</li>
              </ol>
            </div>

            {usageStatus.includes("Already") ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-amber-800 dark:text-amber-300">
                <strong>Prior Commercial Use:</strong> Claiming prior usage requires notarized user affidavit with dated invoices, GST bills, or marketing evidence from the first date of use.
              </div>
            ) : null}

            <p className="border-t border-border/70 pt-2 text-[0.72rem] text-muted-foreground/80 italic">
              {COMMON_DISCLAIMER}
            </p>
          </div>
        </>
      }
    >
      <SelectInput
        label="Applicant category (Govt fee determinant)"
        value={applicantType}
        onChange={setApplicantType}
        options={TM_APPLICANT_TYPES}
      />

      <SelectInput
        label="What are you protecting?"
        value={protectionType}
        onChange={setProtectionType}
        options={TM_PROTECTION_TYPES}
      />

      <SelectInput
        label="Primary business vertical / sector"
        value={sector}
        onChange={setSector}
        options={TM_CATEGORIES.map((c) => c.label)}
      />

      <NumberInput
        label="Number of trademark classes to protect"
        value={classCount}
        onChange={setClassCount}
        min={1}
        max={10}
        step={1}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectInput
          label="Filing procedure"
          value={filingType}
          onChange={setFilingType}
          options={["Standard e-filing (TM-A)", "Expedited process (Rule 34)"]}
        />

        <SelectInput
          label="Current usage of the brand"
          value={usageStatus}
          onChange={setUsageStatus}
          options={["Proposed to be used (Fresh mark)", "Already in commercial use (With proof)"]}
        />
      </div>
    </ToolShell>
  );
}

/* ========================================================================
   4. COMPLIANCE CHECKLIST
   ======================================================================== */

type ComplianceItem = {
  id: string;
  category: string;
  task: string;
  frequency: "Monthly" | "Quarterly" | "Half-Yearly" | "Annual" | "Event-Based";
  priority: "High" | "Medium" | "Standard";
  statusNote: string;
  explanation: string;
  appliesTo: (ctx: {
    entity: string;
    isGst: boolean;
    isComposition: boolean;
    employees: number;
    activity: string;
    isTds: boolean;
    isGujaratPt: boolean;
  }) => boolean;
};

const MASTER_COMPLIANCE_RULES: ComplianceItem[] = [
  // GST
  {
    id: "gst_r1",
    category: "GST Compliances",
    task: "GSTR-1 (Outward Supplies Return)",
    frequency: "Monthly",
    priority: "High",
    statusNote: "Required by the 11th of every month (or quarterly under QRMP)",
    explanation: "Reports all sales invoices, B2B supplies, and debit/credit notes to enable customer input tax credit.",
    appliesTo: (ctx) => ctx.isGst && !ctx.isComposition,
  },
  {
    id: "gst_r3b",
    category: "GST Compliances",
    task: "GSTR-3B (Summary Return & Tax Payment)",
    frequency: "Monthly",
    priority: "High",
    statusNote: "Mandatory by the 20th of every month",
    explanation: "Reconciles input tax credit with supplier GSTR-2B, self-assesses output liability, and deposits net cash tax.",
    appliesTo: (ctx) => ctx.isGst && !ctx.isComposition,
  },
  {
    id: "gst_cmp08",
    category: "GST Compliances",
    task: "CMP-08 (Composition Scheme Statement)",
    frequency: "Quarterly",
    priority: "High",
    statusNote: "Due on the 18th following quarter end",
    explanation: "Quarterly summary payment statement for small taxpayers registered under the GST Composition scheme.",
    appliesTo: (ctx) => ctx.isGst && ctx.isComposition,
  },
  {
    id: "gst_annual_9",
    category: "GST Compliances",
    task: "GSTR-9 / 9C Annual Return",
    frequency: "Annual",
    priority: "Medium",
    statusNote: "Due by December 31st following the financial year",
    explanation: "Consolidated annual return and self-certified reconciliation for registered taxpayers crossing statutory thresholds.",
    appliesTo: (ctx) => ctx.isGst,
  },

  // Income Tax & TDS
  {
    id: "advance_tax",
    category: "Income Tax & TDS",
    task: "Advance Tax Installments (Sec 208)",
    frequency: "Quarterly",
    priority: "High",
    statusNote: "Due June 15, Sept 15, Dec 15, and March 15",
    explanation: "Mandatory for all businesses whose estimated tax liability exceeds ₹10,000 in a financial year to prevent interest under Sec 234B/C.",
    appliesTo: () => true,
  },
  {
    id: "tds_monthly",
    category: "Income Tax & TDS",
    task: "Monthly TDS Payment (Challan 281)",
    frequency: "Monthly",
    priority: "High",
    statusNote: "Due by the 7th of the subsequent month (April 30 for March)",
    explanation: "Deposit of tax deducted at source on contractor payments (194C), professional fees (194J), rent (194I), and salaries (192).",
    appliesTo: (ctx) => ctx.isTds,
  },
  {
    id: "tds_quarterly_returns",
    category: "Income Tax & TDS",
    task: "Quarterly TDS Returns (Form 24Q / 26Q)",
    frequency: "Quarterly",
    priority: "High",
    statusNote: "Due by the 31st of the month following quarter end",
    explanation: "Detailed return of all deductor transactions; late filing attracts a mandatory ₹200/day penalty under Sec 234E.",
    appliesTo: (ctx) => ctx.isTds,
  },
  {
    id: "itr_business",
    category: "Income Tax & TDS",
    task: "Annual Income Tax Return (ITR-3 / 5 / 6)",
    frequency: "Annual",
    priority: "High",
    statusNote: "Due July 31 (non-audit) or October 31 (corporate/audit)",
    explanation: "Annual filing of audited or compiled financial accounts with the Income Tax Department.",
    appliesTo: () => true,
  },
  {
    id: "tax_audit_44ab",
    category: "Income Tax & TDS",
    task: "Tax Audit under Section 44AB",
    frequency: "Annual",
    priority: "Medium",
    statusNote: "Due September 30 by a practicing Chartered Accountant",
    explanation: "Applies if business turnover crosses statutory limits (₹1 Cr for cash or ₹10 Cr if digital transactions exceed 95%).",
    appliesTo: (ctx) => ctx.activity.includes("Manufacturing") || ctx.activity.includes("Trading") || ctx.entity.includes("Company"),
  },

  // Corporate & MCA (Pvt Ltd, OPC, LLP)
  {
    id: "mca_aoc4",
    category: "ROC & MCA Compliance",
    task: "Form AOC-4 (Financial Statements Filing)",
    frequency: "Annual",
    priority: "High",
    statusNote: "Due within 30 days of Annual General Meeting (AGM)",
    explanation: "Statutory submission of balance sheet, profit and loss account, auditor's report, and board report to the Ministry of Corporate Affairs.",
    appliesTo: (ctx) => ctx.entity.includes("Company") || ctx.entity.includes("OPC"),
  },
  {
    id: "mca_mgt7",
    category: "ROC & MCA Compliance",
    task: "Form MGT-7 / MGT-7A (Annual Return)",
    frequency: "Annual",
    priority: "High",
    statusNote: "Due within 60 days of AGM",
    explanation: "Discloses company shareholding structure, director changes, board meetings, and statutory records to the ROC.",
    appliesTo: (ctx) => ctx.entity.includes("Company") || ctx.entity.includes("OPC"),
  },
  {
    id: "llp_form11",
    category: "ROC & MCA Compliance",
    task: "Form 11 (LLP Annual Return)",
    frequency: "Annual",
    priority: "High",
    statusNote: "Due by May 30th of every financial year",
    explanation: "Annual declaration of partner contributions and management details; late filing attracts a cumulative per-day fine.",
    appliesTo: (ctx) => ctx.entity.includes("LLP"),
  },
  {
    id: "llp_form8",
    category: "ROC & MCA Compliance",
    task: "Form 8 (LLP Statement of Accounts & Solvency)",
    frequency: "Annual",
    priority: "High",
    statusNote: "Due by October 30th of every financial year",
    explanation: "Mandatory statement confirming solvency and asset-liability declarations signed by designated partners.",
    appliesTo: (ctx) => ctx.entity.includes("LLP"),
  },
  {
    id: "dir3_kyc",
    category: "ROC & MCA Compliance",
    task: "DIR-3 KYC / Web KYC for Directors & DPIN Holders",
    frequency: "Annual",
    priority: "High",
    statusNote: "Due on or before September 30th annually",
    explanation: "Mandatory annual identity verification for every active DIN/DPIN holder; non-compliance deactivates the DIN with a ₹5,000 penalty.",
    appliesTo: (ctx) => ctx.entity.includes("Company") || ctx.entity.includes("OPC") || ctx.entity.includes("LLP"),
  },
  {
    id: "statutory_audit",
    category: "ROC & MCA Compliance",
    task: "Statutory Financial Audit by Independent CA",
    frequency: "Annual",
    priority: "High",
    statusNote: "Before AGM approval",
    explanation: "Mandatory statutory verification of corporate books by a Chartered Accountant under the Companies Act.",
    appliesTo: (ctx) => ctx.entity.includes("Company") || ctx.entity.includes("OPC"),
  },

  // Payroll, PF, ESIC & Gujarat Professional Tax
  {
    id: "gujarat_pt_ptrc",
    category: "Payroll & Labor Compliances",
    task: "Gujarat Professional Tax (PTRC Monthly Challan)",
    frequency: "Monthly",
    priority: "High",
    statusNote: "Due by the 15th of the subsequent month in Gujarat",
    explanation: "Employer deduction and deposit of employee Professional Tax based on Gujarat Commercial Tax slab rates.",
    appliesTo: (ctx) => ctx.employees > 0 && ctx.isGujaratPt,
  },
  {
    id: "gujarat_pt_ptec",
    category: "Payroll & Labor Compliances",
    task: "Gujarat Professional Tax (PTEC Annual Fee)",
    frequency: "Annual",
    priority: "Medium",
    statusNote: "Due by September 30th annually (₹2,400 typical for companies/directors)",
    explanation: "Statutory professional tax paid by the entity, directors, and designated partners for trading or carrying out profession in Gujarat.",
    appliesTo: (ctx) => ctx.isGujaratPt,
  },
  {
    id: "epf_monthly",
    category: "Payroll & Labor Compliances",
    task: "EPF Monthly Contribution & ECR Challan",
    frequency: "Monthly",
    priority: "High",
    statusNote: "Due by the 15th of the subsequent month",
    explanation: "Mandatory for organizations with 20 or more staff (or voluntary below 20); covers provident fund and pension deductions.",
    appliesTo: (ctx) => ctx.employees >= 20,
  },
  {
    id: "esic_monthly",
    category: "Payroll & Labor Compliances",
    task: "ESIC Monthly Contribution & Portal Filing",
    frequency: "Monthly",
    priority: "High",
    statusNote: "Due by the 15th of the subsequent month",
    explanation: "Health and medical insurance contribution for employees earning up to ₹21,000 monthly in eligible establishments.",
    appliesTo: (ctx) => ctx.employees >= 10,
  },
  {
    id: "posh_annual",
    category: "Payroll & Labor Compliances",
    task: "POSH Policy & Internal Complaints Committee (ICC)",
    frequency: "Annual",
    priority: "Medium",
    statusNote: "Annual compliance return to district officer",
    explanation: "Mandatory under the Prevention of Sexual Harassment Act for establishments with 10 or more employees.",
    appliesTo: (ctx) => ctx.employees >= 10,
  },

  // Registers & Commercial
  {
    id: "msme_form1",
    category: "Registers & Commercial Records",
    task: "MSME-1 Half-Yearly Return",
    frequency: "Half-Yearly",
    priority: "Medium",
    statusNote: "Due April 30 and October 31",
    explanation: "Mandatory for companies with outstanding payments to Micro or Small enterprises exceeding 45 days under Sec 15 of the MSMED Act.",
    appliesTo: (ctx) => ctx.entity.includes("Company"),
  },
  {
    id: "statutory_registers",
    category: "Registers & Commercial Records",
    task: "Statutory Registers & Board Minutes Maintenance",
    frequency: "Event-Based",
    priority: "Medium",
    statusNote: "Updated within 7–30 days of corporate events",
    explanation: "Physical or digital maintenance of register of members, directors, charges, contracts, and board/AGM minutes.",
    appliesTo: (ctx) => ctx.entity.includes("Company") || ctx.entity.includes("LLP"),
  },
];

export function ComplianceChecklist() {
  const [entity, setEntity] = useState("Private Limited Company");
  const [gstStatus, setGstStatus] = useState("Yes (Regular scheme)");
  const [employees, setEmployees] = useState("1–10 employees");
  const [activity, setActivity] = useState("Services & IT / Consulting");
  const [tdsApplicable, setTdsApplicable] = useState("Yes");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // Parse employee count for threshold logic
  const empCount =
    employees === "0 (Founders only)"
      ? 0
      : employees === "1–10 employees"
        ? 6
        : employees === "11–19 employees"
          ? 15
          : employees === "20–50 employees"
            ? 30
            : 60;

  const ctx = useMemo(
    () => ({
      entity,
      isGst: gstStatus.startsWith("Yes"),
      isComposition: gstStatus.includes("Composition"),
      employees: empCount,
      activity,
      isTds: tdsApplicable === "Yes",
      isGujaratPt: true, // Default Gujarat
    }),
    [entity, gstStatus, empCount, activity, tdsApplicable],
  );

  const applicableItems = useMemo(
    () => MASTER_COMPLIANCE_RULES.filter((r) => r.appliesTo(ctx)),
    [ctx],
  );

  const highPriorityCount = applicableItems.filter((i) => i.priority === "High").length;
  const completedCount = applicableItems.filter((i) => checkedIds.includes(i.id)).length;
  const pendingCount = applicableItems.length - completedCount;

  // Group by category
  const categories = useMemo(() => {
    const map = new Map<string, ComplianceItem[]>();
    for (const item of applicableItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [applicableItems]);

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Dynamic Compliance Calendar</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric
              label="Applicable statutory obligations"
              value={`${applicableItems.length} Tasks`}
              hint={`${highPriorityCount} critical high-priority filings`}
            />

            <Metric
              label="Review progress"
              value={`${completedCount} / ${applicableItems.length} Reviewed`}
              hint={pendingCount === 0 ? "All verified!" : `${pendingCount} items to verify`}
            />

            <Metric
              label="Primary jurisdiction"
              value="Gujarat & Central MCA/CBIC"
              hint="Includes Gujarat Professional Tax (PTRC & PTEC)"
            />
          </div>

          {/* Categorized Checklist View */}
          <div className="mt-6 space-y-5">
            {categories.map(([categoryName, items]) => (
              <div key={categoryName} className="rounded-2xl border border-border bg-card p-4">
                <h4 className="font-display text-sm font-bold text-ink flex items-center justify-between">
                  <span>{categoryName}</span>
                  <span className="text-[0.68rem] text-primary font-mono font-semibold">
                    {items.length} filing(s)
                  </span>
                </h4>

                <div className="mt-3 space-y-2.5">
                  {items.map((item) => {
                    const isChecked = checkedIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          isChecked
                            ? "bg-secondary/20 border-border/60"
                            : "bg-background border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            id={`task-${item.id}`}
                            checked={isChecked}
                            onChange={() =>
                              setCheckedIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id],
                              )
                            }
                            className="mt-0.5 h-4 w-4 accent-[var(--color-primary)] shrink-0 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`task-${item.id}`}
                              className={`text-xs font-bold block cursor-pointer ${
                                isChecked ? "text-muted-foreground line-through" : "text-ink"
                              }`}
                            >
                              {item.task}
                            </label>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.65rem]">
                              <span className="rounded bg-secondary px-1.5 py-0.5 font-semibold text-muted-foreground">
                                {item.frequency}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 font-bold ${
                                  item.priority === "High"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {item.priority} Priority
                              </span>
                              <span className="text-muted-foreground font-mono">{item.statusNote}</span>
                            </div>

                            <p className="mt-1.5 text-[0.7rem] text-muted-foreground leading-relaxed">
                              {item.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 border-t border-border/70 pt-2 text-[0.72rem] text-muted-foreground/80 italic">
            {COMMON_DISCLAIMER}
          </p>
        </>
      }
    >
      <SelectInput
        label="Entity type"
        value={entity}
        onChange={setEntity}
        options={[
          "Private Limited Company",
          "Limited Liability Partnership (LLP)",
          "One Person Company (OPC)",
          "Partnership Firm",
          "Sole Proprietorship",
        ]}
      />

      <SelectInput
        label="GST registration status"
        value={gstStatus}
        onChange={setGstStatus}
        options={["Yes (Regular scheme)", "Yes (Composition scheme)", "No (Unregistered)"]}
      />

      <SelectInput
        label="Employee & workforce count"
        value={employees}
        onChange={setEmployees}
        options={[
          "0 (Founders only)",
          "1–10 employees",
          "11–19 employees",
          "20–50 employees (EPF mandatory at 20+)",
          "50+ employees (Gratuity, ESIC & POSH mandatory)",
        ]}
      />

      <SelectInput
        label="Primary business activity"
        value={activity}
        onChange={setActivity}
        options={[
          "Services & IT / Consulting",
          "Trading & Wholesale Distribution",
          "Manufacturing & Industrial Engineering",
          "E-commerce & Online Marketplace",
          "Other / Mixed Operations",
        ]}
      />

      <SelectInput
        label="TDS applicability (Tax deduction on vendors/rent/salary)"
        value={tdsApplicable}
        onChange={setTdsApplicable}
        options={["Yes", "No", "Not sure"]}
      />
    </ToolShell>
  );
}
