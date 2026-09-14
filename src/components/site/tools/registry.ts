import type { ComponentType } from "react";
import type { ServiceKey } from "@/data/site";
import { EmiCalculator, LoanEligibility, LoanComparison, DocumentChecklist } from "./financial";
import {
  WebsiteCostCalculator,
  ErpCostEstimator,
  CrmRecommendation,
  AiReadinessAssessment,
  MarketingRoiCalculator,
} from "./it";
import {
  GstWizard,
  CompanyRegistrationSelector,
  TrademarkGuide,
  ComplianceChecklist,
} from "./legal";
import {
  ProjectCostEstimator,
  ManufacturingAssessment,
  CadConsultationForm,
} from "./engineering";

export type Tool = {
  slug: string;
  name: string;
  division: ServiceKey;
  summary: string;
  description: string;
  component: ComponentType;
};

export const TOOLS: Tool[] = [
  {
    slug: "emi-calculator",
    name: "EMI Calculator",
    division: "financial",
    summary: "Work out the monthly instalment before you talk to any lender.",
    description:
      "Enter the amount, rate and tenure to see your exact monthly outgo, total interest and the full repayment picture over the life of the loan.",
    component: EmiCalculator,
  },
  {
    slug: "loan-eligibility",
    name: "Loan Eligibility",
    division: "financial",
    summary: "See the sanction amount your income realistically supports.",
    description:
      "We apply the same FOIR logic lenders use, so the number you see here is close to what an underwriter will approve.",
    component: LoanEligibility,
  },
  {
    slug: "loan-comparison",
    name: "Loan Comparison",
    division: "financial",
    summary: "Compare three offers on true lifetime cost, not headline rate.",
    description:
      "Processing fees and small rate differences change the total outgo by lakhs. Compare offers side by side before signing.",
    component: LoanComparison,
  },
  {
    slug: "document-checklist",
    name: "Document Checklist",
    division: "financial",
    summary: "Know exactly which papers your file needs before you apply.",
    description:
      "Pick your loan type and tick off documents as you gather them. Complete files clear underwriting roughly a week faster.",
    component: DocumentChecklist,
  },
  {
    slug: "website-cost-calculator",
    name: "Website Cost Calculator",
    division: "it",
    summary: "Budget a website or web app in under a minute.",
    description:
      "Choose the type of build, the design approach and the add-ons you need for a realistic investment range including QA and launch.",
    component: WebsiteCostCalculator,
  },
  {
    slug: "erp-cost-estimator",
    name: "ERP Cost Estimator",
    division: "it",
    summary: "Estimate ERP implementation, AMC and rollout time.",
    description:
      "Module count, user count, deployment model and migration weight are the four things that actually move an ERP budget.",
    component: ErpCostEstimator,
  },
  {
    slug: "crm-recommendation",
    name: "CRM Recommendation",
    division: "it",
    summary: "Find out whether you need a licence, a configuration or a build.",
    description:
      "Most businesses over-buy CRM. Answer four questions and we will tell you honestly which route fits your sales motion.",
    component: CrmRecommendation,
  },
  {
    slug: "ai-readiness",
    name: "AI Readiness Assessment",
    division: "it",
    summary: "Check whether your data and processes can support AI yet.",
    description:
      "AI fails on messy data, not on models. This eight-point check tells you whether to pilot now or fix the foundation first.",
    component: AiReadinessAssessment,
  },
  {
    slug: "marketing-roi",
    name: "Digital Marketing ROI",
    division: "it",
    summary: "Model leads, customers and profit from a monthly ad budget.",
    description:
      "Work backwards from spend to gross profit so you know the conversion rate your campaign has to hit to be worth running.",
    component: MarketingRoiCalculator,
  },
  {
    slug: "gst-registration-wizard",
    name: "GST Registration Wizard",
    division: "legal",
    summary: "Find out if GST registration is mandatory for you.",
    description:
      "Thresholds differ by supply type, state and channel. Five questions tell you where you stand and which scheme suits you.",
    component: GstWizard,
  },
  {
    slug: "company-registration-selector",
    name: "Company Registration Selector",
    division: "legal",
    summary: "Proprietorship, LLP, OPC or Private Limited — decided properly.",
    description:
      "The right structure depends on owners, funding plans, liability and how much compliance you can carry.",
    component: CompanyRegistrationSelector,
  },
  {
    slug: "trademark-guide",
    name: "Trademark Guide",
    division: "legal",
    summary: "Pick your classes and see the real cost of protection.",
    description:
      "Trademark cost scales per class. See government and professional fees before filing, and when you can use ™ and ®.",
    component: TrademarkGuide,
  },
  {
    slug: "compliance-checklist",
    name: "Compliance Checklist",
    division: "legal",
    summary: "Track every recurring filing your entity owes.",
    description:
      "GST, TDS, ROC and income tax obligations laid out by entity type, with a live view of what is still open.",
    component: ComplianceChecklist,
  },
  {
    slug: "project-cost-estimator",
    name: "Project Cost Estimator",
    division: "engineering",
    summary: "Scope engineering effort, materials and commissioning.",
    description:
      "Estimate a design, automation or fabrication mandate across engineering hours, bought-out material and site work.",
    component: ProjectCostEstimator,
  },

  {
    slug: "manufacturing-assessment",
    name: "Manufacturing Assessment",
    division: "engineering",
    summary: "Evaluate shop floor maturity across quality, inventory and workflow.",
    description:
      "Assess eight operational pillars including digital capture, OEE tracking, maintenance and single-piece flow to identify immediate automation and throughput gains.",
    component: ManufacturingAssessment,
  },
  {
    slug: "cad-consultation",
    name: "CAD Consultation",
    division: "engineering",
    summary: "Send drawings and get a scoped engineering response.",
    description:
      "Upload DWG, STEP or PDF drawings with your requirement and our design desk replies with an approach and estimate.",
    component: CadConsultationForm,
  },
];

export function getTool(slug: string) {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolsFor(division: ServiceKey) {
  return TOOLS.filter((t) => t.division === division);
}
