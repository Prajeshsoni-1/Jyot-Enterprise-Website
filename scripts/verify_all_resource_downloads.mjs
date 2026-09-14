import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env
const envContent = fs.readFileSync(".env", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
}

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyAllDownloads() {
  console.log("==================================================");
  console.log("CRITICAL DOWNLOAD QA VERIFICATION (REQUIREMENT 30)");
  console.log("==================================================");

  const { data: resources, error } = await supabase
    .from("cms_resources")
    .select("id, slug, title, data")
    .order("sort_order", { ascending: true });

  if (error || !resources) {
    console.error("Failed to load resources:", error?.message);
    process.exit(1);
  }

  let totalFiles = 0;
  let passedFiles = 0;
  let failedFiles = 0;

  for (const r of resources) {
    console.log(`\nChecking Resource: [${r.slug}] "${r.title}"`);
    const files = r.data?.resourceFiles || [];
    console.log(`  Found ${files.length} attached download records.`);

    if (files.length === 0) {
      console.warn(`  WARNING: No download records on ${r.slug}!`);
      continue;
    }

    for (const f of files) {
      totalFiles++;
      const { title, file_url, file_type, mime_type, file_name } = f;

      try {
        const res = await fetch(file_url);
        const status = res.status;
        const contentType = res.headers.get("content-type") || "";
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        const signature = buf.subarray(0, 5).toString("ascii");
        const zipSig = buf.subarray(0, 4).toString("ascii");

        let isTypeMatch = false;
        if (file_type === "PDF" && contentType.includes("application/pdf")) isTypeMatch = true;
        else if (file_type === "XLSX" && contentType.includes("spreadsheetml.sheet")) isTypeMatch = true;
        else if (file_type === "DOCX" && contentType.includes("wordprocessingml.document")) isTypeMatch = true;
        else if (contentType.includes(mime_type)) isTypeMatch = true;

        let isBinaryValid = false;
        if (file_type === "PDF" && signature.startsWith("%PDF-")) isBinaryValid = true;
        else if ((file_type === "XLSX" || file_type === "DOCX") && zipSig === "PK\x03\x04") isBinaryValid = true;
        else if (buf.length > 0) isBinaryValid = true;

        const passed = status === 200 && isTypeMatch && isBinaryValid && buf.length > 500;

        if (passed) {
          passedFiles++;
          console.log(`  ✓ PASS: "${title}" (${file_name})`);
          console.log(`     HTTP ${status} | ${contentType} | Sig: [${file_type === "PDF" ? signature : zipSig}] | Size: ${buf.length} bytes`);
        } else {
          failedFiles++;
          console.error(`  ✗ FAIL: "${title}" (${file_name})`);
          console.error(`     HTTP: ${status}, Expected MIME: ${mime_type}, Got: ${contentType}`);
          console.error(`     Signature: "${signature}", Size: ${buf.length}`);
        }
      } catch (err) {
        failedFiles++;
        console.error(`  ✗ NETWORK ERROR fetching ${file_name}:`, err.message);
      }
    }
  }

  console.log("\n==================================================");
  console.log(`DOWNLOAD QA RESULTS: ${passedFiles} / ${totalFiles} PASSED (Failed: ${failedFiles})`);
  console.log("==================================================");

  if (failedFiles > 0) {
    process.exit(1);
  }
}

verifyAllDownloads();
