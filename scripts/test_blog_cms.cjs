// test_blog_cms.cjs
// Code-level validation of Blog CMS data structure, mappings, preview logic, Supabase database, and HTTP endpoints

const http = require("http");
const fs = require("fs");
const path = require("path");

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
  console.log("=== Blog CMS Validation Suite ===\n");
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
  console.log("--- Testing Public Blog Endpoints ---");
  try {
    const resIndex = await fetchUrl("http://localhost:8080/blogs");
    assert(resIndex.statusCode === 200, "GET /blogs returns 200 OK");
    assert(
      resIndex.body.includes("Insights") || resIndex.body.includes("Notes from the desks"),
      "/blogs renders insights heading or post cards",
    );

    const resErp = await fetchUrl("http://localhost:8080/blogs/off-the-shelf-erp-vs-custom-platform");
    assert(resErp.statusCode === 200, "GET /blogs/off-the-shelf-erp-vs-custom-platform returns 200 OK");
    assert(
      resErp.body.includes("Off-the-shelf ERP") || resErp.body.includes("ERP"),
      "/blogs/off-the-shelf-erp-vs-custom-platform renders article title",
    );

    const resVoice = await fetchUrl("http://localhost:8080/blogs/ai-voice-agent-production-cost");
    assert(resVoice.statusCode === 200, "GET /blogs/ai-voice-agent-production-cost returns 200 OK");

    const resCompliance = await fetchUrl("http://localhost:8080/blogs/compliance-calendar-private-limited-companies-miss");
    assert(resCompliance.statusCode === 200, "GET /blogs/compliance-calendar-private-limited-companies-miss returns 200 OK");

    const resLegacy = await fetchUrl("http://localhost:8080/blogs/reverse-engineering-legacy-tooling");
    assert(resLegacy.statusCode === 200, "GET /blogs/reverse-engineering-legacy-tooling returns 200 OK");

    const resGrowth = await fetchUrl("http://localhost:8080/blogs/operating-rhythm-that-survives-fast-growth");
    assert(resGrowth.statusCode === 200, "GET /blogs/operating-rhythm-that-survives-fast-growth returns 200 OK");

    const resPreview = await fetchUrl(
      "http://localhost:8080/blogs/off-the-shelf-erp-vs-custom-platform?preview=true",
    );
    assert(
      resPreview.statusCode === 200,
      "GET /blogs/off-the-shelf-erp-vs-custom-platform?preview=true returns 200 OK with preview mode",
    );
    assert(
      resPreview.body.includes("PREVIEW MODE"),
      "Preview query displays PREVIEW MODE banner",
    );
  } catch (err) {
    console.error("HTTP endpoint testing error:", err.message);
    failed++;
  }

  // 2. Verify Blog Types & Schema Definitions
  console.log("\n--- Testing TypeScript Types and Schemas ---");
  const blogTs = fs.readFileSync(path.join(__dirname, "../src/data/blog.ts"), "utf-8");
  assert(blogTs.includes("BlogSectionType"), "blog.ts exports BlogSectionType");
  assert(blogTs.includes("BlogSection"), "blog.ts exports BlogSection");
  assert(blogTs.includes("authorPhoto"), "BlogPost includes authorPhoto");
  assert(blogTs.includes("authorBio"), "BlogPost includes authorBio");
  assert(blogTs.includes("featuredImage"), "BlogPost includes featuredImage");
  assert(blogTs.includes("thumbnailImage"), "BlogPost includes thumbnailImage");
  assert(blogTs.includes("gallery?:"), "BlogPost includes gallery");
  assert(blogTs.includes("sections?:"), "BlogPost includes sections");
  assert(blogTs.includes("cta?:"), "BlogPost includes cta");
  assert(blogTs.includes("controls?:"), "BlogPost includes controls");
  assert(blogTs.includes("seoTitle?:"), "BlogPost includes seoTitle");

  // 3. Verify CMS Data Layer & Mapping
  console.log("\n--- Testing CMS Content Mapping ---");
  const cmsContentTs = fs.readFileSync(path.join(__dirname, "../src/lib/cms-content.ts"), "utf-8");
  assert(cmsContentTs.includes("export function toBlogPost"), "cms-content.ts exports toBlogPost");
  assert(cmsContentTs.includes("export function mergeBlogPosts"), "cms-content.ts exports mergeBlogPosts");
  assert(cmsContentTs.includes("authorPhoto: s(d.authorPhoto)"), "toBlogPost maps authorPhoto from JSONB data");
  assert(cmsContentTs.includes("authorBio: s(d.authorBio)"), "toBlogPost maps authorBio from JSONB data");
  assert(cmsContentTs.includes("gallery,"), "toBlogPost maps gallery");
  assert(cmsContentTs.includes("sections,"), "toBlogPost maps dynamic sections");

  // 4. Verify Server Functions & Loaders
  console.log("\n--- Testing Server Functions & Loaders ---");
  const cmsFunctionsTs = fs.readFileSync(path.join(__dirname, "../src/lib/cms.functions.ts"), "utf-8");
  assert(cmsFunctionsTs.includes("export const getBlogPost"), "cms.functions.ts exports getBlogPost");

  const cmsLoadersTs = fs.readFileSync(path.join(__dirname, "../src/lib/cms-loaders.ts"), "utf-8");
  assert(cmsLoadersTs.includes("export async function loadBlogPost"), "cms-loaders.ts exports loadBlogPost");

  // 5. Verify Components
  console.log("\n--- Testing Components ---");
  const rendererPath = path.join(__dirname, "../src/components/blog/BlogSectionsRenderer.tsx");
  assert(fs.existsSync(rendererPath), "BlogSectionsRenderer.tsx exists");
  const rendererCode = fs.readFileSync(rendererPath, "utf-8");
  assert(rendererCode.includes("heading_text"), "BlogSectionsRenderer handles heading_text blocks");
  assert(rendererCode.includes("full_image"), "BlogSectionsRenderer handles full_image blocks");
  assert(rendererCode.includes("key_takeaways"), "BlogSectionsRenderer handles key_takeaways blocks");
  assert(rendererCode.includes("faq"), "BlogSectionsRenderer handles faq blocks");

  const editorPath = path.join(__dirname, "../src/components/admin/BlogEditor.tsx");
  assert(fs.existsSync(editorPath), "BlogEditor.tsx exists");
  const editorCode = fs.readFileSync(editorPath, "utf-8");
  assert(editorCode.includes("MediaPicker"), "BlogEditor imports MediaPicker");
  assert(editorCode.includes("handleInsertImage"), "BlogEditor supports inline media insertion into markdown");
  assert(editorCode.includes("Basic Info"), "BlogEditor has Basic Info tab");
  assert(editorCode.includes("Sections ("), "BlogEditor has Sections tab");
  assert(editorCode.includes("SEO & SERP"), "BlogEditor has SEO tab");

  // 6. Verify Supabase Database Table
  console.log("\n--- Testing Supabase Database State ---");
  try {
    const envFile = fs.readFileSync(path.join(__dirname, "../.env"), "utf-8");
    let supabaseUrl = "";
    let serviceKey = "";
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("VITE_SUPABASE_URL=")) {
        supabaseUrl = trimmed.split("=")[1].replace(/["']/g, "").trim();
      }
      if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
        serviceKey = trimmed.split("=")[1].replace(/["']/g, "").trim();
      }
    }

    if (supabaseUrl && serviceKey) {
      const https = require("https");
      const url = new URL(`${supabaseUrl}/rest/v1/cms_posts?select=id,slug,title,status,author,data&order=sort_order.asc`);
      const dbPosts = await new Promise((resolve, reject) => {
        https.get(url, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }, (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }).on("error", reject);
      });

      assert(Array.isArray(dbPosts) && dbPosts.length >= 5, `Supabase cms_posts contains ${dbPosts.length} posts (>=5)`);
      const erpPost = dbPosts.find((p) => p.slug === "off-the-shelf-erp-vs-custom-platform");
      assert(Boolean(erpPost), "off-the-shelf-erp-vs-custom-platform exists in database");
      assert(erpPost?.status === "published", "Existing blog status is published");
    }
  } catch (err) {
    console.error("Database query check error:", err.message);
    failed++;
  }

  console.log(`\n=== Validation Completed: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
