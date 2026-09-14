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
const MUTED = rgb(0.380, 0.435, 0.518);      // #616F84
const LIGHT_BG = rgb(0.973, 0.980, 0.988);   // #F8FAFC
const BORDER = rgb(0.886, 0.910, 0.941);     // #E2E8F0
const WHITE = rgb(1, 1, 1);
const ACCENT_BG = rgb(1.0, 0.969, 0.929);   // #FFF7ED
const LINE_COLOR = rgb(0.85, 0.88, 0.92);

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

function drawCheckbox(page, x, y, label, fontRegular, fontSize = 8) {
  // Draw square vector checkbox
  page.drawRectangle({
    x,
    y: y - 1,
    width: 9.5,
    height: 9.5,
    color: WHITE,
    borderColor: ORANGE,
    borderWidth: 1.1,
  });

  page.drawText(cleanWinAnsi(label), {
    x: x + 15,
    y: y,
    size: fontSize,
    font: fontRegular,
    color: DARK,
  });
}

function drawRuledLine(page, x, y, width) {
  page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: 0.75,
    color: LINE_COLOR,
  });
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

function drawSectionHeader(page, num, title, x, y, width, fontBold) {
  page.drawRectangle({
    x,
    y: y - 4,
    width,
    height: 20,
    color: LIGHT_BG,
    borderColor: BORDER,
    borderWidth: 0.8,
  });

  page.drawRectangle({
    x,
    y: y - 4,
    width: 4,
    height: 20,
    color: ORANGE,
  });

  page.drawText(`SECTION ${num} - ${cleanWinAnsi(title).toUpperCase()}`, {
    x: x + 10,
    y: y + 2,
    size: 8.5,
    font: fontBold,
    color: DARK,
  });
}

