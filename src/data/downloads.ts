import { CONTACT, type ServiceKey } from "./site";

/**
 * Phase 5 — download centre. Every practice ships a brochure, a checklist,
 * a process guide and an FAQ sheet. Files are generated on demand from the
 * structured content below so nothing goes stale.
 */

export type DownloadKind = "Brochure" | "Checklist" | "Process Guide" | "FAQ Sheet";

export type DownloadItem = {
  slug: string;
  division: ServiceKey;
  kind: DownloadKind;
  title: string;
  summary: string;
  pages: number;
  fileUrl?: string;
  downloadName?: string;
  sections: { heading: string; lines: string[] }[];
};

const build = (
  division: ServiceKey,
  label: string,
  items: {
    kind: DownloadKind;
    title: string;
    summary: string;
    pages: number;
    fileUrl?: string;
    downloadName?: string;
    sections: DownloadItem["sections"];
  }[],
): DownloadItem[] =>
  items.map((i) => {
    const slug = `${division}-${i.kind.toLowerCase().replace(/\s+/g, "-")}`;
    const filename = i.downloadName || `${slug}.pdf`;
    return {
      ...i,
      division,
      slug,
      title: i.title || `${label} ${i.kind}`,
      fileUrl: i.fileUrl || `/downloads/${filename}`,
      downloadName: filename,
    };
  });

