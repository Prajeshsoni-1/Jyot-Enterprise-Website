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

async function run() {
  console.log("=== Local public/downloads ===");
  if (fs.existsSync("public/downloads")) {
    const files = fs.readdirSync("public/downloads");
    console.log(`Found ${files.length} files:`);
    console.log(files.slice(0, 40));
  } else {
    console.log("No public/downloads directory");
  }

  console.log("\n=== Supabase Storage: jyot-enterprise / website-documents/resources ===");
  const { data: storageFiles, error } = await supabase.storage.from("jyot-enterprise").list("website-documents/resources", { limit: 100 });
  if (error) {
    console.error("Storage error:", error);
  } else {
    console.log(`Found ${storageFiles.length} files in storage:`);
    console.log(storageFiles.map(f => `${f.name} (${f.metadata?.size || f.id} bytes)`));
  }
}

run();