function drawPageHeader(page, title, fontRegular, fontBold, logoMark) {
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

    page.drawText("SOFTWARE PROJECT READINESS CHECKLIST", {
      x: 82,
      y: topY - 6,
      size: 6.5,
      font: fontBold,
      color: ORANGE,
    });
  }

  page.drawText(cleanWinAnsi(title), {
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

function drawPageFooter(page, pageNum, totalPages, fontRegular, fontBold) {
  const { width } = page.getSize();
  const y = 30;

  page.drawLine({
    start: { x: 48, y: y + 16 },
    end: { x: width - 48, y: y + 16 },
    thickness: 0.75,
    color: BORDER,
  });

  page.drawText("Jyot Enterprise  *  Pre-Kickoff Discovery Toolkit  *  Software Readiness", {
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

async function generateChecklist() {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const logoBytes = fs.readFileSync('public/brand/logo-transparent.png');
  const logoImg = await doc.embedPng(logoBytes);

  const markBytes = fs.readFileSync('public/brand/logo-mark.png');
  const logoMark = await doc.embedPng(markBytes);

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const CONTENT_WIDTH = PAGE_WIDTH - 96; // 499.28
  const TOTAL_PAGES = 4;

  // =========================================================================
  // PAGE 1: COVER (EXACT IMAGE 2 FORMAT)
  // =========================================================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();

    // Top Orange Brand Bar
    page.drawRectangle({
      x: 0,
      y: height - 12,
      width,
      height: 12,
      color: ORANGE,
    });

    // Left Vertical Orange Accent Stripe
    page.drawRectangle({
      x: 48,
      y: 0,
      width: 4,
      height: height - 12,
      color: ORANGE,
    });

    // Logo
    const logoW = 210;
    const logoH = (logoImg.height / logoImg.width) * logoW;
    page.drawImage(logoImg, {
      x: 68,
      y: height - 125,
      width: logoW,
      height: logoH,
    });

    // Desk Subheader
    page.drawText("PRE-KICKOFF DISCOVERY TOOLKIT", {
      x: 70,
      y: height - 155,
      size: 11,
      font: fontBold,
      color: ORANGE,
    });

    // Two-Tone Title
    page.drawText("Software Project", {
      x: 70,
      y: height - 215,
      size: 38,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Readiness Checklist", {
      x: 70,
      y: height - 262,
      size: 38,
      font: fontBold,
      color: ORANGE,
    });

    // Divider Line
    page.drawLine({
      start: { x: 70, y: height - 285 },
      end: { x: width - 48, y: height - 285 },
      thickness: 1.5,
      color: BORDER,
    });

    // Subtitle Callout Box with left 4px orange bar
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

    page.drawText("DISCOVERY OBJECTIVE", {
      x: 88,
      y: height - 324,
      size: 7.5,
      font: fontBold,
      color: MUTED,
    });

    page.drawText('"Prepare the right information before development starts."', {
      x: 88,
      y: height - 346,
      size: 12.5,
      font: fontBold,
      color: DARK,
    });

    // Core Focus Areas List
    page.drawText("10 CORE READINESS MODULES INCLUDED IN THIS CHECKLIST", {
      x: 70,
      y: height - 410,
      size: 8.5,
      font: fontBold,
      color: DARK,
    });

    const checklistModules = [
      { name: "01-03 Scope & Users", desc: "Business objectives, user personas, roles & target features" },
      { name: "04-06 Workflow & Data", desc: "Current vs automated workflows, legacy migration & APIs" },
      { name: "07 Design & Branding", desc: "Design preferences, mobile/desktop requirements & assets" },
      { name: "08-09 Security & Deploy", desc: "Authentication, permissions, cloud infrastructure & backups" },
      { name: "10 Final Sign-Off", desc: "Pre-development readiness confirmation & stakeholder sign-off" },
    ];

    let modY = height - 440;
    for (const m of checklistModules) {
      page.drawRectangle({
        x: 70,
        y: modY - 14,
        width: width - 118,
        height: 38,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 1,
      });

      // Orange bullet badge
      page.drawRectangle({
        x: 82,
        y: modY + 4,
        width: 6,
        height: 6,
        color: ORANGE,
      });

      page.drawText(m.name, {
        x: 96,
        y: modY + 3,
        size: 10,
        font: fontBold,
        color: DARK,
      });

      page.drawText(m.desc, {
        x: 235,
        y: modY + 3,
        size: 8.5,
        font: fontRegular,
        color: MUTED,
      });

      modY -= 46;
    }

    // Bottom Direct Inquiry Desk Box (Light Background, NOT Black!)
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

    page.drawText("Official Document  *  Confidential  *  Ahmedabad, Gujarat", {
      x: 88,
      y: boxY + 12,
      size: 7.5,
      font: fontRegular,
      color: MUTED,
    });
  }

  // =========================================================================
  // PAGE 2: SECTIONS 1, 2 & 3
  // =========================================================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Scope, Users & Features", fontRegular, fontBold, logoMark);

    let y = height - 76;
    drawCategoryPill(page, "DISCOVERY & SPECIFICATION", 48, y, fontBold);
    y -= 26;

    page.drawText("Business Objectives, User Roles & Feature Scope", {
      x: 48,
      y,
      size: 16,
      font: fontBold,
      color: DARK,
    });
    y -= 22;

    // SECTION 1 — BUSINESS OBJECTIVE
    drawSectionHeader(page, "1", "Business Objective", 48, y, CONTENT_WIDTH, fontBold);
    y -= 20;

    const s1 = [
      "What business problem are we solving?",
      "What process are we trying to improve?",
      "Who will use the system?",
      "What result do we expect from the software?",
      "How will we measure success?"
    ];

    for (const item of s1) {
      drawCheckbox(page, 56, y, item, fontRegular, 8.2);
      y -= 15;
    }

    y -= 2;
    page.drawText("Notes:", { x: 56, y, size: 7.8, font: fontBold, color: MUTED });
    y -= 12;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);
    y -= 13;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);
    y -= 22;

    // SECTION 2 — USERS & ROLES
    drawSectionHeader(page, "2", "Users & Roles", 48, y, CONTENT_WIDTH, fontBold);
    y -= 18;

    const roles = ["Admin", "Manager", "Employee", "Customer", "Vendor", "Partner", "Other"];
    let rx = 56;
    for (let i = 0; i < roles.length; i++) {
      drawCheckbox(page, rx, y, roles[i], fontRegular, 8);
      rx += (i === 3 ? 72 : 68);
    }
    y -= 18;

    page.drawText("Questions:", { x: 56, y, size: 8, font: fontBold, color: DARK });
    y -= 13;
    page.drawText("- Who should have access to the system?", { x: 56, y, size: 7.8, font: fontRegular, color: MUTED });
    y -= 12;
    page.drawText("- What should each user be allowed to see or modify?", { x: 56, y, size: 7.8, font: fontRegular, color: MUTED });
    y -= 14;
    page.drawText("Notes:", { x: 56, y, size: 7.8, font: fontBold, color: MUTED });
    y -= 12;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);
    y -= 22;

    // SECTION 3 — FEATURES
    drawSectionHeader(page, "3", "Features", 48, y, CONTENT_WIDTH, fontBold);
    y -= 18;

    const featsCol1 = [
      "Login / Authentication",
      "Dashboard",
      "User Management",
      "Lead Management",
      "Customer Management",
      "Inventory",
    ];
    const featsCol2 = [
      "Sales",
      "Purchase",
      "Reports",
      "Notifications",
      "Search & Filters",
      "File Uploads",
    ];
    const featsCol3 = [
      "Booking / Appointment",
      "Payment Integration",
      "Third-party API Integration",
      "Mobile Application",
      "Admin Panel",
    ];

    let fy1 = y;
    for (const f of featsCol1) {
      drawCheckbox(page, 56, fy1, f, fontRegular, 8);
      fy1 -= 16;
    }
    let fy2 = y;
    for (const f of featsCol2) {
      drawCheckbox(page, 220, fy2, f, fontRegular, 8);
      fy2 -= 16;
    }
    let fy3 = y;
    for (const f of featsCol3) {
      drawCheckbox(page, 370, fy3, f, fontRegular, 8);
      fy3 -= 16;
    }

    y = Math.min(fy1, fy2, fy3) - 4;
    page.drawText("Other:", { x: 56, y, size: 8, font: fontBold, color: MUTED });
    y -= 12;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);

    drawPageFooter(page, 2, TOTAL_PAGES, fontRegular, fontBold);
  }

  // =========================================================================
  // PAGE 3: SECTIONS 4, 5 & 6
  // =========================================================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Workflow, Data & Integrations", fontRegular, fontBold, logoMark);

    let y = height - 76;
    drawCategoryPill(page, "OPERATIONS & TECHNICAL FOUNDATION", 48, y, fontBold);
    y -= 26;

    page.drawText("Business Workflow, Data Architecture & Integrations", {
      x: 48,
      y,
      size: 16,
      font: fontBold,
      color: DARK,
    });
    y -= 22;

    // SECTION 4 — BUSINESS WORKFLOW
    drawSectionHeader(page, "4", "Business Workflow", 48, y, CONTENT_WIDTH, fontBold);
    y -= 18;

    page.drawText("Describe the current process:", { x: 56, y, size: 8, font: fontBold, color: DARK });
    y -= 14;

    const steps = ["Step 1", "Step 2", "Step 3", "Step 4"];
    for (const st of steps) {
      page.drawText(`${st}:`, { x: 56, y, size: 7.8, font: fontBold, color: MUTED });
      y -= 12;
      drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);
      y -= 14;
    }

    page.drawText("What is currently manual?", { x: 56, y, size: 8, font: fontBold, color: DARK });
    y -= 12;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);
    y -= 16;

    page.drawText("What should become automated?", { x: 56, y, size: 8, font: fontBold, color: DARK });
    y -= 12;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);
    y -= 24;

    // SECTION 5 — DATA REQUIREMENTS
    drawSectionHeader(page, "5", "Data Requirements", 48, y, CONTENT_WIDTH, fontBold);
    y -= 18;

    const dataItems = [
      "Existing Excel files",
      "CSV data",
      "Existing database",
      "Customer records",
      "Product records",
      "Employee records",
      "Historical data"
    ];

    let dx1 = 56;
    let dx2 = 220;
    for (let i = 0; i < dataItems.length; i++) {
      if (i < 4) {
        drawCheckbox(page, dx1, y - (i * 15), dataItems[i], fontRegular, 8);
      } else {
        drawCheckbox(page, dx2, y - ((i - 4) * 15), dataItems[i], fontRegular, 8);
      }
    }
    y -= 64;

    page.drawText("What data needs to be stored?", { x: 56, y, size: 8, font: fontBold, color: DARK });
    y -= 12;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);
    y -= 16;

    page.drawText("Is existing data migration required?", { x: 56, y, size: 8, font: fontBold, color: DARK });
    drawCheckbox(page, 240, y, "Yes", fontRegular, 8);
    drawCheckbox(page, 290, y, "No", fontRegular, 8);
    drawCheckbox(page, 340, y, "Not sure", fontRegular, 8);
    y -= 24;

    // SECTION 6 — INTEGRATIONS
    drawSectionHeader(page, "6", "Integrations", 48, y, CONTENT_WIDTH, fontBold);
    y -= 18;

    const intCol1 = ["Email", "WhatsApp", "SMS"];
    const intCol2 = ["Payment Gateway", "Google Services", "Accounting Software"];
    const intCol3 = ["CRM", "ERP", "Other API"];

    for (let i = 0; i < 3; i++) {
      drawCheckbox(page, 56, y - (i * 15), intCol1[i], fontRegular, 8);
      drawCheckbox(page, 200, y - (i * 15), intCol2[i], fontRegular, 8);
      drawCheckbox(page, 370, y - (i * 15), intCol3[i], fontRegular, 8);
    }
    y -= 50;

    page.drawText("Integration details:", { x: 56, y, size: 8, font: fontBold, color: MUTED });
    y -= 12;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);

    drawPageFooter(page, 3, TOTAL_PAGES, fontRegular, fontBold);
  }

  // =========================================================================
  // PAGE 4: SECTIONS 7, 8, 9, 10 & FINAL CTA
  // =========================================================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Design, Security & Final Readiness", fontRegular, fontBold, logoMark);

    let y = height - 76;
    drawCategoryPill(page, "DESIGN, DEPLOYMENT & SIGN-OFF", 48, y, fontBold);
    y -= 26;

    page.drawText("Design, Security, Deployment & Project Sign-Off", {
      x: 48,
      y,
      size: 16,
      font: fontBold,
      color: DARK,
    });
    y -= 20;

    // SECTION 7 — DESIGN & BRANDING
    drawSectionHeader(page, "7", "Design & Branding", 48, y, CONTENT_WIDTH, fontBold);
    y -= 18;

    const designItems = [
      "Logo available",
      "Brand colors available",
      "Existing website",
      "Reference websites",
      "Mobile requirement",
      "Desktop requirement"
    ];
    for (let i = 0; i < designItems.length; i++) {
      const colX = (i % 3 === 0 ? 56 : i % 3 === 1 ? 200 : 360);
      const rowY = y - Math.floor(i / 3) * 15;
      drawCheckbox(page, colX, rowY, designItems[i], fontRegular, 7.8);
    }
    y -= 34;
    page.drawText("Preferred design style:", { x: 56, y, size: 7.8, font: fontBold, color: MUTED });
    y -= 12;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);
    y -= 20;

    // SECTION 8 — SECURITY & ACCESS
    drawSectionHeader(page, "8", "Security & Access", 48, y, CONTENT_WIDTH, fontBold);
    y -= 18;

    const secItems = [
      "User authentication",
      "Role-based permissions",
      "Data access restrictions",
      "Backup requirements",
      "Audit history",
      "Sensitive data handling"
    ];
    for (let i = 0; i < secItems.length; i++) {
      const colX = (i % 3 === 0 ? 56 : i % 3 === 1 ? 200 : 360);
      const rowY = y - Math.floor(i / 3) * 15;
      drawCheckbox(page, colX, rowY, secItems[i], fontRegular, 7.8);
    }
    y -= 34;
    page.drawText("Important security requirements:", { x: 56, y, size: 7.8, font: fontBold, color: MUTED });
    y -= 12;
    drawRuledLine(page, 56, y, CONTENT_WIDTH - 16);
    y -= 20;

    // SECTION 9 — DEPLOYMENT
    drawSectionHeader(page, "9", "Deployment", 48, y, CONTENT_WIDTH, fontBold);
    y -= 18;

    const depItems = [
      "Domain",
      "Hosting / Cloud",
      "Production database",
      "SSL/HTTPS",
      "Business email",
      "Backup strategy",
      "Production admin account"
    ];
    for (let i = 0; i < depItems.length; i++) {
      const colX = (i < 4 ? 56 : 240);
      const rowY = y - (i < 4 ? i : i - 4) * 14;
      drawCheckbox(page, colX, rowY, depItems[i], fontRegular, 7.8);
    }
    y -= 62;

    // SECTION 10 — FINAL PROJECT READINESS
    drawSectionHeader(page, "10", "Final Project Readiness Confirmation", 48, y, CONTENT_WIDTH, fontBold);
    y -= 16;
    page.drawText("Before development starts, confirm:", { x: 56, y, size: 7.8, font: fontBold, color: ORANGE });
    y -= 14;

    const finalChecks = [
      "Business objective is clear",
      "Users are identified",
      "Main features are identified",
      "Workflow is documented",
      "Data requirements are known",
      "Integrations are identified",
      "Design expectations are discussed",
      "Security requirements are discussed",
      "Deployment expectations are understood"
    ];

    for (let i = 0; i < finalChecks.length; i++) {
      const colX = (i < 5 ? 56 : 280);
      const rowY = y - (i < 5 ? i : i - 5) * 13;
      drawCheckbox(page, colX, rowY, finalChecks[i], fontRegular, 7.5);
    }
    y -= 74;

    // FINAL CTA BOX
    page.drawRectangle({
      x: 48,
      y: y - 56,
      width: CONTENT_WIDTH,
      height: 60,
      color: LIGHT_BG,
      borderColor: ORANGE,
      borderWidth: 1,
    });

    page.drawText('"Ready to discuss your project?"', {
      x: 64,
      y: y - 16,
      size: 11,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Jyot Enterprise  *  +91 95374 30101  *  +91 77780 08999  *  jyotenterpriseofficial@gmail.com", {
      x: 64,
      y: y - 32,
      size: 8.5,
      font: fontRegular,
      color: DARK,
    });

    page.drawText("IT  *  AI  *  Automation  *  ERP  *  CRM  *  Digital Transformation", {
      x: 64,
      y: y - 46,
      size: 7.5,
      font: fontBold,
      color: ORANGE,
    });

    drawPageFooter(page, 4, TOTAL_PAGES, fontRegular, fontBold);
  }

  const pdfBytes = await doc.save();

  // Save requested filename
  const requestedFile = path.join(OUT_DIR, 'Jyot-Enterprise-Software-Project-Readiness-Checklist.pdf');
  fs.writeFileSync(requestedFile, pdfBytes);
  console.log(`Saved: ${requestedFile}`);

  // Save aliases
  fs.writeFileSync(path.join(OUT_DIR, 'software-project-readiness-checklist.pdf'), pdfBytes);
  fs.writeFileSync(path.join(OUT_DIR, 'it-checklist.pdf'), pdfBytes);

  console.log('Successfully generated Software Project Readiness Checklist with Image 2 format!');
}

generateChecklist().catch(console.error);
