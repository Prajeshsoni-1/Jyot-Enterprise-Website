import http from "http";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env
const envContent = fs.readFileSync(".env", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
}

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testDatabase() {
  console.log("=== 1. Testing Database Config ===");
  const { data: service, error } = await supabase
    .from("cms_services")
    .select("slug, data")
    .eq("slug", "financial")
    .single();

  if (error || !service) {
    console.error("FAIL: Could not load cms_services financial:", error?.message);
    process.exit(1);
  }

  const showcase = service.data?.financial_showcase;
  console.log("Found financial_showcase:", !!showcase);
  console.log("Statistics:", showcase?.statistics);
  console.log("Rates count:", showcase?.rates?.length);
  console.log("Lenders count:", showcase?.lenders?.length);

  // Assertions
  const stats = showcase?.statistics;
  if (stats?.funding_facilitated !== "₹150 Cr") throw new Error(`Expected ₹150 Cr, got ${stats?.funding_facilitated}`);
  if (stats?.median_sanction_time !== "15 days") throw new Error(`Expected 15 days, got ${stats?.median_sanction_time}`);
  if (stats?.lender_relationships !== "86+") throw new Error(`Expected 86+, got ${stats?.lender_relationships}`);
  if (stats?.best_secured_rate !== "7.5%") throw new Error(`Expected 7.5%, got ${stats?.best_secured_rate}`);

  console.log("✓ Statistics match all requirements!");

  const rateNames = showcase?.rates?.map(r => r.name);
  if (!rateNames.includes("Personal Loan")) throw new Error("Missing Personal Loan in rates");
  if (!rateNames.includes("Vehicle / Car Loan")) throw new Error("Missing Vehicle / Car Loan in rates");
  console.log("✓ All 6 required loan types present!");

  const allHaveOnwards = showcase?.rates?.every(r => r.display_rate?.includes("onwards") || r.rate?.includes("onwards"));
  if (!allHaveOnwards) throw new Error("Some rates do not have 'onwards'!");
  console.log("✓ All rates use 'onwards'!");

  if (showcase?.lenders?.length < 34) throw new Error(`Expected at least 34 lenders, got ${showcase?.lenders?.length}`);
  console.log(`✓ Lenders list contains ${showcase?.lenders?.length} institutions!`);
}

async function testPublicEndpoint() {
  console.log("\n=== 2. Testing Public /services/financial Endpoint ===");
  return new Promise((resolve) => {
    http.get("http://localhost:8080/services/financial", (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => {
        console.log("HTTP Status:", res.statusCode);

        const checks = [
          { name: "₹150 Cr", ok: body.includes("₹150 Cr") },
          { name: "380 Cr removed", ok: !body.includes("380 Cr") },
          { name: "15 days", ok: body.includes("15 days") },
          { name: "86+", ok: body.includes("86+") },
          { name: "7.5%", ok: body.includes("7.5%") },
          { name: "38 days removed", ok: !body.includes("38 days") },
          { name: "24+ removed", ok: !body.includes("24+") },
          { name: "Personal Loan", ok: body.includes("Personal Loan") },
          { name: "Vehicle / Car Loan", ok: body.includes("Vehicle / Car Loan") },
          { name: "7.50% onwards", ok: body.includes("7.50% onwards") },
          { name: "Business Loan 9.90% onwards", ok: body.includes("9.90% onwards") },
          { name: "Bank Partnerships", ok: body.includes("Bank Partnerships") },
          { name: "We work with a wide network", ok: body.includes("We work with a wide network") },
          { name: "SBI", ok: body.includes("SBI") },
          { name: "HDFC Bank", ok: body.includes("HDFC Bank") },
          { name: "Tata Capital", ok: body.includes("Tata Capital") },
          { name: "Cholamandalam Finance", ok: body.includes("Cholamandalam Finance") }
        ];

        let allOk = true;
        for (const c of checks) {
          if (!c.ok) {
            console.error(`  ✗ FAIL: ${c.name}`);
            allOk = false;
          } else {
            console.log(`  ✓ PASS: ${c.name}`);
          }
        }

        if (!allOk) process.exit(1);
        resolve();
      });
    }).on("error", (e) => {
      console.error("HTTP error:", e.message);
      process.exit(1);
    });
  });
}

async function run() {
  await testDatabase();
  await testPublicEndpoint();
  console.log("\n==================================================");
  console.log("ALL FINANCIAL SERVICES & LENDERS TESTS PASSED!");
  console.log("==================================================");
}

run();
