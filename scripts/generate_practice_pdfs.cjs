const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const OUT_DIR = path.join(process.cwd(), 'public/downloads');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Brand Colors
const ORANGE = rgb(0.969, 0.420, 0.110);    // #F76B1C
const DARK = rgb(0.071, 0.075, 0.086);       // #121316
const MUTED = rgb(0.380, 0.435, 0.518);      // #616f84
const LIGHT_BG = rgb(0.973, 0.980, 0.988);   // #F8FAFC
const BORDER = rgb(0.886, 0.910, 0.941);     // #E2E8F0
const WHITE = rgb(1, 1, 1);
const ACCENT_BG = rgb(1.0, 0.969, 0.929);   // #FFF7ED
const SOFT_BORDER = rgb(0.92, 0.93, 0.95);

function cleanWinAnsi(str) {
  if (!str) return '';
  return String(str)
    .replace(/₹/g, 'Rs. ')
    .replace(/[—–]/g, '-')
    .replace(/[•·]/g, '*')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x00-\x7F]/g, '');
}

function drawCategoryPill(page, text, x, y, fontBold) {
  const textWidth = text.length * 5.2 + 16;
  page.drawRectangle({
    x,
    y: y - 3,
    width: textWidth,
    height: 18,
    color: ACCENT_BG,
    borderColor: ORANGE,
    borderWidth: 0.75,
  });

  page.drawText(cleanWinAnsi(text), {
    x: x + 8,
    y: y + 2,
    size: 7.5,
    font: fontBold,
    color: ORANGE,
  });

  return textWidth;
}

// Helper for standard page headers
function drawPageHeader(page, divisionLabel, title, fontRegular, fontBold, logoMark) {
  const { width, height } = page.getSize();

  // Top accent line
  page.drawRectangle({
    x: 0,
    y: height - 5,
    width,
    height: 5,
    color: ORANGE,
  });

  const topY = height - 42;

  if (logoMark) {
    const markW = 28;
    const markH = (logoMark.height / logoMark.width) * markW;
    page.drawImage(logoMark, {
      x: 48,
      y: topY - 2,
      width: markW,
      height: markH,
    });

    page.drawText("JYOT ENTERPRISE", {
      x: 82,
      y: topY + 4,
      size: 10,
      font: fontBold,
      color: DARK,
    });

    page.drawText(divisionLabel.toUpperCase(), {
      x: 82,
      y: topY - 6,
      size: 6.5,
      font: fontBold,
      color: ORANGE,
    });
  }

  page.drawText(title, {
    x: width - 48 - (title.length * 5.0),
    y: topY - 1,
    size: 8.5,
    font: fontRegular,
    color: MUTED,
  });

  page.drawLine({
    start: { x: 48, y: height - 54 },
    end: { x: width - 48, y: height - 54 },
    thickness: 0.75,
    color: BORDER,
  });
}

// Helper for standard page footers
function drawPageFooter(page, divisionLabel, pageNum, totalPages, fontRegular, fontBold) {
  const { width } = page.getSize();
  const y = 30;

  page.drawLine({
    start: { x: 48, y: y + 16 },
    end: { x: width - 48, y: y + 16 },
    thickness: 0.75,
    color: BORDER,
  });

  page.drawText(`Jyot Enterprise  *  ${divisionLabel}  *  Confidential & Official`, {
    x: 48,
    y: y + 2,
    size: 7.2,
    font: fontRegular,
    color: MUTED,
  });

  page.drawText("Contact: +91 95374 30101  *  +91 77780 08999", {
    x: 270,
    y: y + 2,
    size: 7.2,
    font: fontRegular,
    color: MUTED,
  });

  const pageStr = `Page ${pageNum} of ${totalPages}`;
  page.drawText(pageStr, {
    x: width - 48 - (pageStr.length * 4.8),
    y: y + 2,
    size: 7.8,
    font: fontBold,
    color: DARK,
  });
}

// Helper for drawing wrapped text blocks
function drawTextBlock(page, text, x, y, maxWidth, font, size, color, lineHeight = size * 1.35) {
  const sanitized = cleanWinAnsi(text);
  const words = sanitized.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && n > 0) {
      page.drawText(line.trim(), { x, y: curY, size, font, color });
      line = words[n] + ' ';
      curY -= lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    page.drawText(line.trim(), { x, y: curY, size, font, color });
    curY -= lineHeight;
  }
  return curY;
}

// Helper to draw checklist items with vector checkbox
function drawChecklistItem(page, title, desc, x, y, width, fontRegular, fontBold) {
  // Checkbox square
  page.drawRectangle({
    x,
    y: y - 1,
    width: 12,
    height: 12,
    borderColor: ORANGE,
    borderWidth: 1.2,
    color: WHITE,
  });

  page.drawText(cleanWinAnsi(title), {
    x: x + 20,
    y: y + 1,
    size: 9.5,
    font: fontBold,
    color: DARK,
  });

  if (desc) {
    return drawTextBlock(page, desc, x + 20, y - 13, width - 20, fontRegular, 8.2, MUTED, 11) - 6;
  }
  return y - 18;
}

// Helper to draw clean cards
function drawContentCard(page, title, points, x, y, width, fontRegular, fontBold) {
  const cardH = 34 + (points.length * 15);
  page.drawRectangle({
    x,
    y: y - cardH,
    width,
    height: cardH,
    color: LIGHT_BG,
    borderColor: BORDER,
    borderWidth: 0.8,
  });

  page.drawRectangle({
    x,
    y: y - 24,
    width,
    height: 24,
    color: ACCENT_BG,
  });

  page.drawText(cleanWinAnsi(title), {
    x: x + 12,
    y: y - 16,
    size: 9.5,
    font: fontBold,
    color: DARK,
  });

  let curY = y - 38;
  for (const pt of points) {
    page.drawRectangle({
      x: x + 14,
      y: curY + 2,
      width: 4,
      height: 4,
      color: ORANGE,
    });
    page.drawText(cleanWinAnsi(pt), {
      x: x + 24,
      y: curY,
      size: 8.5,
      font: fontRegular,
      color: DARK,
    });
    curY -= 15;
  }

  return y - cardH - 12;
}

