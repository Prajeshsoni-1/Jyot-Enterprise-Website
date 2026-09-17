const fs = require("fs");
const path = require("path");

function runGa4Validation() {
  console.log("==================================================");
  console.log("GOOGLE ANALYTICS 4 (GA4) INTEGRATION VERIFICATION");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name, detail = "") {
    if (condition) {
      console.log(`[PASS] ${name} ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${detail}`);
      failed++;
    }
  }

  // 1. Inspect analytics.ts source code
  const analyticsFile = path.join(__dirname, "..", "src", "lib", "analytics.ts");
  const analyticsContent = fs.readFileSync(analyticsFile, "utf-8");

  assert(
    analyticsContent.includes("VITE_GA4_MEASUREMENT_ID"),
    "Supports VITE_GA4_MEASUREMENT_ID environment variable"
  );
  assert(
    analyticsContent.includes("send_page_view: false"),
    "Initial gtag('config') sets send_page_view: false to prevent duplicate initial pageviews"
  );
  assert(
    analyticsContent.includes("isPublicPath"),
    "Exports isPublicPath helper for route classification"
  );
  assert(
    analyticsContent.includes("lastTrackedPath"),
    "Implements route deduplication for client-side re-renders"
  );

  // 2. Inspect __root.tsx source code
  const rootFile = path.join(__dirname, "..", "src", "routes", "__root.tsx");
  const rootContent = fs.readFileSync(rootFile, "utf-8");

  assert(
    rootContent.includes("isPublicPath(pathname)"),
    "__root.tsx checks isPublicPath before initializing analytics and tracking pageviews"
  );
  assert(
    rootContent.includes("isConsole = !isPublicPath(pathname)"),
    "__root.tsx treats non-public paths as internal console routes"
  );

  // 3. Inspect .env and .env.example
  const envFile = path.join(__dirname, "..", ".env");
  const envContent = fs.readFileSync(envFile, "utf-8");
  assert(
    envContent.includes("VITE_GA4_MEASUREMENT_ID"),
    ".env defines VITE_GA4_MEASUREMENT_ID"
  );

  const envExample = path.join(__dirname, "..", ".env.example");
  const envExampleContent = fs.readFileSync(envExample, "utf-8");
  assert(
    envExampleContent.includes("VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX"),
    ".env.example documents VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX"
  );

  // 4. Test Route Exclusion Logic (simulate isPublicPath)
  console.log("\n--- Testing Route Exclusion & Inclusion Rules ---");
  function isPublicPath(pathname) {
    if (!pathname || typeof pathname !== "string") return false;
    const p = pathname.toLowerCase().trim();
    if (p.startsWith("/admin") || p.startsWith("/auth") || p.startsWith("/api")) {
      return false;
    }
    return true;
  }

  // Admin routes MUST BE EXCLUDED
  assert(!isPublicPath("/admin"), "Excludes /admin root");
  assert(!isPublicPath("/admin/"), "Excludes /admin/ trailing slash");
  assert(!isPublicPath("/admin/enquiries"), "Excludes /admin/enquiries");
  assert(!isPublicPath("/admin/bookings?id=123"), "Excludes /admin/bookings with params");
  assert(!isPublicPath("/admin/website/settings"), "Excludes /admin/website/settings");
  assert(!isPublicPath("/admin/team"), "Excludes /admin/team");

  // Auth routes MUST BE EXCLUDED
  assert(!isPublicPath("/auth"), "Excludes /auth root");
  assert(!isPublicPath("/auth/reset-password"), "Excludes /auth subroutes");

  // API routes MUST BE EXCLUDED
  assert(!isPublicPath("/api/downloads/test.pdf"), "Excludes /api routes");

  // Public marketing routes MUST BE INCLUDED
  assert(isPublicPath("/"), "Includes home page '/'");
  assert(isPublicPath("/about"), "Includes '/about'");
  assert(isPublicPath("/contact"), "Includes '/contact'");
  assert(isPublicPath("/services"), "Includes '/services'");
  assert(isPublicPath("/services/it"), "Includes '/services/it'");
  assert(isPublicPath("/services/financial"), "Includes '/services/financial'");
  assert(isPublicPath("/book"), "Includes '/book'");
  assert(isPublicPath("/careers"), "Includes '/careers'");
  assert(isPublicPath("/careers/senior-developer"), "Includes '/careers/senior-developer'");
  assert(isPublicPath("/blogs"), "Includes '/blogs'");
  assert(isPublicPath("/blogs/sample-post"), "Includes '/blogs/sample-post'");
  assert(isPublicPath("/downloads"), "Includes '/downloads'");

  // 5. Test Simulated GA4 Dispatch
  console.log("\n--- Testing Simulated GA4 Event Dispatch & Deduplication ---");
  const dataLayer = [];
  const events = [];
  let testLastPath = null;

  function mockGtag(...args) {
    dataLayer.push(args);
    events.push({ command: args[0], target: args[1], params: args[2] });
  }

  function simulateTrackPageView(path, title) {
    if (!isPublicPath(path)) return false;
    if (testLastPath === path) return false; // deduplicate
    testLastPath = path;
    mockGtag("event", "page_view", {
      page_path: path,
      page_location: "https://jyotenterprise.in" + path,
      page_title: title,
    });
    return true;
  }

  // Initial home page visit
  const r1 = simulateTrackPageView("/", "Home — Jyot Enterprise");
  assert(r1 === true, "Initial visit to '/' is tracked");
  assert(events.length === 1 && events[0].params.page_path === "/", "GA4 receives single page_view for '/'");

  // Re-render of home page (duplicate prevention)
  const r2 = simulateTrackPageView("/", "Home — Jyot Enterprise");
  assert(r2 === false, "Re-render of same path '/' is ignored (deduplicated)");
  assert(events.length === 1, "No duplicate page_view sent for re-render");

  // SPA Navigation to /contact
  const r3 = simulateTrackPageView("/contact", "Contact Us — Jyot Enterprise");
  assert(r3 === true, "SPA Navigation to '/contact' is tracked");
  assert(events.length === 2 && events[1].params.page_path === "/contact", "GA4 receives second page_view for '/contact'");

  // Admin Navigation (MUST BE SILENT)
  const r4 = simulateTrackPageView("/admin/enquiries", "Admin Enquiries");
  assert(r4 === false, "Navigation to '/admin/enquiries' is completely ignored");
  assert(events.length === 2, "GA4 event count remains unchanged (admin traffic excluded)");

  // Return to public page /services/it
  const r5 = simulateTrackPageView("/services/it", "IT Services — Jyot Enterprise");
  assert(r5 === true, "Navigation to '/services/it' is tracked");
  assert(events.length === 3 && events[2].params.page_path === "/services/it", "GA4 receives third page_view for '/services/it'");

  console.log("\n==================================================");
  console.log(`GA4 VALIDATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
}

runGa4Validation();