export const DOWNLOADS: DownloadItem[] = [
  ...build("financial", "Financial", [
    {
      kind: "Brochure",
      title: "Jyot Financial Services — Capability Brochure",
      summary: "Every funding and risk product we run, with typical ticket sizes and turnaround.",
      pages: 8,
      fileUrl: "/downloads/Jyot-Enterprise-Financial-Services-Capability-Brochure.pdf",
      downloadName: "Jyot-Enterprise-Financial-Services-Capability-Brochure.pdf",
      sections: [
        {
          heading: "What we do",
          lines: [
            "Retail and business credit advisory",
            "Project and structured finance",
            "Insurance and investment advisory",
          ],
        },
        {
          heading: "Typical mandates",
          lines: [
            "Home loans Rs. 25 L - Rs. 5 Cr",
            "Business and MSME loans Rs. 10 L - Rs. 15 Cr",
            "Project finance Rs. 5 Cr and above",
          ],
        },
        {
          heading: "How we are paid",
          lines: ["Success-linked fee on disbursement", "No fee if the file is not sanctioned"],
        },
      ],
    },
    {
      kind: "Checklist",
      title: "Loan Document Checklist",
      summary: "Everything a lender will ask for, by loan type and applicant profile.",
      pages: 4,
      fileUrl: "/downloads/Jyot-Enterprise-Loan-Document-Checklist.pdf",
      downloadName: "Jyot-Enterprise-Loan-Document-Checklist.pdf",
      sections: [
        {
          heading: "Salaried applicants",
          lines: ["PAN, Aadhaar", "3 months salary slips", "6 months bank statement", "Form 16"],
        },
        {
          heading: "Self-employed",
          lines: [
            "3 years ITR and computation",
            "Audited financials",
            "12 months current account statement",
            "GST returns",
          ],
        },
        {
          heading: "Secured loans",
          lines: [
            "Title deed and chain documents",
            "Approved plan",
            "Latest tax receipt",
            "Valuation access",
          ],
        },
      ],
    },
    {
      kind: "Process Guide",
      title: "From Enquiry to Disbursement",
      summary: "The nine steps of a loan file and what can slow each one down.",
      pages: 6,
      fileUrl: "/downloads/Jyot-Enterprise-Loan-Enquiry-to-Disbursement-Guide.pdf",
      downloadName: "Jyot-Enterprise-Loan-Enquiry-to-Disbursement-Guide.pdf",
      sections: [
        {
          heading: "Stages",
          lines: [
            "Eligibility review",
            "Lender shortlist",
            "File login",
            "Credit appraisal",
            "Valuation and legal",
            "Sanction",
            "Documentation",
            "Disbursement",
            "Post-disbursement support",
          ],
        },
        {
          heading: "Common delays",
          lines: ["Incomplete KYC", "Unclear property chain", "Undisclosed existing EMIs"],
        },
      ],
    },
    {
      kind: "FAQ Sheet",
      title: "Financial Services — FAQs",
      summary: "The twenty questions our credit desk answers every week.",
      pages: 5,
      fileUrl: "/downloads/Jyot-Enterprise-Financial-Services-FAQs.pdf",
      downloadName: "Jyot-Enterprise-Financial-Services-FAQs.pdf",
      sections: [
        {
          heading: "Eligibility",
          lines: [
            "How is FOIR calculated?",
            "Does a co-applicant raise my sanction?",
            "What CIBIL score do I need?",
          ],
        },
        {
          heading: "Cost",
          lines: [
            "What are processing charges?",
            "Is a balance transfer worth it?",
            "When is a floating rate better?",
          ],
        },
      ],
    },
  ]),
  ...build("it", "IT", [
    {
      kind: "Brochure",
      title: "Jyot Enterprise — IT Services Capability Brochure",
      summary:
        "Technology solutions designed around the way your business works. Custom software, ERP, CRM, AI automation, and cloud & API integration.",
      pages: 7,
      fileUrl: "/downloads/Jyot-Enterprise-IT-Services-Capability-Brochure.pdf",
      downloadName: "Jyot-Enterprise-IT-Services-Capability-Brochure.pdf",
      sections: [
        {
          heading: "Core Practice Areas",
          lines: [
            "Custom Software & Product Engineering",
            "Jyot ERP — Business Operations",
            "Jyot CRM & Lead Automation",
            "AI & Intelligent Automation",
            "Cloud, DevOps & API Integration",
          ],
        },
        {
          heading: "Delivery & Standards",
          lines: [
            "8-stage structured delivery approach from Discovery to Support",
            "Verified modern stack: React, TypeScript, TanStack Start, Tailwind, Python, PostgreSQL",
            "100% bespoke source code and data ownership transferred to client",
          ],
        },
      ],
    },
    {
      kind: "Checklist",
      title: "Software Project Readiness Checklist",
      summary:
        "A practical checklist to help businesses organize requirements, users, workflows, data, integrations and deployment expectations before starting development.",
      pages: 4,
      fileUrl: "/downloads/Jyot-Enterprise-Software-Project-Readiness-Checklist.pdf",
      downloadName: "Jyot-Enterprise-Software-Project-Readiness-Checklist.pdf",
      sections: [
        {
          heading: "Scope & Users",
          lines: [
            "Section 1 — Business Objective & Success Metrics",
            "Section 2 — Users & Role-Based Access Matrix",
            "Section 3 — Feature List & Module Selection",
            "Section 4 — Current vs Automated Business Workflow",
          ],
        },
        {
          heading: "Technical & Launch Readiness",
          lines: [
            "Section 5 — Data Requirements & Legacy Migration",
            "Section 6 — Third-Party Integrations & Gateways",
            "Section 7 — Design, Branding & Benchmark References",
            "Section 8 — Security, Access & Permissions",
            "Section 9 & 10 — Deployment & Final Readiness Confirmation",
          ],
        },
      ],
    },
    {
      kind: "Process Guide",
      title: "How We Ship Software",
      summary:
        "From business idea to production-ready software. Clear process, practical technology, and measurable 8-stage delivery.",
      pages: 4,
      fileUrl: "/downloads/Jyot-Enterprise-How-We-Ship-Software.pdf",
      downloadName: "Jyot-Enterprise-How-We-Ship-Software.pdf",
      sections: [
        {
          heading: "Stages 01–04",
          lines: [
            "01 Discovery — Understand business goals, users & existing workflow",
            "02 Planning — Turn requirements into a structured delivery plan",
            "03 UI/UX Design — Design intuitive, responsive user experiences",
            "04 Development — Build frontend, backend, database, APIs & business logic",
          ],
        },
        {
          heading: "Stages 05–08 & Delivery Principles",
          lines: [
            "05 Testing — Verify functionality, responsiveness & reliability",
            "06 UAT — Client review, feedback, improvements & sign-off",
            "07 Deployment — Move approved solution to live production",
            "08 Support — Ongoing maintenance, enhancements & evolution",
            "Principles — Business-first, Clarity, Quality, Security, Scalability, Usability",
          ],
        },
      ],
    },
    {
      kind: "FAQ Sheet",
      title: "IT Services — Frequently Asked Questions",
      summary:
        "14 transparent answers to common questions about custom software, ERP, CRM, AI automation, APIs, mobile responsiveness, data migration and security.",
      pages: 4,
      fileUrl: "/downloads/Jyot-Enterprise-IT-Services-FAQs.pdf",
      downloadName: "Jyot-Enterprise-IT-Services-FAQs.pdf",
      sections: [
        {
          heading: "Solutions & Architecture",
          lines: [
            "Q1–Q4: Custom software scope, workflow alignment, ERP & CRM capabilities",
            "Q5–Q7: AI integrations, 3rd-party APIs, and mobile device responsiveness",
          ],
        },
        {
          heading: "Commercials & Operations",
          lines: [
            "Q8–Q11: Deployment, post-launch support, project kickoff & data migration",
            "Q12–Q14: Software security, internal business tools & post-launch evolution",
          ],
        },
      ],
    },
  ]),
  ...build("legal", "Legal", [
    {
      kind: "Brochure",
      title: "Jyot Legal & Compliance — Capability Brochure",
      summary: "Registrations, filings, IP and contracts handled as a standing desk.",
      pages: 8,
      fileUrl: "/downloads/Jyot-Enterprise-Legal-Compliance-Capability-Brochure.pdf",
      downloadName: "Jyot-Enterprise-Legal-Compliance-Capability-Brochure.pdf",
      sections: [
        {
          heading: "Services",
          lines: [
            "Company and GST registration",
            "Monthly and annual filings",
            "Trademark and IP",
            "Contracts and notices",
          ],
        },
      ],
    },
    {
      kind: "Checklist",
      title: "Annual Compliance Checklist",
      summary: "Every recurring obligation by entity type, with due dates.",
      pages: 4,
      fileUrl: "/downloads/Jyot-Enterprise-Annual-Compliance-Checklist.pdf",
      downloadName: "Jyot-Enterprise-Annual-Compliance-Checklist.pdf",
      sections: [
        {
          heading: "Monthly",
          lines: ["GSTR-1 by the 11th", "GSTR-3B by the 20th", "TDS payment by the 7th"],
        },
        {
          heading: "Annual",
          lines: ["AOC-4 and MGT-7", "Income tax return", "DIR-3 KYC", "Statutory audit"],
        },
      ],
    },
    {
      kind: "Process Guide",
      title: "Registration to Steady State",
      summary: "What happens in your first ninety days as a registered entity.",
      pages: 5,
      fileUrl: "/downloads/Jyot-Enterprise-Company-Registration-to-Steady-State-Guide.pdf",
      downloadName: "Jyot-Enterprise-Company-Registration-to-Steady-State-Guide.pdf",
      sections: [
        {
          heading: "First 90 days",
          lines: [
            "Incorporation",
            "PAN, TAN, bank account",
            "GST registration",
            "First filings",
            "Compliance calendar handover",
          ],
        },
      ],
    },
    {
      kind: "FAQ Sheet",
      title: "Legal & Compliance — FAQs",
      summary: "Penalties, notices, structure changes and IP timelines.",
      pages: 4,
      fileUrl: "/downloads/Jyot-Enterprise-Legal-Compliance-FAQs.pdf",
      downloadName: "Jyot-Enterprise-Legal-Compliance-FAQs.pdf",
      sections: [
        {
          heading: "Common questions",
          lines: [
            "What happens if I file late?",
            "Can an LLP convert to a Pvt Ltd?",
            "How long does a trademark take?",
          ],
        },
      ],
    },
  ]),
  ...build("engineering", "Engineering", [
    {
      kind: "Brochure",
      title: "Jyot Engineering — Capability Brochure",
      summary: "Design, automation, machine building and manufacturing support.",
      pages: 9,
      fileUrl: "/downloads/Jyot-Enterprise-Engineering-Services-Capability-Brochure.pdf",
      downloadName: "Jyot-Enterprise-Engineering-Services-Capability-Brochure.pdf",
      sections: [
        {
          heading: "Capabilities",
          lines: [
            "CAD and CAE",
            "Special purpose machines",
            "Industrial automation and PLC",
            "Reverse engineering and prototyping",
          ],
        },
      ],
    },
    {
      kind: "Checklist",
      title: "Engineering Enquiry Checklist",
      summary: "The inputs we need to quote a design or automation mandate accurately.",
      pages: 3,
      fileUrl: "/downloads/Jyot-Enterprise-Engineering-Enquiry-Checklist.pdf",
      downloadName: "Jyot-Enterprise-Engineering-Enquiry-Checklist.pdf",
      sections: [
        {
          heading: "Send with your enquiry",
          lines: [
            "Existing drawings (DWG / STEP / PDF)",
            "Cycle time target",
            "Material and finish spec",
            "Batch size",
            "Site constraints",
          ],
        },
      ],
    },
    {
      kind: "Process Guide",
      title: "Concept to Commissioning",
      summary: "How an engineering mandate moves from brief to signed-off machine.",
      pages: 6,
      fileUrl: "/downloads/Jyot-Enterprise-Concept-to-Commissioning-Guide.pdf",
      downloadName: "Jyot-Enterprise-Concept-to-Commissioning-Guide.pdf",
      sections: [
        {
          heading: "Stages",
          lines: [
            "Requirement study",
            "Concept and DFM review",
            "Detailed design",
            "Manufacturing",
            "Assembly and trials",
            "Commissioning and training",
          ],
        },
      ],
    },
    {
      kind: "FAQ Sheet",
      title: "Engineering — FAQs",
      summary: "IP on drawings, warranty, spares, AMC and site support.",
      pages: 4,
      fileUrl: "/downloads/Jyot-Enterprise-Engineering-FAQs.pdf",
      downloadName: "Jyot-Enterprise-Engineering-FAQs.pdf",
      sections: [
        {
          heading: "Common questions",
          lines: [
            "Who owns the design IP?",
            "What warranty applies?",
            "Do you supply spares and AMC?",
          ],
        },
      ],
    },
  ]),
];

export function downloadsFor(division: ServiceKey) {
  return DOWNLOADS.filter((d) => d.division === division);
}

/** Renders a download item as a plain-text document the browser can save. */
export function renderDownloadText(item: DownloadItem): string {
  const rule = "=".repeat(64);
  const lines = [
    "JYOT ENTERPRISE",
    item.title,
    rule,
    item.summary,
    "",
    ...item.sections.flatMap((s) => [
      s.heading.toUpperCase(),
      ...s.lines.map((l) => `  • ${l}`),
      "",
    ]),
    rule,
    `${CONTACT.address} · ${CONTACT.email} · ${CONTACT.phone}`,
    `Generated ${new Date().toLocaleDateString("en-IN")}`,
  ];
  return lines.join("\n");
}
