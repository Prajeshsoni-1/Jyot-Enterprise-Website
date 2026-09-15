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

// Helper for standard page headers (Pages 2-7)
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

  // Top bar container
  const topY = height - 42;

  if (logoMark) {
    // Draw small logo mark on top left
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

    page.drawText("IT SERVICES & DIGITAL TRANSFORMATION", {
      x: 82,
      y: topY - 6,
      size: 6.5,
      font: fontBold,
      color: ORANGE,
    });
  } else {
    page.drawText("JYOT ENTERPRISE", {
      x: 48,
      y: topY + 2,
      size: 11,
      font: fontBold,
      color: ORANGE,
    });
  }

  // Right Title
  page.drawText(title, {
    x: width - 48 - (title.length * 5.2),
    y: topY - 1,
    size: 8.5,
    font: fontRegular,
    color: MUTED,
  });

  // Header bottom border
  page.drawLine({
    start: { x: 48, y: height - 54 },
    end: { x: width - 48, y: height - 54 },
    thickness: 0.75,
    color: BORDER,
  });
}

// Helper for standard page footers (Pages 2-7)
function drawPageFooter(page, pageNum, totalPages, fontRegular, fontBold) {
  const { width } = page.getSize();
  const y = 30;

  // Divider
  page.drawLine({
    start: { x: 48, y: y + 16 },
    end: { x: width - 48, y: y + 16 },
    thickness: 0.75,
    color: BORDER,
  });

  // Left company line
  page.drawText("Jyot Enterprise  •  IT • AI • Automation • ERP • CRM • Cloud", {
    x: 48,
    y: y + 2,
    size: 7.2,
    font: fontRegular,
    color: MUTED,
  });

  // Center contact
  page.drawText("Contact: +91 95374 30101  •  +91 77780 08999", {
    x: 270,
    y: y + 2,
    size: 7.2,
    font: fontRegular,
    color: MUTED,
  });

  // Right page number
  const pageStr = `Page ${pageNum} of ${totalPages}`;
  page.drawText(pageStr, {
    x: width - 48 - (pageStr.length * 4.8),
    y: y + 2,
    size: 7.8,
    font: fontBold,
    color: DARK,
  });
}

// Category Badge Pill
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

  page.drawText(text, {
    x: x + 8,
    y: y + 2,
    size: 7.5,
    font: fontBold,
    color: ORANGE,
  });

  return textWidth;
}

