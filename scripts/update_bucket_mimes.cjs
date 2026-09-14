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

const allowedMimeTypes = [
  "application/pdf",
  "image/*",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/csv",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream"
];

async function run() {
  const { data, error } = await sb.storage.updateBucket("jyot-enterprise", {
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: allowedMimeTypes
  });

  if (error) {
    console.error("Update bucket error:", error);
  } else {
    console.log("SUCCESS updating jyot-enterprise bucket:", data);
  }

  const { data: buckets } = await sb.storage.listBuckets();
  const jb = buckets.find(b => b.name === "jyot-enterprise");
  console.log("Updated jyot-enterprise bucket allowed_mime_types:", jb.allowed_mime_types);
}

run();
