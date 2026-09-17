const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf-8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = val;
    }
  });
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  console.log("Auth Users:", users?.users?.map(u => ({ id: u.id, email: u.email })), uErr);

  const { data: roles, error: rErr } = await supabase.from("user_roles").select("*");
  console.log("User Roles:", roles, rErr);

  const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
  console.log("Profiles:", profiles, pErr);
}

inspect().catch(console.error);
