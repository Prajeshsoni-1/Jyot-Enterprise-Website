import type { ServiceKey } from "@/data/site";

/**
 * Phase 2 — lead qualification.
 * Pure functions, shared by the browser (instant feedback) and the server
 * function that persists the lead, so the score can never diverge.
 */

export type LeadScore = "High" | "Medium" | "Low";

export type Qualification = {
  score: LeadScore;
  scoreValue: number;
  estimatedValue: string;
  projectSize: string;
  department: string;
  reasons: string[];
};

const BUDGET_VALUE: Record<string, number> = {
  "Under ₹1 lakh": 75_000,
  "₹1 – 5 lakh": 300_000,
  "₹5 – 15 lakh": 1_000_000,
  "₹15 – 50 lakh": 3_000_000,
  "Above ₹50 lakh": 7_500_000,
  "Need guidance": 250_000,
  "Under ₹50,000": 40_000,
  "₹50,000 – ₹2 lakh": 125_000,
  "₹2 – ₹10 lakh": 600_000,
  "₹10 – ₹50 lakh": 3_000_000,
  "Above ₹50 lakh ": 7_500_000,
  "Not sure yet": 250_000,
};

const TIMELINE_POINTS: Record<string, number> = {
  Immediately: 25,
  "Emergency (within 48 hours)": 25,
  "This week": 22,
  "Within 1 month": 20,
  "This month": 18,
  "1–3 months": 12,
  "3–6 months": 6,
  "Planning ahead": 4,
  "Just exploring": 0,
};

const DEPARTMENTS: Record<ServiceKey, string> = {
  financial: "Financial Advisory Desk",
  it: "Technology & Product Desk",
  legal: "Legal & Compliance Desk",
  engineering: "Engineering Delivery Desk",
};

export function formatINR(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)} L`;
  if (value >= 1_000) return `₹${Math.round(value / 1000)}K`;
  return `₹${Math.round(value)}`;
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Rough revenue to Jyot from a mandate of this size, per division. */
function revenueFromValue(division: ServiceKey, value: number): number {
  const rate = division === "financial" ? 0.012 : division === "legal" ? 0.35 : 1;
  return Math.max(value * rate, division === "legal" ? 5_000 : 15_000);
}

function sizeBand(value: number): string {
  if (value >= 5_000_000) return "Enterprise";
  if (value >= 1_000_000) return "Large";
  if (value >= 250_000) return "Mid-size";
  return "Small";
}

export function qualifyLead(input: {
  division: ServiceKey;
  details: Record<string, unknown>;
  message?: string | undefined;
  attachments?: number;
}): Qualification {
  const { division, details } = input;
  const reasons: string[] = [];
  let points = 20;

  // ---- deal value -------------------------------------------------------
  let dealValue = 0;
  if (division === "financial") {
    dealValue = num(details["loanAmount"]);
    const income = num(details["monthlyIncome"]);
    const emi = num(details["existingEmi"]);
    if (income > 0) {
      const capacity = Math.max(income * 0.5 - emi, 0) * 12 * 8; // ~8-year affordability proxy
      if (capacity >= dealValue && dealValue > 0) {
        points += 15;
        reasons.push("Income comfortably supports the requested amount");
      } else if (dealValue > 0 && capacity < dealValue * 0.6) {
        points -= 10;
        reasons.push("Requested amount is high relative to declared income");
      }
    }
  } else {
    dealValue = BUDGET_VALUE[String(details["budget"] ?? "")] ?? 0;
    if (division === "legal") dealValue = dealValue || 60_000;
  }

  if (dealValue >= 5_000_000) {
    points += 30;
    reasons.push("Large ticket size");
  } else if (dealValue >= 1_000_000) {
    points += 22;
    reasons.push("Substantial ticket size");
  } else if (dealValue >= 250_000) {
    points += 14;
  } else if (dealValue > 0) {
    points += 6;
  }

  // ---- urgency ----------------------------------------------------------
  const timing = String(details["timeline"] ?? details["urgency"] ?? "");
  const timingPoints = TIMELINE_POINTS[timing] ?? 8;
  points += timingPoints;
  if (timingPoints >= 20) reasons.push("Ready to start immediately");
  if (timingPoints === 0) reasons.push("Still exploring options");

  // ---- readiness signals -----------------------------------------------
  if ((input.attachments ?? 0) > 0) {
    points += 10;
    reasons.push("Documents already supplied");
  }
  if ((input.message ?? "").trim().length > 120) {
    points += 5;
    reasons.push("Detailed requirement described");
  }
  const status = String(details["currentStatus"] ?? "");
  if (status === "Documents ready" || status === "Application in progress") {
    points += 8;
    reasons.push("Paperwork already in motion");
  }
  if (details["currentSoftware"] && String(details["currentSoftware"]).trim().length > 2) {
    points += 4;
  }

  const scoreValue = Math.max(0, Math.min(100, Math.round(points)));
  const score: LeadScore = scoreValue >= 70 ? "High" : scoreValue >= 45 ? "Medium" : "Low";

  return {
    score,
    scoreValue,
    estimatedValue:
      dealValue > 0 ? formatINR(revenueFromValue(division, dealValue)) : "To be scoped",
    projectSize: dealValue > 0 ? sizeBand(dealValue) : "Unscoped",
    department: DEPARTMENTS[division],
    reasons,
  };
}

export function leadReference(division: ServiceKey, date = new Date()): string {
  const prefix = { financial: "FIN", it: "TEC", legal: "LGL", engineering: "ENG" }[division];
  const stamp = `${date.getFullYear()}`.slice(2) + String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `JE-${prefix}-${stamp}-${rand}`;
}
