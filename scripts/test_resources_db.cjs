const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return [line.slice(0, idx).trim(), val];
    })
);

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data, error } = await supabase
    .from('cms_resources')
    .select('id, slug, title, status, category, resource_type, data')
    .order('sort_order', { ascending: true });

  console.log('cms_resources rows count:', data?.length, 'error:', error?.message);
  if (data) {
    for (const r of data) {
      console.log(`\n- [${r.status}] ${r.title} (${r.slug}):`);
      console.log(`  downloads (${r.data?.downloads?.length || 0}):`, JSON.stringify(r.data?.downloads, null, 2));
    }
  }
}

inspect().catch(console.error);
