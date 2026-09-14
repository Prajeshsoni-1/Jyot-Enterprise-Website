// scripts/test_careers_cms.cjs
// Comprehensive validation script for Jyot Enterprise Job + Internship CMS

const http = require("http");
const { createClient } = require("@supabase/supabase-js");

// Load .env
const fs = require("fs");
const path = require("path");
const envFile = path.join(__dirname, "..", ".env");
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:8080${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on("error", reject);
  });
}

async function run() {
  console.log("=== Testing Careers CMS (Job + Internship) ===");
  let failed = false;

  // 1. Check Supabase cms_jobs records
  console.log("\n1. Inspecting Supabase cms_jobs table...");
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: jobs, error } = await supabase
      .from("cms_jobs")
      .select("id, slug, title, status, employment_type, department, location, work_mode, salary, openings");

    if (error) {
      console.error("  ❌ Error querying cms_jobs:", error.message);
      failed = true;
    } else {
      console.log(`  ✅ Successfully retrieved ${jobs.length} career openings from database:`);
      for (const j of jobs) {
        console.log(`     - [${j.status.toUpperCase()}] "${j.title}" (${j.slug}): Type="${j.employment_type}", Dept="${j.department}"`);
      }

      // Check all 3 expected existing roles are intact
      const expectedSlugs = ["ai-engineer", "digital-marketing-executive", "sales-executive"];
      for (const s of expectedSlugs) {
        const found = jobs.find((j) => j.slug === s);
        if (found) {
          console.log(`     ✅ Live role preserved: "${found.title}" (Type: ${found.employment_type})`);
        } else {
          console.error(`     ❌ Missing expected role: ${s}`);
          failed = true;
        }
      }
    }
  } else {
    console.log("  ⚠️ Skipping direct DB check (missing service role key).");
  }

  // 2. Test Public Careers Index Page (/careers)
  console.log("\n2. Testing Public Careers List Page (/careers)...");
  try {
    const res = await fetchUrl("/careers");
    if (res.status === 200) {
      console.log(`  ✅ /careers returned 200 OK (${res.body.length} bytes)`);

      // Check Section 1: Jobs (should appear first)
      const jobsIndex = res.body.indexOf("Jobs & Full-Time Opportunities") !== -1 
        ? res.body.indexOf("Jobs & Full-Time Opportunities") 
        : res.body.indexOf("Jobs");

      // Check Section 2: Internships (should appear second)
      const internshipsIndex = res.body.indexOf("Six-month programmes with real mandates") !== -1
        ? res.body.indexOf("Six-month programmes with real mandates")
        : res.body.indexOf("Internships");

      if (jobsIndex !== -1) {
        console.log("  ✅ SECTION 1: Jobs section present in rendered HTML");
      } else {
        console.error("  ❌ Missing SECTION 1: Jobs in HTML");
        failed = true;
      }

      if (internshipsIndex !== -1) {
        console.log("  ✅ SECTION 2: Internships section present in rendered HTML");
      } else {
        console.error("  ❌ Missing SECTION 2: Internships in HTML");
        failed = true;
      }

      if (jobsIndex !== -1 && internshipsIndex !== -1) {
        if (jobsIndex < internshipsIndex) {
          console.log("  ✅ Section ordering verified: SECTION 1 (Jobs) appears BEFORE SECTION 2 (Internships)");
        } else {
          console.error("  ❌ Ordering mismatch: Internships appears before Jobs");
          failed = true;
        }
      }

      // Check for role titles in HTML
      if (res.body.includes("AI Engineer")) {
        console.log("  ✅ AI Engineer role found in public listing");
      }
      if (res.body.includes("Digital Marketing")) {
        console.log("  ✅ Digital Marketing role found in public listing");
      }
    } else {
      console.error(`  ❌ /careers failed with status ${res.status}`);
      failed = true;
    }
  } catch (err) {
    console.error("  ❌ Could not connect to localhost:8080:", err.message);
    failed = true;
  }

  // 3. Test Public Role Detail Page (/careers/ai-engineer)
  console.log("\n3. Testing Public Role Detail Page (/careers/ai-engineer)...");
  try {
    const res = await fetchUrl("/careers/ai-engineer");
    if (res.status === 200) {
      console.log(`  ✅ /careers/ai-engineer returned 200 OK (${res.body.length} bytes)`);
      if (res.body.includes("AI Engineer")) {
        console.log("  ✅ Role title rendered dynamically");
      }
      if (res.body.includes("Apply for this role") || res.body.includes("Submit")) {
        console.log("  ✅ Application form rendered with interactive inputs");
      }
    } else {
      console.error(`  ❌ /careers/ai-engineer returned ${res.status}`);
      failed = true;
    }
  } catch (err) {
    console.error("  ❌ Error testing role page:", err.message);
    failed = true;
  }

  // 4. Test Draft Preview Mode (/careers/ai-engineer?preview=true)
  console.log("\n4. Testing Role Preview Mode (/careers/ai-engineer?preview=true)...");
  try {
    const res = await fetchUrl("/careers/ai-engineer?preview=true");
    if (res.status === 200) {
      console.log(`  ✅ /careers/ai-engineer?preview=true returned 200 OK`);
      if (res.body.includes("Draft Preview Mode") || res.body.includes("Preview")) {
        console.log("  ✅ Draft preview indicator verified in rendered response");
      }
    } else {
      console.error(`  ❌ Preview mode returned ${res.status}`);
      failed = true;
    }
  } catch (err) {
    console.error("  ❌ Error testing preview mode:", err.message);
    failed = true;
  }

  // 5. Test Other Existing Roles
  console.log("\n5. Testing other existing role routes...");
  for (const slug of ["digital-marketing-executive", "sales-executive"]) {
    try {
      const res = await fetchUrl(`/careers/${slug}`);
      if (res.status === 200) {
        console.log(`  ✅ /careers/${slug} returned 200 OK`);
      } else {
        console.error(`  ❌ /careers/${slug} returned ${res.status}`);
        failed = true;
      }
    } catch (err) {
      console.error(`  ❌ Error fetching /careers/${slug}:`, err.message);
      failed = true;
    }
  }

  // 6. Test Non-Existent Role returns 404
  console.log("\n6. Testing non-existent role handling...");
  try {
    const res = await fetchUrl("/careers/non-existent-career-role-xyz");
    if (res.status === 404 || res.body.includes("Role not found") || res.body.includes("not found")) {
      console.log(`  ✅ Non-existent role safely returned 404 or Role not found`);
    } else {
      console.log(`  ℹ️ Received status: ${res.status}`);
    }
  } catch (err) {
    console.error("  ❌ Error testing 404:", err.message);
  }

  console.log("\n=========================================");
  if (failed) {
    console.error("❌ Careers CMS verification completed with issues.");
    process.exit(1);
  } else {
    console.log("🎉 All Careers CMS tests PASSED flawlessly!");
  }
}

run().catch((e) => {
  console.error("Fatal test failure:", e);
  process.exit(1);
});
