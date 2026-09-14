// test_portfolio_cms.cjs
// Code-level validation of Portfolio CMS data structure, mappings, preview logic, and HTTP endpoints

const http = require("http");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
      })
      .on("error", reject);
  });
}

async function runTests() {
  console.log("=== Portfolio CMS Validation Suite ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // 1. Verify Public Endpoints respond with HTTP 200
  console.log("--- Testing Public Portfolio Endpoints ---");
  try {
    const resIndex = await fetchUrl("http://localhost:8080/portfolio");
    assert(resIndex.statusCode === 200, "GET /portfolio returns 200 OK");
    assert(
      resIndex.body.includes("Meridian Polymers") || resIndex.body.includes("Portfolio"),
      "/portfolio renders portfolio title or projects",
    );

    const resMeridian = await fetchUrl("http://localhost:8080/portfolio/meridian-polymers-erp");
    assert(resMeridian.statusCode === 200, "GET /portfolio/meridian-polymers-erp returns 200 OK");
    assert(
      resMeridian.body.includes("Meridian Polymers") || resMeridian.body.includes("working capital"),
      "/portfolio/meridian-polymers-erp renders project content",
    );

    const resNorthline = await fetchUrl("http://localhost:8080/portfolio/northline-compliance-desk");
    assert(resNorthline.statusCode === 200, "GET /portfolio/northline-compliance-desk returns 200 OK");

    const resArva = await fetchUrl("http://localhost:8080/portfolio/arva-fixture-redesign");
    assert(resArva.statusCode === 200, "GET /portfolio/arva-fixture-redesign returns 200 OK");

    const resPreview = await fetchUrl(
      "http://localhost:8080/portfolio/meridian-polymers-erp?preview=true",
    );
    assert(
      resPreview.statusCode === 200,
      "GET /portfolio/meridian-polymers-erp?preview=true returns 200 OK with preview mode",
    );
  } catch (err) {
    console.error("HTTP endpoint testing error:", err.message);
    failed++;
  }

  // 2. Verify Schema Migration exists
  console.log("\n--- Testing Schema Migrations ---");
  const fs = require("fs");
  const path = require("path");

  const migrationPath = path.join(
    __dirname,
    "../supabase/migrations/20260910173000_portfolio_media_schema.sql",
  );
  assert(fs.existsSync(migrationPath), "Migration 20260910173000_portfolio_media_schema.sql exists");

  const migrationContent = fs.readFileSync(migrationPath, "utf-8");
  assert(
    migrationContent.includes("CREATE TABLE IF NOT EXISTS public.cms_media"),
    "Migration defines public.cms_media table",
  );
  assert(
    migrationContent.includes("CREATE POLICY \"Public reads cms_media\""),
    "Migration defines RLS policies on cms_media",
  );

  // 3. Verify Master Schema updated
  const masterPath = path.join(__dirname, "../supabase/master_schema.sql");
  const masterContent = fs.readFileSync(masterPath, "utf-8");
  assert(
    masterContent.includes("CREATE TABLE IF NOT EXISTS public.cms_media"),
    "master_schema.sql contains cms_media table definition",
  );

  // 4. Verify Project Types & Schema Definitions
  console.log("\n--- Testing TypeScript Types and Schemas ---");
  const projectsTs = fs.readFileSync(path.join(__dirname, "../src/data/projects.ts"), "utf-8");
  assert(projectsTs.includes("PortfolioSectionType"), "projects.ts exports PortfolioSectionType");
  assert(projectsTs.includes("PortfolioSection"), "projects.ts exports PortfolioSection");
  assert(projectsTs.includes("challengeDetails"), "Project type contains challengeDetails");
  assert(projectsTs.includes("solutionDetails"), "Project type contains solutionDetails");
  assert(projectsTs.includes("resultDetails"), "Project type contains resultDetails");
  assert(projectsTs.includes("technologiesDetailed"), "Project type contains technologiesDetailed");
  assert(projectsTs.includes("clientQuote"), "Project type contains clientQuote");
  assert(projectsTs.includes("cta?:"), "Project type contains cta");
  assert(projectsTs.includes("controls?:"), "Project type contains controls");

  // 5. Verify Components exist
  console.log("\n--- Testing Components ---");
  assert(
    fs.existsSync(path.join(__dirname, "../src/components/admin/PortfolioEditor.tsx")),
    "PortfolioEditor.tsx component exists",
  );
  assert(
    fs.existsSync(path.join(__dirname, "../src/components/portfolio/PortfolioSectionsRenderer.tsx")),
    "PortfolioSectionsRenderer.tsx component exists",
  );

  // 6. Summary
  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