async function generateDocument(docDef) {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Embed logo images
  let logoImg = null;
  let logoMark = null;

  const logoPath = path.join(process.cwd(), 'public/brand/logo-transparent.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      logoImg = await doc.embedPng(logoBytes);
    } catch (e) {
      console.warn("Logo embedding skipped:", e.message);
    }
  }

  const markPath = path.join(process.cwd(), 'public/brand/logo-mark.png');
  if (fs.existsSync(markPath)) {
    try {
      const markBytes = fs.readFileSync(markPath);
      logoMark = await doc.embedPng(markBytes);
    } catch (e) {
      console.warn("Mark embedding skipped:", e.message);
    }
  }

  // Determine cover page highlights and content pages
  let heroPoints = [];
  let contentPages = [];

  if (docDef.isBrochure) {
    heroPoints = (docDef.pages[0] && docDef.pages[0].heroPoints) || [];
    contentPages = docDef.pages.slice(1);
  } else {
    // Checklists, process guides, and FAQs
    heroPoints = docDef.pages.map((p, idx) => ({
      title: (p.heading || p.pageTitle || `Section 0${idx + 1}`).replace(/^\d+\s*[—-]\s*/, '').trim(),
      desc: p.subheading || (p.sections && p.sections[0] ? p.sections[0].title : "Comprehensive institutional guidelines.")
    })).slice(0, 4);
    contentPages = docDef.pages;
  }

  const totalPages = 1 + contentPages.length;

  // ==========================================
  // PAGE 1 — COVER (EXACT IMAGE 2 FORMAT)
  // ==========================================
  {
    const page = doc.addPage([595.28, 841.89]);
    const origDrawText = page.drawText.bind(page);
    page.drawText = (text, options) => origDrawText(cleanWinAnsi(text), options);
    const { width, height } = page.getSize();

    // Top Orange Brand Accent Bar (12px)
    page.drawRectangle({
      x: 0,
      y: height - 12,
      width,
      height: 12,
      color: ORANGE,
    });

    // Elegant full-height side accent stripe (4px)
    page.drawRectangle({
      x: 48,
      y: 0,
      width: 4,
      height: height - 12,
      color: ORANGE,
    });

    // Top Logo Banner (large 210px)
    if (logoImg) {
      const logoW = 210;
      const logoH = (logoImg.height / logoImg.width) * logoW;
      page.drawImage(logoImg, {
        x: 68,
        y: height - 125,
        width: logoW,
        height: logoH,
      });
    }

    // Desk Sub-Header
    const deskLabel = docDef.deskLabel || (docDef.divisionLabel.toUpperCase() + " PRACTICE");
    page.drawText(cleanWinAnsi(deskLabel), {
      x: 70,
      y: height - 155,
      size: 11,
      font: fontBold,
      color: ORANGE,
    });

    // Two-Tone Title
    let title1 = docDef.coverTitle1;
    let title2 = docDef.coverTitle2;

    if (!title1 || !title2) {
      if (docDef.title.includes("—")) {
        const parts = docDef.title.split("—").map(s => s.trim());
        title1 = parts[0].replace(/^Jyot\s+/i, '');
        title2 = parts[1];
      } else if (docDef.title.includes("Checklist")) {
        title1 = docDef.title.replace(/Checklist$/i, '').trim();
        title2 = "Checklist";
      } else if (docDef.title.includes("Guide")) {
        title1 = docDef.title.replace(/Guide$/i, '').trim();
        title2 = "Process Guide";
      } else {
        title1 = docDef.title;
        title2 = docDef.divisionLabel;
      }
    }

    const t1Size = title1.length > 22 ? 32 : 38;
    const t2Size = title2.length > 24 ? 28 : (title2.length > 18 ? 32 : 38);

    page.drawText(cleanWinAnsi(title1), {
      x: 70,
      y: height - 215,
      size: t1Size,
      font: fontBold,
      color: DARK,
    });

    page.drawText(cleanWinAnsi(title2), {
      x: 70,
      y: height - 262,
      size: t2Size,
      font: fontBold,
      color: ORANGE,
    });

    // Horizontal Accent Line
    page.drawLine({
      start: { x: 70, y: height - 285 },
      end: { x: width - 48, y: height - 285 },
      thickness: 1.5,
      color: BORDER,
    });

    // Subtitle in stylized box with left 4px orange bar
    page.drawRectangle({
      x: 70,
      y: height - 370,
      width: width - 118,
      height: 68,
      color: LIGHT_BG,
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: 70,
      y: height - 370,
      width: 4,
      height: 68,
      color: ORANGE,
    });

    const calloutTag = docDef.calloutTag || "EXECUTIVE PRACTICE MANDATES & ADVISORY FOCUS";
    page.drawText(cleanWinAnsi(calloutTag), {
      x: 88,
      y: height - 324,
      size: 7.5,
      font: fontBold,
      color: MUTED,
    });

    drawTextBlock(page, `"${docDef.summary}"`, 88, height - 344, width - 142, fontBold, 11, DARK, 14);

    // Core Highlights Box
    const sectionHeader = docDef.coreHeading || "CORE PRACTICE AREAS INCLUDED IN THIS BROCHURE";
    page.drawText(cleanWinAnsi(sectionHeader), {
      x: 70,
      y: height - 410,
      size: 8.5,
      font: fontBold,
      color: DARK,
    });

    let pillY = height - 440;
    for (const p of heroPoints.slice(0, 4)) {
      page.drawRectangle({
        x: 70,
        y: pillY - 14,
        width: width - 118,
        height: 38,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 1,
      });

      // Orange bullet badge
      page.drawRectangle({
        x: 82,
        y: pillY + 4,
        width: 6,
        height: 6,
        color: ORANGE,
      });

      page.drawText(cleanWinAnsi(p.title), {
        x: 96,
        y: pillY + 3,
        size: 9.5,
        font: fontBold,
        color: DARK,
        maxWidth: 165,
      });

      page.drawText(cleanWinAnsi(p.desc), {
        x: 235,
        y: pillY + 3,
        size: 8.2,
        font: fontRegular,
        color: MUTED,
        maxWidth: width - 235 - 55,
      });

      pillY -= 46;
    }

    // Bottom Contact Box (EXACT IMAGE 2: LIGHT_BG, BORDER, NO BLACK BOX!)
    const boxY = 48;
    page.drawRectangle({
      x: 70,
      y: boxY,
      width: width - 118,
      height: 90,
      color: LIGHT_BG,
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawText("DIRECT INQUIRY DESK", {
      x: 88,
      y: boxY + 68,
      size: 8,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("Phone:  +91 95374 30101   |   +91 77780 08999", {
      x: 88,
      y: boxY + 48,
      size: 10,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Email:  jyotenterpriseofficial@gmail.com", {
      x: 88,
      y: boxY + 30,
      size: 9.5,
      font: fontRegular,
      color: DARK,
    });

    page.drawText("Official Document  *  Confidential  *  Gandhinagar & Ahmedabad Offices", {
      x: 88,
      y: boxY + 12,
      size: 7.5,
      font: fontRegular,
      color: MUTED,
    });
  }

  // ==========================================
  // CONTENT PAGES (PAGES 2..N)
  // ==========================================
  for (let cIdx = 0; cIdx < contentPages.length; cIdx++) {
    const pageData = contentPages[cIdx];
    const pageNum = cIdx + 2;
    const page = doc.addPage([595.28, 841.89]);
    const origDrawText = page.drawText.bind(page);
    page.drawText = (text, options) => origDrawText(cleanWinAnsi(text), options);
    const { width, height } = page.getSize();

    drawPageHeader(page, docDef.divisionLabel, pageData.pageTitle || docDef.title, fontRegular, fontBold, logoMark);

    let curY = height - 85;

    drawCategoryPill(page, docDef.divisionLabel.toUpperCase() + " PRACTICE", 48, curY, fontBold);
    curY -= 28;

    if (pageData.heading) {
      page.drawText(cleanWinAnsi(pageData.heading), {
        x: 48,
        y: curY,
        size: 18,
        font: fontBold,
        color: DARK,
      });
      curY -= 20;
    }

    if (pageData.subheading) {
      curY = drawTextBlock(page, pageData.subheading, 48, curY, width - 96, fontRegular, 9.5, MUTED, 14) - 10;
    }

    if (pageData.sections) {
      for (const sec of pageData.sections) {
        if (sec.type === 'cards') {
          curY = drawContentCard(page, sec.title, sec.items, 48, curY, width - 96, fontRegular, fontBold);
        } else if (sec.type === 'checklist') {
          page.drawText(cleanWinAnsi(sec.title), { x: 48, y: curY, size: 11, font: fontBold, color: ORANGE });
          curY -= 16;
          for (const item of sec.items) {
            curY = drawChecklistItem(page, item.title, item.desc, 48, curY, width - 96, fontRegular, fontBold);
          }
          curY -= 8;
        } else if (sec.type === 'faqs') {
          for (const f of sec.items) {
            page.drawRectangle({
              x: 48,
              y: curY - 56,
              width: width - 96,
              height: 56,
              color: LIGHT_BG,
              borderColor: BORDER,
              borderWidth: 0.8,
            });
            // Left orange accent
            page.drawRectangle({
              x: 48,
              y: curY - 56,
              width: 3.5,
              height: 56,
              color: ORANGE,
            });
            page.drawText(cleanWinAnsi(`Q: ${f.q}`), { x: 60, y: curY - 18, size: 9.5, font: fontBold, color: DARK });
            drawTextBlock(page, `A: ${f.a}`, 60, curY - 32, width - 120, fontRegular, 8.5, MUTED, 11.5);
            curY -= 68;
          }
        }
      }
    }

    drawPageFooter(page, docDef.divisionLabel, pageNum, totalPages, fontRegular, fontBold);
  }

  const pdfBytes = await doc.save();

  // Save to filenames
  for (const fn of docDef.filenames) {
    const fullPath = path.join(OUT_DIR, fn);
    fs.writeFileSync(fullPath, pdfBytes);
    console.log(`Saved: ${fullPath} (${Math.round(pdfBytes.length / 1024)} KB)`);
  }
}

// -------------------------------------------------------------------------------------------------
// Document Definitions for Financial, Legal, and Engineering
// -------------------------------------------------------------------------------------------------

const DOCUMENTS = [
  // 1. Financial Brochure (8 pages)
  {
    divisionLabel: "Financial Advisory",
    title: "Jyot Financial Services — Capability Brochure",
    summary: "Comprehensive credit advisory, retail & business financing, structured capital, and debt syndication tailored for Indian business owners and salaried professionals.",
    isBrochure: true,
    filenames: [
      "Jyot-Enterprise-Financial-Services-Capability-Brochure.pdf",
      "financial-brochure.pdf"
    ],
    pages: [
      {
        heroPoints: [
          { title: "Retail & Mortgage Lending", desc: "Home loans (₹25 L – ₹5 Cr), Loan against property, Balance transfers, and Top-up facilities." },
          { title: "MSME & Working Capital Lines", desc: "Unsecured business loans (₹10 L – ₹15 Cr), CC/OD limits, Invoice discounting, and Machinery finance." },
          { title: "Project & Structured Finance", desc: "Greenfield and brownfield term loans, real estate builder funding, and structured debt mandates exceeding ₹5 Cr." },
        ]
      },
      {
        pageTitle: "Credit & Financing Practice",
        heading: "01 — Retail & Commercial Credit Advisory",
        subheading: "Bridging borrowers with 40+ leading public, private banks and NBFCs across Gujarat and Western India.",
        sections: [
          {
            type: 'cards',
            title: "Housing & Secured Credit Facilities",
            items: [
              "Home Purchase & Self-Construction Loans (₹25 L – ₹5 Cr) with leading PSU & Private lenders",
              "Loan Against Residential / Commercial Property (LAP) up to 70% market valuation",
              "Strategic Balance Transfer with Rate Reduction and substantial Top-up capital",
              "Specialized NRI Home Loans with doorstep documentation and POA liaison"
            ]
          },
          {
            type: 'cards',
            title: "Commercial & Business Capital",
            items: [
              "Unsecured Business Growth Loans (₹10 L – ₹1.5 Cr) disbursed within 3 to 7 working days",
              "Cash Credit (CC) & Overdraft (OD) limits structured against primary & collateral securities",
              "Equipment & Industrial Machinery Finance with moratorium alignment",
              "CGTMSE Covered loans for qualified manufacturing and service enterprises"
            ]
          }
        ]
      },
      {
        pageTitle: "Large Mandates & Terms",
        heading: "02 — Structured Capital & Typical Mandates",
        subheading: "High-conviction credit underwriting that matches project cash flows with optimal lender appetite.",
        sections: [
          {
            type: 'cards',
            title: "Ticket Sizes & Lending Spectrum",
            items: [
              "Retail Mortgages: ₹25 Lakhs to ₹5 Crores (Tenures up to 30 years)",
              "MSME Working Capital: ₹20 Lakhs to ₹15 Crores (Annual review & renewal advisory)",
              "Industrial & Project Finance: ₹5 Crores to ₹100 Crores+ (Multi-bank syndication)",
              "Lease Rental Discounting (LRD): ₹2 Crores to ₹50 Crores against tier-1 corporate leases"
            ]
          },
          {
            type: 'cards',
            title: "Commercial Engagement Terms",
            items: [
              "Success-linked advisory fee payable upon formal disbursement",
              "Zero advisory fees charged if loan file is not sanctioned by shortlisted institution",
              "Transparent fee structure communicated upfront without hidden retainer surprises",
              "End-to-end liaison with credit managers, empanelled valuers, and legal advocates"
            ]
          }
        ]
      },
      {
        pageTitle: "Underwriting Standards",
        heading: "03 — The Jyot Credit Preparation Process",
        subheading: "How we eliminate file rejections before submitting your application to lender credit desks.",
        sections: [
          {
            type: 'cards',
            title: "Pre-Login Eligibility & FOIR Calibration",
            items: [
              "Granular Fixed Obligation to Income Ratio (FOIR) calculation across all active obligations",
              "Banking cash-flow analysis (inflows, debit bounce review, average monthly balance analysis)",
              "GST vs Banking turnover reconciliation to establish actual operating margins",
              "CIBIL & Experian credit report audit to resolve legacy reporting errors before file submission"
            ]
          },
          {
            type: 'cards',
            title: "Collateral & Legal Clearance Protocol",
            items: [
              "Pre-vetting of 30-year property title chain and search reports",
              "Town planning (TP/FP) zoning, Raja Chithi, NA orders, and approved construction plans",
              "Resolution of hereditary, partnership, or co-owner consent requirements upfront",
              "Empanelled technical valuer access facilitation to maximize sanction loan-to-value"
            ]
          }
        ]
      },
      {
        pageTitle: "Lender Relationships",
        heading: "04 — Institutional Ecosystem & Lending Partners",
        subheading: "Access to the entire spectrum of Indian institutional debt capital.",
        sections: [
          {
            type: 'cards',
            title: "Public Sector Banks (PSUs)",
            items: [
              "State Bank of India (SBI) — Benchmark MCLR and repo-linked lending rates",
              "Bank of Baroda (BOB) — Strong regional MSME and industrial credit appetite",
              "Punjab National Bank & Canara Bank — Structured working capital and term loans",
              "Union Bank of India — Competitive pricing for CGTMSE manufacturing units"
            ]
          },
          {
            type: 'cards',
            title: "Private Banks & Top-Tier NBFCs",
            items: [
              "HDFC Bank & ICICI Bank — Rapid turnaround mortgage and digital business credit",
              "Axis Bank & Kotak Mahindra Bank — Custom working capital & trade finance",
              "Bajaj Housing Finance & Tata Capital — Flexible surrogate underwriting programs",
              "Piramal, Godrej Capital & Aditya Birla Finance — High-ticket LAP and promoter loans"
            ]
          }
        ]
      },
      {
        pageTitle: "Turnaround & SLAs",
        heading: "05 — Turnaround Timelines & Service Levels",
        subheading: "Definite milestones to ensure your business capital arrives precisely when required.",
        sections: [
          {
            type: 'cards',
            title: "Milestone Timelines",
            items: [
              "Day 01–02: Eligibility diagnosis, lender matching, and dossier curation",
              "Day 03–04: Formal file login and credit manager interaction",
              "Day 05–08: Legal title search & physical technical valuation inspection",
              "Day 09–12: Credit committee appraisal and formal Sanction Letter issuance",
              "Day 13–15: Loan agreement signing, MODT registration, and net disbursement"
            ]
          }
        ]
      },
      {
        pageTitle: "Risk & Wealth Advisory",
        heading: "06 — Corporate Risk & Asset Protection",
        subheading: "Ensuring personal and business assets remain insulated across business cycles.",
        sections: [
          {
            type: 'cards',
            title: "Enterprise Protection Instruments",
            items: [
              "Keyman Insurance policies to safeguard business continuity upon founder loss",
              "Group Health & Workmen Compensation insurance compliant with statutory norms",
              "Fire, Burglary & Industrial All Risk (IAR) policies protecting factory plant & machinery",
              "Directors & Officers (D&O) liability coverage for expanding corporate boards"
            ]
          }
        ]
      },
      {
        pageTitle: "Engagement & Advisory Desk",
        heading: "07 — Initiating Your Credit Mandate",
        subheading: "Schedule a confidential consultation with our Senior Credit Advisory Desk.",
        sections: [
          {
            type: 'cards',
            title: "Next Steps",
            items: [
              "Step 1: Share 12 months bank statements & latest 3 years ITR for rapid evaluation",
              "Step 2: Receive confidential Lender Comparison Matrix within 24 business hours",
              "Step 3: Agree on target sanction amount, rate structure, and disbursement schedule",
              "Step 4: Dedicated credit relationship manager handles all bank inquiries until fund payout"
            ]
          }
        ]
      }
    ]
  },

  // 2. Financial Checklist (4 pages)
  {
    divisionLabel: "Financial Advisory",
    title: "Loan Document Checklist",
    summary: "Comprehensive checklist covering every mandatory KYC, income, banking, and legal property document required by Indian banks and NBFCs.",
    isBrochure: false,
    filenames: [
      "Jyot-Enterprise-Loan-Document-Checklist.pdf",
      "financial-checklist.pdf"
    ],
    pages: [
      {
        pageTitle: "Borrower KYC & Salaried Profiles",
        heading: "01 — Borrower Identification & Salaried Profile",
        subheading: "Standard document set required for primary applicants and co-applicants.",
        sections: [
          {
            type: 'checklist',
            title: "Mandatory KYC (All Applicants)",
            items: [
              { title: "Permanent Account Number (PAN) Card", desc: "Clear color copy of PAN card. Must match Income Tax records." },
              { title: "Aadhaar Card with Linked Mobile Number", desc: "Both sides of Aadhaar card. Required for digital e-sign and CKYC verification." },
              { title: "Passport / Voter ID / Driving Licence", desc: "Secondary official photo identity proof required for institutional compliance." },
              { title: "Current Address Proof (Utility Bill / Rent Agreement)", desc: "Electricity bill, piped gas bill, or registered rent agreement under 60 days old." },
              { title: "Passport Size Color Photographs (3 per applicant)", desc: "Recent formal photograph with white background for physical loan dossier." }
            ]
          },
          {
            type: 'checklist',
            title: "Salaried Professional Financials",
            items: [
              { title: "Latest 3 Months Detailed Salary Slips", desc: "Showing gross earnings, statutory PF/ESI deductions, and net credit." },
              { title: "Latest 6 Months Salary Account Bank Statements", desc: "Complete computer-generated statement showing salary credits." },
              { title: "Latest 2 Years Form 16 (Part A & Part B)", desc: "Issued by employer with verified TDS certificate numbers." },
              { title: "Official Employee ID Card & Appointment Letter", desc: "Confirming current designation, joining date, and corporate email verification." }
            ]
          }
        ]
      },
      {
        pageTitle: "Self-Employed & MSME Financials",
        heading: "02 — Self-Employed Individuals & Business Entities",
        subheading: "Required for Sole Proprietorships, Partnerships, LLPs, and Private Limited Companies.",
        sections: [
          {
            type: 'checklist',
            title: "Business Financial Records (Last 3 Financial Years)",
            items: [
              { title: "3 Years ITR with Computation of Income", desc: "Complete ITR acknowledgment receipts and detailed computation schedules." },
              { title: "Audited Balance Sheets & Profit/Loss Accounts", desc: "Audited financial statements including 3CA/3CB/3CD audit reports from CA." },
              { title: "Tax Audit Reports & Schedules", desc: "Mandatory for turnover exceeding statutory thresholds under Income Tax Act." },
              { title: "Latest 12 Months Current Account Bank Statements", desc: "All operative current accounts, CC/OD limit accounts, and director accounts." },
              { title: "12 Months GST Returns (GSTR-3B & GSTR-1)", desc: "Used by lender credit underwriting to reconcile declared business sales turnover." }
            ]
          },
          {
            type: 'checklist',
            title: "Business Constitution Documents",
            items: [
              { title: "GST Registration Certificate (All 3 pages)", desc: "Showing primary place of business and authorized signatory details." },
              { title: "Udyam / MSME Registration Certificate", desc: "Classified as Micro, Small or Medium enterprise." },
              { title: "Partnership Deed / Certificate of Incorporation & MOA/AOA", desc: "Certified true copies of organizational founding documents." },
              { title: "Latest Shareholding Pattern & Board Resolution", desc: "Authorized director authorization for borrowing and mortgaging assets." }
            ]
          }
        ]
      },
      {
        pageTitle: "Property Collateral Documents",
        heading: "03 — Secured Collateral & Property Title Deeds",
        subheading: "Mandatory for Home Loans, Loan Against Property (LAP), and Term Loans against Real Estate.",
        sections: [
          {
            type: 'checklist',
            title: "Primary Title Deeds & Chain Documents",
            items: [
              { title: "Registered Sale Deed / Conveyance Deed / Gift Deed", desc: "Original title deed registered with Sub-Registrar of Assurances." },
              { title: "Complete Prior Title Chain (30 Years Minimum)", desc: "All previous linked sale deeds tracing unbroken chain of ownership." },
              { title: "Index II (Suchi Number 2) Copies", desc: "Official Sub-Registrar record reflecting deed registration." },
              { title: "Latest City Survey Extract / 7/12 & 8-A Extracts", desc: "Revenue department ownership extract issued within last 3 months." }
            ]
          },
          {
            type: 'checklist',
            title: "Sanctions, Permissions & Local Tax Receipts",
            items: [
              { title: "Approved Building Construction Plan & Raja Chithi", desc: "Approved layout plan issued by Municipal Corporation (AMC/AUDA/etc.)." },
              { title: "Non-Agricultural (NA) Permission Order", desc: "Revenue collector order certifying land converted for commercial/residential use." },
              { title: "Latest Property Tax Receipt & Assessment Bill", desc: "Paid municipal property tax receipt showing zero outstanding dues." },
              { title: "Society Share Certificate & No Objection Certificate (NOC)", desc: "From housing/commercial society certifying mortgage permission." }
            ]
          }
        ]
      },
      {
        pageTitle: "Existing Debt & Final Sign-Off",
        heading: "04 — Existing Loan Obligation Schedule & Verification",
        subheading: "Full disclosure required to prevent credit appraisal delays and sanction cuts.",
        sections: [
          {
            type: 'checklist',
            title: "Active Loan Repayment Schedules",
            items: [
              { title: "Sanction Letters of All Active Loans", desc: "Car loans, personal loans, business overdrafts, and previous mortgages." },
              { title: "Latest 12 Months Loan Account Statements (SOA)", desc: "Confirming zero EMI bounces, late penalties, or defaults." },
              { title: "Foreclosure / Outstanding Principal Letters (For BT)", desc: "From existing lender if transferring loan balance to new institution." },
              { title: "List of Documents (LOD) Held by Existing Financier", desc: "Certified statement from existing bank listing original deeds in their custody." }
            ]
          },
          {
            type: 'cards',
            title: "Ready to Submit Your File?",
            items: [
              "Compile original documents for in-person verification by our credit desk",
              "Submit self-attested photocopies or high-resolution PDF scans",
              "Our Senior Credit Advisor will review your dossier within 4 business hours",
              "Direct Credit Helpline: +91 95374 30101  *  Email: jyotenterpriseofficial@gmail.com"
            ]
          }
        ]
      }
    ]
  },

  // 3. Financial Process Guide (6 pages)
  {
    divisionLabel: "Financial Advisory",
    title: "From Enquiry to Disbursement",
    summary: "The definitive 9-step guide to corporate and retail loan execution: how loan files move, credit appraisal standards, and how to avoid costly delays.",
    isBrochure: false,
    filenames: [
      "Jyot-Enterprise-Loan-Enquiry-to-Disbursement-Guide.pdf",
      "financial-process-guide.pdf"
    ],
    pages: [
      {
        pageTitle: "The 9-Stage Credit Workflow",
        heading: "01 — The 9 Stages of a Loan Mandate",
        subheading: "A transparent overview of how Jyot Enterprise navigates institutional banking credit desks.",
        sections: [
          {
            type: 'cards',
            title: "Stages 01–03: Discovery to File Login",
            items: [
              "01. Eligibility Diagnostic — Calculating income eligibility, FOIR limits, and DSCR metrics",
              "02. Institution Shortlist — Selecting top 3 lenders based on ROI, tenure, and appraisal flexibility",
              "03. Formal Dossier Login — Digital submission of complete KYC, financial, and title records"
            ]
          },
          {
            type: 'cards',
            title: "Stages 04–06: Credit Appraisal to Sanction",
            items: [
              "04. Credit Desk Appraisal — Underwriter personal discussion, banking cash flow verification",
              "05. Technical & Legal Clearance — Physical site inspection and Sub-Registrar 30-year title search",
              "06. Formal Sanction Letter — Term sheet issue outlining approved amount, ROI, and conditions"
            ]
          },
          {
            type: 'cards',
            title: "Stages 07–09: Documentation to Fund Release",
            items: [
              "07. Acceptance & Stamp Duty — Signing bank agreements and franking loan contracts",
              "08. Mortgage Creation (MODT) — Registering title deposit with the Sub-Registrar and CERSAI",
              "09. Disbursement Payout — Funds credited directly to beneficiary account or seller escrow"
            ]
          }
        ]
      },
      {
        pageTitle: "Eligibility Diagnostics & Login",
        heading: "02 — Stage 1 to 3: Preparing the Winning Application",
        subheading: "Why proper file preparation is the single biggest factor in obtaining favorable terms.",
        sections: [
          {
            type: 'cards',
            title: "Underwriting Metric Calibration",
            items: [
              "FOIR Optimization: Structuring co-applicants to absorb liabilities and elevate eligibility",
              "DSCR Balancing: Ensuring commercial debt service coverage ratio remains comfortably above 1.35x",
              "Banking Conduct Optimization: Explaining internal account transfers to present genuine turnover",
              "Lender Profile Alignment: Routing files to banks with specific sectoral appetite for your business"
            ]
          }
        ]
      },
      {
        pageTitle: "Credit Appraisal & Verification",
        heading: "03 — Stage 4: Navigating the Credit Manager Appraisal",
        subheading: "Handling the Personal Discussion (PD) and banking queries with confidence.",
        sections: [
          {
            type: 'cards',
            title: "Key Elements of the Credit Appraisal",
            items: [
              "Personal Discussion (PD) Preparation: Aligning business projections with past revenue records",
              "Business Workplace Verification: Physical visit by lender risk intelligence agents",
              "Supplier & Customer Reference Checks: Discrete trade inquiries for large commercial limits",
              "Credit Committee Notes: Addressing credit policy exceptions with robust mitigating factors"
            ]
          }
        ]
      },
      {
        pageTitle: "Legal Search & Technical Valuation",
        heading: "04 — Stage 5: Technical Valuation & Legal Title Clearance",
        subheading: "Protecting your property title and securing the highest possible valuation.",
        sections: [
          {
            type: 'cards',
            title: "Valuation & Legal Protocols",
            items: [
              "Empanelled Valuer Inspection: Evaluating land value, construction quality, and realizable market price",
              "Sub-Registrar 30-Year Search: Confirming nil prior encumbrances, litigation, or attachment orders",
              "Local Body Approvals Check: Verifying Raja Chithi, completion certificates, and building bye-laws",
              "Title Clearance Certificate: Empanelled bank advocate issuing unconditional legal opinion"
            ]
          }
        ]
      },
      {
        pageTitle: "Sanction, MODT & Disbursement",
        heading: "05 — Stage 6 to 9: From Sanction to Money in Account",
        subheading: "Executing loan agreements, registering mortgages, and disbursing funds without friction.",
        sections: [
          {
            type: 'cards',
            title: "Closing & Payout Execution",
            items: [
              "Sanction Condition Clearance: Fulfilling pre-disbursement conditions (PDCs, ECS mandates, margins)",
              "Loan Agreement Franking: Ensuring correct Gujarat state stamp duty adjudication",
              "Memorandum of Deposit of Title Deeds (MODT): Formal registration at Sub-Registrar office",
              "CERSAI Portal Registration: Central registry filing certifying valid institutional charge",
              "Disbursement Check / RTGS Release: Payout into builder, seller, or company working capital account"
            ]
          }
        ]
      },
      {
        pageTitle: "Common Bottlenecks & Remedies",
        heading: "06 — Eliminating Common Delays",
        subheading: "The five pitfalls that derail loan files and how Jyot Enterprise prevents them.",
        sections: [
          {
            type: 'cards',
            title: "Top 5 Delays & Jyot Preventative Actions",
            items: [
              "Incomplete KYC / Name Mismatches -> Resolved during initial file hygiene check on Day 1",
              "Unregistered Prior Title Deeds -> Traced via Sub-Registrar certified copies before login",
              "Undisclosed Existing EMIs -> CIBIL reconciled upfront to ensure accurate eligibility calculations",
              "Debit Bounces on Current Accounts -> Mitigated with formal CA clarification letters",
              "Valuation Shortfall -> Coordinated with dual empanelled valuers to establish fair market value"
            ]
          },
          {
            type: 'cards',
            title: "Direct Advisory Contact",
            items: [
              "Credit Lead Desk: +91 95374 30101  *  +91 77780 08999",
              "Official Email: jyotenterpriseofficial@gmail.com",
              "Headquarters: Ahmedabad, Gujarat, India"
            ]
          }
        ]
      }
    ]
  },

  // 4. Financial FAQs (5 pages)
  {
    divisionLabel: "Financial Advisory",
    title: "Financial Services — FAQs",
    summary: "Clear, transparent answers to the 20 most frequent questions on FOIR, interest rate structures, CIBIL repair, balance transfers, and processing fees.",
    isBrochure: false,
    filenames: [
      "Jyot-Enterprise-Financial-Services-FAQs.pdf",
      "financial-faq-sheet.pdf"
    ],
    pages: [
      {
        pageTitle: "Eligibility & CIBIL FAQs",
        heading: "01 — Borrower Eligibility & Credit Scores",
        subheading: "Essential questions on credit scores, income calculation, and co-applicant rules.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "What minimum CIBIL score is required for a commercial or home loan?", a: "Most prime lenders prefer a score of 750 or above. However, Jyot Enterprise works with specialized NBFCs and private banks capable of approving files with scores between 650 and 749 by presenting mitigating cash flow evidence." },
              { q: "How is FOIR (Fixed Obligation to Income Ratio) calculated?", a: "FOIR measures the percentage of your monthly income committed to loan repayments. Salaried borrowers can generally commit up to 50-65% of net pay, while commercial business borrowers can stretch up to 70% based on proven operating margins." },
              { q: "Does adding a co-applicant increase our sanctioned loan amount?", a: "Yes. Adding an earning spouse, parent, or adult child combines household cash flows, substantially raising FOIR headroom and qualifying your file for a significantly higher loan sanction." },
              { q: "Can non-salaried income (rental yields, dividends) be counted for eligibility?", a: "Yes, provided these incomes are reflected in official bank statements and declared across at least 2 consecutive Income Tax Returns with verifiable rental agreements." }
            ]
          }
        ]
      },
      {
        pageTitle: "Interest Rates & Balance Transfers",
        heading: "02 — Interest Rates, Floating vs Fixed & Balance Transfers",
        subheading: "How interest benchmarks work and when refinancing makes financial sense.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "When is a floating rate loan better than a fixed rate loan?", a: "In the Indian banking system, repo-linked floating rate loans are almost always superior for home and commercial mortgages because RBI mandates zero foreclosure charges for individuals, allowing fee-free prepayments anytime." },
              { q: "How do I determine if a Home Loan Balance Transfer (BT) is worthwhile?", a: "A balance transfer makes compelling sense if your existing lender is charging 0.50% or more above prevailing market rates, provided your remaining tenure exceeds 5 years. Savings on EMIs easily outweigh transfer costs." },
              { q: "What is an EBLR / RLLR benchmark?", a: "External Benchmark Lending Rate (EBLR) is linked directly to the RBI Repo Rate plus an institutional spread. When RBI alters rates, banks are legally bound to pass rate cuts directly to borrowers." },
              { q: "Can I transfer my loan if I have existing EMI bounces?", a: "Minor bounces in the past can be overcome if your last 6 months show spotless repayment and sufficient liquidity in your operating account." }
            ]
          }
        ]
      },
      {
        pageTitle: "Costs & Processing Fees",
        heading: "03 — Fees, Taxes, Valuations & Foreclosure Charges",
        subheading: "Transparent breakdown of all administrative charges across loan files.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "What are standard bank processing fees?", a: "Processing fees range from 0.25% to 1.00% of the sanctioned amount for home loans, and 1.00% to 2.00% for unsecured commercial credit lines, subject to institutional caps and seasonal promotions." },
              { q: "Are there legal and valuation charges?", a: "Yes. Lenders charge actual advocate title search fees (₹3,000 – ₹7,500) and physical technical valuation fees (₹2,500 – ₹5,000) directly to empanelled professionals." },
              { q: "What is MODT stamp duty in Gujarat?", a: "Under the Gujarat Stamp Act, Memorandum of Deposit of Title Deeds (MODT) incurs stamp duty typically calculated at 0.25% to 0.50% of the borrowing amount, capped by statutory limits." },
              { q: "Can a lender charge prepayment penalty on business loans?", a: "For individual borrowers and sole proprietors, floating rate loans carry zero prepayment penalty. For private limited companies, NBFCs may levy 2% to 4% foreclosure charges as per sanction terms." }
            ]
          }
        ]
      },
      {
        pageTitle: "Business & MSME Credit FAQs",
        heading: "04 — Business Capital, Overdrafts & Project Loans",
        subheading: "Managing working capital limits, term loans, and machinery finance.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "What is the difference between a Term Loan and a Cash Credit (CC) limit?", a: "A Term Loan is disbursed in full for capital investments (machinery, factory construction) with fixed monthly principal repayments. Cash Credit is a revolving working capital facility where interest is charged only on the daily utilized balance." },
              { q: "Can our business obtain unsecured credit without collateral?", a: "Yes. Profitable businesses operating for over 3 years with annual turnover exceeding ₹50 Lakhs can secure collateral-free business loans between ₹10 Lakhs and ₹1.5 Crores based purely on GST and banking cash flow." },
              { q: "What is the CGTMSE guarantee scheme?", a: "Credit Guarantee Fund Trust for Micro and Small Enterprises provides institutional collateral guarantees up to ₹5 Crores for eligible manufacturing and service enterprises without third-party collateral." },
              { q: "How frequently must working capital limits be renewed?", a: "Bank CC/OD limits are renewed annually upon submission of updated audited financials, provisional numbers, and stock & debtor statements." }
            ]
          }
        ]
      },
      {
        pageTitle: "Jyot Engagement & Service Terms",
        heading: "05 — How Jyot Enterprise Works With You",
        subheading: "Our commercial terms, success fees, and commitment to transparency.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "How is Jyot Enterprise compensated for loan advisory?", a: "We operate primarily on a success-linked advisory model upon successful disbursement. If your loan file cannot be sanctioned or disbursed, no success fee is charged." },
              { q: "Do you represent one specific bank or lender?", a: "No. Jyot Enterprise is an independent credit advisory firm empanelled with over 40 public banks, private banks, housing finance companies (HFCs), and NBFCs. We act exclusively in your commercial interest." },
              { q: "How do I get my loan file evaluated today?", a: "Reach out to our credit desk directly. We will provide an initial eligibility diagnosis within 4 business hours upon reviewing your basic income and banking records." },
              { q: "Direct Helpline:", a: "Phone: +91 95374 30101  *  +91 77780 08999  *  Email: jyotenterpriseofficial@gmail.com" }
            ]
          }
        ]
      }
    ]
  },

  // 5. Legal Brochure (8 pages)
  {
    divisionLabel: "Legal & Corporate Advisory",
    title: "Jyot Legal & Compliance — Capability Brochure",
    summary: "Corporate registrations, statutory secretarial compliance, GST litigation, contract drafting, and Intellectual Property protection as a standing corporate desk.",
    isBrochure: true,
    filenames: [
      "Jyot-Enterprise-Legal-Compliance-Capability-Brochure.pdf",
      "legal-brochure.pdf"
    ],
    pages: [
      {
        heroPoints: [
          { title: "Entity Incorporation & Structuring", desc: "Private Limited, LLP, Section 8, OPC, and Joint Venture entity formation with full MCA compliance." },
          { title: "Standing Secretarial Compliance", desc: "Annual MCA filings, Director KYC, Board resolutions, Statutory Registers, and AGM/EGM management." },
          { title: "Intellectual Property & Contracts", desc: "Trademark, Copyright, Master Service Agreements (MSA), NDAs, Employment contracts, and IP protection." },
        ]
      },
      {
        pageTitle: "Corporate Practice Overview",
        heading: "01 — Corporate Incorporation & Structuring",
        subheading: "End-to-end founding advisory ensuring your business structure matches long-term capital goals.",
        sections: [
          {
            type: 'cards',
            title: "Entity Incorporation Mandates",
            items: [
              "Private Limited Company Incorporation (SPICe+ Part A & B) with MCA name clearance",
              "Limited Liability Partnership (LLP) registration with tailored LLP agreements",
              "Wholly Owned Subsidiary (WOS) & Liaison Office formation for foreign parent entities",
              "Conversion of Sole Proprietorships and Partnerships into corporate entities"
            ]
          },
          {
            type: 'cards',
            title: "Essential Registrations & Licences",
            items: [
              "GST Registration (Normal, Composition, ISD) across multi-state operations",
              "Import Export Code (IEC) from Directorate General of Foreign Trade (DGFT)",
              "Udyam MSME Certificate and Startup India DPIIT recognition",
              "Professional Tax (PTRC/PTEC), Shop & Establishment (Gumasta) licences"
            ]
          }
        ]
      },
      {
        pageTitle: "Statutory & Secretarial",
        heading: "02 — Standing Corporate Secretarial Desk",
        subheading: "Proactive compliance calendar management to safeguard corporate standing and prevent hefty penalties.",
        sections: [
          {
            type: 'cards',
            title: "Annual MCA Statutory Filings",
            items: [
              "Form AOC-4 — Filing of annual balance sheets, P&L accounts, and Director reports",
              "Form MGT-7 / MGT-7A — Annual return covering shareholder capital and meeting details",
              "DIR-3 KYC — Annual biometric and OTP verification for all active Directors",
              "Form DPT-3 — Annual return of deposits and non-deposit receipts"
            ]
          },
          {
            type: 'cards',
            title: "Secretarial Records & Governance",
            items: [
              "Drafting Notice, Agenda, and Minutes for Quarterly Board Meetings and AGMs",
              "Maintenance of Statutory Registers (Members, Debentures, Directors, Charges)",
              "Filing Form CHG-1 & CHG-4 for creation and satisfaction of bank charges",
              "Appointment, resignation, and regularization of Directors (DIR-11 / DIR-12)"
            ]
          }
        ]
      },
      {
        pageTitle: "Taxation & Regulatory Filings",
        heading: "03 — GST, Direct Tax & Regulatory Desk",
        subheading: "Managing monthly and quarterly tax obligations with rigorous audit defense.",
        sections: [
          {
            type: 'cards',
            title: "Indirect Tax (GST) Operations",
            items: [
              "Monthly GSTR-1 outward supply statements and GSTR-3B monthly tax computation",
              "Annual GST Reconciliation (GSTR-9) and CA Audit reconciliation (GSTR-9C)",
              "Resolution of GST Input Tax Credit (ITC) mismatches against supplier GSTR-2B",
              "Drafting replies to GST department scrutiny notices (ASMT-10) and summons"
            ]
          },
          {
            type: 'cards',
            title: "Income Tax & Withholding Tax (TDS)",
            items: [
              "Quarterly TDS Returns (Form 24Q, 26Q, 27Q) and Form 16/16A generation",
              "Advance tax calculations and Corporate Income Tax return filing (ITR-6)",
              "Facilitation of statutory and tax audits with empanelled Chartered Accountants",
              "Faceless assessment representations and rectification filings under Section 154"
            ]
          }
        ]
      },
      {
        pageTitle: "Contracts & Agreements",
        heading: "04 — Commercial Contracts & Legal Drafting",
        subheading: "Ironclad commercial contracts protecting revenue, IP ownership, and operational assets.",
        sections: [
          {
            type: 'cards',
            title: "Core Commercial Agreements",
            items: [
              "Master Service Agreements (MSA) & Statements of Work (SOW) for tech & consulting",
              "Bilateral Non-Disclosure Agreements (NDA) and Intellectual Property Assignment Deeds",
              "Vendor, Supplier & Procurement contracts with strict SLA & penalty terms",
              "Commercial Lease & License agreements for corporate offices and factory warehouses"
            ]
          },
          {
            type: 'cards',
            title: "Employment & Human Resources",
            items: [
              "Executive Employment Agreements with robust non-compete & non-solicit clauses",
              "Consultant Agreements & Independent Contractor Contracts (retaining IP ownership)",
              "Corporate Employee Handbooks and POSH (Prevention of Sexual Harassment) policies",
              "Employee Stock Option Plans (ESOP) scheme structuring and grant letters"
            ]
          }
        ]
      },
      {
        pageTitle: "Intellectual Property Desk",
        heading: "05 — Trademark, Copyright & IP Defense",
        subheading: "Registering and defending your enterprise brand assets in India and internationally.",
        sections: [
          {
            type: 'cards',
            title: "Trademark Services",
            items: [
              "Comprehensive NICE classification search across wordmarks, logos, and taglines",
              "Online Trademark Application filing (Form TM-A) with Priority Claims",
              "Drafting legal counter-statements to Trademark Examination Reports (Section 9/11)",
              "Attending virtual hearings before the Trademark Registrar and Opposition defense"
            ]
          },
          {
            type: 'cards',
            title: "Copyright & Patent Support",
            items: [
              "Software source code, UI design, and literary work copyright registrations",
              "Drafting cease-and-desist notices against infringing third parties",
              "Patent prior-art search coordination and provisional specification drafting"
            ]
          }
        ]
      },
      {
        pageTitle: "Dispute & Notice Advisory",
        heading: "06 — Pre-Litigation Advisory & Dispute Management",
        subheading: "Resolving commercial friction and outstanding dues through structured legal notices.",
        sections: [
          {
            type: 'cards',
            title: "Legal Notice & Recovery Practice",
            items: [
              "Issuance of Demand Notices under Section 138 of Negotiable Instruments Act (Cheque Bounce)",
              "Notices under Insolvency & Bankruptcy Code (IBC Section 8 Demand Notice)",
              "Breach of contract, supplier default, and unpaid invoice legal representations",
              "Commercial arbitration facilitation and out-of-court settlement negotiation"
            ]
          }
        ]
      },
      {
        pageTitle: "Engagement & Advisory Desk",
        heading: "07 — Corporate Retainership & Engagement",
        subheading: "Engage Jyot Enterprise as your standing outside General Counsel and Corporate Desk.",
        sections: [
          {
            type: 'cards',
            title: "Retainership Benefits",
            items: [
              "Dedicated Company Secretary (CS) and Legal Counsel assigned to your account",
              "Predictable monthly retainership eliminating unpredictable hourly law firm billing",
              "Proactive compliance calendar with automated deadline alerts 30 days in advance",
              "Direct Advisory Desk: +91 95374 30101  *  Email: jyotenterpriseofficial@gmail.com"
            ]
          }
        ]
      }
    ]
  },

  // 6. Legal Checklist (4 pages)
  {
    divisionLabel: "Legal & Corporate Advisory",
    title: "Annual Compliance Checklist",
    summary: "Complete statutory compliance calendar covering all monthly, quarterly, and annual obligations for Private Limited Companies and LLPs in India.",
    isBrochure: false,
    filenames: [
      "Jyot-Enterprise-Annual-Compliance-Checklist.pdf",
      "legal-checklist.pdf"
    ],
    pages: [
      {
        pageTitle: "Monthly & Quarterly Obligations",
        heading: "01 — Monthly & Quarterly Recurring Filings",
        subheading: "Recurring statutory tax and payroll deadlines that attract immediate interest upon delay.",
        sections: [
          {
            type: 'checklist',
            title: "Monthly Statutory Obligations",
            items: [
              { title: "TDS / TCS Deposit (By 7th of every month)", desc: "Payment of tax deducted at source under Section 194C, 194J, 194I, etc., via Challan ITNS 281." },
              { title: "GSTR-1 Outward Supplies (By 11th of every month)", desc: "Monthly filing of sales invoices, credit notes, and zero-rated supplies on the GST portal." },
              { title: "GSTR-3B Monthly Return (By 20th of every month)", desc: "Self-assessment summary return with input tax credit settlement and net tax payment." },
              { title: "Provident Fund (EPF) & ESI Remittance (By 15th)", desc: "Electronic Challan cum Return (ECR) filing and deposit of statutory employee contributions." }
            ]
          },
          {
            type: 'checklist',
            title: "Quarterly Statutory Deadlines",
            items: [
              { title: "Advance Tax Installments (15th Jun, 15th Sep, 15th Dec, 15th Mar)", desc: "Payment of estimated corporate income tax liability to avoid interest under Section 234B/C." },
              { title: "Quarterly TDS Returns (Form 24Q & 26Q) (31st Jul, 31st Oct, 31st Jan, 31st May)", desc: "Detailed quarterly return of TDS deducted on salaries and contractor/professional payments." },
              { title: "Conduct of Quarterly Board Meeting", desc: "Mandatory minimum 4 board meetings per year with no more than 120 days gap between two meetings." }
            ]
          }
        ]
      },
      {
        pageTitle: "Annual MCA & Company Law Filings",
        heading: "02 — Annual MCA Company Law Obligations",
        subheading: "Mandatory annual secretarial filings under the Companies Act 2013.",
        sections: [
          {
            type: 'checklist',
            title: "Ministry of Corporate Affairs (MCA) Filings",
            items: [
              { title: "Form DPT-3 — Return of Deposits (Due by 30th June)", desc: "Mandatory disclosure of all outstanding loans, advances, and non-deposit receipts." },
              { title: "DIR-3 KYC — Director Verification (Due by 30th September)", desc: "Annual web-based or biometric KYC for all DIN holders to avoid ₹5,000 penalty per director." },
              { title: "Conduct of Annual General Meeting (AGM) (By 30th September)", desc: "Convening statutory AGM of shareholders to approve audited financial statements and auditor tenure." },
              { title: "Form AOC-4 — Financial Statements (Within 30 days of AGM)", desc: "Filing audited balance sheet, profit and loss statement, auditor report, and director report." },
              { title: "Form MGT-7 / MGT-7A — Annual Return (Within 60 days of AGM)", desc: "Filing comprehensive annual return detailing shareholding pattern and management changes." }
            ]
          }
        ]
      },
      {
        pageTitle: "Audits & Corporate Income Tax",
        heading: "03 — Statutory Audits & Income Tax Deadlines",
        subheading: "Mandatory audit engagements and corporate tax returns.",
        sections: [
          {
            type: 'checklist',
            title: "Audits & Tax Returns",
            items: [
              { title: "Statutory Financial Audit by Chartered Accountant", desc: "Independent audit of accounts resulting in signed Balance Sheet and Auditor's Report." },
              { title: "Tax Audit Report in Form 3CA/3CB and 3CD (By 30th September)", desc: "Mandatory tax audit for companies with business turnover exceeding statutory limits." },
              { title: "Corporate Income Tax Return (ITR-6) (By 31st October)", desc: "Filing digital tax return with verified digital signature certificates (DSC)." },
              { title: "Annual GST Return (GSTR-9 & GSTR-9C) (By 31st December)", desc: "Annual consolidation of all monthly returns and reconciliation with audited annual financials." }
            ]
          }
        ]
      },
      {
        pageTitle: "LLP Obligations & Governance",
        heading: "04 — Limited Liability Partnership (LLP) Specifics",
        subheading: "Annual compliance for LLPs registered under the LLP Act 2008.",
        sections: [
          {
            type: 'checklist',
            title: "LLP Statutory Deadlines",
            items: [
              { title: "Form 11 — Annual Return of LLP (Due by 30th May)", desc: "Annual summary of partners, capital contributions, and operational status." },
              { title: "Form 8 — Statement of Account & Solvency (Due by 30th October)", desc: "Declaration of financial solvency and asset/liability statement signed by designated partners." },
              { title: "LLP Income Tax Return (ITR-5) (Due by 31st July / 31st October)", desc: "Filing income tax return based on whether statutory tax audit is applicable." }
            ]
          },
          {
            type: 'cards',
            title: "Need Proactive Compliance Management?",
            items: [
              "Jyot Enterprise manages end-to-end filings with guaranteed zero-penalty compliance",
              "Automated tracking of MCA, GST, Income Tax, and Trademark renewals",
              "Direct Advisory Desk: +91 95374 30101  *  Email: jyotenterpriseofficial@gmail.com"
            ]
          }
        ]
      }
    ]
  },

  // 7. Legal Process Guide (5 pages)
  {
    divisionLabel: "Legal & Corporate Advisory",
    title: "Registration to Steady State",
    summary: "The definitive 90-day blueprint for new corporate entities in India: from initial incorporation and bank setup to GST activation and standing compliance handover.",
    isBrochure: false,
    filenames: [
      "Jyot-Enterprise-Company-Registration-to-Steady-State-Guide.pdf",
      "legal-process-guide.pdf"
    ],
    pages: [
      {
        pageTitle: "The 90-Day Incorporation Roadmap",
        heading: "01 — The First 90 Days of a New Corporate Entity",
        subheading: "A step-by-step timeline taking a business from concept to fully compliant operational entity.",
        sections: [
          {
            type: 'cards',
            title: "Phase 1: Days 01–15 — Founding & Entity Formation",
            items: [
              "Day 01–03: Name reservation (RUN application) & Digital Signature Certificate (DSC) issuance",
              "Day 04–08: SPICe+ Part A & B filing with MCA, drafted MOA & AOA, and Director declarations",
              "Day 09–15: Certificate of Incorporation (COI) issued with PAN, TAN, EPFO, and ESIC registrations"
            ]
          },
          {
            type: 'cards',
            title: "Phase 2: Days 16–45 — Banking, Capital & Tax Registrations",
            items: [
              "Day 16–25: Corporate Current Account opening and initial equity share capital deposit",
              "Day 26–35: Form INC-20A filing (Declaration of Commencement of Business) with MCA",
              "Day 36–45: GST Registration approval, Professional Tax (PTEC/PTRC), and MSME registration"
            ]
          },
          {
            type: 'cards',
            title: "Phase 3: Days 46–90 — Governance, Contracts & Steady State",
            items: [
              "Day 46–60: First Board Meeting, appointment of first Statutory Auditor (Form ADT-1)",
              "Day 61–75: Share certificate issuance, stamp duty payment, and Trademark filing",
              "Day 76–90: Master Service Agreements, employee contracts, and Compliance Calendar handover"
            ]
          }
        ]
      },
      {
        pageTitle: "Days 01–15: Entity Formation",
        heading: "02 — Days 01–15: Incorporation & Founding Legalities",
        subheading: "Key steps to ensure clean incorporation without name rejections or MCA resubmissions.",
        sections: [
          {
            type: 'cards',
            title: "Critical Founding Milestones",
            items: [
              "Unique Name Reservation: Ensuring proposed name conforms to MCA Rule 8 guidelines",
              "Class-3 Digital Signature Certificates (DSC) with encryption tokens for all directors",
              "Drafting Bespoke Articles of Association (AOA) with customized voting and share transfer rights",
              "PAN & TAN automatic allotment alongside Certificate of Incorporation"
            ]
          }
        ]
      },
      {
        pageTitle: "Days 16–45: Banking & Capital",
        heading: "03 — Days 16–45: Current Account & Commencement of Business",
        subheading: "Overcoming bank KYC protocols and legally declaring business commencement.",
        sections: [
          {
            type: 'cards',
            title: "Banking & INC-20A Execution",
            items: [
              "Corporate Current Account Setup: Resolution, COI, MOA/AOA, and director physical verification",
              "Subscription Money Inflow: Shareholders depositing agreed paid-up capital from personal accounts",
              "Form INC-20A Mandatory Filing: Must be filed within 180 days to avoid MCA disqualification",
              "Physical Registered Office Setup: Displaying name board, CIN, and registered address at premises"
            ]
          }
        ]
      },
      {
        pageTitle: "Days 46–90: Governance & Contracts",
        heading: "04 — Days 46–90: Auditor Appointment & Brand Defense",
        subheading: "Setting up corporate governance and locking down intellectual property.",
        sections: [
          {
            type: 'cards',
            title: "Governance & Protection Checklist",
            items: [
              "Form ADT-1 Filing: Formally appointing first Statutory Auditor within 30 days of incorporation",
              "Share Certificate Adjudication: Issuing physical certificates and paying state stamp duty",
              "Trademark Filing (Form TM-A): Protecting brand name, logo, and product identity across key classes",
              "Customer & Vendor Contracts: Standardizing MSAs, NDAs, and contractor agreements"
            ]
          }
        ]
      },
      {
        pageTitle: "Handover to Steady State",
        heading: "05 — The Steady State Operating Model",
        subheading: "Transitioning to standing monthly and quarterly compliance management.",
        sections: [
          {
            type: 'cards',
            title: "Steady-State Retainership Deliverables",
            items: [
              "Automated compliance calendar covering all GST, TDS, advance tax, and MCA deadlines",
              "Quarterly Board Meeting secretarial pack and maintenance of statutory registers",
              "Annual filings (AOC-4, MGT-7, DIR-3 KYC) managed seamlessly without management disruption",
              "Direct Advisory Desk: +91 95374 30101  *  Email: jyotenterpriseofficial@gmail.com"
            ]
          }
        ]
      }
    ]
  },

  // 8. Legal FAQs (4 pages)
  {
    divisionLabel: "Legal & Corporate Advisory",
    title: "Legal & Compliance — FAQs",
    summary: "Clear answers to critical corporate legal questions: MCA late filing penalties, Private Limited vs LLP conversion, director liabilities, and trademark protection timelines.",
    isBrochure: false,
    filenames: [
      "Jyot-Enterprise-Legal-Compliance-FAQs.pdf",
      "legal-faq-sheet.pdf"
    ],
    pages: [
      {
        pageTitle: "Entity Selection & Formation",
        heading: "01 — Entity Selection & Founding FAQs",
        subheading: "Choosing the appropriate legal structure for your enterprise.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "What is the difference between a Private Limited Company and an LLP?", a: "A Private Limited Company has equity shares, can raise venture capital, and is governed by strict board and statutory audit requirements. An LLP is ideal for professional and service firms requiring limited liability without burdensome meeting and audit requirements (until turnover exceeds ₹40 Lakhs)." },
              { q: "How long does it take to incorporate a Private Limited Company?", a: "With all director KYC and registered office documents verified, incorporation via SPICe+ typically takes 5 to 8 working days from MCA submission." },
              { q: "Can a foreign national or NRI be a director in an Indian company?", a: "Yes. At least one director must be a resident of India (present for at least 182 days). Foreign nationals must have notarized and apostilled passport copies." },
              { q: "Can an existing Partnership firm or LLP convert into a Private Limited Company?", a: "Yes. Under Chapter XXI of the Companies Act 2013, an existing partnership or LLP can convert into a Private Limited company while preserving existing contracts, licenses, and operational track record." }
            ]
          }
        ]
      },
      {
        pageTitle: "Compliance, Penalties & Filings",
        heading: "02 — MCA Compliance & Late Filing Penalties",
        subheading: "Understanding the financial and legal consequences of delayed filings.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "What are the penalties for delayed MCA filings (AOC-4 / MGT-7)?", a: "Under Section 403 of the Companies Act, delayed filing of financial statements or annual returns attracts a severe daily additional fee of ₹100 per day per form with no upper ceiling." },
              { q: "What happens if DIR-3 KYC is not filed before the deadline?", a: "If a director fails to file DIR-3 KYC by 30th September, their Director Identification Number (DIN) is deactivated with status 'Deactivated due to non-filing of DIR-3 KYC', attracting a mandatory ₹5,000 penalty to reactivate." },
              { q: "What is Form INC-20A and what happens if it is missed?", a: "Form INC-20A declares that subscribers have deposited their equity capital. Failing to file within 180 days from incorporation attracts a penalty of ₹50,000 on the company and ₹1,000 per day on directors, risking company strike-off." },
              { q: "Can a dormant or inactive company simply be abandoned?", a: "No. Abandoning an entity without formal strike-off (Form STK-2) or obtaining Dormant status leads to director disqualification for 5 years and severe accumulated penalties." }
            ]
          }
        ]
      },
      {
        pageTitle: "Intellectual Property FAQs",
        heading: "03 — Trademark, Copyright & Brand Protection",
        subheading: "Navigating brand registrations, objections, and timelines.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "How long does it take to obtain a registered trademark (R symbol)?", a: "From filing Form TM-A, examination occurs within 1 to 3 months. If no objections or oppositions arise, the registration certificate is typically granted in 6 to 12 months. You may use the TM symbol immediately upon filing." },
              { q: "What happens if a trademark receives an examination objection under Section 9 or 11?", a: "Section 9 objections allege lack of distinctiveness; Section 11 alleges similarity to an existing mark. A formal legal reply must be filed within 30 days citing judicial precedents and evidence of continuous prior commercial use." },
              { q: "How long is a trademark valid in India?", a: "A registered trademark is valid for 10 years from the application date and can be renewed indefinitely every 10 years by filing Form TM-R." },
              { q: "Who owns the intellectual property created by our software developers or contractors?", a: "By default under Indian law, independent contractors own the copyright unless an explicit written agreement contains an unequivocal Intellectual Property Assignment clause. Jyot Enterprise drafts ironclad IP assignments." }
            ]
          }
        ]
      },
      {
        pageTitle: "Contracts & Dispute Advisory",
        heading: "04 — Commercial Contracts & Standing Retainership",
        subheading: "Protecting commercial interests and working with Jyot Enterprise.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "What key clauses must every Master Service Agreement (MSA) contain?", a: "Every robust MSA must include explicit scope definitions, milestone acceptance criteria, limitation of liability, IP ownership transfer upon full payment, non-solicitation, governing law, and dispute arbitration clauses." },
              { q: "What legal recourse exists for unpaid commercial invoices?", a: "Recourse includes issuing formal legal demand notices, filing under the MSME Samadhaan portal for delayed payments with statutory compound interest, Section 138 NI Act notices for bounced cheques, and IBC Section 8 notices." },
              { q: "What does the Jyot Corporate Retainership include?", a: "Our retainership includes standing Company Secretary oversight, all mandatory annual MCA filings, board resolutions, routine contract reviews, compliance alerts, and direct legal helpline access." },
              { q: "Direct Advisory Helpline:", a: "Phone: +91 95374 30101  *  +91 77780 08999  *  Email: jyotenterpriseofficial@gmail.com" }
            ]
          }
        ]
      }
    ]
  },

  // 9. Engineering Brochure (9 pages)
  {
    divisionLabel: "Industrial Engineering & Automation",
    title: "Jyot Engineering — Capability Brochure",
    summary: "Precision mechanical design, CAD/CAE simulation, Special Purpose Machine (SPM) building, PLC industrial automation, and rapid prototyping for Indian manufacturing enterprises.",
    isBrochure: true,
    filenames: [
      "Jyot-Enterprise-Engineering-Services-Capability-Brochure.pdf",
      "engineering-brochure.pdf"
    ],
    pages: [
      {
        heroPoints: [
          { title: "Special Purpose Machines (SPM)", desc: "Turnkey assembly, testing, inspection, and packaging machinery designed for target cycle times." },
          { title: "Industrial Automation & Robotics", desc: "PLC programming (Siemens, Allen-Bradley, Mitsubishi), SCADA, servo control, and vision inspection." },
          { title: "CAD, FEA & Reverse Engineering", desc: "SolidWorks/Inventor 3D modeling, FEA structural stress analysis, DFM reviews, and 3D laser scanning." },
        ]
      },
      {
        pageTitle: "Core Practice Overview",
        heading: "01 — Turnkey Special Purpose Machines (SPM)",
        subheading: "Custom automated machine design and manufacturing to replace manual bottlenecks and multiply throughput.",
        sections: [
          {
            type: 'cards',
            title: "Custom Machine Building Categories",
            items: [
              "Automated Component Assembly Stations with pneumatic, hydraulic, and servo integration",
              "End-of-Line (EOL) Testing Rigs: Leak testing, pressure endurance, torque verification",
              "Multi-Station Rotary Indexing Table Machines for high-speed repetitive manufacturing",
              "Automated Part Feeding & Sorting Systems (bowl feeders, linear tracks, pick-and-place units)"
            ]
          },
          {
            type: 'cards',
            title: "Manufacturing Standards & Components",
            items: [
              "Pneumatics & Actuators: Festo, SMC, and Janatics precision valves and cylinders",
              "Linear Motion: THK and Hiwin guideways, ground ballscrews, and heavy-duty slide units",
              "Sensors & Safety: Keyence, Sick, and Omron optical sensors, light curtains, and interlocks",
              "Structural Frames: Precision laser-cut mild steel, stress-relieved weldments, and anodized aluminum extrusions"
            ]
          }
        ]
      },
      {
        pageTitle: "Industrial Automation & Control",
        heading: "02 — Industrial Automation, PLC & SCADA",
        subheading: "Complete electrical architecture, control panel fabrication, and intelligent automation.",
        sections: [
          {
            type: 'cards',
            title: "Control System Capabilities",
            items: [
              "PLC Programming: Siemens S7-1200/1500, Allen-Bradley Micro800/CompactLogix, Mitsubishi, Delta",
              "HMI Interface Design: User-friendly touchscreen interfaces with recipe management and diagnostics",
              "Servo & Motion Synchronization: Multi-axis servo drives for precise positioning and tension control",
              "SCADA & Factory Data Acquisition: Real-time OEE tracking, downtime analytics, and MES integration"
            ]
          },
          {
            type: 'cards',
            title: "Quality & Machine Vision Integration",
            items: [
              "Industrial Machine Vision Systems (Cognex, Keyence) for sub-millimeter defect detection",
              "Automated 100% Dimensional Inspection Stations eliminating human inspection errors",
              "Barcoding, 2D DataMatrix marking, and traceability integration directly into production databases"
            ]
          }
        ]
      },
      {
        pageTitle: "CAD Modeling & CAE Analysis",
        heading: "03 — Precision Mechanical CAD & Simulation",
        subheading: "Robust digital engineering eliminating design flaws before metal is cut.",
        sections: [
          {
            type: 'cards',
            title: "Design & Modeling Practice",
            items: [
              "Parametric 3D CAD Modeling in SolidWorks, Autodesk Inventor, and Siemens NX",
              "Detailed Manufacturing Drawings: ASME Y14.5 compliant Geometric Dimensioning & Tolerancing (GD&T)",
              "Design for Manufacturing & Assembly (DFM/DFA) reviews to minimize CNC machining costs",
              "BOM Generation: Complete indented bills of materials with material and standard hardware specs"
            ]
          },
          {
            type: 'cards',
            title: "Finite Element Analysis (FEA)",
            items: [
              "Static Structural Stress Analysis: Verifying safety factors under maximum operational loads",
              "Dynamic & Vibration Analysis: Eliminating harmonic resonance and premature fatigue failures",
              "Thermal Simulation: Evaluating heat dissipation in industrial enclosures and drive mechanisms",
              "Topology Optimization: Strategic lightweighting of structural castings and machined brackets"
            ]
          }
        ]
      },
      {
        pageTitle: "Reverse Engineering & Prototyping",
        heading: "04 — Reverse Engineering & Rapid Prototyping",
        subheading: "Digitizing obsolete imported components and producing functional prototypes rapidly.",
        sections: [
          {
            type: 'cards',
            title: "Reverse Engineering Workflow",
            items: [
              "High-Precision 3D Optical & Laser Scanning of legacy tooling and worn machine parts",
              "CAD Reconstruction: Converting point clouds and mesh data into parametric STEP/IGES models",
              "Material Composition & Hardness Testing: Identifying exact alloy metallurgy and heat treatment",
              "Domestic Import Substitution: Engineering domestic alternatives to expensive OEM spare parts"
            ]
          },
          {
            type: 'cards',
            title: "Rapid Prototyping & Verification",
            items: [
              "Industrial 3D Printing (FDM, SLA, SLS) in nylon, ABS, and polycarbonate for form/fit checks",
              "Rapid CNC Machining: 3-axis and 5-axis prototype fabrication in steel, aluminum, and brass",
              "Functional Sheet Metal Prototypes: Laser cutting, CNC bending, and rapid TIG/MIG welding"
            ]
          }
        ]
      },
      {
        pageTitle: "Manufacturing & Assembly",
        heading: "05 — Fabrication, In-House Assembly & Trials",
        subheading: "High-precision manufacturing infrastructure ensuring built-to-print perfection.",
        sections: [
          {
            type: 'cards',
            title: "Manufacturing Ecosystem",
            items: [
              "CNC Milling & Turning: High-precision machining centers delivering +/- 10 micron tolerances",
              "Precision Grinding: Surface grinding and cylindrical grinding for hardened spindle and slide surfaces",
              "Stress Relieving & Heat Treatment: Post-weld normalization, induction hardening, and nitriding",
              "Dedicated Clean Assembly Bay: Controlled mechanical and pneumatic assembly with calibrated torque tools"
            ]
          }
        ]
      },
      {
        pageTitle: "Factory Acceptance Testing (FAT)",
        heading: "06 — Testing, FAT, Site Commissioning & AMC",
        subheading: "Rigorous dry and wet trials before machine sign-off and factory shipment.",
        sections: [
          {
            type: 'cards',
            title: "Validation & Commissioning Protocol",
            items: [
              "Factory Acceptance Test (FAT): Continuous 8-hour uninterrupted dry and production component trials",
              "Cycle Time & CPK Verification: Establishing machine capability index (CPK > 1.67) on critical dimensions",
              "Site Installation & Commissioning: Doorstep machine levelling, utility hookup, and trial production",
              "Operator & Maintenance Training: Complete technical documentation, electrical schematics, and hands-on training"
            ]
          }
        ]
      },
      {
        pageTitle: "Spares & AMC Support",
        heading: "07 — Warranty, Spare Parts & Maintenance Contracts",
        subheading: "Standing technical support to guarantee zero unscheduled factory downtime.",
        sections: [
          {
            type: 'cards',
            title: "Standing Engineering Support",
            items: [
              "Comprehensive 12-Month Mechanical & Electrical Machine Warranty",
              "Guaranteed Spare Parts Availability: Recommended 2-year consumable spares pack supplied with delivery",
              "Annual Maintenance Contracts (AMC): Scheduled quarterly preventative audits and recalibration",
              "On-Site Breakdown Support: Rapid-response engineering technicians dispatched within 24 hours"
            ]
          }
        ]
      },
      {
        pageTitle: "Engagement & Quoting",
        heading: "08 — Commissioning Your Engineering Project",
        subheading: "How to engage Jyot Engineering for machine building and design mandates.",
        sections: [
          {
            type: 'cards',
            title: "Engagement Process",
            items: [
              "Step 1: Share component drawings (2D/3D), cycle time targets, and batch specifications",
              "Step 2: Joint concept brainstorm & DFM review with our Senior Machine Design Team",
              "Step 3: Receive 3D concept layout, detailed technical proposal, and commercial timeline",
              "Direct Engineering Desk: +91 95374 30101  *  Email: jyotenterpriseofficial@gmail.com"
            ]
          }
        ]
      }
    ]
  },

  // 10. Engineering Checklist (3 pages)
  {
    divisionLabel: "Industrial Engineering & Automation",
    title: "Engineering Enquiry Checklist",
    summary: "Essential technical parameters, drawing formats, tolerances, cycle time targets, and factory site constraints required to quote custom machinery accurately.",
    isBrochure: false,
    filenames: [
      "Jyot-Enterprise-Engineering-Enquiry-Checklist.pdf",
      "engineering-checklist.pdf"
    ],
    pages: [
      {
        pageTitle: "Part Specifications & Drawings",
        heading: "01 — Component Specifications & Drawings",
        subheading: "Technical inputs required to underwrite mechanical concept design.",
        sections: [
          {
            type: 'checklist',
            title: "Part Geometry & Files",
            items: [
              { title: "2D Engineering Drawings (PDF / DWG / DXF)", desc: "Showing complete dimensions, critical tolerances, surface finish, and GD&T callouts." },
              { title: "3D CAD Models (STEP / IGES / Parasolid / SolidWorks)", desc: "Native or neutral 3D model files showing complete component geometry." },
              { title: "Raw Material Specification & Hardness", desc: "Material grade (e.g. EN8, SS304, Delrin, ADC12 aluminum) and required heat treatment." },
              { title: "Sample Physical Components (10–20 pieces)", desc: "Mandatory for automated feeding bowl trials, gripper validation, and inspection tests." }
            ]
          },
          {
            type: 'checklist',
            title: "Critical Tolerance & Quality Criteria",
            items: [
              { title: "Identification of High-Precision Features", desc: "Bore concentricity, perpendicularity, surface roughness (Ra value), and flatness limits." },
              { title: "Inspection Protocol & Required CPK", desc: "Target Process Capability Index (e.g. CPK >= 1.33 or >= 1.67) on critical dimensions." }
            ]
          }
        ]
      },
      {
        pageTitle: "Operational Targets & Site Context",
        heading: "02 — Operational Output & Site Constraints",
        subheading: "Production capacity and utility inputs required to size machinery.",
        sections: [
          {
            type: 'checklist',
            title: "Throughput & Process Targets",
            items: [
              { title: "Target Cycle Time per Part (Seconds / Minutes)", desc: "Maximum allowable floor-to-floor cycle time to meet production volume." },
              { title: "Daily Production Volumes & Shift Pattern", desc: "Planned single-shift (8h), double-shift (16h), or continuous 3-shift operation." },
              { title: "Loading & Unloading Preference", desc: "Manual operator load/unload vs complete bowl-feeder / gantry / robotic automation." },
              { title: "Changeover & Tooling Flexibility", desc: "Whether the machine handles a single part or multiple variant part sizes with rapid changeover." }
            ]
          },
          {
            type: 'checklist',
            title: "Factory Site Utilities & Layout Constraints",
            items: [
              { title: "Available Floor Space & Ceiling Height", desc: "Maximum footprint envelope available on factory floor including maintenance clearance." },
              { title: "Electrical Power Availability", desc: "Available voltage (415V 3-phase / 230V 1-phase), frequency (50Hz), and connected load capacity." },
              { title: "Pneumatic Compressed Air Supply", desc: "Operating pressure (e.g. 6 to 7 bar) and CFM volume capacity at installation point." }
            ]
          }
        ]
      },
      {
        pageTitle: "Commercial & Safety Standards",
        heading: "03 — Preferred Component Makes & Safety Standards",
        subheading: "Specifying client-preferred electrical, pneumatic, and control standards.",
        sections: [
          {
            type: 'checklist',
            title: "Standard Component Make Preferences",
            items: [
              { title: "Preferred PLC & HMI Architecture", desc: "Siemens, Allen-Bradley, Mitsubishi, Delta, or Schneider Electric preference." },
              { title: "Preferred Pneumatics & Actuators", desc: "Festo, SMC, or Janatics standardized components." },
              { title: "Electrical Switchgear Standards", desc: "Schneider, Siemens, ABB, or L&T components inside control enclosure." },
              { title: "Machine Safety Compliances", desc: "CE mark compliance, Category 4 safety relays, light curtains, and emergency stop interlocks." }
            ]
          },
          {
            type: 'cards',
            title: "Submit Your Engineering Enquiry",
            items: [
              "Email drawings and enquiry checklist to: jyotenterpriseofficial@gmail.com",
              "Our Senior Mechanical & Automation team will respond with an initial DFM review within 24h",
              "Direct Engineering Desk: +91 95374 30101  *  +91 77780 08999"
            ]
          }
        ]
      }
    ]
  },

  // 11. Engineering Process Guide (6 pages)
  {
    divisionLabel: "Industrial Engineering & Automation",
    title: "Concept to Commissioning",
    summary: "The structured 6-stage engineering lifecycle: how custom SPM and automation mandates advance from preliminary concept and DFM review to shop-floor commissioning.",
    isBrochure: false,
    filenames: [
      "Jyot-Enterprise-Concept-to-Commissioning-Guide.pdf",
      "engineering-process-guide.pdf"
    ],
    pages: [
      {
        pageTitle: "The 6-Stage Engineering Lifecycle",
        heading: "01 — The 6 Stages from Concept to Commissioning",
        subheading: "How Jyot Enterprise manages industrial automation projects with engineering rigor.",
        sections: [
          {
            type: 'cards',
            title: "Stages 01–03: Design & Engineering Approval",
            items: [
              "01. Requirement Study & DFM Review — Analyzing component drawings, cycle time targets, and process feasibility",
              "02. Concept 3D Layout & Simulation — Presenting kinematic 3D layouts, cycle time charts, and commercial proposals",
              "03. Detailed Mechanical & Electrical Design — Generating manufacturing drawings, FEA analysis, BOMs, and electrical schematics"
            ]
          },
          {
            type: 'cards',
            title: "Stages 04–06: Build, Test & Factory Commissioning",
            items: [
              "04. Precision Machining & Fabrication — CNC machining, frame fabrication, stress relief, and surface finishing",
              "05. Assembly, Wiring & Factory Acceptance Trials (FAT) — Shop floor integration, PLC programming, and 8-hour continuous testing",
              "06. Site Installation, Commissioning & Handover — Delivery to customer plant, alignment, utility hookup, operator training, and final sign-off"
            ]
          }
        ]
      },
      {
        pageTitle: "Stage 01: Requirement Study & DFM",
        heading: "02 — Stage 1: Requirement Study & Design for Manufacturing",
        subheading: "Preventing costly engineering changes by resolving manufacturing hurdles upfront.",
        sections: [
          {
            type: 'cards',
            title: "Feasibility Assessment Activities",
            items: [
              "Component Geometric Feasibility: Reviewing 2D/3D drawings to identify impossible machining or clamping points",
              "Cycle Time Budget Breakdown: Slicing the target cycle time into discrete feeding, indexing, clamping, and processing seconds",
              "Process Risk Identification: Evaluating part burrs, dimensional variations, and material inconsistencies",
              "Formal Concept Brief Sign-off: Mutually agreed design parameters locking in technical scope"
            ]
          }
        ]
      },
      {
        pageTitle: "Stage 02 & 03: 3D Design & Simulation",
        heading: "03 — Stage 2 & 3: Detailed 3D Modeling, FEA & Electrical Design",
        subheading: "Digital prototyping and comprehensive manufacturing documentation.",
        sections: [
          {
            type: 'cards',
            title: "Detailed Engineering Deliverables",
            items: [
              "Full Assembly Parametric 3D Model: Complete machine assembly showing all moving mechanisms and stroke limits",
              "FEA Stress & Deflection Analysis: Verifying critical structural weldments, tooling arms, and bearing housings",
              "Electrical & Pneumatic Schematics: Complete EPLAN electrical panel diagrams, I/O lists, and pneumatic line circuits",
              "Indented Bill of Materials (BOM): Specifying material grades, hardened pins, bushings, and commercial buy-out parts"
            ]
          }
        ]
      },
      {
        pageTitle: "Stage 04: Machining & Fabrication",
        heading: "04 — Stage 4: Precision Manufacturing & Quality Control",
        subheading: "Transforming approved CAD blueprints into physical precision components.",
        sections: [
          {
            type: 'cards',
            title: "Fabrication & Machining Protocols",
            items: [
              "Laser Cutting & Certified Welding: Heavy-duty base frames fabricated from IS 2062 structural steel",
              "Post-Weld Normalization / Stress Relieving: Preventing structural warping and ensuring lifetime geometric stability",
              "CNC Milling on 3-Axis / 5-Axis Centers: Delivering critical mounting surfaces to +/- 0.010 mm tolerances",
              "Incoming Quality Inspection (IQC): Verifying all outsourced and in-house parts with calibrated CMM and height gauges"
            ]
          }
        ]
      },
      {
        pageTitle: "Stage 05: Assembly, Wiring & FAT",
        heading: "05 — Stage 5: Shop Floor Assembly & Factory Acceptance Trials",
        subheading: "Validating cycle time, repeatability, and machine safety under production conditions.",
        sections: [
          {
            type: 'cards',
            title: "Testing & Validation Standards",
            items: [
              "Mechanical Alignment & Sub-assembly: Meticulous fitting of linear guides, ballscrews, and rotary tables",
              "Control Panel Wiring: Clean wire ferruling, safety relay wiring, and neat cable track routing",
              "Dry Cycling & Program Debugging: Verifying sensor debounce, emergency stop safety circuits, and homing routines",
              "Client Factory Acceptance Test (FAT): Continuous test run on actual components achieving target CPK and cycle time"
            ]
          }
        ]
      },
      {
        pageTitle: "Stage 06: Installation & Handover",
        heading: "06 — Stage 6: Site Commissioning, Training & Steady State",
        subheading: "Seamless transition into full production with standing engineering support.",
        sections: [
          {
            type: 'cards',
            title: "Handover Deliverables",
            items: [
              "Customer Plant Rigging & Levelling: Precision anchoring and anti-vibration pad alignment",
              "Facility Utility Integration: Connecting pneumatic air header and 3-phase electrical drop",
              "Operator & Maintenance Team Training: Practical hands-on training for daily operation and troubleshooting",
              "Comprehensive Documentation Pack: Operating manuals, electrical schematics, PLC program backups, and spare parts catalog",
              "Direct Engineering Desk: +91 95374 30101  *  Email: jyotenterpriseofficial@gmail.com"
            ]
          }
        ]
      }
    ]
  },

  // 12. Engineering FAQs (4 pages)
  {
    divisionLabel: "Industrial Engineering & Automation",
    title: "Engineering — FAQs",
    summary: "Clear answers to the most common questions on SPM machine building: design IP ownership, warranty, spare parts turnaround, AMC coverage, and typical lead times.",
    isBrochure: false,
    filenames: [
      "Jyot-Enterprise-Engineering-FAQs.pdf",
      "engineering-faq-sheet.pdf"
    ],
    pages: [
      {
        pageTitle: "Design IP & Ownership FAQs",
        heading: "01 — Design IP Ownership & Technical Deliverables",
        subheading: "Understanding intellectual property ownership and source code handover.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "Who owns the design IP and 3D CAD models of the machine?", a: "Upon project completion and final payment, 100% full intellectual property ownership of the custom machine design is transferred directly to the client. Jyot Enterprise provides editable 3D CAD files (STEP/SolidWorks) and 2D manufacturing drawings." },
              { q: "Do you hand over the unlocked PLC and HMI source code?", a: "Yes. We deliver fully documented, unlocked PLC ladder logic / structured text and HMI project files. We do not lock our clients out with proprietary passwords or artificial software restrictions." },
              { q: "Can you sign a Non-Disclosure Agreement (NDA) before we share component drawings?", a: "Absolutely. We execute bilateral Non-Disclosure Agreements prior to receiving proprietary part drawings, maintaining strict confidentiality across our engineering design office." },
              { q: "What documentation is provided upon machine delivery?", a: "Deliverables include machine operating manuals, preventive maintenance schedules, pneumatic and electrical schematics, PLC source code backups, bought-out component data sheets, and a 2-year recommended spares list." }
            ]
          }
        ]
      },
      {
        pageTitle: "Lead Times & Project Milestones",
        heading: "02 — Lead Times, Project Tracking & Payment Terms",
        subheading: "Delivery schedules and transparent milestone execution.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "What is the typical lead time for a Special Purpose Machine (SPM)?", a: "Standard assembly or testing SPMs typically require 8 to 14 weeks from design sign-off to Factory Acceptance Testing (FAT). Highly complex multi-station rotary indexing machines may require 16 to 20 weeks." },
              { q: "How are engineering projects tracked during fabrication?", a: "Clients receive weekly project milestone reports with photographic and video updates. Key milestone checkpoints include 3D Design Freeze, In-House Machining Completion, Mechanical Integration, and FAT Demonstration." },
              { q: "What are the standard commercial payment milestones?", a: "Standard payment terms are structured across milestones: 30% advance on PO, 30% on 3D design freeze, 30% on successful Factory Acceptance Test (FAT) sign-off, and 10% on site installation and commissioning." },
              { q: "What if component drawings change during the build process?", a: "Minor tweaks are absorbed during design reviews. Major part geometry alterations post-machining are handled via a structured Engineering Change Request (ECR) documenting time and cost impacts." }
            ]
          }
        ]
      },
      {
        pageTitle: "Warranty & Spare Parts",
        heading: "03 — Machine Warranty & Spare Parts Availability",
        subheading: "Ensuring long-term operational uptime and reliable component replacement.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "What warranty is provided on custom machines?", a: "Jyot Enterprise provides a comprehensive 12-month warranty covering all fabricated parts, mechanical assemblies, and control integration against manufacturing defects, effective from site commissioning." },
              { q: "How are bought-out components (pneumatics, sensors, drives) warranted?", a: "Bought-out components from premier manufacturers (Festo, SMC, Siemens, Schneider) carry direct original manufacturer warranties, which we facilitate on your behalf." },
              { q: "Are replacement spare parts readily available?", a: "Yes. All standard wear parts (pneumatic seals, gripper fingers, slide bushings) are detailed with manufacturer part numbers in your manual. Critical custom machined spares can be manufactured and dispatched from our facility within 48 to 72 hours." },
              { q: "What happens if the machine encounters an unexpected breakdown?", a: "We offer immediate phone and remote diagnostic support via Ethernet/VPN. If an on-site technician is required, our service engineer is dispatched to Gujarat industrial zones within 24 hours." }
            ]
          }
        ]
      },
      {
        pageTitle: "AMC & Service Contracts",
        heading: "04 — Annual Maintenance Contracts (AMC) & Consultation",
        subheading: "Preventative servicing and getting started with Jyot Engineering.",
        sections: [
          {
            type: 'faqs',
            items: [
              { q: "Do you offer Annual Maintenance Contracts (AMC)?", a: "Yes. Following the 12-month warranty period, clients can opt for comprehensive or non-comprehensive AMC agreements covering quarterly preventive servicing, sensor recalibration, pneumatic leak checks, and software optimization." },
              { q: "Can you automate an existing manual machine or line?", a: "Yes. We frequently retrofit manual presses, packaging lines, and assembly jigs with servo positioning, PLC automation, and safety interlocks, significantly upgrading capacity at a fraction of new equipment cost." },
              { q: "How do we get an engineering quotation for our project?", a: "Email your component drawings (2D/3D), cycle time target, and batch requirements to jyotenterpriseofficial@gmail.com. We will organize a concept discussion and deliver a technical proposal within 3 business days." },
              { q: "Direct Engineering Helpline:", a: "Phone: +91 95374 30101  *  +91 77780 08999  *  Email: jyotenterpriseofficial@gmail.com" }
            ]
          }
        ]
      }
    ]
  }
];

async function main() {
  console.log("==================================================");
  console.log("Generating Real PDFs for Financial, Legal & Engineering");
  console.log("==================================================");

  for (const doc of DOCUMENTS) {
    console.log(`\nGenerating: ${doc.title}...`);
    await generateDocument(doc);
  }

  console.log("\n==================================================");
  console.log("Successfully generated all 12 practice PDFs!");
  console.log("==================================================");
}

main().catch(console.error);
