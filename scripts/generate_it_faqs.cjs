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

    page.drawText("IT SERVICES - FREQUENTLY ASKED QUESTIONS", {
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

  page.drawText("Jyot Enterprise  *  IT Services FAQ  *  Commercial & Technical Information", {
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

function drawFaqCard(page, qNum, question, answer, x, y, width, fontRegular, fontBold) {
  const qIsLong = question.length > 62;
  const aIsLong = answer.length > 130;
  const cardHeight = (qIsLong ? 26 : 18) + (aIsLong ? 46 : 32) + 24;

  page.drawRectangle({
    x,
    y: y - cardHeight,
    width,
    height: cardHeight,
    color: LIGHT_BG,
    borderColor: BORDER,
    borderWidth: 0.8,
  });

  // Left Orange accent bar on each FAQ card
  page.drawRectangle({
    x,
    y: y - cardHeight,
    width: 3.5,
    height: cardHeight,
    color: ORANGE,
  });

  // Q Number Badge
  page.drawRectangle({
    x: x + 10,
    y: y - 18,
    width: 18,
    height: 14,
    color: ORANGE,
  });

  page.drawText(qNum, {
    x: x + (qNum.length === 1 ? 16 : 12),
    y: y - 14,
    size: 7.5,
    font: fontBold,
    color: WHITE,
  });

  // Question
  page.drawText(cleanWinAnsi(question), {
    x: x + 34,
    y: y - 15,
    size: 9.5,
    font: fontBold,
    color: DARK,
    maxWidth: width - 46,
  });

  // Answer
  const answerY = qIsLong ? y - 34 : y - 26;
  page.drawText(cleanWinAnsi(answer), {
    x: x + 34,
    y: answerY - 6,
    size: 8.2,
    font: fontRegular,
    color: MUTED,
    maxWidth: width - 50,
    lineHeight: 12.2,
  });

  return cardHeight;
}

async function generateItFaqs() {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const logoBytes = fs.readFileSync('public/brand/logo-transparent.png');
  const logoImg = await doc.embedPng(logoBytes);

  const markBytes = fs.readFileSync('public/brand/logo-mark.png');
  const logoMark = await doc.embedPng(markBytes);

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const CONTENT_WIDTH = PAGE_WIDTH - 96; // 499.28
  const TOTAL_PAGES = 4;

  const faqs = [
    {
      num: "1",
      q: "What type of software does Jyot Enterprise develop?",
      a: "Jyot Enterprise develops business-focused software solutions including custom web applications, management systems, ERP/CRM solutions, automation platforms, dashboards, APIs and workflow-based applications."
    },
    {
      num: "2",
      q: "Can software be built around our existing business workflow?",
      a: "Yes. The existing workflow can be studied first and the solution can then be designed around the business process, users and operational requirements."
    },
    {
      num: "3",
      q: "Do you provide ERP solutions?",
      a: "Yes. ERP-style solutions can be designed or customized around business requirements such as manufacturing, inventory, purchasing, sales, reporting and other operational workflows."
    },
    {
      num: "4",
      q: "Can you develop CRM software?",
      a: "Yes. CRM solutions can include lead management, customer management, sales pipelines, follow-ups, tasks, appointments and reporting."
    },
    {
      num: "5",
      q: "Can AI be integrated into existing software?",
      a: "Yes. AI capabilities can be integrated where they provide practical business value. Possible use cases include AI assistants, document processing, workflow automation, data processing and LLM-based features."
    },
    {
      num: "6",
      q: "Can you integrate third-party APIs?",
      a: "Yes. APIs can be integrated based on the technical capabilities, documentation and requirements of the third-party service."
    },
    {
      num: "7",
      q: "Will the software work on mobile devices?",
      a: "Web applications can be designed responsively for mobile, tablet and desktop environments."
    },
    {
      num: "8",
      q: "Do you provide deployment and hosting support?",
      a: "Deployment and infrastructure requirements can be discussed based on the project's architecture, hosting environment and business needs."
    },
    {
      num: "9",
      q: "Do you provide post-launch support?",
      a: "Yes. Depending on the engagement, support can include maintenance, bug fixes, technical improvements and future enhancements."
    },
    {
      num: "10",
      q: "How does a project start?",
      a: "The process starts with a consultation to understand the business requirement, existing workflow, users and expected outcome. A suitable technology approach can then be discussed."
    },
    {
      num: "11",
      q: "Can existing data be migrated into a new system?",
      a: "Existing data such as spreadsheets, CSV files or databases may be migrated depending on the data structure, quality and project requirements."
    },
    {
      num: "12",
      q: "How do you approach software security?",
      a: "Security considerations can include authentication, authorization, protected data access, server-side operations, input validation and appropriate database access controls."
    },
    {
      num: "13",
      q: "Can you build internal business management software?",
      a: "Yes. Internal systems can be designed for workflows such as employees, tasks, leads, customers, documents, approvals, reporting and other business operations."
    },
    {
      num: "14",
      q: "Can software be enhanced after launch?",
      a: "Yes. Business software can evolve over time with additional features, workflow improvements, integrations and performance enhancements."
    }
  ];

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
    page.drawText("CLIENT KNOWLEDGE BASE", {
      x: 70,
      y: height - 155,
      size: 11,
      font: fontBold,
      color: ORANGE,
    });

    // Two-Tone Title
    page.drawText("IT Services", {
      x: 70,
      y: height - 215,
      size: 38,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Frequently Asked Questions", {
      x: 70,
      y: height - 262,
      size: 30,
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

    page.drawText("TRANSPARENT CLIENT ADVISORY", {
      x: 88,
      y: height - 324,
      size: 7.5,
      font: fontBold,
      color: MUTED,
    });

    page.drawText('"Common questions about software, automation and digital solutions."', {
      x: 88,
      y: height - 346,
      size: 11.5,
      font: fontBold,
      color: DARK,
    });

    // Core Highlight Topics
    page.drawText("TOPICS COVERED IN THIS FAQ SHEET", {
      x: 70,
      y: height - 410,
      size: 8.5,
      font: fontBold,
      color: DARK,
    });

    const topics = [
      { name: "Scope & Solutions", desc: "Q1-Q4: Custom applications, business workflows, ERP & CRM capabilities" },
      { name: "AI & Integrations", desc: "Q5-Q7: Practical AI, 3rd-party REST APIs & responsive mobile engineering" },
      { name: "Infrastructure & Ops", desc: "Q8-Q10: Cloud deployment, hosting, post-launch support & project kickoff" },
      { name: "Data & Security", desc: "Q11-Q12: Data migration, legacy CSV/Excel import & access controls" },
      { name: "Internal Systems", desc: "Q13-Q14: Internal operations software & post-launch feature evolution" },
    ];

    let topY = height - 440;
    for (const t of topics) {
      page.drawRectangle({
        x: 70,
        y: topY - 14,
        width: width - 118,
        height: 38,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: 82,
        y: topY + 4,
        width: 6,
        height: 6,
        color: ORANGE,
      });

      page.drawText(t.name, {
        x: 96,
        y: topY + 3,
        size: 10,
        font: fontBold,
        color: DARK,
      });

      page.drawText(t.desc, {
        x: 220,
        y: topY + 3,
        size: 8.5,
        font: fontRegular,
        color: MUTED,
      });

      topY -= 46;
    }

    // Bottom Direct Inquiry Desk Box (Light background, NOT black!)
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
  // PAGE 2: FAQS 1 TO 5
  // =========================================================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Solutions, Workflows & Capabilities", fontRegular, fontBold, logoMark);

    let y = height - 76;
    drawCategoryPill(page, "SERVICES & CORE CAPABILITIES", 48, y, fontBold);
    y -= 26;

    page.drawText("Core Software Solutions, Workflows & AI", {
      x: 48,
      y,
      size: 16,
      font: fontBold,
      color: DARK,
    });
    y -= 24;

    for (let i = 0; i < 5; i++) {
      const f = faqs[i];
      const h = drawFaqCard(page, f.num, f.q, f.a, 48, y, CONTENT_WIDTH, fontRegular, fontBold);
      y -= (h + 12);
    }

    drawPageFooter(page, 2, TOTAL_PAGES, fontRegular, fontBold);
  }

  // =========================================================================
  // PAGE 3: FAQS 6 TO 10
  // =========================================================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "APIs, Platforms & Delivery", fontRegular, fontBold, logoMark);

    let y = height - 76;
    drawCategoryPill(page, "TECHNICAL ARCHITECTURE & PROCESS", 48, y, fontBold);
    y -= 26;

    page.drawText("APIs, Responsiveness, Hosting & Kickoff", {
      x: 48,
      y,
      size: 16,
      font: fontBold,
      color: DARK,
    });
    y -= 24;

    for (let i = 5; i < 10; i++) {
      const f = faqs[i];
      const h = drawFaqCard(page, f.num, f.q, f.a, 48, y, CONTENT_WIDTH, fontRegular, fontBold);
      y -= (h + 12);
    }

    drawPageFooter(page, 3, TOTAL_PAGES, fontRegular, fontBold);
  }

  // =========================================================================
  // PAGE 4: FAQS 11 TO 14 & FINAL CTA
  // =========================================================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Security, Internal Tools & Contact", fontRegular, fontBold, logoMark);

    let y = height - 76;
    drawCategoryPill(page, "SECURITY, EVOLUTION & ENGAGEMENT", 48, y, fontBold);
    y -= 26;

    page.drawText("Data Migration, Security, Evolution & Contact", {
      x: 48,
      y,
      size: 16,
      font: fontBold,
      color: DARK,
    });
    y -= 24;

    for (let i = 10; i < 14; i++) {
      const f = faqs[i];
      const h = drawFaqCard(page, f.num, f.q, f.a, 48, y, CONTENT_WIDTH, fontRegular, fontBold);
      y -= (h + 12);
    }

    y -= 10;

    // FINAL CTA BOX
    page.drawRectangle({
      x: 48,
      y: y - 80,
      width: CONTENT_WIDTH,
      height: 84,
      color: LIGHT_BG,
      borderColor: ORANGE,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: 48,
      y: y - 80,
      width: 4,
      height: 84,
      color: ORANGE,
    });

    page.drawText("STILL HAVE A QUESTION?", {
      x: 64,
      y: y - 18,
      size: 8,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("Let's discuss your requirement.", {
      x: 64,
      y: y - 36,
      size: 13,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Jyot Enterprise  *  +91 95374 30101  *  +91 77780 08999  *  jyotenterpriseofficial@gmail.com", {
      x: 64,
      y: y - 54,
      size: 8.5,
      font: fontRegular,
      color: DARK,
    });

    page.drawText("IT  *  AI  *  Automation  *  ERP  *  CRM  *  Digital Transformation", {
      x: 64,
      y: y - 70,
      size: 7.8,
      font: fontBold,
      color: ORANGE,
    });

    drawPageFooter(page, 4, TOTAL_PAGES, fontRegular, fontBold);
  }

  const pdfBytes = await doc.save();

  // Save requested filename
  const requestedFile = path.join(OUT_DIR, 'Jyot-Enterprise-IT-Services-FAQs.pdf');
  fs.writeFileSync(requestedFile, pdfBytes);
  console.log(`Saved: ${requestedFile}`);

  // Save aliases
  fs.writeFileSync(path.join(OUT_DIR, 'it-services-faqs.pdf'), pdfBytes);
  fs.writeFileSync(path.join(OUT_DIR, 'it-faq-sheet.pdf'), pdfBytes);

  console.log('Successfully generated IT Services FAQs with Image 2 format!');
}

generateItFaqs().catch(console.error);
