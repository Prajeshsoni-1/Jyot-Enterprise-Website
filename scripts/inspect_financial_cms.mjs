import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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
  const { data: services, error } = await supabase.from("cms_services").select("id, slug, title, data");
  console.log("cms_services count:", services?.length, "error:", error?.message);
  for (const s of services || []) {
    console.log(`- [${s.slug}] ${s.title}:`, s.data);
  }

  // Also check if any lender table exists
  const { data: lenders, error: lErr } = await supabase.from("cms_lenders").select("*").limit(1);
  console.log("cms_lenders check:", lErr ? lErr.message : `Found ${lenders?.length} rows`);
}

run();
