import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// 1. Load .env
const envContent = fs.readFileSync(".env", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
}

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 2. ZIP builder for XLSX and DOCX
function makeZip(files) {
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[i] = c;
  }
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  const localHeaders = [];
  const cdHeaders = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, "utf8");
    const dataBuf = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, "utf8");
    const compressed = zlib.deflateRawSync(dataBuf);
    const crc = crc32(dataBuf);

    const localHdr = Buffer.alloc(30 + nameBuf.length);
    localHdr.write("PK\x03\x04", 0);
    localHdr.writeUInt16LE(20, 4); // min version
    localHdr.writeUInt16LE(0, 6);  // flags
    localHdr.writeUInt16LE(8, 8);  // deflate
    localHdr.writeUInt16LE(0, 10); // time
    localHdr.writeUInt16LE(0, 12); // date
    localHdr.writeUInt32LE(crc, 14);
    localHdr.writeUInt32LE(compressed.length, 18);
    localHdr.writeUInt32LE(dataBuf.length, 22);
    localHdr.writeUInt16LE(nameBuf.length, 26);
    localHdr.writeUInt16LE(0, 28);
    nameBuf.copy(localHdr, 30);

    localHeaders.push(localHdr, compressed);

    const cdHdr = Buffer.alloc(46 + nameBuf.length);
    cdHdr.write("PK\x01\x02", 0);
    cdHdr.writeUInt16LE(20, 4); // made by
    cdHdr.writeUInt16LE(20, 6); // min version
    cdHdr.writeUInt16LE(0, 8);
    cdHdr.writeUInt16LE(8, 10);
    cdHdr.writeUInt16LE(0, 12);
    cdHdr.writeUInt16LE(0, 14);
    cdHdr.writeUInt32LE(crc, 16);
    cdHdr.writeUInt32LE(compressed.length, 20);
    cdHdr.writeUInt32LE(dataBuf.length, 24);
    cdHdr.writeUInt16LE(nameBuf.length, 28);
    cdHdr.writeUInt16LE(0, 30);
    cdHdr.writeUInt16LE(0, 32);
    cdHdr.writeUInt16LE(0, 34);
    cdHdr.writeUInt16LE(0, 36);
    cdHdr.writeUInt32LE(0, 38);
    cdHdr.writeUInt32LE(offset, 42);
    nameBuf.copy(cdHdr, 46);

    cdHeaders.push(cdHdr);
    offset += localHdr.length + compressed.length;
  }

  const cdTotalSize = cdHeaders.reduce((s, h) => s + h.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.write("PK\x05\x06", 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdTotalSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...cdHeaders, eocd]);
}

// 3. Document Builders
async function buildPdf({ title, subtitle, practice, items }) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Top header bar
  page.drawRectangle({
    x: 0,
    y: 780,
    width: 595.28,
    height: 62,
    color: rgb(0.06, 0.15, 0.32), // Dark Navy
  });

  page.drawText("JYOT ENTERPRISE", {
    x: 40,
    y: 805,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(practice.toUpperCase(), {
    x: 40,
    y: 790,
    size: 10,
    font,
    color: rgb(0.85, 0.72, 0.44), // Gold accent
  });

  // Title & Subtitle
  let curY = 740;
  page.drawText(title, {
    x: 40,
    y: curY,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.16),
  });

  curY -= 22;
  page.drawText(subtitle, {
    x: 40,
    y: curY,
    size: 11,
    font,
    color: rgb(0.35, 0.4, 0.48),
  });

  // Divider
  curY -= 16;
  page.drawLine({
    start: { x: 40, y: curY },
    end: { x: 555, y: curY },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.94),
  });

  curY -= 24;

  // Content items
  for (const item of items) {
    if (curY < 120) break; // keep footer space

    if (item.type === "section") {
      page.drawText(item.title, {
        x: 40,
        y: curY,
        size: 13,
        font: fontBold,
        color: rgb(0.06, 0.15, 0.32),
      });
      curY -= 18;
    } else if (item.type === "bullet") {
      page.drawText("•", {
        x: 45,
        y: curY,
        size: 12,
        font: fontBold,
        color: rgb(0.85, 0.72, 0.44),
      });
      page.drawText(item.text, {
        x: 60,
        y: curY,
        size: 10,
        font,
        color: rgb(0.2, 0.24, 0.3),
      });
      curY -= 16;
    } else if (item.type === "check") {
      // Checkbox square
      page.drawRectangle({
        x: 45,
        y: curY - 1,
        width: 10,
        height: 10,
        borderColor: rgb(0.3, 0.4, 0.5),
        borderWidth: 1,
        color: rgb(0.96, 0.97, 0.99),
      });
      page.drawText(item.text, {
        x: 65,
        y: curY,
        size: 10,
        font,
        color: rgb(0.18, 0.22, 0.28),
      });
      curY -= 18;
    }
  }

  // Footer bar
  page.drawLine({
    start: { x: 40, y: 60 },
    end: { x: 555, y: 60 },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.94),
  });

  page.drawText("© 2026 Jyot Enterprise Suite. Official Practice Resource. Confidential & Proprietary.", {
    x: 40,
    y: 45,
    size: 8,
    font,
    color: rgb(0.5, 0.55, 0.6),
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

function buildXlsx({ sheetName, headers, rows }) {
  const escapeXml = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`;

  let sheetData = "";
  // Header row (r=1)
  sheetData += '<row r="1">\n';
  headers.forEach((h, colIdx) => {
    const colLetter = String.fromCharCode(65 + colIdx);
    sheetData += `  <c r="${colLetter}1" t="inlineStr" s="1"><is><t>${escapeXml(h)}</t></is></c>\n`;
  });
  sheetData += '</row>\n';

  // Data rows
  rows.forEach((row, rowIdx) => {
    const rNum = rowIdx + 2;
    sheetData += `<row r="${rNum}">\n`;
    row.forEach((cell, colIdx) => {
      const colLetter = String.fromCharCode(65 + colIdx);
      sheetData += `  <c r="${colLetter}${rNum}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>\n`;
    });
    sheetData += '</row>\n';
  });

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
${sheetData}
  </sheetData>
