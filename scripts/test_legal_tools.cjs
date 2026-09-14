const assert = require("assert");

console.log("=== RUNNING LEGAL TOOLS UNIT TESTS ===");

// 1. Currency Formatting
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

console.log("\n1. Testing Currency Formatter...");
assert.strictEqual(formatLakhRupee(4500), "₹4,500");
assert.strictEqual(formatLakhRupee(9000), "₹9,000");
assert.strictEqual(formatLakhRupee(25000), "₹25,000");
assert.strictEqual(formatLakhRupee(150000), "₹1.50 L");
assert.strictEqual(formatLakhRupee(4000000), "₹40.00 L");
console.log("✓ Currency formatter passed.");

// 2. GST Registration Wizard Logic
console.log("\n2. Testing GST Registration Wizard Logic...");
function evaluateGst({ state, activity, interstate, ecommerce, turnoverBracket }) {
  const isSpecialState = state.startsWith("Special Category");
  let thresholdAmount = 4000000;
  if (activity.startsWith("Services") || activity.startsWith("Goods + Services")) {
    thresholdAmount = isSpecialState ? 1000000 : 2000000;
  } else if (isSpecialState) {
    thresholdAmount = 2000000;
  } else if (activity.startsWith("Exempt")) {
    thresholdAmount = 0;
  }

  const triggers = [];
  if (interstate === "Yes") triggers.push("Inter-state supply (Sec 24)");
  if (ecommerce === "Yes") triggers.push("E-commerce selling");

  const turnoverCrossed =
    (turnoverBracket === "₹20 – ₹40 lakh" && thresholdAmount <= 2000000) ||
    turnoverBracket === "₹40 lakh – ₹1.5 crore" ||
    turnoverBracket === "Above ₹1.5 crore";

  if (turnoverCrossed && !activity.startsWith("Exempt")) {
    triggers.push("Turnover crossed threshold");
  }

  if (activity.startsWith("Exempt")) return "Not mandatory (Exempt)";
  if (triggers.length > 0) return "Mandatory / Special Condition";
  return "Not mandatory";
}

// Scenario A: Gujarat Services turnover ₹20–40 Lakh -> Mandatory (crossed ₹20L limit)
assert.strictEqual(
  evaluateGst({
    state: "Gujarat (Normal state)",
    activity: "Services (Exclusive supply of services)",
    interstate: "No",
    ecommerce: "No",
    turnoverBracket: "₹20 – ₹40 lakh",
  }),
  "Mandatory / Special Condition",
);

// Scenario B: Gujarat Goods turnover ₹20–40 Lakh, no interstate -> Not mandatory (Goods limit is ₹40L in Gujarat)
assert.strictEqual(
  evaluateGst({
    state: "Gujarat (Normal state)",
    activity: "Goods (Exclusive supply of goods)",
    interstate: "No",
    ecommerce: "No",
    turnoverBracket: "₹20 – ₹40 lakh",
  }),
  "Not mandatory",
);

// Scenario C: Gujarat Goods turnover Below ₹10 Lakh, but Interstate = Yes -> Mandatory under Sec 24
assert.strictEqual(
  evaluateGst({
    state: "Gujarat (Normal state)",
    activity: "Goods (Exclusive supply of goods)",
    interstate: "Yes",
    ecommerce: "No",
    turnoverBracket: "Below ₹10 lakh",
  }),
  "Mandatory / Special Condition",
);

// Scenario D: Exempt supply -> Not mandatory
assert.strictEqual(
  evaluateGst({
    state: "Gujarat (Normal state)",
    activity: "Exempt / Nil-rated supplies only",
    interstate: "No",
    ecommerce: "No",
    turnoverBracket: "Above ₹1.5 crore",
  }),
  "Not mandatory (Exempt)",
);
console.log("✓ GST Registration Wizard logic passed all scenarios.");

// 3. Trademark Guide Official Fee Calculations
console.log("\n3. Testing Trademark Fee Calculation...");
function calculateTmFees({ applicantType, classCount, isExpedited }) {
  const isConcession =
    applicantType.startsWith("Individual") ||
    applicantType.startsWith("Startup") ||
    applicantType.startsWith("Small Enterprise");

  const govtFeePerClass = isExpedited ? (isConcession ? 20000 : 40000) : (isConcession ? 4500 : 9000);
  const totalGovtFee = govtFeePerClass * classCount;
  const profFeePerClass = isExpedited ? 6000 : 3500;
  const totalProfFee = profFeePerClass * classCount;

  return { totalGovtFee, totalProfFee, totalPlanningEstimate: totalGovtFee + totalProfFee };
}

// Concession 1 class standard: Govt = ₹4,500, Prof = ₹3,500, Total = ₹8,000
const tm1 = calculateTmFees({
  applicantType: "Small Enterprise / MSME (Udyam registered)",
  classCount: 1,
  isExpedited: false,
});
assert.strictEqual(tm1.totalGovtFee, 4500);
assert.strictEqual(tm1.totalProfFee, 3500);
assert.strictEqual(tm1.totalPlanningEstimate, 8000);

// Corporate 2 classes standard: Govt = 2 * 9,000 = ₹18,000, Prof = 2 * 3,500 = ₹7,000, Total = ₹25,000
const tm2 = calculateTmFees({
  applicantType: "Private Limited Company / Corporate",
  classCount: 2,
  isExpedited: false,
});
assert.strictEqual(tm2.totalGovtFee, 18000);
assert.strictEqual(tm2.totalProfFee, 7000);
assert.strictEqual(tm2.totalPlanningEstimate, 25000);
console.log("✓ Trademark statutory vs professional fee separation passed.");

// 4. Company Registration Selection
console.log("\n4. Testing Company Registration Selection...");
function selectStructure({ founders, funding, needLiability, objective }) {
  const isSolo = founders === "1 founder";
  const wantsVC = funding.includes("Angel / Venture Capital") || funding.includes("Maybe equity");
  const isTechOrStartup = objective.includes("Technology / SaaS") || objective.includes("High-growth");

  if (wantsVC || (isTechOrStartup && !isSolo)) return "Private Limited Company (Pvt Ltd)";
  if (isSolo) {
    if (needLiability === "Yes") return "One Person Company (OPC)";
    return "Sole Proprietorship";
  }
  if (needLiability === "Yes") return "Limited Liability Partnership (LLP)";
  return "Partnership Firm";
}

// 2 founders + VC funding -> Pvt Ltd
assert.strictEqual(
  selectStructure({
    founders: "2 co-founders",
    funding: "Angel / Venture Capital equity investors",
    needLiability: "Yes",
    objective: "Technology / SaaS & digital startup",
  }),
  "Private Limited Company (Pvt Ltd)",
);

// 1 founder + limited liability -> OPC
assert.strictEqual(
  selectStructure({
    founders: "1 founder",
    funding: "No external funding (Bootstrapped)",
    needLiability: "Yes",
    objective: "Professional services / Consulting",
  }),
  "One Person Company (OPC)",
);

// 2 founders + consulting + no VC -> LLP
assert.strictEqual(
  selectStructure({
    founders: "2 co-founders",
    funding: "No external funding (Bootstrapped)",
    needLiability: "Yes",
    objective: "Professional services / Consulting",
  }),
  "Limited Liability Partnership (LLP)",
);
console.log("✓ Company Registration Selector logic passed.");

console.log("\n=== ALL LEGAL TOOLS UNIT TESTS PASSED SUCCESSFULLY ===");
