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

async function getPaths() {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
    headers: {
      "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await res.json();
  const rpcs = Object.keys(data.paths || {}).filter(p => p.startsWith("/rpc/"));
  console.log("RPC functions:", rpcs);
}

getPaths().catch(console.error);
