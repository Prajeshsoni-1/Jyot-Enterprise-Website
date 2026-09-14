"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Building2, Calculator, Percent, ChevronDown, ChevronUp } from "lucide-react";
import { Reveal } from "../primitives";
import {
  DEFAULT_FINANCIAL_CONFIG,
  type FinancialShowcaseConfig,
  type LenderItem,
} from "@/data/financial";

type Props = {
  config?: FinancialShowcaseConfig | undefined;
};

export function FinancialShowcase({ config = DEFAULT_FINANCIAL_CONFIG }: Props) {
  const [amount, setAmount] = useState(2500000);
  const [years, setYears] = useState(15);
  const [showAllLenders, setShowAllLenders] = useState(false);

  // EMI parameters from CMS
  const defaultRate = config.emi?.default_rate ?? 8.9;
  const annualRate = defaultRate / 100;
  const monthlyRate = annualRate / 12;
  const n = years * 12;
  const emi = Math.round(
    (amount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1),
  );
  const total = emi * n;

  // Active rates and lenders
  const rates = (config.rates || DEFAULT_FINANCIAL_CONFIG.rates).filter(
    (r) => r.is_active !== false,
  );
  const activeLenders = (config.lenders || DEFAULT_FINANCIAL_CONFIG.lenders).filter(
    (l) => l.is_active !== false,
  );

  // Initial display limit for lenders
  const INITIAL_LENDER_COUNT = 12;
  const displayedLenders = showAllLenders
    ? activeLenders
    : activeLenders.slice(0, INITIAL_LENDER_COUNT);
  const hasMoreLenders = activeLenders.length > INITIAL_LENDER_COUNT;

  return (
    <section className="relative overflow-hidden border-y border-border py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.98 0.03 95), transparent 45%), radial-gradient(70% 60% at 90% 10%, oklch(0.93 0.09 92 / 0.55), transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div className="noise-layer pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="container-x relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left Column: EMI Calculator Preview */}
        <Reveal>
          <div className="rounded-3xl border border-border bg-background/80 p-8 shadow-soft backdrop-blur-sm sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">
              <Calculator className="h-3.5 w-3.5" /> EMI Preview
            </span>
            <h3 className="mt-6 text-2xl font-extrabold text-ink">Estimate before you apply.</h3>

            <div className="mt-8 space-y-7">
              <div>
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="loan-amount"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Loan amount
                  </label>
                  <span className="font-display text-lg font-extrabold text-ink">
                    ₹{(amount / 100000).toFixed(1)} L
                  </span>
                </div>
                <input
                  id="loan-amount"
                  type="range"
                  min={config.emi?.min_amount ?? 200000}
                  max={config.emi?.max_amount ?? 20000000}
                  step={100000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="loan-tenure"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Tenure
                  </label>
                  <span className="font-display text-lg font-extrabold text-ink">
                    {years} years
                  </span>
                </div>
                <input
                  id="loan-tenure"
                  type="range"
                  min={config.emi?.min_years ?? 1}
                  max={config.emi?.max_years ?? 30}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
                />
              </div>
            </div>

            <div className="mt-9 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
              {[
                { k: `₹${emi.toLocaleString("en-IN")}`, v: "Monthly EMI" },
                { k: `${defaultRate.toFixed(2)}%`, v: "Indicative rate" },
                { k: `₹${(total / 10000000).toFixed(2)} Cr`, v: "Total outflow" },
              ].map((s) => (
                <div key={s.v} className="bg-background px-5 py-5">
                  <p className="font-display text-xl font-extrabold text-ink">{s.k}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.v}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              {config.emi?.disclaimer ||
                "Indicative only. Final rate depends on applicant profile, credit score, loan type and lender policy."}
            </p>
          </div>
        </Reveal>

        {/* Right Column: Interest Comparison + Bank Partnerships */}
        <div className="grid gap-8">
          {/* Card 1: Interest Comparison */}
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-border bg-background/80 p-8 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-growth/20 px-3 py-1.5 text-xs font-bold text-growth-foreground">
                <Percent className="h-3.5 w-3.5" /> Interest Comparison
              </span>
              <ul className="mt-6 divide-y divide-border">
                {rates.map((r) => (
                  <li key={r.id || r.name} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm font-medium text-ink">{r.name}</span>
                    <span className="text-right">
                      <span className="font-display text-base font-extrabold text-ink">
                        {r.display_rate ||
                          (r.rate.includes("onwards") ? r.rate : `${r.rate} onwards`)}
                      </span>
                      {r.tenure ? (
                        <span className="ml-2 text-xs text-muted-foreground">{r.tenure}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.72rem] leading-relaxed text-muted-foreground">
                {config.rate_note ||
                  "Starting rates shown for indicative comparison. Final pricing depends on lender and applicant profile."}
              </p>
              <p className="mt-2 text-[0.68rem] leading-relaxed text-muted-foreground/80">
                {config.rate_disclaimer ||
                  "Interest rates shown are indicative starting rates and may vary based on lender, applicant profile, credit score, income, loan amount, tenure and other applicable conditions. Final rate is subject to lender approval."}
              </p>
            </div>
          </Reveal>

          {/* Card 2: Bank Partnerships */}
          <Reveal delay={0.18}>
            <div className="rounded-3xl border border-border bg-background/80 p-8 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary w-fit">
                  <Building2 className="h-3.5 w-3.5" />{" "}
                  {config.partnerships_heading || "Bank Partnerships"}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {activeLenders.length} partner institutions
                </span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {config.partnerships_description ||
                  "We work with a wide network of banks and financial institutions across Gujarat and India to help match customers with suitable loan options."}
              </p>

              {/* Responsive Lender Grid */}
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {displayedLenders.map((lender) => (
                  <LenderCard key={lender.id || lender.name} lender={lender} />
                ))}
              </div>

              {/* View all / show less toggle */}
              {hasMoreLenders && (
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllLenders((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-secondary hover:text-primary cursor-pointer"
                  >
                    {showAllLenders ? (
                      <>
                        Show fewer lenders <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        View all {activeLenders.length} lenders{" "}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function LenderCard({ lender }: { lender: LenderItem }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group relative flex h-14 flex-col items-center justify-center rounded-xl border border-border bg-background p-2 text-center transition-all hover:border-primary/40 hover:shadow-2xs overflow-hidden"
    >
      {lender.logo_url && !imgError ? (
        <img
          src={lender.logo_url}
          alt={lender.alt_text || lender.name}
          onError={() => setImgError(true)}
          className="max-h-7 max-w-[85%] object-contain grayscale transition-all group-hover:grayscale-0"
        />
      ) : (
        <span className="font-display text-[0.72rem] font-bold text-muted-foreground transition-colors group-hover:text-ink line-clamp-2 leading-tight">
          {lender.name}
        </span>
      )}
      {lender.is_featured && (
        <span
          className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary/60"
          title="Featured Partner"
        />
      )}
    </motion.div>
  );
}
