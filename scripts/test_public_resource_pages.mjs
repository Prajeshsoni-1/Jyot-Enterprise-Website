import http from "http";

const slugs = [
  "gst-guide",
  "loan-guide",
  "website-checklist",
  "erp-guide",
  "crm-guide",
  "ai-guide",
  "engineering-guide",
  "business-templates"
];

async function fetchPage(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    }).on("error", (e) => resolve({ statusCode: 500, error: e.message }));
  });
}

async function run() {
  console.log("==================================================");
  console.log("TESTING PUBLIC RESOURCE DETAIL PAGES ON DEV SERVER");
  console.log("==================================================");

  // 1. Test /resources
  const listing = await fetchPage("http://localhost:8080/resources");
  console.log(`GET /resources -> HTTP ${listing.statusCode} (${listing.body?.length || 0} bytes)`);

  // 2. Test each slug
  for (const slug of slugs) {
    const detail = await fetchPage(`http://localhost:8080/resources/${slug}`);
    const hasHashDownload = detail.body?.includes('href="#"');
    console.log(`GET /resources/${slug} -> HTTP ${detail.statusCode} | HashHref: ${hasHashDownload ? "YES (BUG!)" : "NO (OK)"}`);
  }
}

run();
