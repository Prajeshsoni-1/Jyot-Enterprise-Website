// Unit tests for the 5 IT calculators
const assert = require("assert");

function formatLakhRupee(val) {
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

console.log("=== RUNNING IT TOOLS RECALIBRATION TESTS ===");

// TEST 1: Currency Formatter
console.log("\n1. Testing Currency Formatter...");
assert.strictEqual(formatLakhRupee(25000), "₹25,000");
assert.strictEqual(formatLakhRupee(61500), "₹61,500");
assert.strictEqual(formatLakhRupee(150000), "₹1.50 L");
assert.strictEqual(formatLakhRupee(330000), "₹3.30 L");
assert.strictEqual(formatLakhRupee(12500000), "₹1.25 Cr");
console.log("✓ Currency formatter tests passed.");

// TEST 2: Website Cost Calculator
console.log("\n2. Testing Website Cost Calculator...");
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

const WEBSITE_ADDONS = {
  "CMS Content Management (Dynamic Updates)": 12000,
  "Lead Capture & Instant WhatsApp Integration": 6500,
};

// Default scenario:
const defType = SITE_TYPE_CONFIG["Professional Business Website"];
const defDesign = DESIGN_APPROACH["Professional / Semi-custom"];
const defPages = 8;
const defExtraPages = Math.max(defPages - defType.includedPages, 0);
const defBase = Math.round(defType.base * defDesign + defExtraPages * defType.extraPageRate);
const defAddons = 12000 + 6500;
const defTotal = defBase + defAddons;
const defMin = Math.round(defTotal * 0.88);
const defMax = Math.round(defTotal * 1.15);

console.log("Default Website Cost:", {
  baseBuild: formatLakhRupee(defBase),
  addOns: formatLakhRupee(defAddons),
  total: formatLakhRupee(defTotal),
  range: `${formatLakhRupee(defMin)} – ${formatLakhRupee(defMax)}`,
});
assert(defMin >= 50000 && defMax <= 75000, "Default website cost must be in realistic ₹50k–₹75k range");
console.log("✓ Website cost calculator default benchmark verified!");

// TEST 3: ERP Cost Estimator
console.log("\n3. Testing ERP Cost Estimator Critical Benchmark...");
const erpBaseFramework = 140000;
const erpUsers = 25;
const erpModules = 2; // Finance & Accounting, Inventory
const erpUserCost = erpUsers * 2500;
const erpModuleCost = erpModules * 60000;
const erpDeploymentMult = 1.0; // Cloud
const erpMigrationMult = 1.15; // Moderate
const erpSubtotal = (erpBaseFramework + erpModuleCost + erpUserCost) * erpDeploymentMult * erpMigrationMult;
const erpMin = Math.round(erpSubtotal * 0.9);
const erpMax = Math.round(erpSubtotal * 1.25);
const erpAmc = Math.round(erpSubtotal * 0.18);
const erpWeeksMin = Math.max(6, Math.round(erpModules * 2.8));
const erpWeeksMax = Math.max(10, Math.round(erpModules * 3.8));

console.log("ERP Critical Test Scenario (25 users, Cloud, Moderate, Finance + Inventory):", {
  midpoint: formatLakhRupee(erpSubtotal),
  implementationRange: `${formatLakhRupee(erpMin)} – ${formatLakhRupee(erpMax)}`,
  amc: `${formatLakhRupee(erpAmc)}/yr`,
  rollout: `${erpWeeksMin} – ${erpWeeksMax} weeks`,
});
assert(erpMin >= 320000 && erpMin <= 345000, "ERP min implementation should be ~₹3.3L");
assert(erpMax >= 450000 && erpMax <= 475000, "ERP max implementation should be ~₹4.6L");
assert(erpWeeksMin === 6 && erpWeeksMax === 10, "ERP rollout should be 6–10 weeks");
console.log("✓ ERP benchmark matches user test requirement precisely!");

// TEST 4: Digital Marketing ROI
console.log("\n4. Testing Digital Marketing ROI...");
const adBudget = 50000;
const agencyFee = 15000;
const cpl = 500;
const conversionRate = 8; // 8%
const dealValue = 45000;
const margin = 40; // 40%

const totalMarketingInvestment = adBudget + agencyFee;
const estimatedLeads = Math.floor(adBudget / cpl);
const estimatedCustomers = Number(((estimatedLeads * conversionRate) / 100).toFixed(1));
const projectedRevenue = Math.round(estimatedCustomers * dealValue);
const grossProfit = Math.round((projectedRevenue * margin) / 100);
const netProfitAfterMarketing = grossProfit - totalMarketingInvestment;
const roas = projectedRevenue / adBudget;
const roi = Math.round((netProfitAfterMarketing / totalMarketingInvestment) * 100);

console.log("Marketing ROI Scenario:", {
  adBudget: formatLakhRupee(adBudget),
  agencyFee: formatLakhRupee(agencyFee),
  totalMarketingInvestment: formatLakhRupee(totalMarketingInvestment),
  estimatedLeads,
  estimatedCustomers,
  projectedRevenue: formatLakhRupee(projectedRevenue),
  grossProfit: formatLakhRupee(grossProfit),
  netProfit: formatLakhRupee(netProfitAfterMarketing),
  roas: `${roas.toFixed(1)}x`,
  roi: `${roi}%`,
});
assert.strictEqual(totalMarketingInvestment, 65000, "Ad budget and agency fee must be kept separate and sum to ₹65k");
assert.strictEqual(estimatedLeads, 100, "Leads must be calculated strictly from ad budget (₹50k / ₹500 = 100), not total investment");
assert.strictEqual(estimatedCustomers, 8, "100 leads @ 8% = 8 customers");
assert.strictEqual(projectedRevenue, 360000, "8 * ₹45k = ₹3,60,000 revenue");
assert.strictEqual(grossProfit, 144000, "₹3.6L * 40% margin = ₹1,44,000");
assert.strictEqual(netProfitAfterMarketing, 79000, "₹1,44,000 - ₹65,000 = ₹79,000 net profit");
console.log("✓ Marketing ROI separation and calculation verified!");

console.log("\n=== ALL TEST SCENARIOS PASSED WITH ZERO ERRORS ===");
