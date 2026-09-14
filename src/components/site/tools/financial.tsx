"use client";

import { useState } from "react";
import { CheckList, Metric, NumberInput, ResultHeading, SelectInput, ToolShell } from "./ui";
import { formatINR } from "@/lib/lead-scoring";

function emi(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12 / 100;
  if (r === 0 || months === 0) return months ? principal / months : 0;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

/* --------------------------------- EMI --------------------------------- */
export function EmiCalculator() {
  const [amount, setAmount] = useState(3_500_000);
  const [rate, setRate] = useState(8.75);
  const [years, setYears] = useState(20);

  const monthly = emi(amount, rate, years * 12);
  const total = monthly * years * 12;

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Your repayment</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric label="Monthly EMI" value={formatINR(monthly)} />
            <Metric label="Total interest" value={formatINR(total - amount)} />
            <Metric
              label="Total payable"
              value={formatINR(total)}
              hint={`${years * 12} instalments`}
            />
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Indicative only. Final EMI depends on the lender, processing charges and insurance
            loading.
          </p>
        </>
      }
    >
      <NumberInput
        label="Loan amount (₹)"
        value={amount}
        onChange={setAmount}
        min={100000}
        max={100000000}
        step={50000}
      />
      <NumberInput
        label="Interest rate (% p.a.)"
        value={rate}
        onChange={setRate}
        min={5}
        max={24}
        step={0.05}
      />
      <NumberInput label="Tenure (years)" value={years} onChange={setYears} min={1} max={30} />
    </ToolShell>
  );
}

/* ----------------------------- Eligibility ----------------------------- */
export function LoanEligibility() {
  const [income, setIncome] = useState(120000);
  const [emiNow, setEmiNow] = useState(15000);
  const [rate, setRate] = useState(8.75);
  const [years, setYears] = useState(20);
  const [occupation, setOccupation] = useState("Salaried");

  const foir = occupation === "Salaried" ? 0.55 : 0.5;
  const capacity = Math.max(income * foir - emiNow, 0);
  const r = rate / 12 / 100;
  const n = years * 12;
  const eligible =
    r > 0 ? (capacity * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n)) : capacity * n;

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Indicative eligibility</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric label="Loan you may qualify for" value={formatINR(eligible)} />
            <Metric
              label="Affordable EMI"
              value={formatINR(capacity)}
              hint={`FOIR ${Math.round(foir * 100)}%`}
            />
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Lenders also weigh credit score, vintage and property value. We regularly improve
            sanctions by 15–30% through income structuring and co-applicant planning.
          </p>
        </>
      }
    >
      <SelectInput
        label="Occupation"
        value={occupation}
        onChange={setOccupation}
        options={["Salaried", "Self-employed professional", "Business owner", "NRI"]}
      />
      <NumberInput
        label="Monthly income (₹)"
        value={income}
        onChange={setIncome}
        min={15000}
        max={2000000}
        step={5000}
      />
      <NumberInput
        label="Existing EMI (₹)"
        value={emiNow}
        onChange={setEmiNow}
        min={0}
        max={500000}
        step={1000}
      />
      <NumberInput
        label="Interest rate (% p.a.)"
        value={rate}
        onChange={setRate}
        min={5}
        max={24}
        step={0.05}
      />
      <NumberInput label="Tenure (years)" value={years} onChange={setYears} min={1} max={30} />
    </ToolShell>
  );
}

