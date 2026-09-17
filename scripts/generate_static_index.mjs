import fs from "node:fs";
import path from "node:path";

async function run() {
  const serverPath = path.resolve(".output/server/index.mjs");
  if (!fs.existsSync(serverPath)) {
    console.error("[postbuild] Server build not found at", serverPath);
    return;
  }
  const m = await import(`file://${serverPath.replace(/\\/g, "/")}`);
  const handler = m.default?.fetch || m.fetch;
  if (!handler) {
    console.error("[postbuild] No fetch handler exported in server bundle");
    return;
  }
  const res = await handler(new Request("http://localhost/"), {});
  const html = await res.text();
  const target = path.resolve(".output/public/index.html");
  fs.writeFileSync(target, html, "utf8");
  console.log(`[postbuild] Generated static ${target} (${(html.length / 1024).toFixed(1)} KB)`);
}

run().catch((err) => {
  console.error("[postbuild] Failed:", err);
  process.exit(1);
});
