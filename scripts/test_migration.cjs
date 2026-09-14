const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envFile = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envFile, 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=["']?([^"'\r\n]+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\r\n]+)/)[1].trim();

const supabase = createClient(url, key);

async function testRpc() {
  const funcs = ['exec', 'execute_sql', 'exec_sql', 'sql', 'query'];
  for (const f of funcs) {
    const { data, error } = await supabase.rpc(f, { query: 'SELECT 1' });
    console.log(`RPC ${f}:`, error ? error.message : 'SUCCESS');
  }
}

testRpc();
