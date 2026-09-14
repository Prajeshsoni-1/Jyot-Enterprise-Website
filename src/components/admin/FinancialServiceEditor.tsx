"use client";

import { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Building2,
  Percent,
  Calculator,
  Search,
  CheckCircle2,
  AlertCircle,
  Star,
  Globe,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import {
  DEFAULT_FINANCIAL_CONFIG,
  type FinancialShowcaseConfig,
  type LenderItem,
  type LenderType,
  type LoanRateItem,
} from "@/data/financial";
import { getFinancialShowcaseConfig, saveFinancialShowcaseConfig } from "@/lib/financial.functions";
import { MediaButton } from "@/components/admin/MediaPicker";

type TabKey = "stats" | "emi" | "rates" | "lenders";

export function FinancialServiceEditor({ id }: { id?: string }) {
  const getConfigFn = useServerFn(getFinancialShowcaseConfig);
  const saveConfigFn = useServerFn(saveFinancialShowcaseConfig);

  const [activeTab, setActiveTab] = useState<TabKey>("stats");
  const [config, setConfig] = useState<FinancialShowcaseConfig>(DEFAULT_FINANCIAL_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Rate Modal State
  const [editingRate, setEditingRate] = useState<LoanRateItem | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // Lender Modal State
  const [editingLender, setEditingLender] = useState<LenderItem | null>(null);
  const [isLenderModalOpen, setIsLenderModalOpen] = useState(false);

  // Lender Filter & Search
  const [lenderSearch, setLenderSearch] = useState("");
  const [lenderTypeFilter, setLenderTypeFilter] = useState<string>("all");
  const [lenderStatusFilter, setLenderStatusFilter] = useState<string>("all");

  // Load config on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getConfigFn();
        if (res) {
          setConfig(res);
        }
      } catch (err) {
        setNotice({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to load financial settings.",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getConfigFn]);

  // Unsaved changes warning
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  async function handleSave() {
    try {
      setSaving(true);
      setNotice(null);
      await saveConfigFn({ data: config });
      setIsDirty(false);
      setNotice({
        type: "success",
        message:
          "Financial services & lenders updated successfully! Changes are live on /services/financial.",
      });
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save financial configuration.",
      });
    } finally {
      setSaving(false);
    }
  }

  // --- Rate Actions ---
  function openAddRateModal() {
    setEditingRate({
      id: crypto.randomUUID(),
      name: "",
      rate: "8.50%",
      display_rate: "8.50% onwards",
      tenure: "Up to 10 years",
      is_active: true,
      sort_order: config.rates.length + 1,
    });
    setIsRateModalOpen(true);
  }

  function openEditRateModal(rate: LoanRateItem) {
    setEditingRate({ ...rate });
    setIsRateModalOpen(true);
  }

  function saveRate(rateToSave: LoanRateItem) {
    setIsDirty(true);
    setConfig((prev) => {
      const exists = prev.rates.some((r) => r.id === rateToSave.id);
      let newRates: LoanRateItem[];
      if (exists) {
        newRates = prev.rates.map((r) => (r.id === rateToSave.id ? rateToSave : r));
      } else {
        newRates = [...prev.rates, rateToSave];
      }
      return { ...prev, rates: newRates };
    });
    setIsRateModalOpen(false);
    setEditingRate(null);
  }

  function deleteRate(rateId: string) {
    if (!confirm("Are you sure you want to delete this loan type?")) return;
    setIsDirty(true);
    setConfig((prev) => ({
      ...prev,
      rates: prev.rates.filter((r) => r.id !== rateId),
    }));
  }

  function moveRate(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.rates.length) return;
    setIsDirty(true);
    setConfig((prev) => {
      const items = [...prev.rates];
      const temp = items[index]!;
      items[index] = items[targetIdx]!;
      items[targetIdx] = temp;
      return {
        ...prev,
        rates: items.map((it, idx) => ({ ...it, sort_order: idx + 1 })),
      };
    });
  }

  function toggleRateActive(rateId: string) {
    setIsDirty(true);
    setConfig((prev) => ({
      ...prev,
      rates: prev.rates.map((r) => (r.id === rateId ? { ...r, is_active: !r.is_active } : r)),
    }));
  }

  // --- Lender Actions ---
  function openAddLenderModal() {
    setEditingLender({
      id: crypto.randomUUID(),
      name: "",
      type: "Bank",
      logo_url: "",
      alt_text: "",
      website_url: "",
      supported_loans: [],
      display_text: "",
      is_active: true,
      is_featured: false,
      sort_order: config.lenders.length + 1,
    });
    setIsLenderModalOpen(true);
  }

  function openEditLenderModal(lender: LenderItem) {
    setEditingLender({ ...lender });
    setIsLenderModalOpen(true);
  }

  function saveLender(lenderToSave: LenderItem) {
    setIsDirty(true);
    setConfig((prev) => {
      const exists = prev.lenders.some((l) => l.id === lenderToSave.id);
      let newLenders: LenderItem[];
      if (exists) {
        newLenders = prev.lenders.map((l) => (l.id === lenderToSave.id ? lenderToSave : l));
      } else {
        newLenders = [...prev.lenders, lenderToSave];
      }
      return { ...prev, lenders: newLenders };
    });
    setIsLenderModalOpen(false);
    setEditingLender(null);
  }

  function deleteLender(lenderId: string) {
    if (!confirm("Are you sure you want to remove this lender institution?")) return;
    setIsDirty(true);
    setConfig((prev) => ({
      ...prev,
      lenders: prev.lenders.filter((l) => l.id !== lenderId),
    }));
  }

  function moveLender(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.lenders.length) return;
    setIsDirty(true);
    setConfig((prev) => {
      const items = [...prev.lenders];
      const temp = items[index]!;
      items[index] = items[targetIdx]!;
      items[targetIdx] = temp;
      return {
        ...prev,
        lenders: items.map((it, idx) => ({ ...it, sort_order: idx + 1 })),
      };
    });
  }

  function toggleLenderActive(lenderId: string) {
    setIsDirty(true);
    setConfig((prev) => ({
      ...prev,
      lenders: prev.lenders.map((l) => (l.id === lenderId ? { ...l, is_active: !l.is_active } : l)),
    }));
  }

  function toggleLenderFeatured(lenderId: string) {
    setIsDirty(true);
    setConfig((prev) => ({
      ...prev,
      lenders: prev.lenders.map((l) =>
        l.id === lenderId ? { ...l, is_featured: !l.is_featured } : l,
      ),
    }));
  }

  // Filtered lenders list for table view
  const filteredLenders = useMemo(() => {
    return config.lenders.filter((l) => {
      const matchesSearch =
        !lenderSearch || l.name.toLowerCase().includes(lenderSearch.toLowerCase());
      const matchesType = lenderTypeFilter === "all" || l.type === lenderTypeFilter;
      const matchesStatus =
        lenderStatusFilter === "all" ||
        (lenderStatusFilter === "active" && l.is_active) ||
        (lenderStatusFilter === "inactive" && !l.is_active) ||
        (lenderStatusFilter === "featured" && l.is_featured);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [config.lenders, lenderSearch, lenderTypeFilter, lenderStatusFilter]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading financial services configuration…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <Link
            to="/admin/website/$module"
            params={{ module: "services" }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Services
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold text-ink">
              Financial Services & Loans CMS
            </h1>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[0.68rem] font-bold text-primary uppercase">
              Financial Desk
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage top statistics, indicative rates, EMI calculator settings, and bank partner
            network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/services/financial"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/50 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
          >
            <span>Preview Public Page</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-ember hover:bg-primary-hover transition cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : isDirty ? "Save Changes *" : "Saved"}
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-medium ${
            notice.type === "success"
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
              : "border border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "stats"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> 1. Top Statistics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("emi")}
          className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "emi"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <Calculator className="h-3.5 w-3.5" /> 2. EMI Preview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rates")}
          className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "rates"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <Percent className="h-3.5 w-3.5" /> 3. Loan Rates & Comparison ({config.rates.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("lenders")}
          className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "lenders"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" /> 4. Bank Partnerships & Lenders (
          {config.lenders.length})
        </button>
      </div>

      {/* TAB 1: Top Statistics */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs">
            <h2 className="text-base font-bold text-ink">Key Financial Metrics (Hero Bar)</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              These four highlights appear directly beneath the hero on{" "}
              <code className="text-primary font-mono">/services/financial</code>.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink">Stat 1: Funding Facilitated</label>
                <input
                  type="text"
                  value={config.statistics.funding_facilitated}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({
                      ...prev,
                      statistics: { ...prev.statistics, funding_facilitated: e.target.value },
                    }));
                  }}
                  placeholder="e.g. ₹380 Cr"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
                />
                <p className="text-[0.7rem] text-muted-foreground">Label: Funding facilitated</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-ink">Stat 2: Median Sanction Time</label>
                <input
                  type="text"
                  value={config.statistics.median_sanction_time}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({
                      ...prev,
                      statistics: { ...prev.statistics, median_sanction_time: e.target.value },
                    }));
                  }}
                  placeholder="e.g. 15 days"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
                />
                <p className="text-[0.7rem] text-muted-foreground">Label: Median sanction time</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-ink">Stat 3: Lender Relationships</label>
                <input
                  type="text"
                  value={config.statistics.lender_relationships}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({
                      ...prev,
                      statistics: { ...prev.statistics, lender_relationships: e.target.value },
                    }));
                  }}
                  placeholder="e.g. 86+"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
                />
                <p className="text-[0.7rem] text-muted-foreground">Label: Lender relationships</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-ink">Stat 4: Best Secured Rate</label>
                <input
                  type="text"
                  value={config.statistics.best_secured_rate}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({
                      ...prev,
                      statistics: { ...prev.statistics, best_secured_rate: e.target.value },
                    }));
                  }}
                  placeholder="e.g. 7.5%"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
                />
                <p className="text-[0.7rem] text-muted-foreground">Label: Best secured rate</p>
              </div>
            </div>

            {/* Live Preview Bar */}
            <div className="mt-8 rounded-2xl border border-border bg-secondary/30 p-5">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                Live Public Preview:
              </span>
              <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
                <div className="bg-background p-4">
                  <p className="font-display text-2xl font-extrabold text-ink">
                    {config.statistics.funding_facilitated}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Funding facilitated</p>
                </div>
                <div className="bg-background p-4">
                  <p className="font-display text-2xl font-extrabold text-ink">
                    {config.statistics.median_sanction_time}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Median sanction time</p>
                </div>
                <div className="bg-background p-4">
                  <p className="font-display text-2xl font-extrabold text-ink">
                    {config.statistics.lender_relationships}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Lender relationships</p>
                </div>
                <div className="bg-background p-4">
                  <p className="font-display text-2xl font-extrabold text-ink">
                    {config.statistics.best_secured_rate}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Best secured rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMI Calculator */}
      {activeTab === "emi" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-ink">EMI Calculator Defaults & Settings</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Configure the baseline calculation rate and disclaimer displayed on the interactive
                calculator card.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink">
                  Default Indicative Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  max="35"
                  value={config.emi.default_rate}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({
                      ...prev,
                      emi: { ...prev.emi, default_rate: parseFloat(e.target.value) || 8.9 },
                    }));
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  Default rate used for calculating monthly EMI and indicative outflow (e.g. 8.90%).
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-ink">Max Tenure (Years)</label>
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={config.emi.max_years}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({
                      ...prev,
                      emi: { ...prev.emi, max_years: parseInt(e.target.value, 10) || 30 },
                    }));
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary"
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  Slider upper limit (e.g. 30 years).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-ink">EMI Calculator Disclaimer Text</label>
              <textarea
                rows={3}
                value={config.emi.disclaimer}
                onChange={(e) => {
                  setIsDirty(true);
                  setConfig((prev) => ({
                    ...prev,
                    emi: { ...prev.emi, disclaimer: e.target.value },
                  }));
                }}
                className="w-full rounded-2xl border border-border bg-background p-3.5 text-xs text-ink outline-none focus:border-primary"
              />
              <p className="text-[0.7rem] text-muted-foreground">
                Displayed in subtle text below the EMI preview card.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Loan Rates & Comparison */}
      {activeTab === "rates" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-bold text-ink">Interest Comparison Rates</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  All loan types and indicative starting rates displayed on the comparison card.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddRateModal}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Loan Type
              </button>
            </div>

            {/* Rates Table */}
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/40 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Loan Type</th>
                    <th className="py-3 px-4">Starting Rate</th>
                    <th className="py-3 px-4">Display Label</th>
                    <th className="py-3 px-4">Tenure</th>
                    <th className="py-3 px-4 w-24">Status</th>
                    <th className="py-3 px-4 w-36 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {config.rates.map((rate, idx) => (
                    <tr
                      key={rate.id || rate.name}
                      className={`hover:bg-secondary/20 transition ${!rate.is_active ? "opacity-50" : ""}`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-ink">{rate.name}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        {rate.rate}
                      </td>
                      <td className="py-3 px-4 font-semibold text-ink">
                        {rate.display_rate || `${rate.rate} onwards`}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{rate.tenure}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleRateActive(rate.id)}
                          className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold cursor-pointer ${
                            rate.is_active
                              ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {rate.is_active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => moveRate(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRate(idx, "down")}
                            disabled={idx === config.rates.length - 1}
                            className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditRateModal(rate)}
                            className="p-1 text-muted-foreground hover:text-primary cursor-pointer ml-1"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRate(rate.id)}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Disclaimers & Notes */}
            <div className="grid gap-4 pt-4 border-t border-border">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Comparison Note (Short)</label>
                <input
                  type="text"
                  value={config.rate_note}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({ ...prev, rate_note: e.target.value }));
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Statutory Rate Disclaimer</label>
                <textarea
                  rows={2}
                  value={config.rate_disclaimer}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({ ...prev, rate_disclaimer: e.target.value }));
                  }}
                  className="w-full rounded-2xl border border-border bg-background p-3.5 text-xs text-ink outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Bank Partnerships & Lenders */}
      {activeTab === "lenders" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-bold text-ink">
                  Bank Partner Network ({config.lenders.length})
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lenders, NBFCs and financial institutions displayed in the partnership grid.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddLenderModal}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Lender
              </button>
            </div>

            {/* Section Headings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Section Title</label>
                <input
                  type="text"
                  value={config.partnerships_heading}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({ ...prev, partnerships_heading: e.target.value }));
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Section Description</label>
                <input
                  type="text"
                  value={config.partnerships_description}
                  onChange={(e) => {
                    setIsDirty(true);
                    setConfig((prev) => ({ ...prev, partnerships_description: e.target.value }));
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-ink outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={lenderSearch}
                  onChange={(e) => setLenderSearch(e.target.value)}
                  placeholder="Search lenders by name…"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <select
                value={lenderTypeFilter}
                onChange={(e) => setLenderTypeFilter(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              >
                <option value="all">All Institution Types</option>
                <option value="Bank">Banks</option>
                <option value="NBFC">NBFCs</option>
                <option value="Housing Finance Company">Housing Finance</option>
                <option value="Financial Institution">Financial Institutions</option>
              </select>

              <select
                value={lenderStatusFilter}
                onChange={(e) => setLenderStatusFilter(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              >
                <option value="all">All Statuses</option>
                <option value="featured">Featured Only</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Lenders Table */}
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/40 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Lender / Institution</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Logo Status</th>
                    <th className="py-3 px-4 w-24 text-center">Featured</th>
                    <th className="py-3 px-4 w-24 text-center">Status</th>
                    <th className="py-3 px-4 w-36 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLenders.map((lender, idx) => (
                    <tr
                      key={lender.id || lender.name}
                      className={`hover:bg-secondary/20 transition ${!lender.is_active ? "opacity-50" : ""}`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {lender.logo_url ? (
                            <img
                              src={lender.logo_url}
                              alt={lender.name}
                              className="h-6 w-12 object-contain rounded bg-white p-0.5 border border-border"
                            />
                          ) : (
                            <div className="h-6 w-12 grid place-items-center rounded bg-secondary text-[0.65rem] font-bold text-muted-foreground">
                              {lender.name.slice(0, 4)}
                            </div>
                          )}
                          <span className="font-bold text-ink">{lender.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                          {lender.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {lender.logo_url ? (
                          <span className="text-[0.68rem] text-emerald-600 font-medium">
                            Custom Logo
                          </span>
                        ) : (
                          <span className="text-[0.68rem] text-muted-foreground">
                            Text Fallback
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleLenderFeatured(lender.id)}
                          className={`p-1 rounded cursor-pointer ${
                            lender.is_featured
                              ? "text-amber-500"
                              : "text-muted-foreground/40 hover:text-amber-500"
                          }`}
                          title={lender.is_featured ? "Featured Partner" : "Mark Featured"}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleLenderActive(lender.id)}
                          className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold cursor-pointer ${
                            lender.is_active
                              ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {lender.is_active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => moveLender(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLender(idx, "down")}
                            disabled={idx === config.lenders.length - 1}
                            className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditLenderModal(lender)}
                            className="p-1 text-muted-foreground hover:text-primary cursor-pointer ml-1"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLender(lender.id)}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Add/Edit Rate --- */}
      {isRateModalOpen && editingRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-ink">
              {config.rates.some((r) => r.id === editingRate.id)
                ? "Edit Loan Type"
                : "Add Loan Type"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink">Loan Type Name</label>
                <input
                  type="text"
                  value={editingRate.name}
                  onChange={(e) => setEditingRate({ ...editingRate, name: e.target.value })}
                  placeholder="e.g. Home Loan, Business Loan"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Starting Rate</label>
                <input
                  type="text"
                  value={editingRate.rate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingRate({
                      ...editingRate,
                      rate: val,
                      display_rate: val.includes("onwards") ? val : `${val} onwards`,
                    });
                  }}
                  placeholder="e.g. 7.50%"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Display Text</label>
                <input
                  type="text"
                  value={editingRate.display_rate}
                  onChange={(e) => setEditingRate({ ...editingRate, display_rate: e.target.value })}
                  placeholder="e.g. 7.50% onwards"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Tenure Description</label>
                <input
                  type="text"
                  value={editingRate.tenure}
                  onChange={(e) => setEditingRate({ ...editingRate, tenure: e.target.value })}
                  placeholder="e.g. Up to 30 years, Renewable"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rate-active-check"
                  checked={editingRate.is_active}
                  onChange={(e) => setEditingRate({ ...editingRate, is_active: e.target.checked })}
                  className="rounded border-border accent-primary"
                />
                <label
                  htmlFor="rate-active-check"
                  className="text-xs font-medium text-ink cursor-pointer"
                >
                  Active (Show on public website)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsRateModalOpen(false);
                  setEditingRate(null);
                }}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveRate(editingRate)}
                disabled={!editingRate.name.trim()}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition cursor-pointer disabled:opacity-50"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Add/Edit Lender --- */}
      {isLenderModalOpen && editingLender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-ink">
              {config.lenders.some((l) => l.id === editingLender.id) ? "Edit Lender" : "Add Lender"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink">Lender / Institution Name</label>
                <input
                  type="text"
                  value={editingLender.name}
                  onChange={(e) => setEditingLender({ ...editingLender, name: e.target.value })}
                  placeholder="e.g. State Bank of India, Tata Capital"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Institution Type</label>
                <select
                  value={editingLender.type}
                  onChange={(e) =>
                    setEditingLender({ ...editingLender, type: e.target.value as LenderType })
                  }
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                >
                  <option value="Bank">Bank</option>
                  <option value="NBFC">NBFC</option>
                  <option value="Housing Finance Company">Housing Finance Company</option>
                  <option value="Financial Institution">Financial Institution</option>
                </select>
              </div>

              {/* Logo Picker */}
              <div>
                <label className="text-xs font-bold text-ink">Lender Logo (Optional)</label>
                <div className="mt-2 flex items-center gap-4">
                  {editingLender.logo_url ? (
                    <div className="relative h-14 w-24 rounded-xl border border-border bg-white p-1.5 flex items-center justify-center">
                      <img
                        src={editingLender.logo_url}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-24 rounded-xl border border-dashed border-border bg-secondary/30 flex items-center justify-center text-[0.65rem] text-muted-foreground text-center p-1">
                      No Logo (Text fallback)
                    </div>
                  )}

                  <div className="space-y-2">
                    <MediaButton
                      label={editingLender.logo_url ? "Replace Logo" : "Choose / Upload Logo"}
                      onSelect={(url) => setEditingLender({ ...editingLender, logo_url: url })}
                      folderPrefix="website-documents/lenders"
                    />
                    {editingLender.logo_url && (
                      <button
                        type="button"
                        onClick={() => setEditingLender({ ...editingLender, logo_url: "" })}
                        className="block text-[0.7rem] text-destructive hover:underline cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink">
                  Official Website URL (Optional)
                </label>
                <input
                  type="text"
                  value={editingLender.website_url || ""}
                  onChange={(e) =>
                    setEditingLender({ ...editingLender, website_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lender-active-check"
                    checked={editingLender.is_active}
                    onChange={(e) =>
                      setEditingLender({ ...editingLender, is_active: e.target.checked })
                    }
                    className="rounded border-border accent-primary"
                  />
                  <label
                    htmlFor="lender-active-check"
                    className="text-xs font-medium text-ink cursor-pointer"
                  >
                    Active Partner
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lender-featured-check"
                    checked={editingLender.is_featured}
                    onChange={(e) =>
                      setEditingLender({ ...editingLender, is_featured: e.target.checked })
                    }
                    className="rounded border-border accent-primary"
                  />
                  <label
                    htmlFor="lender-featured-check"
                    className="text-xs font-medium text-ink cursor-pointer"
                  >
                    Featured Partner (Show first)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsLenderModalOpen(false);
                  setEditingLender(null);
                }}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveLender(editingLender)}
                disabled={!editingLender.name.trim()}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition cursor-pointer disabled:opacity-50"
              >
                Save Lender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
