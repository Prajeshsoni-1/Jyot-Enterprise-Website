import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Checking Supabase tables...");

  const { data: rfData, error: rfErr } = await supabase.from("cms_resource_files").select("*").limit(2);
  console.log("cms_resource_files:", { count: rfData?.length, error: rfErr?.message || rfErr?.code });

  const { data: leads, error: lErr } = await supabase.from("leads").select("id, reference, name, email").order("created_at", { ascending: false }).limit(3);
  console.log("recent leads:", leads, lErr?.message);
}

main();
