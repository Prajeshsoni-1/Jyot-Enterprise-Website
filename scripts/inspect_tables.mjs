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

async function inspectTables() {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
    headers: {
      "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await res.json();
  console.log("lead_activity properties:", Object.keys(data.definitions?.lead_activity?.properties || {}));
  console.log("cms_audit_log properties:", Object.keys(data.definitions?.cms_audit_log?.properties || {}));
}

inspectTables().catch(console.error);
