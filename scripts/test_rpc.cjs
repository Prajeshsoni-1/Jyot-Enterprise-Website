const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = path.join(process.cwd(), '.env');
const env = Object.fromEntries(
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      let v = l.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return [l.slice(0, i).trim(), v];
    })
);

const sb = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectRpc() {
  const rpcs = ['admin_exists', 'claim_first_admin', 'has_role', 'is_team'];
  for (const r of rpcs) {
    const { data, error } = await sb.rpc(r);
    console.log(`RPC ${r}:`, error ? error.message : 'SUCCESS: ' + JSON.stringify(data));
  }
}

inspectRpc().catch(console.error);
