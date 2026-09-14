const http = require("http");
const fs = require("fs");
const path = require("path");

const filesToTest = [
  // 4 Main IT PDFs
  "Jyot-Enterprise-IT-Services-Capability-Brochure.pdf",
  "Jyot-Enterprise-Software-Project-Readiness-Checklist.pdf",
  "Jyot-Enterprise-How-We-Ship-Software.pdf",
  "Jyot-Enterprise-IT-Services-FAQs.pdf",
  // 4 Financial PDFs
  "Jyot-Enterprise-Financial-Services-Capability-Brochure.pdf",
  "Jyot-Enterprise-Loan-Document-Checklist.pdf",
  "Jyot-Enterprise-Loan-Enquiry-to-Disbursement-Guide.pdf",
  "Jyot-Enterprise-Financial-Services-FAQs.pdf",
  // 4 Legal PDFs
  "Jyot-Enterprise-Legal-Compliance-Capability-Brochure.pdf",
  "Jyot-Enterprise-Annual-Compliance-Checklist.pdf",
  "Jyot-Enterprise-Company-Registration-to-Steady-State-Guide.pdf",
  "Jyot-Enterprise-Legal-Compliance-FAQs.pdf",
  // 4 Engineering PDFs
  "Jyot-Enterprise-Engineering-Services-Capability-Brochure.pdf",
  "Jyot-Enterprise-Engineering-Enquiry-Checklist.pdf",
  "Jyot-Enterprise-Concept-to-Commissioning-Guide.pdf",
  "Jyot-Enterprise-Engineering-FAQs.pdf",
  // Slug aliases
  "financial-brochure.pdf",
  "financial-checklist.pdf",
  "financial-process-guide.pdf",
  "financial-faq-sheet.pdf",
  "it-brochure.pdf",
  "it-checklist.pdf",
  "it-process-guide.pdf",
  "it-faq-sheet.pdf",
  // Non-extension slug requests (testing resilience)
  "financial-brochure",
  "it-brochure"
];

async function testFile(filename) {
  return new Promise((resolve) => {
    const url = `http://localhost:8080/api/downloads/${filename}`;
    http.get(url, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        const signature = buf.subarray(0, 5).toString("ascii");
        const contentType = res.headers["content-type"] || "";
        const contentDisposition = res.headers["content-disposition"] || "";

        const passed =
          res.statusCode === 200 &&
          contentType.includes("application/pdf") &&
          contentDisposition.includes(".pdf") &&
          signature === "%PDF-" &&
          buf.length > 50000; // Multi-page PDF must be > 50 KB

        resolve({
          filename,
          statusCode: res.statusCode,
          contentType,
          contentDisposition,
          sizeBytes: buf.length,
          signature,
          passed,
        });
      });
    }).on("error", (e) => {
      resolve({ filename, error: e.message, passed: false });
    });
  });
}

async function main() {
  console.log("==================================================");
  console.log("TESTING ALL DOWNLOAD ENDPOINTS ON LOCAL SERVER");
  console.log("==================================================");

  let allPassed = true;
  for (const f of filesToTest) {
    const res = await testFile(f);
    if (!res.passed) {
      allPassed = false;
      console.error(`FAIL: ${f}`, res);
    } else {
      console.log(
        `PASS: ${f} -> HTTP ${res.statusCode} | ${res.contentType} | ${res.signature} | ${Math.round(res.sizeBytes / 1024)} KB | ${res.contentDisposition}`,
      );
    }
  }

  console.log("\n==================================================");
  if (allPassed) {
    console.log("ALL TESTS PASSED: 100% VALID MULTI-PAGE PDFS DELIVERED!");
  } else {
    console.error("SOME TESTS FAILED!");
  }
  console.log("==================================================");
}

main().catch(console.error);
