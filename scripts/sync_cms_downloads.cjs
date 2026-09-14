const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, "../.env"), "utf8")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .map(line => {
      const idx = line.indexOf("=");
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return [line.slice(0, idx).trim(), val];
    })
);

const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, serviceKey);

async function main() {
  console.log("Checking cms_downloads in Supabase...");
  const { data: rows, error } = await sb
    .from("cms_downloads")
    .select("*")
    .order("sort_order");

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  console.log(`Found ${rows.length} rows in cms_downloads.`);

  // Check for duplicates by slug
  const slugCount = {};
  for (const r of rows) {
    slugCount[r.slug] = (slugCount[r.slug] || 0) + 1;
  }
  const duplicates = Object.entries(slugCount).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.warn("Duplicate slugs found:", duplicates);
  } else {
    console.log("No duplicate slugs found in cms_downloads table.");
  }

  // Update file_url for each row
  for (const r of rows) {
    const targetFileUrl = `/api/downloads/${r.slug}.pdf`;
    if (r.file_url !== targetFileUrl) {
      const { error: updateError } = await sb
        .from("cms_downloads")
        .update({
          file_url: targetFileUrl,
          cta_label: "Download · PDF",
          updated_at: new Date().toISOString()
        })
        .eq("id", r.id);

      if (updateError) {
        console.error(`Failed to update ${r.slug}:`, updateError);
      } else {
        console.log(`Updated ${r.slug} -> ${targetFileUrl}`);
      }
    } else {
      console.log(`Already up to date: ${r.slug} -> ${r.file_url}`);
    }
  }

  // Verify
  const { data: updatedRows } = await sb
    .from("cms_downloads")
    .select("slug, title, file_url, status")
    .order("sort_order");

  console.log("\nVerified cms_downloads rows:");
  updatedRows.forEach(r => console.log(`${r.slug} | ${r.title} | ${r.file_url} | ${r.status}`));
}

main().catch(console.error);
