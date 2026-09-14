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

async function test() {
  const candidates = [
    'admin_notifications',
    'notifications',
    'crm_notifications',
    'app_notifications',
    'leads',
    'bookings',
    'user_roles',
    'profiles'
  ];
  for (const c of candidates) {
    const { data, error } = await sb.from(c).select('id').limit(1);
    console.log(c, error ? 'NOT FOUND / ERROR: ' + error.message : 'EXISTS (sample: ' + (data ? data.length : 0) + ')');
  }
}

test().catch(console.error);
