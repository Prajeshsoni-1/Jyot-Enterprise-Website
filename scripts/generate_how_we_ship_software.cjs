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

function drawPageHeader(page, title, fontRegular, fontBold, logoMark) {
  const { width, height } = page.getSize();

  // Top orange accent stripe
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

    page.drawText("HOW WE SHIP SOFTWARE — DELIVERY MODEL", {
      x: 82,
      y: topY - 6,
      size: 6.5,
      font: fontBold,
      color: ORANGE,
    });
  }

  page.drawText(title, {
    x: width - 48 - (title.length * 5.2),
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

  page.drawText("Jyot Enterprise  •  Software Engineering & Delivery Framework", {
    x: 48,
    y: y + 2,
    size: 7.2,
    font: fontRegular,
    color: MUTED,
  });

  page.drawText("Contact: +91 95374 30101  •  +91 77780 08999", {
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

async function generateHowWeShipSoftware() {
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

  // ==========================================
  // PAGE 1: COVER
  // ==========================================
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

    // Side accent line
    page.drawRectangle({
      x: 48,
      y: 0,
      width: 4,
      height: height - 12,
      color: ORANGE,
    });

    // Logo
    const logoW = 200;
    const logoH = (logoImg.height / logoImg.width) * logoW;
    page.drawImage(logoImg, {
      x: 68,
      y: height - 120,
      width: logoW,
      height: logoH,
    });

    page.drawText("SOFTWARE ENGINEERING FRAMEWORK", {
      x: 70,
      y: height - 150,
      size: 11,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("HOW WE SHIP", {
      x: 70,
      y: height - 200,
      size: 36,
      font: fontBold,
      color: DARK,
    });

    page.drawText("SOFTWARE", {
      x: 70,
      y: height - 245,
      size: 36,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("From business idea to production-ready software.", {
      x: 70,
      y: height - 275,
      size: 13,
      font: fontBold,
      color: DARK,
    });

    // Principle Callout Box
    page.drawRectangle({
      x: 70,
      y: height - 340,
      width: width - 118,
      height: 48,
      color: LIGHT_BG,
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: 70,
      y: height - 340,
      width: 4,
      height: 48,
      color: ORANGE,
    });

    page.drawText("\"Clear process. Practical technology. Measurable delivery.\"", {
      x: 88,
      y: height - 312,
      size: 12,
      font: fontBold,
      color: DARK,
    });

    // 8-Stage Visual Timeline Summary Card
    page.drawRectangle({
      x: 70,
      y: height - 600,
      width: width - 118,
      height: 240,
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawText("THE 8-STAGE DELIVERY ROADMAP", {
      x: 88,
      y: height - 380,
      size: 9.5,
      font: fontBold,
      color: ORANGE,
    });

    const roadmap = [
      { num: "01", title: "Discovery", desc: "Understand business goals, users & existing workflow" },
      { num: "02", title: "Planning", desc: "Define features, architecture, scope & delivery milestones" },
      { num: "03", title: "UI/UX Design", desc: "Design intuitive interfaces & responsive user experiences" },
      { num: "04", title: "Development", desc: "Build applications, database schemas, APIs & business logic" },
      { num: "05", title: "Testing", desc: "Verify functionality, security, responsiveness & reliability" },
      { num: "06", title: "UAT", desc: "Client reviews the working system and confirms sign-off" },
      { num: "07", title: "Deployment", desc: "Move approved solution into live production environment" },
      { num: "08", title: "Support", desc: "Provide continuous maintenance, fixes & system evolution" }
    ];

    let roadY = height - 408;
    for (const r of roadmap) {
      page.drawRectangle({
        x: 88,
        y: roadY - 2,
        width: 18,
        height: 14,
        color: ACCENT_BG,
        borderColor: ORANGE,
        borderWidth: 0.75,
      });

      page.drawText(r.num, {
        x: 92,
        y: roadY + 2,
        size: 7.5,
        font: fontBold,
        color: ORANGE,
      });

      page.drawText(r.title, {
        x: 114,
        y: roadY + 2,
        size: 8.5,
        font: fontBold,
        color: DARK,
      });

      page.drawText(`—  ${r.desc}`, {
        x: 185,
        y: roadY + 2,
        size: 7.8,
        font: fontRegular,
        color: MUTED,
      });

      roadY -= 23;
    }

    // Bottom Contact Box
    const bBoxY = 48;
    page.drawRectangle({
      x: 70,
      y: bBoxY,
      width: width - 118,
      height: 80,
      color: LIGHT_BG,
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawText("JYOT ENTERPRISE — CONSULTATION & INQUIRIES", {
      x: 88,
      y: bBoxY + 58,
      size: 8,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("Phone: +91 95374 30101   |   +91 77780 08999", {
      x: 88,
      y: bBoxY + 38,
      size: 10,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Email:  jyotenterpriseofficial@gmail.com", {
      x: 88,
      y: bBoxY + 20,
      size: 9.5,
      font: fontRegular,
      color: DARK,
    });
  }

  // ==========================================
  // PAGE 2: STAGES 01 TO 04
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Stages 01–04: Discovery to Development", fontRegular, fontBold, logoMark);

    let y = height - 80;

    const stagesPart1 = [
      {
        num: "01",
        stage: "DISCOVERY",
        heading: "Understand Before We Build",
        intro: "We start by understanding the business instead of immediately jumping into development.",
        pointsLabel: "We discuss:",
        points: [
          "Business goals",
          "Existing workflow",
          "Current challenges",
          "Users",
          "Required outcomes",
          "Existing systems"
        ],
        outcome: "A clear understanding of what the software needs to solve."
      },
      {
        num: "02",
        stage: "PLANNING",
        heading: "Turn Requirements Into a Plan",
        intro: "We organize the requirement into a practical delivery plan.",
        pointsLabel: "We define:",
        points: [
          "Features",
          "User roles",
          "Workflow",
          "Data requirements",
          "Integrations",
          "Technical architecture",
          "Project priorities"
        ],
        outcome: "A structured implementation direction."
      },
      {
        num: "03",
        stage: "UI/UX DESIGN",
        heading: "Design the Experience",
        intro: "We design interfaces around usability and business workflows.",
        pointsLabel: "Considerations:",
        points: [
          "User journeys",
          "Responsive layouts",
          "Navigation",
          "Forms",
          "Dashboards",
          "Mobile experience"
        ],
        outcome: "A clear interface that users can understand and operate."
      },
      {
        num: "04",
        stage: "DEVELOPMENT",
        heading: "Build the Solution",
        intro: "Development is organized around the approved requirements and workflow.",
        pointsLabel: "Development may include:",
        points: [
          "Frontend",
          "Backend",
          "Database",
          "APIs",
          "Authentication",
          "Business logic",
          "Integrations",
          "Admin systems"
        ],
        outcome: "Clean, modular code built according to verified specifications."
      }
    ];

    for (const st of stagesPart1) {
      const cardHeight = 154;

      page.drawRectangle({
        x: 48,
        y: y - cardHeight,
        width: CONTENT_WIDTH,
        height: cardHeight,
        color: LIGHT_BG,
        borderColor: BORDER,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: 48,
        y: y - cardHeight,
        width: 4,
        height: cardHeight,
        color: ORANGE,
      });

      // Number badge
      page.drawRectangle({
        x: 60,
        y: y - 22,
        width: 22,
        height: 16,
        color: ORANGE,
      });

      page.drawText(st.num, {
        x: 65,
        y: y - 18,
        size: 9.5,
        font: fontBold,
        color: WHITE,
      });

      page.drawText(st.stage, {
        x: 90,
        y: y - 18,
        size: 8.5,
        font: fontBold,
        color: ORANGE,
      });

      page.drawText(st.heading, {
        x: 180,
        y: y - 18,
        size: 11,
        font: fontBold,
        color: DARK,
      });

      page.drawText(st.intro, {
        x: 60,
        y: y - 38,
        size: 8.5,
        font: fontRegular,
        color: DARK,
      });

      // Points section
      page.drawText(st.pointsLabel, {
        x: 60,
        y: y - 56,
        size: 8,
        font: fontBold,
        color: MUTED,
      });

      // Points render in 2 or 3 columns
      let ptX = 60;
      let ptY = y - 72;
      const colStep = 155;

      for (let i = 0; i < st.points.length; i++) {
        page.drawText(`•  ${st.points[i]}`, {
          x: ptX,
          y: ptY,
          size: 7.8,
          font: fontRegular,
          color: DARK,
        });

        ptX += colStep;
        if ((i + 1) % 3 === 0) {
          ptX = 60;
          ptY -= 15;
        }
      }

      // Outcome Card Footer
      page.drawRectangle({
        x: 60,
        y: y - cardHeight + 10,
        width: CONTENT_WIDTH - 24,
        height: 22,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 0.75,
      });

      page.drawText("OUTCOME:", {
        x: 70,
        y: y - cardHeight + 17,
        size: 7.5,
        font: fontBold,
        color: ORANGE,
      });

      page.drawText(st.outcome, {
        x: 130,
        y: y - cardHeight + 17,
        size: 7.8,
        font: fontBold,
        color: DARK,
      });

      y -= cardHeight + 14;
    }

    drawPageFooter(page, 2, TOTAL_PAGES, fontRegular, fontBold);
  }

  // ==========================================
  // PAGE 3: STAGES 05 TO 08
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Stages 05–08: Testing to Support", fontRegular, fontBold, logoMark);

    let y = height - 80;

    const stagesPart2 = [
      {
        num: "05",
        stage: "TESTING",
        heading: "Verify Before Launch",
        intro: "We test important areas thoroughly before deploying to production.",
        pointsLabel: "We test:",
        points: [
          "Functional behavior",
          "Form validation",
          "Responsive UI",
          "Authentication",
          "Permissions",
          "Error handling",
          "Database behavior",
          "Security controls",
          "Browser compatibility"
        ],
        outcome: "A solution that has been verified before production release."
      },
      {
        num: "06",
        stage: "USER ACCEPTANCE TESTING",
        heading: "Client Review & Feedback",
        intro: "The client reviews the working system on live staging environments.",
        pointsLabel: "Iterative Approval Flow:",
        processSteps: ["Review", "Feedback", "Improvements", "Final approval"],
        outcome: "The delivered solution accurately matches the agreed business requirement."
      },
      {
        num: "07",
        stage: "DEPLOYMENT",
        heading: "Move to Production",
        intro: "Structured cutover to the live customer-facing environment.",
        pointsLabel: "Production preparation can include:",
        points: [
          "Domain configuration",
          "Hosting / cloud deployment",
          "Production database",
          "SSL / HTTPS security",
          "Environment configuration",
          "Production testing"
        ],
        outcome: "Clean live rollout with verified data flow and root access handover."
      },
      {
        num: "08",
        stage: "SUPPORT & EVOLUTION",
        heading: "Software Does Not End at Launch",
        intro: "We help the solution evolve as business requirements change over time.",
        pointsLabel: "After launch, businesses may require:",
        points: [
          "Bug fixes",
          "Maintenance",
          "Enhancements",
          "New features",
          "Performance improvements",
          "Technical support"
        ],
        outcome: "A dependable long-term engineering partner supporting your growth."
      }
    ];

    for (const st of stagesPart2) {
      const cardHeight = 154;

      page.drawRectangle({
        x: 48,
        y: y - cardHeight,
        width: CONTENT_WIDTH,
        height: cardHeight,
        color: LIGHT_BG,
        borderColor: BORDER,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: 48,
        y: y - cardHeight,
        width: 4,
        height: cardHeight,
        color: ORANGE,
      });

      page.drawRectangle({
        x: 60,
        y: y - 22,
        width: 22,
        height: 16,
        color: ORANGE,
      });

      page.drawText(st.num, {
        x: 65,
        y: y - 18,
        size: 9.5,
        font: fontBold,
        color: WHITE,
      });

      page.drawText(st.stage, {
        x: 90,
        y: y - 18,
        size: 8.5,
        font: fontBold,
        color: ORANGE,
      });

      page.drawText(st.heading, {
        x: 230,
        y: y - 18,
        size: 11,
        font: fontBold,
        color: DARK,
      });

      page.drawText(st.intro, {
        x: 60,
        y: y - 38,
        size: 8.5,
        font: fontRegular,
        color: DARK,
      });

      page.drawText(st.pointsLabel, {
        x: 60,
        y: y - 56,
        size: 8,
        font: fontBold,
        color: MUTED,
      });

      if (st.processSteps) {
        // Visual flow boxes
        let stepX = 60;
        for (let i = 0; i < st.processSteps.length; i++) {
          const stepName = st.processSteps[i];
          page.drawRectangle({
            x: stepX,
            y: y - 84,
            width: 90,
            height: 22,
            color: WHITE,
            borderColor: ORANGE,
            borderWidth: 1,
          });

          page.drawText(stepName, {
            x: stepX + 12,
            y: y - 76,
            size: 8.5,
            font: fontBold,
            color: DARK,
          });

          if (i < st.processSteps.length - 1) {
            page.drawText(">", {
              x: stepX + 96,
              y: y - 76,
              size: 11,
              font: fontBold,
              color: ORANGE,
            });
          }

          stepX += 114;
        }
      } else if (st.points) {
        let ptX = 60;
        let ptY = y - 72;
        const colStep = 155;

        for (let i = 0; i < st.points.length; i++) {
          page.drawText(`•  ${st.points[i]}`, {
            x: ptX,
            y: ptY,
            size: 7.8,
            font: fontRegular,
            color: DARK,
          });

          ptX += colStep;
          if ((i + 1) % 3 === 0) {
            ptX = 60;
            ptY -= 15;
          }
        }
      }

      // Outcome Card Footer
      page.drawRectangle({
        x: 60,
        y: y - cardHeight + 10,
        width: CONTENT_WIDTH - 24,
        height: 22,
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 0.75,
      });

      page.drawText("OUTCOME:", {
        x: 70,
        y: y - cardHeight + 17,
        size: 7.5,
        font: fontBold,
        color: ORANGE,
      });

      page.drawText(st.outcome, {
        x: 130,
        y: y - cardHeight + 17,
        size: 7.8,
        font: fontBold,
        color: DARK,
      });

      y -= cardHeight + 14;
    }

    drawPageFooter(page, 3, TOTAL_PAGES, fontRegular, fontBold);
  }

  // ==========================================
  // PAGE 4: DELIVERY PRINCIPLES + FINAL CTA
  // ==========================================
  {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const { width, height } = page.getSize();
    drawPageHeader(page, "Our Delivery Principles & Contact", fontRegular, fontBold, logoMark);

    let y = height - 80;

    page.drawText("ENGINEERING PHILOSOPHY", {
      x: 48,
      y,
      size: 8.5,
      font: fontBold,
      color: ORANGE,
    });

    y -= 22;
    page.drawText("Our Delivery Principles", {
      x: 48,
      y,
      size: 20,
      font: fontBold,
      color: DARK,
    });

    y -= 16;
    page.drawText("Six foundational tenets that guide every architecture, code commit and delivery milestone.", {
      x: 48,
      y,
      size: 8.5,
      font: fontRegular,
      color: MUTED,
    });

    y -= 30;

    const principles = [
      {
        title: "Business-first",
        desc: "Build around the actual business workflow. Technology is an instrument to solve operational bottlenecks."
      },
      {
        title: "Clarity",
        desc: "Keep requirements and communication structured. Transparent sprint reviews prevent misaligned scope."
      },
      {
        title: "Quality",
        desc: "Test important functionality before release. Automated linting, type checks and functional audits."
      },
      {
        title: "Security",
        desc: "Protect user access and business data. Role-based access controls and protected database operations."
      },
      {
        title: "Scalability",
        desc: "Keep future growth in mind. Structured relational schemas and modular architectures that expand seamlessly."
      },
      {
        title: "Usability",
        desc: "Make the system practical for its users. Intuitive navigation and responsive layouts staff can operate easily."
      }
    ];

    const colWidth = (CONTENT_WIDTH - 16) / 2;
    for (let i = 0; i < principles.length; i += 2) {
      const p1 = principles[i];
      const p2 = principles[i + 1];

      // P1
      page.drawRectangle({
        x: 48,
        y: y - 68,
        width: colWidth,
        height: 76,
        color: LIGHT_BG,
        borderColor: BORDER,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: 48,
        y: y - 68,
        width: 4,
        height: 76,
        color: ORANGE,
      });

      page.drawText(p1.title, {
        x: 62,
        y: y - 16,
        size: 11,
        font: fontBold,
        color: DARK,
      });

      page.drawText(p1.desc, {
        x: 62,
        y: y - 34,
        size: 8.2,
        font: fontRegular,
        color: MUTED,
        maxWidth: colWidth - 24,
        lineHeight: 12,
      });

      // P2
      if (p2) {
        page.drawRectangle({
          x: 48 + colWidth + 16,
          y: y - 68,
          width: colWidth,
          height: 76,
          color: LIGHT_BG,
          borderColor: BORDER,
          borderWidth: 1,
        });

        page.drawRectangle({
          x: 48 + colWidth + 16,
          y: y - 68,
          width: 4,
          height: 76,
          color: ORANGE,
        });

        page.drawText(p2.title, {
          x: 48 + colWidth + 30,
          y: y - 16,
          size: 11,
          font: fontBold,
          color: DARK,
        });

        page.drawText(p2.desc, {
          x: 48 + colWidth + 30,
          y: y - 34,
          size: 8.2,
          font: fontRegular,
          color: MUTED,
          maxWidth: colWidth - 24,
          lineHeight: 12,
        });
      }

      y -= 88;
    }

    y -= 15;

    // FINAL CALL TO ACTION CARD
    page.drawRectangle({
      x: 48,
      y: y - 145,
      width: CONTENT_WIDTH,
      height: 145,
      color: LIGHT_BG,
      borderColor: BORDER,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: 48,
      y: y - 145,
      width: 4,
      height: 145,
      color: ORANGE,
    });

    page.drawText("Have a software requirement?", {
      x: 68,
      y: y - 28,
      size: 16,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Let's discuss your workflow.", {
      x: 68,
      y: y - 50,
      size: 14,
      font: fontBold,
      color: ORANGE,
    });

    page.drawText("Talk to our engineering leads to outline architecture, sprints and fixed-scope delivery timelines.", {
      x: 68,
      y: y - 72,
      size: 8.5,
      font: fontRegular,
      color: MUTED,
    });

    page.drawText("Phone: +91 95374 30101   |   +91 77780 08999", {
      x: 68,
      y: y - 96,
      size: 10.5,
      font: fontBold,
      color: DARK,
    });

    page.drawText("Email:  jyotenterpriseofficial@gmail.com", {
      x: 68,
      y: y - 114,
      size: 9.5,
      font: fontRegular,
      color: DARK,
    });

    page.drawText("Jyot Enterprise  •  IT • AI • Automation • ERP • CRM • Digital Transformation", {
      x: 68,
      y: y - 132,
      size: 8.2,
      font: fontBold,
      color: ORANGE,
    });

    drawPageFooter(page, 4, TOTAL_PAGES, fontRegular, fontBold);
  }

  const pdfBytes = await doc.save();

  const requestedFile = path.join(OUT_DIR, 'Jyot-Enterprise-How-We-Ship-Software.pdf');
  fs.writeFileSync(requestedFile, pdfBytes);
  console.log(`Saved: ${requestedFile}`);

  // Canonical alias
  const canonicalFile = path.join(OUT_DIR, 'how-we-ship-software-process-guide.pdf');
  fs.writeFileSync(canonicalFile, pdfBytes);
  console.log(`Saved: ${canonicalFile}`);

  const aliasFile = path.join(OUT_DIR, 'it-process-guide.pdf');
  fs.writeFileSync(aliasFile, pdfBytes);
  console.log(`Saved: ${aliasFile}`);

  console.log('Successfully generated the 4-page How We Ship Software PDF!');
}

generateHowWeShipSoftware().catch(console.error);