/* ------------------------------ Comparison ----------------------------- */
export function LoanComparison() {
  const [amount, setAmount] = useState(3_500_000);
  const [years, setYears] = useState(20);
  const [offers, setOffers] = useState([
    { name: "Lender A", rate: 8.4, fee: 15000 },
    { name: "Lender B", rate: 8.75, fee: 5000 },
    { name: "Lender C", rate: 9.1, fee: 0 },
  ]);

  const rows = offers.map((o) => {
    const m = emi(amount, o.rate, years * 12);
    return { ...o, monthly: m, total: m * years * 12 + o.fee };
  });
  const best = rows.reduce((a, b) => (b.total < a.total ? b : a), rows[0]!);

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Cheapest over the full tenure</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric label="Best offer" value={best.name} hint={`${best.rate}% p.a.`} />
            <Metric label="Total outgo" value={formatINR(best.total)} />
            <Metric
              label="Saving vs costliest"
              value={formatINR(Math.max(...rows.map((r) => r.total)) - best.total)}
            />
          </div>
          <ul className="mt-5 grid gap-2 text-xs text-muted-foreground">
            {rows.map((r) => (
              <li key={r.name} className="flex justify-between">
                <span>{r.name}</span>
                <span>
                  {formatINR(r.monthly)}/mo · {formatINR(r.total)} total
                </span>
              </li>
            ))}
          </ul>
        </>
      }
    >
      <NumberInput
        label="Loan amount (₹)"
        value={amount}
        onChange={setAmount}
        min={100000}
        max={100000000}
        step={50000}
      />
      <NumberInput label="Tenure (years)" value={years} onChange={setYears} min={1} max={30} />
      {offers.map((o, i) => (
        <div
          key={i}
          className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-3"
        >
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink">Lender</label>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink"
              value={o.name}
              onChange={(e) =>
                setOffers((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink">Rate %</label>
            <input
              type="number"
              step={0.05}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink"
              value={o.rate}
              onChange={(e) =>
                setOffers((p) =>
                  p.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) } : x)),
                )
              }
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink">Fees ₹</label>
            <input
              type="number"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-ink"
              value={o.fee}
              onChange={(e) =>
                setOffers((p) =>
                  p.map((x, j) => (j === i ? { ...x, fee: Number(e.target.value) } : x)),
                )
              }
            />
          </div>
        </div>
      ))}
    </ToolShell>
  );
}

/* --------------------------- Document checklist ------------------------ */
const DOCS: Record<string, string[]> = {
  "Home Loan": [
    "PAN and Aadhaar of all applicants",
    "Latest 3 months salary slips / 2 years ITR",
    "6 months bank statements",
    "Form 16 or CA-certified financials",
    "Sale agreement / allotment letter",
    "Property chain documents and approved plan",
    "Own contribution proof",
  ],
  "Business Loan": [
    "PAN and Aadhaar of promoters",
    "3 years ITR with computation",
    "3 years audited financials",
    "12 months current account statements",
    "GST returns for the last 12 months",
    "Business registration / Udyam certificate",
    "Existing loan sanction letters",
  ],
  "Loan Against Property": [
    "KYC of all applicants and co-owners",
    "Income proof (ITR / salary slips)",
    "Property title deed and chain documents",
    "Latest property tax receipt",
    "Approved building plan",
    "Existing loan statement, if mortgaged",
  ],
  "Personal Loan": [
    "PAN and Aadhaar",
    "Last 3 salary slips",
    "6 months salary account statement",
    "Employment proof / offer letter",
  ],
};

export function DocumentChecklist() {
  const [type, setType] = useState("Home Loan");
  const [done, setDone] = useState<string[]>([]);
  const items = DOCS[type] ?? [];
  const pct = items.length
    ? Math.round((done.filter((d) => items.includes(d)).length / items.length) * 100)
    : 0;

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Readiness</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric
              label="Documents ready"
              value={`${pct}%`}
              hint={`${items.length} items in total`}
            />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Files submitted complete clear underwriting roughly a week faster than partial files.
          </p>
        </>
      }
    >
      <SelectInput
        label="Loan type"
        value={type}
        onChange={(v) => {
          setType(v);
          setDone([]);
        }}
        options={Object.keys(DOCS)}
      />
      <CheckList
        items={items}
        checked={done}
        toggle={(i) => setDone((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
      />
    </ToolShell>
  );
}

export const FINANCIAL_TOOL_COMPONENTS = {
  "emi-calculator": EmiCalculator,
  "loan-eligibility": LoanEligibility,
  "loan-comparison": LoanComparison,
  "document-checklist": DocumentChecklist,
};
