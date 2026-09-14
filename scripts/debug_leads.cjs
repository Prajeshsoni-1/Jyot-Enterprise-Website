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

async function check() {
  let rows = [];
  const primary = await supabase
    .from("leads")
    .select("id, reference, name, email, phone, city, status, application_stage, details, created_at")
    .eq("source", "careers")
    .order("created_at", { ascending: false })
    .limit(300);

  if (!primary.error && primary.data) {
    console.log("Primary succeeded!");
    rows = primary.data;
  } else {
    console.log("Primary failed as expected, running fallback...");
    const fallback = await supabase
      .from("leads")
      .select("id, reference, name, email, phone, city, status, details, attachments, created_at")
      .eq("source", "careers")
      .order("created_at", { ascending: false })
      .limit(300);
    if (fallback.error) {
      console.error("Fallback error:", fallback.error);
      return;
    }
    rows = fallback.data ?? [];
  }

  const normalized = rows.map((r) => ({
    ...r,
    application_stage:
      r.application_stage ||
      r.details?.application_stage ||
      r.details?.stage ||
      r.status ||
      "new",
  }));

  console.log("Successfully loaded applications count:", normalized.length);
  const firstAttachment = normalized.find(r => r.attachments && r.attachments.length > 0)?.attachments[0];
  if (firstAttachment?.path) {
    const { data: signed, error: signErr } = await supabase.storage.from('lead-uploads').createSignedUrl(firstAttachment.path, 300);
    console.log("Signed URL test result for path:", firstAttachment.path, signed ? "SUCCESS (URL generated)" : "FAILED", signErr);
  }
}

check().catch(console.error);
