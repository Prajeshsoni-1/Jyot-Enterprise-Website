import type { ServiceKey } from "./site";

/**
 * Division-specific intelligent enquiry forms (Phase 1).
 * Each division asks only the questions its desk actually needs to quote,
 * which is what makes the lead score in `src/lib/lead-scoring.ts` meaningful.
 */

export type SmartField = {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "multiselect";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Only show when another field has one of these values. */
  showIf?: { field: string; values: string[] };
};

export type SmartFormConfig = {
  division: ServiceKey;
  label: string;
  intro: string;
  uploadLabel: string;
  uploadHint: string;
  fields: SmartField[];
};

const CITIES = [
  "Surat",
  "Ahmedabad",
  "Vadodara",
  "Rajkot",
  "Mumbai",
  "Pune",
  "Delhi NCR",
  "Bengaluru",
  "Other",
];

export const SMART_FORMS: Record<ServiceKey, SmartFormConfig> = {
  financial: {
    division: "financial",
    label: "Financial",
    intro: "Tell us about the funding requirement and we will come back with indicative terms.",
    uploadLabel: "Upload documents",
    uploadHint:
      "KYC, ITR, bank statements or property papers — PDF, JPG, PNG, DOC up to 10 MB each.",
    fields: [
      {
        name: "loanType",
        label: "Loan type",
        type: "select",
        required: true,
        options: [
          "Home Loan",
          "Business Loan",
          "Mortgage / Loan Against Property",
          "Personal Loan",
          "Vehicle Loan",
          "Education Loan",
          "MSME Loan",
          "Project Finance",
          "Working Capital",
          "Insurance / Investment",
        ],
      },
      {
        name: "loanAmount",
        label: "Loan amount required (₹)",
        type: "number",
        required: true,
        placeholder: "e.g. 3500000",
      },
      {
        name: "occupation",
        label: "Occupation",
        type: "select",
        required: true,
        options: [
          "Salaried",
          "Self-employed professional",
          "Business owner",
          "Company / LLP",
          "NRI",
          "Other",
        ],
      },
      {
        name: "monthlyIncome",
        label: "Monthly income (₹)",
        type: "number",
        required: true,
        placeholder: "e.g. 120000",
      },
      { name: "city", label: "City", type: "select", required: true, options: CITIES },
      {
        name: "existingEmi",
        label: "Existing EMI per month (₹)",
        type: "number",
        placeholder: "0 if none",
      },
      {
        name: "propertyValue",
        label: "Property value (₹)",
        type: "number",
        placeholder: "For secured loans",
        showIf: {
          field: "loanType",
          values: ["Home Loan", "Mortgage / Loan Against Property", "Project Finance"],
        },
      },
      {
        name: "businessType",
        label: "Business type",
        type: "select",
        options: [
          "Proprietorship",
          "Partnership",
          "LLP",
          "Private Limited",
          "Public Limited",
          "Not applicable",
        ],
        showIf: {
          field: "occupation",
          values: ["Self-employed professional", "Business owner", "Company / LLP"],
        },
      },
    ],
  },

  it: {
    division: "it",
    label: "IT",
    intro: "Share the scope and we will send an indicative build plan, timeline and cost band.",
    uploadLabel: "Upload requirement document",
    uploadHint: "SRS, RFP, wireframes or a simple brief — PDF, DOC, XLS, PNG up to 10 MB each.",
    fields: [
      {
        name: "projectType",
        label: "Project type",
        type: "select",
        required: true,
        options: [
          "Website / Web app",
          "ERP",
          "CRM",
          "AI / Automation",
          "Mobile app",
          "E-commerce",
          "Cloud / DevOps",
          "Digital marketing",
        ],
      },
      {
        name: "budget",
        label: "Budget band",
        type: "select",
        required: true,
        options: [
          "Under ₹1 lakh",
          "₹1 – 5 lakh",
          "₹5 – 15 lakh",
          "₹15 – 50 lakh",
          "Above ₹50 lakh",
          "Need guidance",
        ],
      },
      {
        name: "timeline",
        label: "Timeline",
        type: "select",
        required: true,
        options: ["Immediately", "Within 1 month", "1–3 months", "3–6 months", "Just exploring"],
      },
      {
        name: "industry",
        label: "Industry",
        type: "select",
        required: true,
        options: [
          "Manufacturing",
          "Healthcare",
          "Real Estate & Construction",
          "Retail & E-commerce",
          "Logistics",
          "Education",
          "Hospitality",
          "Textile",
          "Professional Services",
          "Other",
        ],
      },
      {
        name: "currentSoftware",
        label: "Current software in use",
        type: "text",
        placeholder: "Tally, SAP, spreadsheets, none…",
      },
      {
        name: "integrations",
        label: "Required integrations",
        type: "multiselect",
        options: [
          "Tally",
          "SAP",
          "Payment gateway",
          "WhatsApp / SMS",
          "Shipping / logistics",
          "GST / e-invoicing",
          "Power BI / analytics",
          "Custom API",
        ],
      },
    ],
  },

  legal: {
    division: "legal",
    label: "Legal",
    intro: "Tell us where you are today and we will map the exact filings you need.",
    uploadLabel: "Upload documents",
    uploadHint:
      "PAN, incorporation papers, notices or existing filings — PDF, JPG up to 10 MB each.",
    fields: [
      {
        name: "businessType",
        label: "Business type",
        type: "select",
        required: true,
        options: [
          "Not registered yet",
          "Proprietorship",
          "Partnership",
          "LLP",
          "Private Limited",
          "Public Limited",
          "Trust / Society",
        ],
      },
      {
        name: "serviceRequired",
        label: "Service required",
        type: "select",
        required: true,
        options: [
          "GST Registration",
          "GST Filing",
          "Trademark",
          "Company Registration",
          "ROC / Annual Compliance",
          "Income Tax",
          "Licences & Certifications",
          "Contracts & Agreements",
          "Notice / Litigation support",
        ],
      },
      {
        name: "currentStatus",
        label: "Current status",
        type: "select",
        required: true,
        options: [
          "Nothing started",
          "Documents ready",
          "Application in progress",
          "Objection / query received",
          "Existing filing needs correction",
        ],
      },
      {
        name: "urgency",
        label: "Urgency",
        type: "select",
        required: true,
        options: ["Emergency (within 48 hours)", "This week", "This month", "Planning ahead"],
      },
      { name: "city", label: "City", type: "select", required: true, options: CITIES },
    ],
  },

  engineering: {
    division: "engineering",
    label: "Engineering",
    intro: "Describe the part, line or machine and we will scope the engineering effort.",
    uploadLabel: "Upload drawings / requirement",
    uploadHint: "DWG, STEP, PDF drawings or a written brief — up to 10 MB each.",
    fields: [
      {
        name: "projectType",
        label: "Project type",
        type: "select",
        required: true,
        options: [
          "CAD / Design",
          "Automation",
          "Machine Design",
          "Manufacturing",
          "Reverse Engineering",
          "Prototyping",
          "Maintenance / AMC",
        ],
      },
      {
        name: "budget",
        label: "Budget band",
        type: "select",
        required: true,
        options: [
          "Under ₹1 lakh",
          "₹1 – 5 lakh",
          "₹5 – 15 lakh",
          "₹15 – 50 lakh",
          "Above ₹50 lakh",
          "Need guidance",
        ],
      },
      {
        name: "timeline",
        label: "Timeline",
        type: "select",
        required: true,
        options: ["Immediately", "Within 1 month", "1–3 months", "3–6 months", "Just exploring"],
      },
      {
        name: "industry",
        label: "Industry",
        type: "select",
        options: [
          "Manufacturing",
          "Automotive",
          "Textile",
          "Pharma",
          "Food processing",
          "Packaging",
          "Other",
        ],
      },
      {
        name: "quantity",
        label: "Quantity / batch size",
        type: "text",
        placeholder: "e.g. 1 machine, 500 parts/month",
      },
    ],
  },
};

export const SMART_FORM_LIST = Object.values(SMART_FORMS);
