import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { DEFAULT_FINANCIAL_CONFIG } from "../src/data/financial.ts";

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

async function run() {
  console.log("Seeding financial CMS configuration...");
  const { data: row, error: fetchErr } = await supabase
    .from("cms_services")
    .select("id, slug, data")
    .eq("slug", "financial")
    .maybeSingle();

  if (fetchErr || !row) {
    console.error("Could not find cms_services row for financial:", fetchErr?.message);
    process.exit(1);
  }

  const updatedData = {
    ...(row.data || {}),
    financial_showcase: DEFAULT_FINANCIAL_CONFIG,
  };

  const { error: updateErr } = await supabase
    .from("cms_services")
    .update({
      data: updatedData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (updateErr) {
    console.error("Update error:", updateErr.message);
    process.exit(1);
  }

  console.log("SUCCESS! Seeded financial_showcase into cms_services.");

  // Also check if cms_lenders exists, if so seed lenders
  try {
    for (const l of DEFAULT_FINANCIAL_CONFIG.lenders) {
      await supabase.from("cms_lenders").upsert({
        name: l.name,
        type: l.type,
        is_active: l.is_active,
        is_featured: l.is_featured,
        sort_order: l.sort_order,
      });
    }
    console.log("Seeded cms_lenders table!");
  } catch (err) {
    console.log("cms_lenders table notice (safe to ignore if pending migration):", err.message);
  }
}

run();