async function buildBrochure() {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Load logo images
  const logoBytes = fs.readFileSync('public/brand/logo-transparent.png');
  const logoImg = await doc.embedPng(logoBytes);

  const markBytes = fs.readFileSync('public/brand/logo-mark.png');
  const logoMark = await doc.embedPng(markBytes);

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const TOTAL_PAGES = 7;

  // ==========================================
  // PAGE 1 — COVER
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();

    // Top Orange Brand Accent Bar
    page.drawRectangle({
      x: 0,
      y: height - 12,
      width,
      height: 12,
      color: ORANGE,
    });

    // Elegant side accent stripe
    page.drawRectangle({
      x: 48,
      y: 0,
      width: 4,
      height: height - 12,
      color: ORANGE,
    });

    // Top Logo Banner
    const logoW = 210;
    const logoH = (logoImg.height / logoImg.width) * logoW;
    page.drawImage(logoImg, {
      x: 68,
      y: height - 125,
      width: logoW,
      height: logoH,
    });

    // Desk Sub-Header
    page.drawText("IT • AI • DIGITAL TRANSFORMATION", {
      x: 70,
      y: height - 155,
      size: 11,
      font: fontBold,
      color: ORANGE,
    });

    // Main Brochure Title
    page.drawText("IT Services", {
      x: 70,
      y: height - 215,
      size: 38,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Capability Brochure", {
      x: 70,
      y: height - 262,
      size: 38,
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

    // Subtitle in stylized box
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

    page.drawText("PRACTICAL ENGINEERING PHILOSOPHY", {
      x: 88,
      y: height - 324,
      size: 7.5,
      font: fontBold,
      color: MUTED,
    });

    page.drawText("\"Technology solutions designed around the way your business works.\"", {
      x: 88,
      y: height - 346,
      size: 12.5,
      font: fontBold,
      color: DARK,
    });

    // Core Solution Highlights Box
    page.drawText("CORE PRACTICE AREAS INCLUDED IN THIS BROCHURE", {
      x: 70,
      y: height - 410,
      size: 8.5,
      font: fontBold,
      color: DARK,
    });

    const pillars = [
      { name: "Custom Software", desc: "Bespoke business platforms & tailored web portals" },
      { name: "ERP Solutions", desc: "Manufacturing, inventory, purchasing & sales workflows" },
      { name: "CRM & Pipelines", desc: "Automated lead ingestion, booking & team routing" },
      { name: "AI & Automation", desc: "Applied LLMs, document extraction & workflow copilots" },
      { name: "Cloud & Integrations", desc: "PostgreSQL, Supabase, REST APIs & cloud infrastructure" },
    ];

    let pillY = height - 435;
    for (const p of pillars) {
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
        y: pillY + 5,
        width: 6,
        height: 6,
        color: ORANGE,
      });

      page.drawText(p.name, {
        x: 96,
        y: pillY + 4,
        size: 9.5,
        font: fontBold,
        color: DARK,
      });

      page.drawText(p.desc, {
        x: 96,
        y: pillY - 8,
        size: 8.0,
        font: fontRegular,
        color: MUTED,
      });

      pillY -= 44;
    }

    // Bottom Contact Box
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

    page.drawText("Official Document  •  Confidential  •  Gandhinagar & Palanpur Offices", {
      x: 88,
      y: boxY + 12,
      size: 7.5,
      font: fontRegular,
      color: MUTED,
    });
  }

  // ==========================================
  // PAGE 2 — ABOUT
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "About Jyot Enterprise", fontRegular, fontBold, logoMark);

    let y = height - 85;

    drawCategoryPill(page, "ABOUT JYOT ENTERPRISE", 48, y, fontBold);
    y -= 30;

    page.drawText("Technology That Supports Business Growth", {
      x: 48,
      y,
      size: 20,
      font: fontBold,
      color: DARK,
    });

    y -= 25;

    // About Lead Paragraphs
    const p1 = "Jyot Enterprise provides practical technology solutions for businesses looking to digitize operations, automate repetitive processes and build better systems for managing customers, teams and business workflows.";
    page.drawText(p1, {
      x: 48,
      y,
      size: 9.5,
      font: fontRegular,
      color: DARK,
      maxWidth: width - 96,
      lineHeight: 14.5,
    });

    y -= 44;

    const p2 = "We focus on understanding the business process first and then designing technology around the actual operational requirement.";
    page.drawText(p2, {
      x: 48,
      y,
      size: 9.5,
      font: fontBold,
      color: ORANGE,
      maxWidth: width - 96,
      lineHeight: 14.5,
    });

    y -= 34;

    const p3 = "Our solutions can combine custom software, ERP, CRM, AI automation, cloud infrastructure and API integrations into a connected digital environment.";
    page.drawText(p3, {
      x: 48,
      y,
      size: 9.5,
      font: fontRegular,
      color: DARK,
      maxWidth: width - 96,
      lineHeight: 14.5,
    });

    y -= 50;

    // Three Value Pillars Cards
    page.drawText("OUR OPERATIONAL COMMITMENTS", {
      x: 48,
      y,
      size: 8.5,
      font: fontBold,
      color: MUTED,
    });

    y -= 16;

    const cards = [
      {
        num: "01",
        title: "Process-First Engineering",
        desc: "We analyze operational bottlenecks and daily workflows with key stakeholders before architecting schemas or selecting technology stacks."
      },
      {
        num: "02",
        title: "Connected Digital Systems",
        desc: "We prevent data silos by connecting ERP, CRM, client portals, and external APIs into a clean, centralized database environment."
      },
      {
        num: "03",
        title: "Practical Operational Value",
        desc: "We engineer software that staff can actually use effortlessly — emphasizing intuitive usability, responsive design, and rapid response times."
      }
    ];

    for (const c of cards) {
      page.drawRectangle({
        x: 48,
        y: y - 56,
        width: width - 96,
        height: 64,
        color: LIGHT_BG,
        borderColor: BORDER,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: 48,
        y: y - 56,
        width: 4,
        height: 64,
        color: ORANGE,
      });

      // Number pill
      page.drawText(c.num, {
        x: 64,
        y: y - 10,
        size: 11,
        font: fontBold,
        color: ORANGE,
      });

      page.drawText(c.title, {
        x: 94,
        y: y - 10,
        size: 11,
        font: fontBold,
        color: DARK,
      });

      page.drawText(c.desc, {
        x: 94,
        y: y - 26,
        size: 8.5,
        font: fontRegular,
        color: MUTED,
        maxWidth: width - 156,
        lineHeight: 12.5,
      });

      y -= 74;
    }

    y -= 10;

    // Architecture Overview Card
    page.drawRectangle({
      x: 48,
      y: y - 110,
      width: width - 96,
      height: 118,
      color: WHITE,
      borderColor: ORANGE,
      borderWidth: 1,
    });

    page.drawText("THE CONNECTED DIGITAL ENVIRONMENT ARCHITECTURE", {
      x: 64,
      y: y - 16,
      size: 9,
      font: fontBold,
      color: ORANGE,
    });

    const flowItems = [
      { step: "Operational Inputs", text: "Customer leads, inquiries, orders, staff actions & legacy records" },
      { step: "Connected Core", text: "Unified PostgreSQL database with custom web apps, Jyot ERP & CRM" },
      { step: "Intelligent Layers", text: "Automated routing, status alerts, document parsing & API synchronizations" },
      { step: "Business Outcomes", text: "Zero redundant data entry, instant executive reporting & audit clarity" }
    ];

    let flowY = y - 36;
    for (const item of flowItems) {
      page.drawText(`•  ${item.step}:`, {
        x: 64,
        y: flowY,
        size: 8.2,
        font: fontBold,
        color: DARK,
      });
      page.drawText(item.text, {
        x: 180,
        y: flowY,
        size: 8.2,
        font: fontRegular,
        color: MUTED,
      });
      flowY -= 17;
    }

    drawPageFooter(page, 2, TOTAL_PAGES, fontRegular, fontBold);
  }

  // ==========================================
  // PAGE 3 — OUR CORE IT SERVICES
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Our Technology Solutions", fontRegular, fontBold, logoMark);

    let y = height - 85;

    drawCategoryPill(page, "CORE SERVICES", 48, y, fontBold);
    y -= 30;

    page.drawText("Our Technology Solutions", {
      x: 48,
      y,
      size: 20,
      font: fontBold,
      color: DARK,
    });

    y -= 16;
    page.drawText("Five dedicated technology disciplines structured around mid-market and enterprise requirements.", {
      x: 48,
      y,
      size: 8.5,
      font: fontRegular,
      color: MUTED,
    });

    y -= 26;

    const services = [
      {
        num: "1",
        title: "Custom Software & Product Engineering",
        desc: "Build tailored web applications, business platforms, portals and workflow-driven software around specific business requirements.",
        items: [
          "Business applications", "Web platforms", "Customer portals",
          "Internal management systems", "API development", "Workflow automation"
        ]
      },
      {
        num: "2",
        title: "Jyot ERP — Business Operations",
        desc: "Business-focused ERP solutions designed to organize and digitize operational workflows.",
        items: [
          "Manufacturing workflows", "Inventory tracking", "Purchasing & vendor POs",
          "Sales orders & dispatch", "Business reporting", "Multi-branch operations",
          "Accounting / GST integrations"
        ]
      },
      {
        num: "3",
        title: "Jyot CRM & Lead Automation",
        desc: "Solutions for managing leads, customers and sales workflows from one place.",
        items: [
          "Lead management & capture", "Customer 360 records", "Sales pipeline tracking",
          "Follow-up scheduling", "Team task boards", "Appointment & booking flows",
          "Lead routing & assignments", "Communication history"
        ]
      },
      {
        num: "4",
        title: "AI & Intelligent Automation",
        desc: "Use AI and automation to reduce repetitive work and improve operational efficiency.",
        items: [
          "Custom AI assistants", "LLM integrations", "Document processing & OCR",
          "Workflow automation triggers", "Automated data processing", "AI-powered business flows"
        ]
      },
      {
        num: "5",
        title: "Cloud, DevOps & API Integration",
        desc: "Technology infrastructure and integration solutions for modern applications.",
        items: [
          "Cloud deployment & hosting", "3rd-party API integration", "Database architecture",
          "Authentication & security", "Deployment automation", "Application monitoring",
          "Scheduled backup planning"
        ]
      }
    ];

    for (const s of services) {
      const isMultiLineItems = s.items.length > 6;
      const cardHeight = isMultiLineItems ? 94 : 88;

      page.drawRectangle({
        x: 48,
        y: y - cardHeight + 10,
        width: width - 96,
        height: cardHeight,
        color: LIGHT_BG,
        borderColor: BORDER,
        borderWidth: 1,
      });

      // Number badge
      page.drawRectangle({
        x: 58,
        y: y - 10,
        width: 18,
        height: 16,
        color: ORANGE,
      });

      page.drawText(s.num, {
        x: 64,
        y: y - 6,
        size: 9.5,
        font: fontBold,
        color: WHITE,
      });

      page.drawText(s.title, {
        x: 84,
        y: y - 6,
        size: 10.5,
        font: fontBold,
        color: DARK,
      });

      page.drawText(s.desc, {
        x: 58,
        y: y - 24,
        size: 8,
        font: fontRegular,
        color: MUTED,
        maxWidth: width - 116,
      });

      // Items Tag Grid
      let itemX = 58;
      let itemY = y - 40;
      let row = 0;

      for (let i = 0; i < s.items.length; i++) {
        const itm = s.items[i];
        const itmW = itm.length * 4.4 + 14;

        if (itemX + itmW > width - 58) {
          itemX = 58;
          itemY -= 17;
          row++;
        }

        page.drawRectangle({
          x: itemX,
          y: itemY - 2,
          width: itmW,
          height: 14,
          color: WHITE,
          borderColor: BORDER,
          borderWidth: 0.75,
        });

        page.drawText(itm, {
          x: itemX + 5,
          y: itemY + 2,
          size: 6.8,
          font: fontBold,
          color: DARK,
        });

        itemX += itmW + 6;
      }

      y -= cardHeight + 8;
    }

    drawPageFooter(page, 3, TOTAL_PAGES, fontRegular, fontBold);
  }

  // ==========================================
  // PAGE 4 — HOW WE WORK
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "How We Work — Delivery Approach", fontRegular, fontBold, logoMark);

    let y = height - 85;

    drawCategoryPill(page, "DELIVERY APPROACH", 48, y, fontBold);
    y -= 30;

    page.drawText("Our Delivery Approach", {
      x: 48,
      y,
      size: 20,
      font: fontBold,
      color: DARK,
    });

    y -= 16;
    page.drawText("An 8-stage structured delivery model ensuring complete transparency, quality and alignment.", {
      x: 48,
      y,
      size: 8.5,
      font: fontRegular,
      color: MUTED,
    });

    y -= 30;

    const steps = [
      {
        num: "01",
        title: "Discovery",
        desc: "Understand business goals, users and existing workflows through stakeholder interviews and process mapping."
      },
      {
        num: "02",
        title: "Planning",
        desc: "Define features, database architecture, API integrations, milestones and realistic delivery scope."
      },
      {
        num: "03",
        title: "Design",
        desc: "Create clear, responsive user experiences, interactive prototypes and consistent interface systems."
      },
      {
        num: "04",
        title: "Development",
        desc: "Build the application, database schemas, REST APIs and business logic with clean, modular code."
      },
      {
        num: "05",
        title: "Testing",
        desc: "Validate functionality, security, responsiveness, edge cases and reliability across devices."
      },
      {
        num: "06",
        title: "UAT",
        desc: "Client team reviews the solution on live staging environments and provides feedback before sign-off."
      },
      {
        num: "07",
        title: "Deployment",
        desc: "Move the approved solution into production with database migration, SSL setup and operational checks."
      },
      {
        num: "08",
        title: "Support",
        desc: "Continue with proactive maintenance, issue fixes, security patching and future feature enhancements."
      }
    ];

    // Render in a 2-column grid
    const colWidth = (width - 96 - 16) / 2;
    for (let i = 0; i < steps.length; i += 2) {
      const s1 = steps[i];
      const s2 = steps[i + 1];

      // Step 1
      page.drawRectangle({
        x: 48,
        y: y - 56,
        width: colWidth,
        height: 64,
        color: LIGHT_BG,
        borderColor: BORDER,
        borderWidth: 1,
      });

      page.drawText(s1.num, {
        x: 58,
        y: y - 8,
        size: 11,
        font: fontBold,
        color: ORANGE,
      });

      page.drawText(s1.title, {
        x: 82,
        y: y - 8,
        size: 10.5,
        font: fontBold,
        color: DARK,
      });

      page.drawText(s1.desc, {
        x: 58,
        y: y - 24,
        size: 7.8,
        font: fontRegular,
        color: MUTED,
        maxWidth: colWidth - 20,
        lineHeight: 11.5,
      });

      // Step 2
      if (s2) {
        page.drawRectangle({
          x: 48 + colWidth + 16,
          y: y - 56,
          width: colWidth,
          height: 64,
          color: LIGHT_BG,
          borderColor: BORDER,
          borderWidth: 1,
        });

        page.drawText(s2.num, {
          x: 48 + colWidth + 26,
          y: y - 8,
          size: 11,
          font: fontBold,
          color: ORANGE,
        });

        page.drawText(s2.title, {
          x: 48 + colWidth + 50,
          y: y - 8,
          size: 10.5,
          font: fontBold,
          color: DARK,
        });

        page.drawText(s2.desc, {
          x: 48 + colWidth + 26,
          y: y - 24,
          size: 7.8,
          font: fontRegular,
          color: MUTED,
          maxWidth: colWidth - 20,
          lineHeight: 11.5,
        });
      }

      y -= 74;
    }

    y -= 10;

    // Delivery Guarantee Callout Box
    page.drawRectangle({
      x: 48,
      y: y - 76,
      width: width - 96,
      height: 82,
      color: ACCENT_BG,
      borderColor: ORANGE,
      borderWidth: 1,
    });

    page.drawText("COLLABORATIVE & MILESTONE-DRIVEN DELIVERY", {
      x: 64,
      y: y - 14,
      size: 9,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("• Transparent sprint tracking: Regular review meetings and live demo builds keep you in control.", {
      x: 64,
      y: y - 32,
      size: 8,
      font: fontRegular,
      color: DARK,
    });

    page.drawText("• Formal UAT sign-off matrix: Clear milestone acceptance criteria before initiating production rollout.", {
      x: 64,
      y: y - 48,
      size: 8,
      font: fontRegular,
      color: DARK,
    });

    page.drawText("• Handover & documentation: Full code repository access, schema dictionaries and operational manuals provided.", {
      x: 64,
      y: y - 64,
      size: 8,
      font: fontRegular,
      color: DARK,
    });

    drawPageFooter(page, 4, TOTAL_PAGES, fontRegular, fontBold);
  }

  // ==========================================
  // PAGE 5 — WHY JYOT ENTERPRISE
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Why Jyot Enterprise", fontRegular, fontBold, logoMark);

    let y = height - 85;

    drawCategoryPill(page, "VALUE PROPOSITION", 48, y, fontBold);
    y -= 30;

    page.drawText("Why Businesses Choose a Practical Technology Approach", {
      x: 48,
      y,
      size: 18,
      font: fontBold,
      color: DARK,
    });

    y -= 16;
    page.drawText("We prioritize pragmatic business outcomes, long-term reliability and straightforward communication.", {
      x: 48,
      y,
      size: 8.5,
      font: fontRegular,
      color: MUTED,
    });

    y -= 30;

    const reasons = [
      {
        title: "Business-first thinking",
        desc: "We focus on the business problem before selecting the technology. Software is an investment that must reduce manual work, lower error rates or drive tangible operational growth."
      },
      {
        title: "Custom workflows",
        desc: "Solutions can be designed around existing operational processes instead of forcing your team to contort into rigid, uncustomizable commercial SaaS platforms."
      },
      {
        title: "Scalable architecture",
        desc: "Systems can be structured to support future growth. Clean modular codebases and industry-standard relational schemas ensure smooth expansion over time."
      },
      {
        title: "Security-conscious development",
        desc: "Authentication, authorization and protected data access are considered during implementation. Role-based permissions protect sensitive business data."
      },
      {
        title: "Automation mindset",
        desc: "We identify repetitive workflows that can be improved through automation, freeing up your internal team to focus on higher-value client and business priorities."
      },
      {
        title: "Long-term support",
        desc: "Technology should continue evolving with the business. We provide dedicated support agreements covering updates, monitoring and continuous improvements."
      }
    ];

    for (const r of reasons) {
      page.drawRectangle({
        x: 48,
        y: y - 56,
        width: width - 96,
        height: 64,
        color: LIGHT_BG,
        borderColor: BORDER,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: 48,
        y: y - 56,
        width: 4,
        height: 64,
        color: ORANGE,
      });

      // Small Orange Dot
      page.drawRectangle({
        x: 62,
        y: y - 7,
        width: 6,
        height: 6,
        color: ORANGE,
      });

      page.drawText(r.title, {
        x: 76,
        y: y - 8,
        size: 11,
        font: fontBold,
        color: DARK,
      });

      page.drawText(r.desc, {
        x: 62,
        y: y - 24,
        size: 8.2,
        font: fontRegular,
        color: MUTED,
        maxWidth: width - 130,
        lineHeight: 12,
      });

      y -= 74;
    }

    y -= 10;

    // Quote Box
    page.drawRectangle({
      x: 48,
      y: y - 66,
      width: width - 96,
      height: 72,
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawText("\"Technology should adapt to your business, not force your business to adapt", {
      x: 64,
      y: y - 24,
      size: 9.5,
      font: fontBold,
      color: DARK,
    });

    page.drawText("to rigid off-the-shelf software.\"", {
      x: 64,
      y: y - 40,
      size: 9.5,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("— Jyot Enterprise Core Engineering Principle", {
      x: 64,
      y: y - 56,
      size: 7.5,
      font: fontRegular,
      color: MUTED,
    });

    drawPageFooter(page, 5, TOTAL_PAGES, fontRegular, fontBold);
  }

  // ==========================================
  // PAGE 6 — TECHNOLOGY & DELIVERY STANDARDS
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Technology & Engineering Standards", fontRegular, fontBold, logoMark);

    let y = height - 85;

    drawCategoryPill(page, "STANDARDS & STACK", 48, y, fontBold);
    y -= 30;

    page.drawText("Technology & Engineering Standards", {
      x: 48,
      y,
      size: 20,
      font: fontBold,
      color: DARK,
    });

    y -= 16;
    page.drawText("Built exclusively on battle-tested, open technologies actually deployed and supported across our client engagements.", {
      x: 48,
      y,
      size: 8.5,
      font: fontRegular,
      color: MUTED,
    });

    y -= 30;

    const stackCategories = [
      {
        title: "Frontend Architecture",
        techs: ["React", "TypeScript", "TanStack Start", "Tailwind CSS"],
        desc: "Component-driven, responsive user interfaces with strict type-safety, accessible navigation and rapid rendering across mobile and desktop devices."
      },
      {
        title: "Backend Services & Business Logic",
        techs: ["Python", "Flask / FastAPI", "Node.js (where applicable)"],
        desc: "Modular API backends, RESTful endpoints, background workers and clean request-response pipelines tailored to specific operational throughput."
      },
      {
        title: "Database & Data Solutions",
        techs: ["PostgreSQL", "Supabase", "MySQL (where applicable)"],
        desc: "Relational data modeling, ACID compliance, structured migrations, indexed query performance and clean relational integrity across business entities."
      },
      {
        title: "Infrastructure & Engineering Workflow",
        techs: ["Cloud Deployment", "REST APIs", "Git / GitHub", "CI/CD (where applicable)"],
        desc: "Version-controlled development repositories, isolated staging environments, automated build checks and disciplined production release procedures."
      }
    ];

    for (const cat of stackCategories) {
      page.drawRectangle({
        x: 48,
        y: y - 82,
        width: width - 96,
        height: 90,
        color: LIGHT_BG,
        borderColor: BORDER,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: 48,
        y: y - 82,
        width: 4,
        height: 90,
        color: ORANGE,
      });

      page.drawText(cat.title, {
        x: 64,
        y: y - 10,
        size: 11,
        font: fontBold,
        color: DARK,
      });

      // Render Pills for Technologies
      let techX = 64;
      for (const t of cat.techs) {
        const pillWidth = t.length * 5 + 14;
        page.drawRectangle({
          x: techX,
          y: y - 32,
          width: pillWidth,
          height: 16,
          color: WHITE,
          borderColor: BORDER,
          borderWidth: 0.75,
        });

        page.drawText(t, {
          x: techX + 7,
          y: y - 27,
          size: 7.5,
          font: fontBold,
          color: ORANGE,
        });

        techX += pillWidth + 6;
      }

      page.drawText(cat.desc, {
        x: 64,
        y: y - 48,
        size: 8.2,
        font: fontRegular,
        color: MUTED,
        maxWidth: width - 130,
        lineHeight: 12,
      });

      y -= 100;
    }

    y -= 10;

    // Direct Code Ownership Guarantee Box
    page.drawRectangle({
      x: 48,
      y: y - 76,
      width: width - 96,
      height: 82,
      color: WHITE,
      borderColor: ORANGE,
      borderWidth: 1,
    });

    page.drawText("CLIENT INTELLECTUAL PROPERTY & CODE OWNERSHIP", {
      x: 64,
      y: y - 14,
      size: 9,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("• Full Source Code Transfer: Upon milestone settlement, you own 100% of bespoke code, database structures and designs.", {
      x: 64,
      y: y - 32,
      size: 7.8,
      font: fontRegular,
      color: DARK,
    });

    page.drawText("• No Proprietary Vendor Lock-in: Built using industry-standard open tools so your internal team can manage it anytime.", {
      x: 64,
      y: y - 48,
      size: 7.8,
      font: fontRegular,
      color: DARK,
    });

    page.drawText("• Hosting Independence: Deployed directly on your own infrastructure account with full administrative ownership.", {
      x: 64,
      y: y - 64,
      size: 7.8,
      font: fontRegular,
      color: DARK,
    });

    drawPageFooter(page, 6, TOTAL_PAGES, fontRegular, fontBold);
  }

  // ==========================================
  // PAGE 7 — FINAL CONTACT PAGE
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Contact Jyot Enterprise", fontRegular, fontBold, logoMark);

    let y = height - 85;

    drawCategoryPill(page, "GET IN TOUCH", 48, y, fontBold);
    y -= 30;

    page.drawText("Let's Build Something Useful", {
      x: 48,
      y,
      size: 24,
      font: fontBold,
      color: DARK,
    });

    y -= 22;

    page.drawText("Have a software, automation or digital transformation requirement?", {
      x: 48,
      y,
      size: 11,
      font: fontBold,
      color: ORANGE,
    });

    y -= 18;

    page.drawText("Talk to Jyot Enterprise to discuss your business workflow and identify the right technology approach.", {
      x: 48,
      y,
      size: 9.5,
      font: fontRegular,
      color: MUTED,
      maxWidth: width - 96,
      lineHeight: 14,
    });

    y -= 44;

    // Contact Methods Card
    page.drawRectangle({
      x: 48,
      y: y - 110,
      width: width - 96,
      height: 118,
      color: LIGHT_BG,
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: 48,
      y: y - 110,
      width: 4,
      height: 118,
      color: ORANGE,
    });

    page.drawText("DIRECT INQUIRY CHANNELS", {
      x: 64,
      y: y - 16,
      size: 8.5,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("Primary Phone:    +91 95374 30101", {
      x: 64,
      y: y - 38,
      size: 11,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Secondary Phone: +91 77780 08999", {
      x: 64,
      y: y - 58,
      size: 11,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Official Email:      jyotenterpriseofficial@gmail.com", {
      x: 64,
      y: y - 80,
      size: 10,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Availability:         Monday – Saturday  •  09:30 – 19:00 IST", {
      x: 64,
      y: y - 100,
      size: 8.5,
      font: fontRegular,
      color: MUTED,
    });

    y -= 135;

    // Office Locations Card
    page.drawRectangle({
      x: 48,
      y: y - 110,
      width: width - 96,
      height: 118,
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawText("OFFICE PRESENCE", {
      x: 64,
      y: y - 16,
      size: 8.5,
      font: fontBold,
      color: ORANGE,
    });

    // Gandhinagar
    page.drawText("Gandhinagar Office (Corporate):", {
      x: 64,
      y: y - 36,
      size: 9,
      font: fontBold,
      color: DARK,
    });

    page.drawText("B2 Building, 6th Floor, Office B-616, The Landmark, Near Kudasan, Gandhinagar, Gujarat – 382419", {
      x: 64,
      y: y - 50,
      size: 8,
      font: fontRegular,
      color: MUTED,
      maxWidth: width - 130,
    });

    // Palanpur
    page.drawText("Palanpur Office (Regional):", {
      x: 64,
      y: y - 72,
      size: 9,
      font: fontBold,
      color: DARK,
    });

    page.drawText("47, Sanskrit Complex, Abu Highway, Palanpur, Gujarat – 385001", {
      x: 64,
      y: y - 86,
      size: 8,
      font: fontRegular,
      color: MUTED,
      maxWidth: width - 130,
    });

    y -= 140;

    // Big Brand Closing Banner
    page.drawRectangle({
      x: 48,
      y: y - 100,
      width: width - 96,
      height: 106,
      color: LIGHT_BG,
      borderColor: BORDER,
      borderWidth: 1,
    });

    // Left vertical orange accent stripe
    page.drawRectangle({
      x: 48,
      y: y - 100,
      width: 4,
      height: 106,
      color: ORANGE,
    });

    page.drawText("JYOT ENTERPRISE", {
      x: 68,
      y: y - 28,
      size: 16,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("IT  •  AI  •  AUTOMATION  •  ERP  •  CRM  •  DIGITAL TRANSFORMATION", {
      x: 68,
      y: y - 48,
      size: 8.5,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Structured technology solutions engineered around real business operations.", {
      x: 68,
      y: y - 68,
      size: 8.5,
      font: fontRegular,
      color: MUTED,
    });

    page.drawText("Phone: +91 95374 30101  •  Email: jyotenterpriseofficial@gmail.com", {
      x: 68,
      y: y - 86,
      size: 8.5,
      font: fontBold,
      color: DARK,
    });

    drawPageFooter(page, 7, TOTAL_PAGES, fontRegular, fontBold);
  }

  // Save the PDF
  const pdfBytes = await doc.save();

  // Save as exact requested filename
  const requestedFile = path.join(OUT_DIR, 'Jyot-Enterprise-IT-Services-Capability-Brochure.pdf');
  fs.writeFileSync(requestedFile, pdfBytes);
  console.log(`Saved: ${requestedFile}`);

  // Save as canonical brochure file
  const canonicalFile = path.join(OUT_DIR, 'jyot-it-services-capability-brochure.pdf');
  fs.writeFileSync(canonicalFile, pdfBytes);
  console.log(`Saved: ${canonicalFile}`);

  // Save as alias
  const aliasFile = path.join(OUT_DIR, 'it-brochure.pdf');
  fs.writeFileSync(aliasFile, pdfBytes);
  console.log(`Saved: ${aliasFile}`);

  console.log('Successfully generated the 7-page Jyot Enterprise IT Services Capability Brochure!');
}

buildBrochure().catch(console.error);
