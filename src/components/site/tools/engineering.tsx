"use client";

import { useState } from "react";
import { CheckList, Metric, NumberInput, ResultHeading, SelectInput, ToolShell } from "./ui";
import { formatINR } from "@/lib/lead-scoring";
import { SmartInquiryForm } from "../SmartInquiryForm";

/* ---------------------- Project cost estimator ------------------------- */
const SCOPE: Record<string, number> = {
  "CAD / Design": 1500,
  "Reverse engineering": 1800,
  "Machine design": 2400,
  Automation: 2600,
  "Manufacturing / fabrication": 2000,
};

export function ProjectCostEstimator() {
  const [scope, setScope] = useState("Machine design");
  const [hours, setHours] = useState(160);
  const [complexity, setComplexity] = useState("Medium");
  const [materials, setMaterials] = useState(250000);
  const [site, setSite] = useState("No");

  const factor = complexity === "High" ? 1.35 : complexity === "Low" ? 0.85 : 1;
  const engineering = (SCOPE[scope] ?? 2000) * hours * factor;
  const commissioning = site === "Yes" ? engineering * 0.15 + 45_000 : 0;
  const total = engineering + materials + commissioning;

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Indicative project cost</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric
              label="Estimated range"
              value={`${formatINR(total * 0.85)} – ${formatINR(total * 1.2)}`}
            />
            <Metric
              label="Engineering effort"
              value={formatINR(engineering)}
              hint={`${hours} hours`}
            />
            <Metric label="Materials / bought-out" value={formatINR(materials)} />
            {site === "Yes" && (
              <Metric label="Site commissioning" value={formatINR(commissioning)} />
            )}
          </div>
        </>
      }
    >
      <SelectInput label="Scope" value={scope} onChange={setScope} options={Object.keys(SCOPE)} />
      <NumberInput
        label="Estimated engineering hours"
        value={hours}
        onChange={setHours}
        min={8}
        max={4000}
        step={8}
      />
      <SelectInput
        label="Complexity"
        value={complexity}
        onChange={setComplexity}
        options={["Low", "Medium", "High"]}
      />
      <NumberInput
        label="Material / bought-out budget (₹)"
        value={materials}
        onChange={setMaterials}
        min={0}
        max={50000000}
        step={10000}
      />
      <SelectInput
        label="Site installation required?"
        value={site}
        onChange={setSite}
        options={["No", "Yes"]}
      />
    </ToolShell>
  );
}

/* --------------------- Manufacturing assessment ------------------------ */
const MFG_CHECKS = [
  "Production data is captured digitally on the shop floor",
  "We know our OEE or machine downtime numbers",
  "Changeover time is measured and tracked",
  "Preventive maintenance runs on a schedule",
  "Quality rejections are logged with root cause",
  "Inventory is reconciled at least weekly",
  "Layout supports single-piece or small-batch flow",
  "Operators are cross-trained across stations",
];

export function ManufacturingAssessment() {
  const [yes, setYes] = useState<string[]>([]);
  const pct = Math.round((yes.length / MFG_CHECKS.length) * 100);
  const band =
    pct >= 75
      ? {
          label: "Optimisation stage",
          body: "Focus on automation and analytics — the fundamentals are already in place.",
        }
      : pct >= 40
        ? {
            label: "Stabilisation stage",
            body: "Standardise measurement and maintenance first; automation pays back much faster afterwards.",
          }
        : {
            label: "Foundation stage",
            body: "Start with data capture and layout. Typical first-year gain is 12–20% on throughput.",
          };

  return (
    <ToolShell
      result={
        <>
          <ResultHeading>Maturity assessment</ResultHeading>
          <div className="mt-5 grid gap-3">
            <Metric label="Maturity" value={`${pct}%`} hint={band.label} />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-5 text-sm text-muted-foreground">{band.body}</p>
        </>
      }
    >
      <CheckList
        items={MFG_CHECKS}
        checked={yes}
        toggle={(i) => setYes((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
      />
    </ToolShell>
  );
}

/* ------------------------- CAD consultation ---------------------------- */
export function CadConsultationForm() {
  return (
    <div className="rounded-3xl border border-border bg-background p-6 sm:p-8">
      <SmartInquiryForm division="engineering" service="CAD / Design" source="cad-consultation" />
    </div>
  );
}
