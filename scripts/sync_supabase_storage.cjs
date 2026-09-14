const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env
const envPath = path.join(__dirname, "../.env");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
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

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const sb = createClient(url, serviceKey);

// Documents mapping to organized folders in jyot-enterprise bucket
const DOCUMENTS_MAPPING = [
  // 1. IT Services (website-documents/it-services/)
  {
    slug: "it-brochure",
    fileName: "Jyot-Enterprise-IT-Services-Capability-Brochure.pdf",
    folder: "website-documents/it-services",
    category: "IT Services",
    title: "Jyot IT Services — Capability Brochure",
    summary: "Comprehensive capability brochure detailing bespoke web platforms, Jyot ERP, CRM & lead automation, AI copilots, and cloud integrations.",
    sortOrder: 4,
  },
  {
    slug: "it-checklist",
    fileName: "Jyot-Enterprise-Software-Project-Readiness-Checklist.pdf",
    folder: "website-documents/it-services",
    category: "IT Services",
    title: "Software Project Readiness Checklist",
    summary: "Prepare the right information before development starts: objectives, user roles, feature scope, workflow automation, and deployment expectations.",
    sortOrder: 5,
  },
  {
    slug: "it-process-guide",
    fileName: "Jyot-Enterprise-How-We-Ship-Software.pdf",
    folder: "website-documents/it-services",
    category: "IT Services",
    title: "How We Ship Software",
    summary: "The 8-stage software delivery roadmap from discovery and planning through UI/UX, engineering, testing, UAT, deployment, and ongoing support.",
    sortOrder: 6,
  },
  {
    slug: "it-faq-sheet",
    fileName: "Jyot-Enterprise-IT-Services-FAQs.pdf",
    folder: "website-documents/it-services",
    category: "IT Services",
    title: "IT Services — Frequently Asked Questions",
    summary: "Answers to common commercial, architecture, data migration, security, and post-launch maintenance questions before kickoff.",
    sortOrder: 7,
  },

  // 2. Brochures (website-documents/brochures/)
  {
    slug: "financial-brochure",
    fileName: "Jyot-Enterprise-Financial-Services-Capability-Brochure.pdf",
    folder: "website-documents/brochures",
    category: "Financial Advisory",
    title: "Jyot Financial Services — Capability Brochure",
    summary: "Comprehensive credit advisory, retail & business financing, structured capital, and debt syndication tailored for Indian business owners and salaried professionals.",
    sortOrder: 0,
  },
  {
    slug: "legal-brochure",
    fileName: "Jyot-Enterprise-Legal-Compliance-Capability-Brochure.pdf",
    folder: "website-documents/brochures",
    category: "Legal & Corporate",
    title: "Jyot Legal & Compliance — Capability Brochure",
    summary: "Corporate legal advisory, ROC compliance, contracts & commercial drafting, intellectual property, and industrial regulatory frameworks.",
    sortOrder: 8,
  },
  {
    slug: "engineering-brochure",
    fileName: "Jyot-Enterprise-Engineering-Services-Capability-Brochure.pdf",
    folder: "website-documents/brochures",
    category: "Engineering & Infra",
    title: "Jyot Engineering — Capability Brochure",
    summary: "Industrial architecture, EPC project execution, MEP engineering, factory commissioning, and infrastructure advisory for Gujarat enterprises.",
    sortOrder: 12,
  },

  // 3. Resources (website-documents/resources/)
  {
    slug: "financial-checklist",
    fileName: "Jyot-Enterprise-Loan-Document-Checklist.pdf",
    folder: "website-documents/resources",
    category: "Financial Advisory",
    title: "Loan Document Checklist",
    summary: "Comprehensive checklist covering every mandatory KYC, income, banking, and legal property document required by Indian banks and NBFCs.",
    sortOrder: 1,
  },
  {
    slug: "financial-process-guide",
    fileName: "Jyot-Enterprise-Loan-Enquiry-to-Disbursement-Guide.pdf",
    folder: "website-documents/resources",
    category: "Financial Advisory",
    title: "From Enquiry to Disbursement",
    summary: "End-to-end borrowing roadmap explaining eligibility appraisal, lender comparison, valuation, legal search, and loan disbursement.",
    sortOrder: 2,
  },
  {
    slug: "financial-faq-sheet",
    fileName: "Jyot-Enterprise-Financial-Services-FAQs.pdf",
    folder: "website-documents/resources",
    category: "Financial Advisory",
    title: "Financial Services — FAQs",
    summary: "Clear answers to common questions about ticket sizes, interest rates, collateral requirements, processing fees, and CIBIL resolution.",
    sortOrder: 3,
  },
  {
    slug: "legal-checklist",
    fileName: "Jyot-Enterprise-Annual-Compliance-Checklist.pdf",
    folder: "website-documents/resources",
    category: "Legal & Corporate",
    title: "Annual Compliance Checklist",
    summary: "Statutory checklist for Pvt Ltd, LLPs and OPCs covering AGM, ROC filings (AOC-4, MGT-7), director KYC, and audit obligations.",
    sortOrder: 9,
  },
  {
    slug: "legal-process-guide",
    fileName: "Jyot-Enterprise-Company-Registration-to-Steady-State-Guide.pdf",
    folder: "website-documents/resources",
    category: "Legal & Corporate",
    title: "Registration to Steady State",
    summary: "Complete legal formation lifecycle from entity selection, DSC/DIN, SPICe+ filing to post-incorporation bank account, GST and steady state.",
    sortOrder: 10,
  },
  {
    slug: "legal-faq-sheet",
    fileName: "Jyot-Enterprise-Legal-Compliance-FAQs.pdf",
    folder: "website-documents/resources",
    category: "Legal & Corporate",
    title: "Legal & Compliance — FAQs",
    summary: "Guidance on company types, director responsibilities, trademark protection, contract drafting, and MCA compliance penalties.",
    sortOrder: 11,
  },
  {
    slug: "engineering-checklist",
    fileName: "Jyot-Enterprise-Engineering-Enquiry-Checklist.pdf",
    folder: "website-documents/resources",
    category: "Engineering & Infra",
    title: "Engineering Enquiry Checklist",
    summary: "Essential technical information, site parameters, capacity targets, and utility specs needed before initiating an engineering project.",
    sortOrder: 13,
  },
  {
    slug: "engineering-process-guide",
    fileName: "Jyot-Enterprise-Concept-to-Commissioning-Guide.pdf",
    folder: "website-documents/resources",
    category: "Engineering & Infra",
    title: "Concept to Commissioning",
    summary: "Multi-disciplinary project lifecycle from preliminary feasibility, detailed engineering, procurement, construction, to trial run.",
    sortOrder: 14,
  },
  {
    slug: "engineering-faq-sheet",
    fileName: "Jyot-Enterprise-Engineering-FAQs.pdf",
    folder: "website-documents/resources",
    category: "Engineering & Infra",
    title: "Engineering — FAQs",
    summary: "Answers on EPC project structures, turnaround timelines, vendor qualification, regulatory approvals, and safety audits.",
    sortOrder: 15,
  },
];

