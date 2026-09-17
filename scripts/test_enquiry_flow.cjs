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

const anonClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const adminClient = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testFlow() {
  console.log("=== 1. Testing Anon Insert into Leads ===");
  const testRef = "TEST-ENQ-" + Math.floor(1000 + Math.random() * 9000);
  const { data: insertData, error: insertErr } = await anonClient
    .from("leads")
    .insert({
      reference: testRef,
      name: "Test Visitor",
      email: "visitor@example.com",
      phone: "+91 98765 43210",
      company: "Test Corp",
      division: "it",
      service: "Enterprise Cloud Migration",
      message: "Testing enquiry flow",
      status: "new",
      source: "website",
    })
    .select("id, reference")
    .single();

  console.log("Anon insert result:", { insertData, insertErr: insertErr?.message });

  console.log("\n=== 2. Checking admin_notifications table ===");
  const { data: notifData, error: notifErr } = await adminClient
    .from("admin_notifications")
    .select("*")
    .limit(5);

  console.log("admin_notifications query result:", { notifData, notifErr: notifErr?.message });

  // Clean up test lead
  if (insertData?.id) {
    await adminClient.from("leads").delete().eq("id", insertData.id);
    console.log("Cleaned up test lead:", insertData.id);
  }
}

testFlow().catch(console.error);
