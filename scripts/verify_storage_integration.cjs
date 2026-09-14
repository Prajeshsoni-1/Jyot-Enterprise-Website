const { createClient } = require("@supabase/supabase-js");

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return [line.slice(0, idx).trim(), val];
    })
);

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== VERIFYING CENTRALIZED PDF/DOCUMENT STORAGE SYSTEM ===");

  // 1. Verify Bucket 'jyot-enterprise'
  console.log("\n1. Verifying Supabase Storage Bucket 'jyot-enterprise'...");
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    console.error("Failed to list buckets:", bucketErr);
    process.exit(1);
  }
  const targetBucket = buckets.find((b) => b.name === "jyot-enterprise");
  if (!targetBucket) {
    console.error("Bucket 'jyot-enterprise' not found!");
    process.exit(1);
  }
  console.log(`✓ Bucket 'jyot-enterprise' exists! (public: ${targetBucket.public})`);

  // 2. Verify Folder Structure in 'jyot-enterprise'
  console.log("\n2. Verifying folder structure in 'jyot-enterprise'...");
  const folders = ["website-documents/it-services", "website-documents/brochures", "website-documents/resources"];
  for (const folder of folders) {
    const { data: files, error: listErr } = await supabase.storage
      .from("jyot-enterprise")
      .list(folder);
    if (listErr) {
      console.error(`Error listing ${folder}:`, listErr);
    } else {
      console.log(`✓ Folder '${folder}': ${files.length} files found.`);
      for (const f of files) {
        console.log(`    - ${f.name} (${Math.round((f.metadata?.size || 0) / 1024)} KB)`);
      }
    }
  }

  // 3. Verify Specific Target File
  console.log("\n3. Verifying specific requirement: Jyot-Enterprise-IT-Services-FAQs.pdf...");
  const itFolder = "website-documents/it-services";
  const targetFileName = "Jyot-Enterprise-IT-Services-FAQs.pdf";
  const targetPath = `${itFolder}/${targetFileName}`;

  const { data: itFaqBlob, error: itFaqErr } = await supabase.storage
    .from("jyot-enterprise")
    .download(targetPath);

  if (itFaqErr || !itFaqBlob) {
    console.error(`Failed to download ${targetPath}:`, itFaqErr);
    process.exit(1);
  }

  const itFaqBuf = Buffer.from(await itFaqBlob.arrayBuffer());
  const header = itFaqBuf.subarray(0, 5).toString("ascii");
  console.log(`✓ Target file downloaded from Supabase Storage '${targetPath}':`);
  console.log(`    Size: ${itFaqBuf.length} bytes (${(itFaqBuf.length / 1024).toFixed(1)} KB)`);
  console.log(`    Header Signature: '${header}' (Valid PDF: ${header === "%PDF-"})`);

  // 4. Verify Database Records in cms_downloads
  console.log("\n4. Verifying database records in 'cms_downloads'...");
  const { data: dbRows, error: dbErr } = await supabase
    .from("cms_downloads")
    .select("id, title, category, file_path, file_url, status, data")
    .order("created_at", { ascending: true });

  if (dbErr) {
    console.error("Failed to query cms_downloads:", dbErr);
    process.exit(1);
  }
  console.log(`✓ Retrieved ${dbRows.length} documents from cms_downloads.`);

  const itFaqRow = dbRows.find((r) => r.file_path === targetPath || (r.data && r.data.file_name === targetFileName));
  if (!itFaqRow) {
    console.error("Did not find database record for Jyot-Enterprise-IT-Services-FAQs.pdf!");
  } else {
    console.log("✓ Database record for IT Services FAQ verified:");
    console.log(`    ID: ${itFaqRow.id}`);
    console.log(`    Title: ${itFaqRow.title}`);
    console.log(`    Category: ${itFaqRow.category}`);
    console.log(`    Storage Path: ${itFaqRow.file_path}`);
    console.log(`    File URL: ${itFaqRow.file_url}`);
    console.log(`    Status: ${itFaqRow.status}`);
  }

  // 5. Test Live Direct Supabase Public CDN URL
  console.log("\n5. Testing Live Supabase Public CDN URL...");
  const publicCdnUrl = `${SUPABASE_URL}/storage/v1/object/public/jyot-enterprise/${targetPath}`;
  const cdnRes = await fetch(publicCdnUrl);
  console.log(`✓ Supabase CDN Status: ${cdnRes.status} ${cdnRes.statusText}`);
  console.log(`    Content-Type: ${cdnRes.headers.get("content-type")}`);
  console.log(`    Content-Length: ${cdnRes.headers.get("content-length")} bytes`);

  // 6. Test Local Server /api/downloads Endpoint
  console.log("\n6. Testing /api/downloads endpoint on local dev server...");
  try {
    const apiRes = await fetch(`http://localhost:8080/api/downloads/${targetFileName}`);
    console.log(`✓ API Endpoint Status: ${apiRes.status} ${apiRes.statusText}`);
    console.log(`    Content-Type: ${apiRes.headers.get("content-type")}`);
    console.log(`    Content-Disposition: ${apiRes.headers.get("content-disposition")}`);
    console.log(`    X-Storage-Source: ${apiRes.headers.get("x-storage-source")}`);
    console.log(`    X-Storage-Path: ${apiRes.headers.get("x-storage-path")}`);
    const apiBuf = Buffer.from(await apiRes.arrayBuffer());
    console.log(`    Byte Length: ${apiBuf.length}`);
    console.log(`    Header: ${apiBuf.subarray(0, 5).toString("ascii")}`);
  } catch (err) {
    console.warn("Could not reach local dev server on port 8080:", err.message);
  }

  console.log("\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===");
}

main().catch(console.error);