</worksheet>`;

  return makeZip([
    { name: "[Content_Types].xml", data: contentTypesXml },
    { name: "_rels/.rels", data: relsXml },
    { name: "xl/_rels/workbook.xml.rels", data: wbRelsXml },
    { name: "xl/workbook.xml", data: wbXml },
    { name: "xl/styles.xml", data: stylesXml },
    { name: "xl/worksheets/sheet1.xml", data: sheet1Xml },
  ]);
}

function buildDocx({ title, subtitle, sections }) {
  const escapeXml = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  let docBody = "";
  // Header
  docBody += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F2552"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r></w:p>\n`;
  docBody += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="22"/><w:color w:val="64748B"/></w:rPr><w:t>${escapeXml(subtitle)}</w:t></w:r></w:p>\n`;
  docBody += `<w:p><w:r><w:t></w:t></w:r></w:p>\n`;

  for (const sec of sections) {
    docBody += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="1E293B"/></w:rPr><w:t>${escapeXml(sec.heading)}</w:t></w:r></w:p>\n`;
    for (const p of sec.paragraphs) {
      docBody += `<w:p><w:r><w:rPr><w:sz w:val="22"/><w:color w:val="334155"/></w:rPr><w:t>${escapeXml(p)}</w:t></w:r></w:p>\n`;
    }
    docBody += `<w:p><w:r><w:t></w:t></w:r></w:p>\n`;
  }

  // Footer / Signatures
  docBody += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>EXECUTION &amp; SIGNATURES</w:t></w:r></w:p>\n`;
  docBody += `<w:p><w:r><w:t>For Jyot Enterprise Suite: ___________________________    Date: ______________</w:t></w:r></w:p>\n`;
  docBody += `<w:p><w:r><w:t>For Client / Recipient:    ___________________________    Date: ______________</w:t></w:r></w:p>\n`;

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${docBody}
  </w:body>
</w:document>`;

  return makeZip([
    { name: "[Content_Types].xml", data: contentTypesXml },
    { name: "_rels/.rels", data: relsXml },
    { name: "word/document.xml", data: docXml },
  ]);
}