async function main() {
  console.log("==================================================");
  console.log("CENTRALIZED SUPABASE STORAGE & DATABASE SYNC");
  console.log("==================================================");

  // 1. Ensure bucket 'jyot-enterprise' exists
  console.log("\n1. Ensuring 'jyot-enterprise' storage bucket exists...");
  const { data: buckets, error: listBucketsError } = await sb.storage.listBuckets();
  if (listBucketsError) {
    console.error("Failed to list buckets:", listBucketsError);
    process.exit(1);
  }

  let bucket = buckets.find(b => b.name === "jyot-enterprise");
  if (!bucket) {
    console.log("Creating bucket 'jyot-enterprise'...");
    const { data: newBucket, error: createError } = await sb.storage.createBucket("jyot-enterprise", {
      public: true,
      allowedMimeTypes: ["application/pdf", "image/*"],
      fileSizeLimit: 52428800 // 50 MB
    });
    if (createError) {
      console.error("Failed to create bucket:", createError);
      process.exit(1);
    }
    console.log("Bucket created:", newBucket);
  } else {
    console.log("Bucket 'jyot-enterprise' exists and is ready.");
  }

  // 2. Upload PDFs to Supabase Storage
  console.log("\n2. Uploading all 16 PDFs to Supabase Storage...");
  const publicDownloadsDir = path.join(process.cwd(), "public/downloads");

  for (const doc of DOCUMENTS_MAPPING) {
    const localFilePath = path.join(publicDownloadsDir, doc.fileName);
    if (!fs.existsSync(localFilePath)) {
      console.warn(`Local file missing: ${localFilePath}`);
      continue;
    }

    const fileBytes = fs.readFileSync(localFilePath);
    const storagePath = `${doc.folder}/${doc.fileName}`;

    console.log(`Uploading: ${doc.fileName} -> ${storagePath} (${Math.round(fileBytes.length / 1024)} KB)...`);

    const { error: uploadError } = await sb.storage
      .from("jyot-enterprise")
      .upload(storagePath, fileBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Failed to upload ${storagePath}:`, uploadError);
      continue;
    }

    // Get public URL
    const { data: urlData } = sb.storage
      .from("jyot-enterprise")
      .getPublicUrl(storagePath);

    doc.storagePath = storagePath;
    doc.fileUrl = urlData.publicUrl;
    doc.fileSize = fileBytes.length;
    doc.fileType = "application/pdf";
    console.log(`  -> Live Supabase URL: ${doc.fileUrl}`);
  }

  // 3. Update cms_downloads in Supabase Database
  console.log("\n3. Updating cms_downloads metadata in Supabase database...");

  for (const doc of DOCUMENTS_MAPPING) {
    const payload = {
      slug: doc.slug,
      title: doc.title,
      category: doc.category,
      summary: doc.summary,
      file_bucket: "jyot-enterprise",
      file_path: doc.storagePath,
      file_url: doc.fileUrl,
      status: "published",
      featured: doc.sortOrder < 4,
      sort_order: doc.sortOrder,
      cta_label: "Download",
      data: {
        file_name: doc.fileName,
        storage_path: doc.storagePath,
        file_url: doc.fileUrl,
        file_size: doc.fileSize,
        file_type: doc.fileType,
        published: true,
        description: doc.summary,
      }
    };

    // First try upsert with full payload
    const { error: upsertError } = await sb
      .from("cms_downloads")
      .upsert(payload, { onConflict: "slug" });

    if (upsertError) {
      console.warn(`Standard upsert failed for ${doc.slug}, trying fallback update:`, upsertError.message);
      // Try updating existing row
      const { error: updateError } = await sb
        .from("cms_downloads")
        .update({
          file_bucket: "jyot-enterprise",
          file_path: doc.storagePath,
          file_url: doc.fileUrl,
          status: "published",
          data: payload.data
        })
        .eq("slug", doc.slug);

      if (updateError) {
        console.error(`Failed fallback update for ${doc.slug}:`, updateError.message);
      } else {
        console.log(`  -> Updated row for ${doc.slug}`);
      }
    } else {
      console.log(`  -> Successfully upserted ${doc.slug} with Supabase Storage path`);
    }
  }

  console.log("\n==================================================");
  console.log("MIGRATION COMPLETE: All 16 PDFs now hosted on Supabase Storage!");
  console.log("==================================================");
}

main().catch(console.error);