// 4. Resource Downloads Manifest
const RESOURCES_DOWNLOADS = [
  // 1. gst-guide
  {
    slug: "gst-guide",
    files: [
      {
        fileName: "GST-Filing-Calendar-2026-27.pdf",
        title: "GST filing calendar 2026-27",
        description: "Official compliance calendar with statutory deadlines for GSTR-1, GSTR-3B, CMP-08, and GSTR-9/9C.",
        fileType: "PDF",
        mimeType: "application/pdf",
        generate: async () => buildPdf({
          title: "GST Filing Calendar FY 2026-27",
          subtitle: "Comprehensive Statutory Deadlines & Compliance Timelines for Indian Businesses",
          practice: "Financial & Tax Advisory",
          items: [
            { type: "section", title: "1. Monthly Filers Schedule (Turnover > 5 Cr)" },
            { type: "bullet", text: "GSTR-1 (Outward Supplies): 11th of each succeeding month" },
            { type: "bullet", text: "GSTR-3B (Summary Return & Tax Payment): 20th of each succeeding month" },
            { type: "bullet", text: "GSTR-8 (e-Commerce Operators): 10th of each succeeding month" },
            { type: "section", title: "2. QRMP Scheme Filers (Turnover up to 5 Cr)" },
            { type: "bullet", text: "IFF (Optional Invoice Furnishing): 13th of Month 1 & Month 2" },
            { type: "bullet", text: "PMT-06 (Tax Deposit Chalan): 25th of Month 1 & Month 2" },
            { type: "bullet", text: "Quarterly GSTR-1: 13th of month following quarter end" },
            { type: "bullet", text: "Quarterly GSTR-3B: 22nd / 24th based on State Category" },
            { type: "section", title: "3. Annual Reconciliations & Audit" },
            { type: "bullet", text: "GSTR-9 (Annual Return): Due 31st December following financial year" },
            { type: "bullet", text: "GSTR-9C (Reconciliation Statement): Applicable for turnover exceeding INR 5 Cr" },
            { type: "section", title: "4. Statutory Penalties & Interest" },
            { type: "bullet", text: "Late fee under Section 47: Rs. 50/day (Rs. 20 for Nil returns) subject to maximum caps" },
            { type: "bullet", text: "Interest under Section 50: 18% p.a. on net tax liability paid after due date" }
          ]
        })
      },
      {
        fileName: "Input-Credit-Reconciliation-Template.xlsx",
        title: "Input credit reconciliation template",
        description: "Standardized reconciliation workbook matching purchase invoices against GSTR-2B statement to maximize ITC.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "ITC_Reconciliation",
          headers: ["Invoice No", "Invoice Date", "Supplier GSTIN", "Supplier Legal Name", "Taxable Value (INR)", "CGST", "SGST", "IGST", "Total GST", "2B Match Status", "Eligible / Blocked ITC"],
          rows: [
            ["INV-2026-001", "2026-04-05", "27AABCT3518Q1Z4", "Apex Logistics Ltd", "150000.00", "13500.00", "13500.00", "0.00", "27000.00", "Exact Match", "Eligible ITC"],
            ["INV-2026-002", "2026-04-12", "24AABCT9981K1ZA", "CloudScale Networks", "85000.00", "0.00", "0.00", "15300.00", "15300.00", "Exact Match", "Eligible ITC"],
            ["INV-2026-003", "2026-04-18", "29AABCS1122D1Z9", "Precision Tooling Corp", "240000.00", "21600.00", "21600.00", "0.00", "43200.00", "Pending in 2B", "Hold ITC (Follow-up)"],
            ["INV-2026-004", "2026-04-24", "27AABCG4455F1Z2", "Metro Office Equipment", "45000.00", "4050.00", "4050.00", "0.00", "8100.00", "Exact Match", "Eligible ITC"],
            ["INV-2026-005", "2026-04-29", "27AABCV8877L1Z1", "Zenith Motor Spares", "12000.00", "1080.00", "1080.00", "0.00", "2160.00", "Value Discrepancy", "Amend with Supplier"]
          ]
        })
      },
      {
        fileName: "GST-Registration-Document-Checklist.pdf",
        title: "GST registration document checklist",
        description: "Prerequisite documentation and KYC verification requirements for Private Limited and Partnership registrations.",
        fileType: "PDF",
        mimeType: "application/pdf",
        generate: async () => buildPdf({
          title: "GST Registration Document Checklist",
          subtitle: "Complete Verification Matrix for Corporate and Commercial Registrations",
          practice: "Financial & Corporate Advisory",
          items: [
            { type: "section", title: "1. Entity Legal Documents" },
            { type: "check", text: "Certificate of Incorporation (COI) / Partnership Deed" },
            { type: "check", text: "Permanent Account Number (PAN) Card of the business entity" },
            { type: "check", text: "Memorandum and Articles of Association (MOA & AOA)" },
            { type: "section", title: "2. Authorized Signatory & Promoter KYC" },
            { type: "check", text: "PAN Card and Aadhaar Card of all Directors / Designated Partners" },
            { type: "check", text: "Passport-size photographs of all Promoters and Authorized Signatory" },
            { type: "check", text: "Board Resolution / Letter of Authorization appointing Primary Signatory" },
            { type: "check", text: "Valid Class 3 Digital Signature Certificate (DSC) for Company filing" },
            { type: "section", title: "3. Principal Place of Business Proofs" },
            { type: "check", text: "Electricity bill, Property tax receipt, or Municipal Khata (under 2 months)" },
            { type: "check", text: "Registered Rent Agreement / Lease Deed with landlord NOC" }
          ]
        })
      }
    ]
  },

  // 2. loan-guide
  {
    slug: "loan-guide",
    files: [
      {
        fileName: "Jyot-Enterprise-Loan-Document-Checklist.pdf",
        title: "Loan document checklist",
        description: "Official checklist of collateral proofs, 3-year audited financials, and bank statement schedules for credit approval.",
        fileType: "PDF",
        mimeType: "application/pdf",
        generate: async () => buildPdf({
          title: "Commercial Loan Documentation Checklist",
          subtitle: "Credit Underwriting & Application Verification Package",
          practice: "Financial Advisory",
          items: [
            { type: "section", title: "1. Financial Records & Statements" },
            { type: "check", text: "Audited Financial Statements for previous 3 financial years (with CA report & notes)" },
            { type: "check", text: "Provisional Financials & CMA Data for current financial year" },
            { type: "check", text: "Income Tax Returns (ITR) of entity & promoters for last 3 Assessment Years" },
            { type: "check", text: "Bank account statements for all operative current accounts (past 12 months in PDF)" },
            { type: "section", title: "2. Statutory & Compliance Proofs" },
            { type: "check", text: "GSTR-3B filings summary for trailing 12 months with sales reconciliation" },
            { type: "check", text: "Existing sanction letters and repayment track records for all active debt facilities" },
            { type: "section", title: "3. Collateral & Project Details" },
            { type: "check", text: "Title deeds, 30-year search report, and approved municipal plan for property collateral" },
            { type: "check", text: "Detailed Project Report (DPR) with cash-flow projections and DSCR analysis" }
          ]
        })
      },
      {
        fileName: "EMI-and-Eligibility-Calculator.xlsx",
        title: "EMI and eligibility calculator",
        description: "Financial calculator evaluating monthly debt service, amortization schedule, and debt-service coverage ratios.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "Loan_Eligibility_Calculator",
          headers: ["Facility Type", "Sanction Amount (INR)", "Interest Rate (% p.a.)", "Tenure (Months)", "Monthly EMI (INR)", "Annual Debt Service", "Projected EBITDA", "DSCR Ratio"],
          rows: [
            ["Term Loan (Equipment)", "25000000.00", "10.25%", "60", "534120.00", "6409440.00", "11200000.00", "1.75 (Strong)"],
            ["Working Capital CC", "15000000.00", "9.80%", "12 (Renewal)", "122500.00 (Interest)", "1470000.00", "8500000.00", "2.10 (Prime)"],
            ["Unsecured Business Loan", "5000000.00", "14.50%", "36", "172080.00", "2064960.00", "4200000.00", "1.52 (Acceptable)"],
            ["Commercial Property Term", "40000000.00", "9.50%", "120", "517400.00", "6208800.00", "13500000.00", "1.82 (Strong)"]
          ]
        })
      },
      {
        fileName: "Working-Capital-Assessment-Template.xlsx",
        title: "Working capital assessment template",
        description: "Tandon / Nayak committee MPBF model evaluating inventory cycles, receivables turnaround, and net working capital.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "MPBF_Assessment",
          headers: ["Operating Metric", "Previous FY (Actual)", "Current FY (Estimate)", "Projected FY", "Holding Norms (Days)", "Bank Norms Target", "Variance Notes"],
          rows: [
            ["Gross Projected Turnover", "185000000.00", "240000000.00", "310000000.00", "-", "-", "30% YoY Expansion"],
            ["Raw Material Inventory", "21000000.00", "28000000.00", "34000000.00", "45 days", "60 days", "Within acceptable range"],
            ["Stock in Process (WIP)", "8500000.00", "11000000.00", "13500000.00", "15 days", "20 days", "Lean manufacturing"],
            ["Finished Goods Inventory", "14000000.00", "18500000.00", "22000000.00", "30 days", "45 days", "Safe buffer"],
            ["Sundry Debtors (Receivables)", "38000000.00", "49000000.00", "61000000.00", "65 days", "75 days", "Strong corporate collections"],
            ["Sundry Creditors (Payables)", "24000000.00", "31000000.00", "39000000.00", "45 days", "45 days", "MSME statutory payment compliant"]
          ]
        })
      }
    ]
  },

  // 3. website-checklist
  {
    slug: "website-checklist",
    files: [
      {
        fileName: "42-Point-Pre-Launch-Website-Checklist.pdf",
        title: "42-point launch checklist",
        description: "Exhaustive QA checklist covering technical SEO, performance budgets, accessibility, security headers, and analytics tracking.",
        fileType: "PDF",
        mimeType: "application/pdf",
        generate: async () => buildPdf({
          title: "42-Point Pre-Launch Website Checklist",
          subtitle: "Enterprise Production Readiness & QA Audit Standard",
          practice: "IT & Digital Engineering",
          items: [
            { type: "section", title: "1. Performance & Core Web Vitals" },
            { type: "check", text: "Largest Contentful Paint (LCP) under 2.5s on simulated 4G mobile" },
            { type: "check", text: "Cumulative Layout Shift (CLS) under 0.1 on all responsive viewports" },
            { type: "check", text: "All images formatted in WebP/AVIF with explicit width/height tags" },
            { type: "check", text: "Font files self-hosted with font-display: swap and preloaded" },
            { type: "section", title: "2. Technical SEO & Indexability" },
            { type: "check", text: "Unique Title tag (<60 chars) and Meta Description (<155 chars) on all pages" },
            { type: "check", text: "Self-referencing canonical URL configured across all indexable routes" },
            { type: "check", text: "Robots.txt tested and XML sitemap generated dynamically" },
            { type: "check", text: "OpenGraph / Twitter Card preview images verified (1200x630px)" },
            { type: "section", title: "3. Security & Compliance" },
            { type: "check", text: "Strict SSL/TLS certificate installed with automatic HTTPS redirection" },
            { type: "check", text: "Security headers configured: CSP, X-Frame-Options, HSTS" }
          ]
        })
      },
      {
        fileName: "SEO-Metadata-Planning-Sheet.xlsx",
        title: "SEO metadata planning sheet",
        description: "Site architecture planner mapping page URLs, primary keywords, title tags, descriptions, and OpenGraph configurations.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "SEO_Metadata_Plan",
          headers: ["Page URL Slug", "Page Title / H1", "Target Primary Keyword", "Meta Title (Max 60 chars)", "Char Count", "Meta Description (Max 155 chars)", "Canonical Tag", "Robots Indexing"],
          rows: [
            ["/", "Jyot Enterprise Suite - Multidisciplinary Practice", "enterprise business solutions", "Jyot Enterprise | Legal, Financial, IT & Engineering Advisory", "59", "Unified enterprise services: corporate legal compliance, business finance, bespoke IT software, and mechanical engineering solutions.", "https://jyotenterprise.com/", "index, follow"],
            ["/services/it", "Bespoke IT & Digital Engineering Services", "enterprise software development", "Enterprise IT Services & Custom Software | Jyot Enterprise", "57", "Scalable cloud applications, custom ERP, CRM automation, and enterprise software engineering built for Indian industry.", "https://jyotenterprise.com/services/it", "index, follow"],
            ["/services/financial", "Corporate Financial & Tax Advisory", "corporate financial advisory india", "Corporate Financial Advisory & Business Loans | Jyot Enterprise", "62", "Business loan facilitation, working capital structuring, GST advisory, and project financing solutions for growing enterprises.", "https://jyotenterprise.com/services/financial", "index, follow"],
            ["/resources", "Enterprise Knowledge Hub & Toolkits", "business guides templates india", "Free Enterprise Business Guides, Templates & Checklists | Jyot", "61", "Download practical GST calculators, business loan checklists, ERP evaluation scorecards, and legal agreement templates.", "https://jyotenterprise.com/resources", "index, follow"]
          ]
        })
      }
    ]
  },

  // 4. erp-guide
  {
    slug: "erp-guide",
    files: [
      {
        fileName: "ERP-Requirement-Specification-Template.xlsx",
        title: "ERP requirement template",
        description: "Functional requirements specification matrix mapping requirements across inventory, finance, production, and CRM.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "ERP_Functional_Requirements",
          headers: ["Module Code", "Functional Requirement", "Priority (MoSCoW)", "Standard Feature in Tier-1", "Custom Code Required", "Business Owner", "Vendor Capability Score (1-5)"],
          rows: [
            ["FIN-01", "Multi-GSTIN automated filing and reconciliation", "Must Have", "Yes", "No", "Finance Controller", "5"],
            ["INV-01", "Multi-warehouse real-time stock allocation with batch/lot tracking", "Must Have", "Yes", "No", "Operations Lead", "5"],
            ["MFG-01", "Multi-level Bill of Materials (BOM) with scrap factor calculation", "Must Have", "Yes", "Optional", "Plant Manager", "4"],
            ["CRM-01", "Direct WhatsApp & Email lead ingestion with quotation generator", "Should Have", "Partial", "Yes", "Sales Director", "4"],
            ["HR-01", "Biometric attendance integration with statutory PF/ESI payroll", "Should Have", "Yes", "No", "HR Head", "5"],
            ["API-01", "Bi-directional REST API syncing with e-commerce & shipping carriers", "Could Have", "Partial", "Yes", "CTO / IT Lead", "4"]
          ]
        })
      },
      {
        fileName: "Five-Year-ERP-TCO-Comparison-Model.xlsx",
        title: "Five-year TCO comparison model",
        description: "Total cost of ownership workbook comparing SaaS subscription versus bespoke build across 5-year lifecycle.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "5Year_TCO_Model",
          headers: ["Cost Component", "Year 1 (Capex/Setup)", "Year 2", "Year 3", "Year 4", "Year 5", "5-Year Total (INR)", "Cost Drivers & Notes"],
          rows: [
            ["Software Licensing / Subscriptions", "1800000.00", "1980000.00", "2178000.00", "2395800.00", "2635380.00", "10989180.00", "10% annual escalation per user seat"],
            ["Implementation & Customization", "2500000.00", "350000.00", "350000.00", "400000.00", "400000.00", "4000000.00", "Initial systems integrator deployment"],
            ["Cloud Hosting & Infrastructure", "420000.00", "480000.00", "550000.00", "630000.00", "720000.00", "2800000.00", "AWS / Azure dedicated database cluster"],
            ["Internal Support & Training", "600000.00", "660000.00", "720000.00", "800000.00", "880000.00", "3660000.00", "Dedicated systems administrator salary"],
            ["Total Ownership Expense", "5320000.00", "3470000.00", "3798000.00", "4225800.00", "4635380.00", "21449180.00", "Comprehensive 5-year enterprise projection"]
          ]
        })
      },
      {
        fileName: "Vendor-Evaluation-Scorecard.pdf",
        title: "Vendor evaluation scorecard",
        description: "Objective evaluation rubric scoring ERP implementation partners across technical architecture, domain experience, and SLAs.",
        fileType: "PDF",
        mimeType: "application/pdf",
        generate: async () => buildPdf({
          title: "ERP Vendor Selection & Evaluation Scorecard",
          subtitle: "Quantitative Due Diligence Framework for Systems Integration Partners",
          practice: "IT Advisory & Enterprise Architecture",
          items: [
            { type: "section", title: "1. Technical Competence (Weight: 30%)" },
            { type: "bullet", text: "Native modular architecture and zero-downtime database upgrades" },
            { type: "bullet", text: "Robust REST/GraphQL API layer with high throughput capabilities" },
            { type: "bullet", text: "SOC2 / ISO 27001 data compliance and encryption at rest standards" },
            { type: "section", title: "2. Industry Domain Expertise (Weight: 30%)" },
            { type: "bullet", text: "Minimum 5 verifiable enterprise deployments in exact client manufacturing/services sector" },
            { type: "bullet", text: "Pre-built Indian statutory taxation models (GST, TCS, TDS, E-Way Bill)" },
            { type: "section", title: "3. Implementation Methodology & SLA (Weight: 25%)" },
            { type: "bullet", text: "Phased milestone delivery methodology with rollback protection" },
            { type: "bullet", text: "Guaranteed Sev-1 response time under 1 hour with 99.9% uptime SLA" },
            { type: "section", title: "4. Commercial Flexibility (Weight: 15%)" },
            { type: "bullet", text: "Transparent pricing without hidden seat fees or punitive change orders" }
          ]
        })
      }
    ]
  },

  // 5. crm-guide
  {
    slug: "crm-guide",
    files: [
      {
        fileName: "Pipeline-Stage-Definition-Template.xlsx",
        title: "Pipeline stage definition template",
        description: "Sales process playbook defining entry/exit criteria, required documents, and conversion benchmarks per funnel stage.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "Sales_Pipeline_Stages",
          headers: ["Stage Name", "Probability (%)", "Entry Trigger", "Mandatory Rep Actions", "Exit Gate / Qualification", "Target SLA"],
          rows: [
            ["1. New Inbound Lead", "10%", "Web form, WhatsApp, or referral", "Log lead in CRM, check deduplication, assign rep", "Contact made within 15 minutes", "24 Hours"],
            ["2. Discovery & Qualification", "25%", "Initial response received", "Conduct BANT/MEDDPIC audit, identify decision maker", "Qualification score >= 70", "3 Days"],
            ["3. Solution Demo / Proposal", "50%", "Requirements confirmed", "Deliver tailored capability presentation & commercials", "Client acknowledges proposal receipt", "5 Days"],
            ["4. Commercial Negotiation", "75%", "Budget approved in principle", "Finalize payment terms, SLA, and contract redlines", "Draft agreement circulated for signoff", "7 Days"],
            ["5. Closed Won", "100%", "Signed agreement & advance PO", "Trigger onboarding kickoff, notify account management", "First milestone invoice generated", "Immediate"]
          ]
        })
      },
      {
        fileName: "CRM-Adoption-Scorecard.pdf",
        title: "CRM adoption scorecard",
        description: "Weekly executive adoption audit scorecard tracking pipeline hygiene, call logging frequency, and forecast accuracy.",
        fileType: "PDF",
        mimeType: "application/pdf",
        generate: async () => buildPdf({
          title: "Enterprise CRM Adoption & Hygiene Scorecard",
          subtitle: "Weekly Performance Metrics for Commercial Sales Teams",
          practice: "Business Operations & IT",
          items: [
            { type: "section", title: "1. Daily Activity Logging Metrics" },
            { type: "bullet", text: "Inbound Lead First Response: Target < 15 mins (Minimum 95% compliance)" },
            { type: "bullet", text: "Call & Meeting Notes: 100% logged within 4 hours of customer interaction" },
            { type: "bullet", text: "Next Action Date: Zero opportunities allowed without a future scheduled task" },
            { type: "section", title: "2. Pipeline Hygiene Benchmarks" },
            { type: "bullet", text: "Stagnant Deal Alert: Deals exceeding 30 days in single stage flagged for review" },
            { type: "bullet", text: "Close Date Realism: Historical push rate tracked; max 2 date pushes allowed" },
            { type: "section", title: "3. Management Coaching Cadence" },
            { type: "bullet", text: "Monday Forecast Review: Commit deals vs pipeline upside audit" },
            { type: "bullet", text: "Friday Win/Loss Post-Mortem: Capture competitive pricing and product feedback" }
          ]
        })
      }
    ]
  },

  // 6. ai-guide
  {
    slug: "ai-guide",
    files: [
      {
        fileName: "AI-Use-Case-Prioritisation-Matrix.xlsx",
        title: "AI use-case prioritisation matrix",
        description: "Decision-making matrix scoring potential AI pilots on business value, implementation effort, and data readiness.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "AI_Prioritisation_Matrix",
          headers: ["Department", "AI Use-Case Description", "Business Value (1-10)", "Tech Feasibility (1-10)", "Data Readiness (1-10)", "Risk Level", "Composite Score", "Execution Quadrant"],
          rows: [
            ["Customer Support", "Automated bilingual WhatsApp support bot with human escalation", "9", "9", "8", "Low", "8.7", "Quick Win (Execute Now)"],
            ["Finance / Accounts", "Automated vendor invoice OCR and 3-way ERP PO matching", "8", "8", "9", "Low", "8.3", "Quick Win (Execute Now)"],
            ["Legal & Contracts", "Contract clause risk analysis and deviation analyzer", "7", "8", "7", "Medium", "7.3", "Strategic Project"],
            ["Manufacturing / Plant", "Computer vision surface defect detection on assembly line", "9", "6", "6", "Medium", "7.0", "Strategic Project"],
            ["Sales & Marketing", "Predictive lead scoring and automated sales email drafting", "7", "8", "8", "Low", "7.7", "Quick Win (Execute Now)"],
            ["HR / Recruitment", "Resume screening & skills gap recommendation engine", "6", "7", "6", "Medium", "6.3", "Secondary Priority"]
          ]
        })
      },
      {
        fileName: "AI-Governance-Policy-Template.docx",
        title: "AI governance policy template",
        description: "Corporate legal policy defining acceptable enterprise use of Generative AI, data confidentiality, and IP protection.",
        fileType: "DOCX",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        generate: async () => buildDocx({
          title: "ENTERPRISE ARTIFICIAL INTELLIGENCE GOVERNANCE POLICY",
          subtitle: "Operational Guidelines, Data Security Safeguards, and Acceptable Use Framework",
          sections: [
            {
              heading: "1. PURPOSE AND SCOPE",
              paragraphs: [
                "This policy establishes enterprise standards for utilizing Artificial Intelligence (AI), Large Language Models (LLMs), and automated machine learning systems within Jyot Enterprise Suite and client partner environments.",
                "This policy applies to all full-time employees, contractors, consultants, and third-party vendors accessing company systems, client confidential data, or proprietary intellectual property."
              ]
            },
            {
              heading: "2. CLASSIFICATION OF AI TOOLS",
              paragraphs: [
                "Tier 1 (Approved Enterprise AI): Secure, enterprise-licensed AI platforms with contractual zero-data-retention guarantees where customer data is not used for model training.",
                "Tier 2 (Consumer Public AI): Public, web-based models (such as free web ChatGPT or Claude). Storing or pasting confidential client records, customer PII, trade secrets, or unreleased source code into Tier 2 models is strictly prohibited."
              ]
            },
            {
              heading: "3. DATA CONFIDENTIALITY & PRIVACY PROTOCOLS",
              paragraphs: [
                "No Personally Identifiable Information (PII) including Aadhaar, PAN, bank account details, or employee compensation data may be submitted to any external AI system without prior masking or synthetic anonymization.",
                "All outputs generated by AI systems must be reviewed, verified, and validated by a qualified human professional prior to external release or client delivery."
              ]
            },
            {
              heading: "4. INTELLECTUAL PROPERTY & CODE GENERATION",
              paragraphs: [
                "Source code authored with AI assistance must undergo standard static analysis, security vulnerability scanning, and peer code review prior to merge into production repositories.",
                "Employees must ensure that AI suggestions do not introduce restrictive copyleft open-source licenses (such as GPL-3.0) into proprietary commercial codebases."
              ]
            }
          ]
        })
      }
    ]
  },

  // 7. engineering-guide
  {
    slug: "engineering-guide",
    files: [
      {
        fileName: "Engineering-Drawing-Standards-Template.pdf",
        title: "Drawing standard template",
        description: "Production drawing title block specification, projection systems, line weight hierarchy, and revision management.",
        fileType: "PDF",
        mimeType: "application/pdf",
        generate: async () => buildPdf({
          title: "Engineering Drawing Standards & Practices",
          subtitle: "ASME Y14.5M & ISO Drafting Convention Handbook",
          practice: "Engineering & Technical Services",
          items: [
            { type: "section", title: "1. Drawing Sheet Layout & Title Block" },
            { type: "bullet", text: "Standard sheet sizes: ISO A4 (210x297mm) through A0 (841x1189mm)" },
            { type: "bullet", text: "Standard First-Angle / Third-Angle projection symbol clearly indicated in title block" },
            { type: "bullet", text: "Title block contains: Part Name, Drawing Number, Material Spec, Finish, Scale, Tolerances, Revision, Approval Signoffs" },
            { type: "section", title: "2. Line Weight & Type Hierarchy" },
            { type: "bullet", text: "Visible Outlines: Continuous Thick (0.50mm - 0.70mm)" },
            { type: "bullet", text: "Hidden Details: Dashed Thin (0.25mm - 0.35mm)" },
            { type: "bullet", text: "Centerlines & Pitch Circles: Long-Short-Long Dash Thin (0.25mm)" },
            { type: "bullet", text: "Dimension & Extension Lines: Continuous Thin with filled arrowheads" },
            { type: "section", title: "3. Revision Control Conventions" },
            { type: "bullet", text: "Revision letter index (Rev A, B, C...) with dated description of engineering change" },
            { type: "bullet", text: "Revision cloud markers placed around modified geometry and dimensions" }
          ]
        })
      },
      {
        fileName: "GDT-Quick-Reference-Sheet.pdf",
        title: "GD&T quick reference",
        description: "Comprehensive geometric dimensioning and tolerancing reference table with symbols, datums, and tolerance zones.",
        fileType: "PDF",
        mimeType: "application/pdf",
        generate: async () => buildPdf({
          title: "Geometric Dimensioning & Tolerancing (GD&T) Reference",
          subtitle: "Quick Reference Guide for Machining, Fabrication, and Inspection",
          practice: "Engineering & Precision Manufacturing",
          items: [
            { type: "section", title: "1. Form Tolerances (No Datum Required)" },
            { type: "bullet", text: "Straightness: Controls line element variation across surface or axis" },
            { type: "bullet", text: "Flatness: Surface elements must lie between two parallel planes" },
            { type: "bullet", text: "Circularity (Roundness): Cross-sectional boundary between two concentric circles" },
            { type: "bullet", text: "Cylindricity: 3D tolerance zone between two coaxial cylinders" },
            { type: "section", title: "2. Orientation Tolerances (Requires Datum)" },
            { type: "bullet", text: "Perpendicularity: Surface, plane, or axis at 90 degrees to specified datum" },
            { type: "bullet", text: "Parallelism: Surface equidistant at all points to reference datum plane" },
            { type: "bullet", text: "Angularity: Surface or axis oriented at specified basic angle to datum" },
            { type: "section", title: "3. Location Tolerances" },
            { type: "bullet", text: "Position: True position zone (diametral or rectangular) at MMC, LMC, or RFS" },
            { type: "bullet", text: "Concentricity: Coaxial alignment of opposing feature midpoints" }
          ]
        })
      },
      {
        fileName: "First-Article-Inspection-Template.xlsx",
        title: "First article inspection template",
        description: "AS9102 / ISO 9001 dimensional verification spreadsheet capturing nominals, tolerances, and CMM gauge readings.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "FAI_Report_Form3",
          headers: ["Char #", "Drawing Sheet / Grid", "Characteristic Description", "Nominal Dimension", "Upper Tol (+)", "Lower Tol (-)", "Measured Value", "Inspection Tool / Gauge", "Result (Pass/Fail)"],
          rows: [
            ["1", "Sheet 1 / B3", "Shaft Outer Diameter (OD)", "45.000 mm", "+0.015", "-0.000", "45.008 mm", "Digital Micrometer (Calibrated)", "PASS"],
            ["2", "Sheet 1 / B4", "Shaft Length", "120.000 mm", "+0.100", "-0.100", "120.040 mm", "Vernier Caliper", "PASS"],
            ["3", "Sheet 1 / C2", "Keyway Width", "8.000 mm", "+0.025", "-0.000", "8.012 mm", "Gauge Blocks", "PASS"],
            ["4", "Sheet 1 / C2", "Keyway Depth", "4.000 mm", "+0.050", "-0.000", "4.020 mm", "Depth Gauge", "PASS"],
            ["5", "Sheet 1 / D5", "Bearing Journal Perpendicularity", "0.020 mm", "+0.020", "0.000", "0.011 mm", "Dial Indicator / V-Block", "PASS"],
            ["6", "Sheet 1 / E1", "Surface Roughness (Ra)", "0.80 um", "Max 0.80", "-", "0.65 um", "Surface Profilometer", "PASS"]
          ]
        })
      }
    ]
  },

  // 8. business-templates
  {
    slug: "business-templates",
    files: [
      {
        fileName: "Mutual-Non-Disclosure-Agreement.docx",
        title: "Mutual NDA",
        description: "Bilateral confidential disclosure agreement governed under Indian Contract Act with standard trade secret protection.",
        fileType: "DOCX",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        generate: async () => buildDocx({
          title: "MUTUAL NON-DISCLOSURE AGREEMENT",
          subtitle: "Bilateral Confidentiality and Proprietary Information Protection Agreement",
          sections: [
            {
              heading: "1. PARTIES AND EFFECTIVE DATE",
              paragraphs: [
                "This Mutual Non-Disclosure Agreement ('Agreement') is entered into on this day by and between JYOT ENTERPRISE SUITE, having its principal office at India ('Disclosing / Receiving Party'), and the counterparty entering into commercial discussions ('Company').",
                "Both parties intend to evaluate prospective business partnerships, professional services, software integration, or joint technical projects ('Purpose')."
              ]
            },
            {
              heading: "2. DEFINITION OF CONFIDENTIAL INFORMATION",
              paragraphs: [
                "'Confidential Information' includes all non-public commercial, technical, operational, and financial data, source code, designs, customer records, and strategic roadmaps disclosed by one party ('Discloser') to the other ('Recipient').",
                "Information shall be protected whether conveyed in writing, electronically, orally, or observed during site inspections, provided it is marked confidential or should reasonably be understood to be confidential."
              ]
            },
            {
              heading: "3. OBLIGATIONS OF RECIPIENT",
              paragraphs: [
                "The Recipient agrees to hold the Confidential Information in strict trust and confidence, exercising the same degree of care it uses for its own confidential data, but in no case less than reasonable care.",
                "The Recipient shall not disclose Confidential Information to any third party other than its directors, employees, and professional legal/financial advisors who have a need-to-know and are bound by confidentiality terms at least as restrictive as this Agreement."
              ]
            },
            {
              heading: "4. TERM AND GOVERNING LAW",
              paragraphs: [
                "This Agreement shall remain in effect for a period of two (2) years from the Effective Date, and confidentiality obligations shall survive for a period of three (3) years post termination.",
                "This Agreement shall be governed by and construed in accordance with the laws of India, and courts of competent jurisdiction shall have exclusive authority."
              ]
            }
          ]
        })
      },
      {
        fileName: "Standard-Service-Agreement.docx",
        title: "Service agreement",
        description: "Master services contract with milestones, intellectual property assignment, indemnity, and limitation of liability.",
        fileType: "DOCX",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        generate: async () => buildDocx({
          title: "MASTER PROFESSIONAL SERVICES AGREEMENT",
          subtitle: "Standard Terms of Service, Deliverables, and Commercial Engagement Framework",
          sections: [
            {
              heading: "1. SCOPE OF SERVICES",
              paragraphs: [
                "Jyot Enterprise Suite ('Provider') agrees to perform advisory, digital engineering, regulatory compliance, or technical consultancy services ('Services') as set forth in Statements of Work ('SOW') executed under this Agreement.",
                "Each SOW shall define the specific deliverables, project milestones, acceptance criteria, commercial fee schedule, and estimated timelines."
              ]
            },
            {
              heading: "2. FEES AND INVOICING",
              paragraphs: [
                "Client shall pay Provider the fees specified in each applicable SOW. Invoices are payable within fifteen (15) days of presentation unless otherwise specified in writing.",
                "Applicable statutory Goods and Services Tax (GST) shall be charged in addition to professional service fees at prevailing rates."
              ]
            },
            {
              heading: "3. INTELLECTUAL PROPERTY RIGHTS",
              paragraphs: [
                "Upon receipt of full payment of professional fees, all bespoke deliverables custom-developed specifically for the Client shall vest in the Client.",
                "Provider retains all right, title, and ownership in its pre-existing tools, libraries, generic frameworks, knowledge artifacts, and foundational architectures."
              ]
            },
            {
              heading: "4. WARRANTIES AND LIMITATION OF LIABILITY",
              paragraphs: [
                "Provider warrants that Services will be performed in a professional, workmanlike manner in accordance with industry best practices.",
                "Neither party shall be liable for indirect, incidental, or consequential damages. Total aggregate liability under any claim shall not exceed total fees paid under the applicable SOW in the preceding 6-month period."
              ]
            }
          ]
        })
      },
      {
        fileName: "Cash-Flow-Projection-Model.xlsx",
        title: "Cash flow projection model",
        description: "12-month rolling cash flow forecasting spreadsheet with operational, investment, and financing cash flow schedules.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "12Month_CashFlow_Model",
          headers: ["Line Item Category", "Month 1 (Apr)", "Month 2 (May)", "Month 3 (Jun)", "Month 4 (Jul)", "Month 5 (Aug)", "Month 6 (Sep)", "H1 Total (INR)"],
          rows: [
            ["Opening Cash Balance", "12500000.00", "13800000.00", "14900000.00", "16200000.00", "17600000.00", "18900000.00", "-"],
            ["Operating Inflows (Collections)", "8500000.00", "9200000.00", "9800000.00", "10500000.00", "11200000.00", "11800000.00", "61000000.00"],
            ["Direct Expenses & COGS", "4200000.00", "4500000.00", "4700000.00", "5100000.00", "5400000.00", "5700000.00", "29600000.00"],
            ["Payroll & Statutory Benefits", "2100000.00", "2100000.00", "2200000.00", "2200000.00", "2300000.00", "2300000.00", "13200000.00"],
            ["Administrative & Office Overheads", "650000.00", "680000.00", "710000.00", "730000.00", "750000.00", "780000.00", "4300000.00"],
            ["Net Monthly Operating Cash Flow", "1300000.00", "1100000.00", "1300000.00", "1400000.00", "1300000.00", "1500000.00", "7900000.00"],
            ["Closing Cash Balance", "13800000.00", "14900000.00", "16200000.00", "17600000.00", "18900000.00", "20400000.00", "-"]
          ]
        })
      },
      {
        fileName: "Statutory-Compliance-Calendar.xlsx",
        title: "Compliance calendar",
        description: "Corporate statutory compliance calendar tracking MCA, ROC, Income Tax, GST, PF, and ESI deadlines.",
        fileType: "XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        generate: async () => buildXlsx({
          sheetName: "Compliance_Calendar",
          headers: ["Statutory Regulatory Body", "Form / Return Name", "Frequency", "Applicable Cutoff / Period", "Statutory Due Date", "Responsible Officer", "Compliance Status"],
          rows: [
            ["Ministry of Corporate Affairs (MCA)", "DIR-3 KYC (Director KYC)", "Annual", "Active Directors", "30th September", "Company Secretary", "Scheduled"],
            ["Ministry of Corporate Affairs (MCA)", "AOC-4 (Financial Statements)", "Annual", "Audited Financials", "30 days post AGM", "Company Secretary", "Scheduled"],
            ["Ministry of Corporate Affairs (MCA)", "MGT-7 (Annual Return)", "Annual", "Shareholder Registry", "60 days post AGM", "Company Secretary", "Scheduled"],
            ["Income Tax Department (CBDT)", "TDS Payment (Challan 281)", "Monthly", "Previous calendar month", "7th of each month", "Accounts Lead", "Compliant"],
            ["Income Tax Department (CBDT)", "TDS Quarterly Return (24Q/26Q)", "Quarterly", "Q1 / Q2 / Q3 / Q4", "31st of following month", "Tax Consultant", "Compliant"],
            ["Employees Provident Fund (EPFO)", "PF Monthly ECR Remittance", "Monthly", "Previous salary month", "15th of each month", "Payroll Officer", "Compliant"],
            ["Employees State Insurance (ESIC)", "ESI Monthly Contribution", "Monthly", "Previous salary month", "15th of each month", "Payroll Officer", "Compliant"]
          ]
        })
      }
    ]
  }
];

// 5. Main Execution Loop
async function main() {
  console.log("==================================================");
  console.log("STARTING GENERATION & SEEDING OF REAL RESOURCE FILES");
  console.log("==================================================");

  let totalFiles = 0;
  let successCount = 0;

  for (const resDef of RESOURCES_DOWNLOADS) {
    console.log(`\nProcessing Resource: ${resDef.slug}...`);

    // Fetch existing resource
    const { data: resource, error: resErr } = await supabase
      .from("cms_resources")
      .select("id, slug, title, data")
      .eq("slug", resDef.slug)
      .single();

    if (resErr || !resource) {
      console.error(`Resource with slug ${resDef.slug} not found in cms_resources:`, resErr?.message);
      continue;
    }

    const seededFiles = [];

    for (let i = 0; i < resDef.files.length; i++) {
      const fileDef = resDef.files[i];
      totalFiles++;
      const storagePath = `website-documents/resources/${fileDef.fileName}`;

      console.log(`  Generating [${fileDef.fileType}] ${fileDef.fileName}...`);
      const fileBuffer = await fileDef.generate();

      console.log(`  Uploading to jyot-enterprise bucket at ${storagePath} (${fileBuffer.length} bytes)...`);
      const { error: uploadErr } = await supabase.storage
        .from("jyot-enterprise")
        .upload(storagePath, fileBuffer, {
          contentType: fileDef.mimeType,
          upsert: true,
        });

      if (uploadErr) {
        console.error(`  Upload failed for ${fileDef.fileName}:`, uploadErr.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("jyot-enterprise")
        .getPublicUrl(storagePath);

      const fileItem = {
        id: crypto.randomUUID(),
        resource_id: resource.id,
        title: fileDef.title,
        description: fileDef.description,
        file_url: urlData.publicUrl,
        storage_path: storagePath,
        file_name: fileDef.fileName,
        file_size: fileBuffer.length,
        mime_type: fileDef.mimeType,
        file_type: fileDef.fileType,
        display_label: `${fileDef.fileType} · ${Math.round(fileBuffer.length / 1024)} KB`,
        download_filename: fileDef.fileName,
        sort_order: i + 1,
        is_active: true,
      };

      seededFiles.push(fileItem);
      successCount++;
    }

    // Update cms_resources row data
    const existingData = resource.data || {};
    const updatedData = {
      ...existingData,
      resourceFiles: seededFiles,
    };

    const { error: updateErr } = await supabase
      .from("cms_resources")
      .update({
        data: updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resource.id);

    if (updateErr) {
      console.error(`Failed to update cms_resources for ${resDef.slug}:`, updateErr.message);
    } else {
      console.log(`Successfully attached ${seededFiles.length} real download files to ${resDef.slug}!`);
    }

    // Try also inserting into cms_resource_files table if table exists
    for (const f of seededFiles) {
      try {
        await supabase.from("cms_resource_files").upsert({
          id: f.id,
          resource_id: f.resource_id,
          title: f.title,
          description: f.description,
          file_url: f.file_url,
          storage_path: f.storage_path,
          file_name: f.file_name,
          file_size: f.file_size,
          mime_type: f.mime_type,
          file_type: f.file_type,
          display_label: f.display_label,
          download_filename: f.download_filename,
          sort_order: f.sort_order,
          is_active: f.is_active,
        });
      } catch {
        // Table might not exist yet; handled via dual-persistence in data.resourceFiles
      }
    }
  }

  console.log("\n==================================================");
  console.log(`FINISHED: ${successCount} / ${totalFiles} FILES GENERATED AND ATTACHED!`);
  console.log("==================================================");
}

main().catch(console.error);
