/**
 * Website CMS — shared, client-safe module definitions.
 *
 * One row shape powers every module: common publishing columns plus a
 * `data` JSONB bag for the module-specific structured content. The admin
 * UI is generated from FIELD definitions below, so adding a field is a
 * one-line change and no new screens are needed.
 *
 * Multi-line fields reuse the "Title | body" convention already used by the
 * static content in src/data, so imported content round-trips unchanged.
 */

export const CMS_STATUSES = ["draft", "published", "archived", "closed"] as const;
export type CmsStatus = (typeof CMS_STATUSES)[number];

export const CMS_MODULES = [
  "services",
  "sub_services",
  "products",
  "industries",
  "projects",
  "case_studies",
  "posts",
  "resources",
  "testimonials",
  "team_members",
  "faqs",
  "pages",
  "jobs",
  "downloads",
  "offices",
] as const;
export type CmsModule = (typeof CMS_MODULES)[number];

export type CmsRow = {
  id: string;
  slug: string | null;
  title?: string | null;
  question?: string | null;
  answer?: string | null;
  status: CmsStatus;
  featured: boolean;
  sort_order: number;
  summary?: string | null;
  excerpt?: string | null;
  body?: string | null;
  hero_title?: string | null;
  hero_description?: string | null;
  hero_image?: string | null;
  icon?: string | null;
  thumbnail?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  service_id?: string | null;
  industry_id?: string | null;
  parent_key?: string | null;
  service_key?: string | null;
  client?: string | null;
  industry?: string | null;
  service?: string | null;
  project_url?: string | null;
  technologies?: string[] | null;
  author?: string | null;
  author_role?: string | null;
  category?: string | null;
  tags?: string[] | null;
  read_time?: string | null;
  published_at?: string | null;
  resource_type?: string | null;
  file_path?: string | null;
  storage_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  description?: string | null;
  published?: boolean;
  file_bucket?: string | null;
  file_url?: string | null;
  department?: string | null;
  employment_type?: string | null;
  location?: string | null;
  work_mode?: string | null;
  experience?: string | null;
  salary?: string | null;
  openings?: number | null;
  deadline?: string | null;
  skills?: string[] | null;
  address?: string | null;
  maps_url?: string | null;
  embed_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  city?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null;
  og_image?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type FieldType = "text" | "textarea" | "lines" | "tags" | "number" | "bool" | "select";

export type CmsField = {
  name: string;
  label: string;
  type: FieldType;
  /** stored inside the JSONB `data` bag instead of a column */
  json?: boolean;
  help?: string;
  options?: string[];
  rows?: number;
};

export type CmsModuleDef = {
  key: CmsModule;
  table: string;
  label: string;
  singular: string;
  description: string;
  /** public URL prefix for preview links; null when the module has no own page */
  publicPath: string | null;
  titleField: "title" | "question";
  fields: CmsField[];
};

const SEO_FIELDS: CmsField[] = [
  { name: "seo_title", label: "SEO title", type: "text", help: "Under 60 characters." },
  {
    name: "seo_description",
    label: "SEO description",
    type: "textarea",
    help: "Under 160 characters.",
    rows: 2,
  },
  { name: "seo_keywords", label: "SEO keywords", type: "tags", help: "Comma separated." },
  { name: "og_image", label: "Social share image URL", type: "text" },
];

const PAIR_HELP = 'One per line. Use "Heading | description" to add a description.';

export const CMS_MODULE_DEFS: Record<CmsModule, CmsModuleDef> = {
  services: {
    key: "services",
    table: "cms_services",
    label: "Services",
    singular: "Service",
    description: "Main service divisions shown across the website.",
    publicPath: "/services",
    titleField: "title",
    fields: [
      { name: "title", label: "Service name", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text", help: "Example: financial" },
      {
        name: "service_key",
        label: "Division key",
        type: "select",
        options: ["financial", "it", "legal", "engineering", ""],
      },
      { name: "icon", label: "Icon name", type: "text", help: "Lucide icon, e.g. Landmark" },
      { name: "summary", label: "Short description", type: "textarea", rows: 2 },
      { name: "body", label: "Full description", type: "textarea", rows: 6 },
      { name: "hero_title", label: "Hero title", type: "text" },
      { name: "hero_description", label: "Hero description", type: "textarea", rows: 3 },
      { name: "hero_image", label: "Hero image URL", type: "text" },
      { name: "benefits", label: "Benefits", type: "lines", json: true, help: PAIR_HELP },
      {
        name: "features",
        label: "Features / offerings",
        type: "lines",
        json: true,
        help: PAIR_HELP,
      },
      { name: "process", label: "Process steps", type: "lines", json: true, help: PAIR_HELP },
      {
        name: "faqs",
        label: "FAQs",
        type: "lines",
        json: true,
        help: 'One per line: "Question | Answer".',
      },
      { name: "related", label: "Related service slugs", type: "tags", json: true },
      ...SEO_FIELDS,
    ],
  },
  sub_services: {
    key: "sub_services",
    table: "cms_sub_services",
    label: "Sub-services",
    singular: "Sub-service",
    description: "Individual offerings that sit under a service division.",
    publicPath: "/service",
    titleField: "title",
    fields: [
      { name: "title", label: "Sub-service name", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text" },
      { name: "service_id", label: "Parent service", type: "select", options: [] },
      {
        name: "parent_key",
        label: "Division key",
        type: "select",
        options: ["financial", "it", "legal", "engineering", ""],
      },
      { name: "summary", label: "Tagline", type: "textarea", rows: 2 },
      { name: "body", label: "Overview", type: "textarea", rows: 6 },
      { name: "hero_image", label: "Hero image URL", type: "text" },
      { name: "icon", label: "Icon name", type: "text" },
      { name: "benefits", label: "Benefits", type: "lines", json: true, help: PAIR_HELP },
      { name: "process", label: "Process steps", type: "lines", json: true, help: PAIR_HELP },
      { name: "timeline", label: "Typical timeline", type: "text", json: true },
      {
        name: "faqs",
        label: "FAQs",
        type: "lines",
        json: true,
        help: 'One per line: "Question | Answer".',
      },
      {
        name: "testimonial",
        label: "Testimonial",
        type: "text",
        json: true,
        help: '"Quote | Author"',
      },
      { name: "cta_label", label: "CTA label", type: "text" },
      { name: "cta_href", label: "CTA link", type: "text" },
      ...SEO_FIELDS,
    ],
  },
  industries: {
    key: "industries",
    table: "cms_industries",
    label: "Industries",
    singular: "Industry",
    description: "Industry landing pages.",
    publicPath: "/industries",
    titleField: "title",
    fields: [
      { name: "title", label: "Industry name", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text" },
      { name: "icon", label: "Icon name", type: "text" },
      { name: "hero_title", label: "Headline", type: "text" },
      { name: "summary", label: "Short description", type: "textarea", rows: 2 },
      { name: "body", label: "Full description", type: "textarea", rows: 6 },
      { name: "hero_image", label: "Hero image URL", type: "text" },
      { name: "painPoints", label: "Industry challenges", type: "lines", json: true },
      { name: "solutions", label: "Solutions", type: "lines", json: true, help: PAIR_HELP },
      {
        name: "services",
        label: "Services used",
        type: "lines",
        json: true,
        help: 'One per line: "Name | division | sub-slug".',
      },
      { name: "caseSlug", label: "Related case study slug", type: "text", json: true },
      {
        name: "stat",
        label: "Headline stat",
        type: "text",
        json: true,
        help: '"22% | Average no-show reduction"',
      },
      { name: "cta_label", label: "CTA label", type: "text" },
      { name: "cta_href", label: "CTA link", type: "text" },
      ...SEO_FIELDS,
    ],
  },
  projects: {
    key: "projects",
    table: "cms_projects",
    label: "Portfolio",
    singular: "Project",
    description: "Delivered projects shown in the portfolio.",
    publicPath: "/portfolio",
    titleField: "title",
    fields: [
      { name: "title", label: "Project name", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text" },
      { name: "client", label: "Client / company", type: "text" },
      { name: "industry", label: "Industry", type: "text" },
      { name: "service", label: "Service / practice", type: "text" },
      { name: "summary", label: "Short description", type: "textarea", rows: 2 },
      { name: "body", label: "Full description", type: "textarea", rows: 5 },
      { name: "challenge", label: "Challenge", type: "textarea", json: true, rows: 4 },
      { name: "solution", label: "Solution", type: "textarea", json: true, rows: 4 },
      { name: "outcome", label: "Results", type: "textarea", json: true, rows: 4 },
      {
        name: "metrics",
        label: "Result metrics",
        type: "lines",
        json: true,
        help: 'One per line: "21 days | Order-to-cash".',
      },
      { name: "technologies", label: "Technologies", type: "tags" },
      { name: "hero_image", label: "Featured image URL", type: "text" },
      { name: "gallery", label: "Project image URLs", type: "lines", json: true },
      { name: "project_url", label: "Project URL", type: "text" },
      { name: "duration", label: "Duration", type: "text", json: true },
      { name: "year", label: "Year", type: "text", json: true },
      { name: "quote", label: "Client quote", type: "textarea", json: true, rows: 2 },
      { name: "quoteBy", label: "Quote by", type: "text", json: true },
      ...SEO_FIELDS,
    ],
  },
  case_studies: {
    key: "case_studies",
    table: "cms_case_studies",
    label: "Case Studies",
    singular: "Case study",
    description: "Long-form outcome stories.",
    publicPath: "/case-studies",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text" },
      { name: "client", label: "Client", type: "text" },
      { name: "industry", label: "Industry", type: "text" },
      { name: "service", label: "Service / practice", type: "text" },
      { name: "summary", label: "Summary", type: "textarea", rows: 2 },
      { name: "problem", label: "Challenge", type: "textarea", json: true, rows: 4 },
      { name: "research", label: "Research points", type: "lines", json: true },
      { name: "solutionPoints", label: "Solution points", type: "lines", json: true },
      {
        name: "implementation",
        label: "Implementation phases",
        type: "lines",
        json: true,
        help: PAIR_HELP,
      },
      { name: "timeline", label: "Timeline", type: "lines", json: true, help: PAIR_HELP },
      {
        name: "roi",
        label: "Result metrics",
        type: "lines",
        json: true,
        help: '"₹2.4 Cr | Working capital released"',
      },
      { name: "roiSummary", label: "Results summary", type: "textarea", json: true, rows: 3 },
      { name: "feedback", label: "Client feedback", type: "textarea", json: true, rows: 2 },
      { name: "person", label: "Feedback by", type: "text", json: true },
      { name: "body", label: "Additional content", type: "textarea", rows: 5 },
      { name: "hero_image", label: "Hero image URL", type: "text" },
      ...SEO_FIELDS,
    ],
  },
  posts: {
    key: "posts",
    table: "cms_posts",
    label: "Blogs",
    singular: "Article",
    description: "Insight articles published under /blogs.",
    publicPath: "/blogs",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text" },
      { name: "excerpt", label: "Excerpt", type: "textarea", rows: 3 },
      { name: "hero_image", label: "Featured image URL", type: "text" },
      { name: "author", label: "Author", type: "text" },
      { name: "author_role", label: "Author role", type: "text" },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: ["Finance", "Technology", "AI", "Legal", "Engineering", "Business", "Marketing"],
      },
      { name: "tags", label: "Tags", type: "tags" },
      {
        name: "body",
        label: "Content",
        type: "textarea",
        rows: 18,
        help: 'Start a section with "## Heading". Bullet lines start with "- ".',
      },
      { name: "read_time", label: "Reading time", type: "text", help: "e.g. 6 min" },
      { name: "published_at", label: "Publish date", type: "text", help: "YYYY-MM-DD" },
      { name: "takeaway", label: "Key takeaway", type: "textarea", json: true, rows: 3 },
      ...SEO_FIELDS,
    ],
  },
  resources: {
    key: "resources",
    table: "cms_resources",
    label: "Resources",
    singular: "Resource",
    description: "Guides, checklists and downloadable templates.",
    publicPath: "/resources",
    titleField: "title",
    fields: [
      { name: "title", label: "Resource title", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text" },
      {
        name: "resource_type",
        label: "Type",
        type: "select",
        options: [
          "Guide",
          "Checklist",
          "Template",
          "Calculator",
          "Report",
          "Ebook",
          "Whitepaper",
          "Case Study",
          "Other",
        ],
      },
      {
        name: "category",
        label: "Practice / Division",
        type: "select",
        options: ["Financial", "IT", "Legal", "Engineering", "Business", "Other"],
      },
      {
        name: "subCategory",
        label: "Sub-category",
        type: "text",
        json: true,
        help: "e.g. GST, ERP Selection, Trademark",
      },
      { name: "industry", label: "Industry (optional)", type: "text" },
      { name: "icon", label: "Icon name", type: "text" },
      { name: "thumbnail", label: "Thumbnail URL", type: "text" },
      { name: "hero_image", label: "Featured image URL", type: "text" },
      { name: "summary", label: "Short description", type: "textarea", rows: 3 },
      { name: "body", label: "Full description / intro", type: "textarea", rows: 5 },
      { name: "author", label: "Author name", type: "text" },
      { name: "author_role", label: "Author role / designation", type: "text" },
      { name: "author_image", label: "Author photo URL", type: "text", json: true },
      { name: "read_time", label: "Read time", type: "text", json: true, help: "e.g. 6 min" },
      { name: "published_at", label: "Publish date", type: "text", help: "YYYY-MM-DD" },
      {
        name: "sections",
        label: "Content blocks (JSON)",
        type: "lines",
        json: true,
        help: "Managed via the dedicated Resource Editor.",
      },
      { name: "faqs", label: "FAQs", type: "lines", json: true, help: '"Question | Answer"' },
      {
        name: "downloads",
        label: "Download items (legacy fallback)",
        type: "lines",
        json: true,
        help: '"Name | PDF | 240 KB" — use the Downloads tab in the editor for real files.',
      },
      {
        name: "cta",
        label: "CTA block (JSON)",
        type: "text",
        json: true,
        help: "Managed via the Resource Editor CTA tab.",
      },
      {
        name: "file_bucket",
        label: "Private file bucket",
        type: "text",
        help: "Leave blank unless the file is protected.",
      },
      { name: "file_path", label: "Private file path", type: "text" },
      { name: "cta_label", label: "Download CTA label", type: "text" },
      ...SEO_FIELDS,
    ],
  },

  pages: {
    key: "pages",
    table: "cms_pages",
    label: "Pages",
    singular: "Page",
    description: "Home and About page content, section titles, visibility and order.",
    publicPath: null,
    titleField: "title",
    fields: [
      { name: "title", label: "Page name", type: "text" },
      { name: "slug", label: "Page key", type: "select", options: ["home", "about"] },
      { name: "hero_title", label: "Hero title", type: "text" },
      { name: "hero_description", label: "Hero subtitle / description", type: "textarea", rows: 3 },
      { name: "hero_image", label: "Hero image URL", type: "text" },
      { name: "cta_label", label: "Primary button text", type: "text" },
      {
        name: "cta_href",
        label: "Primary button link",
        type: "text",
        help: "Internal path, e.g. /contact",
      },
      { name: "cta2Label", label: "Secondary button text", type: "text", json: true },
      { name: "cta2Href", label: "Secondary button link", type: "text", json: true },
      { name: "summary", label: "Introduction", type: "textarea", rows: 3 },
      { name: "body", label: "Main content / company story", type: "textarea", rows: 10 },
      { name: "mission", label: "Mission", type: "textarea", json: true, rows: 3 },
      { name: "vision", label: "Vision", type: "textarea", json: true, rows: 3 },
      { name: "values", label: "Values", type: "lines", json: true, help: PAIR_HELP },
      {
        name: "milestones",
        label: "Timeline / milestones",
        type: "lines",
        json: true,
        help: '"2019 | Company founded"',
      },
      {
        name: "team",
        label: "Team / leadership",
        type: "lines",
        json: true,
        help: '"Name | Role"',
      },
      {
        name: "stats",
        label: "Trust / stat numbers",
        type: "lines",
        json: true,
        help: '"1450+ | Projects completed"',
      },
      { name: "servicesTitle", label: "Services section title", type: "text", json: true },
      {
        name: "servicesBody",
        label: "Services section description",
        type: "textarea",
        json: true,
        rows: 2,
      },
      {
        name: "featuredServices",
        label: "Featured service slugs",
        type: "tags",
        json: true,
        help: "In display order.",
      },
      { name: "industriesTitle", label: "Industries section title", type: "text", json: true },
      { name: "featuredIndustries", label: "Featured industry slugs", type: "tags", json: true },
      { name: "featuredProjects", label: "Featured portfolio slugs", type: "tags", json: true },
      { name: "featuredCaseStudies", label: "Featured case study slugs", type: "tags", json: true },
      {
        name: "testimonials",
        label: "Testimonials",
        type: "lines",
        json: true,
        help: '"Quote | Author | Company"',
      },
      { name: "whyUs", label: "Why choose us", type: "lines", json: true, help: PAIR_HELP },
      { name: "process", label: "How we work", type: "lines", json: true, help: PAIR_HELP },
      { name: "bannerTitle", label: "CTA banner title", type: "text", json: true },
      { name: "bannerBody", label: "CTA banner text", type: "textarea", json: true, rows: 2 },
      { name: "faqTitle", label: "FAQ section title", type: "text", json: true },
      {
        name: "hiddenSections",
        label: "Hidden sections",
        type: "tags",
        json: true,
        help: "Section keys to hide, e.g. testimonials, faq, process.",
      },
      {
        name: "sectionOrder",
        label: "Section order",
        type: "tags",
        json: true,
        help: "Section keys in the order they should appear.",
      },
      ...SEO_FIELDS,
    ],
  },
  jobs: {
    key: "jobs",
    table: "cms_jobs",
    label: "Careers",
    singular: "Job",
    description: "Open roles shown on the careers page.",
    publicPath: "/careers",
    titleField: "title",
    fields: [
      { name: "title", label: "Job title", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text" },
      {
        name: "position_type",
        label: "Position type",
        type: "select",
        options: ["job", "internship"],
      },
      {
        name: "department",
        label: "Department",
        type: "select",
        options: ["Financial", "IT", "Legal", "Engineering", "Cross-practice", "Marketing"],
      },
      {
        name: "employment_type",
        label: "Employment type",
        type: "select",
        options: ["Full-time", "Part-time", "Internship", "Contract"],
      },
      { name: "location", label: "Location", type: "text" },
      {
        name: "work_mode",
        label: "Work mode",
        type: "select",
        options: ["On-site", "Hybrid", "Remote"],
      },
      { name: "experience", label: "Experience", type: "text", help: "e.g. 2–5 years" },
      { name: "salary", label: "Salary / range", type: "text" },
      { name: "openings", label: "Number of openings", type: "number" },
      { name: "deadline", label: "Application deadline", type: "text", help: "YYYY-MM-DD" },
      { name: "skills", label: "Skills", type: "tags" },
      { name: "summary", label: "Short description", type: "textarea", rows: 3 },
      { name: "body", label: "Full description", type: "textarea", rows: 8 },
      { name: "responsibilities", label: "Responsibilities", type: "lines", json: true },
      { name: "qualifications", label: "Qualifications", type: "lines", json: true },
      { name: "benefits", label: "Benefits", type: "lines", json: true },
      { name: "niceToHave", label: "Nice to have", type: "lines", json: true },
      {
        name: "applicationInstructions",
        label: "Application instructions",
        type: "textarea",
        rows: 3,
        json: true,
      },
      { name: "logo", label: "Logo", type: "text", json: true },
      ...SEO_FIELDS,
    ],
  },
  downloads: {
    key: "downloads",
    table: "cms_downloads",
    label: "Downloads",
    singular: "Download",
    description: "Brochures, checklists and guides in the download centre.",
    publicPath: "/downloads",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text" },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: [
          "IT Services",
          "Financial Advisory",
          "Legal & Corporate",
          "Engineering & Infra",
          "Brochures",
          "Case Studies",
          "Resources",
          "Financial",
          "IT",
          "Legal",
          "Engineering",
          "Business",
        ],
      },
      { name: "summary", label: "Description", type: "textarea", rows: 3 },
      { name: "thumbnail", label: "Thumbnail URL", type: "text" },
      {
        name: "file_url",
        label: "Document File (PDF)",
        type: "text",
        help: "Upload a PDF document to store in Supabase Storage.",
      },
      {
        name: "file_path",
        label: "Storage Path",
        type: "text",
        help: "Supabase Storage path (e.g. website-documents/it-services/doc.pdf)",
      },
      { name: "cta_label", label: "Button text", type: "text" },
      { name: "body", label: "Additional details", type: "textarea", rows: 5 },
      ...SEO_FIELDS,
    ],
  },
  offices: {
    key: "offices",
    table: "cms_offices",
    label: "Offices",
    singular: "Office",
    description: "Office locations used across the website.",
    publicPath: null,
    titleField: "title",
    fields: [
      { name: "title", label: "Office name", type: "text" },
      { name: "slug", label: "Reference key", type: "text" },
      { name: "city", label: "City", type: "text" },
      { name: "address", label: "Address", type: "textarea", rows: 3 },
      { name: "maps_url", label: "Google Maps link", type: "text" },
      { name: "embed_url", label: "Google Maps embed URL", type: "text" },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "hours", label: "Working hours", type: "text" },
      { name: "summary", label: "Note", type: "textarea", rows: 2 },
    ],
  },
  products: {
    key: "products",
    table: "cms_products",
    label: "Products / Platforms",
    singular: "Product",
    description: "Platforms and productised systems we own and operate.",
    publicPath: null,
    titleField: "title",
    fields: [
      { name: "title", label: "Product name", type: "text" },
      { name: "slug", label: "Web address (slug)", type: "text", help: "e.g. jyot-erp" },
      {
        name: "icon",
        label: "Icon name",
        type: "text",
        help: "Lucide icon, e.g. Boxes, Users, Bot, Globe, AppWindow",
      },
      { name: "summary", label: "Tagline / Short description", type: "textarea", rows: 2 },
      { name: "body", label: "Full description / overview", type: "textarea", rows: 5 },
      {
        name: "tags",
        label: "Feature tags",
        type: "tags",
        help: "e.g. Manufacturing, Multi-plant, Cloud",
      },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: [
          "Enterprise Software",
          "AI & Automation",
          "Finance & Compliance",
          "Digital & Web",
        ],
      },
      { name: "thumbnail", label: "Thumbnail / Product image", type: "text" },
      {
        name: "cta_label",
        label: "CTA button text",
        type: "text",
        help: "Default: Request a demo",
      },
      { name: "cta_href", label: "CTA button link", type: "text", help: "Default: /contact" },
      {
        name: "features",
        label: "Key capabilities / features",
        type: "lines",
        json: true,
        help: PAIR_HELP,
      },
      ...SEO_FIELDS,
    ],
  },
  testimonials: {
    key: "testimonials",
    table: "cms_testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    description: "Client quotes, feedback and satisfaction reviews.",
    publicPath: null,
    titleField: "title",
    fields: [
      { name: "title", label: "Client name", type: "text" },
      {
        name: "summary",
        label: "Role & Company",
        type: "text",
        help: "e.g. Director, Meridian Polymers",
      },
      { name: "body", label: "Client quote / review", type: "textarea", rows: 4 },
      { name: "author", label: "Author full name", type: "text" },
      { name: "author_role", label: "Author title & organization", type: "text" },
      {
        name: "category",
        label: "Division / Practice",
        type: "select",
        options: ["All", "Financial", "IT", "Legal", "Engineering"],
      },
      { name: "thumbnail", label: "Client photo URL", type: "text" },
      { name: "rating", label: "Rating (1 to 5)", type: "number", json: true },
    ],
  },
  team_members: {
    key: "team_members",
    table: "cms_team_members",
    label: "Team & Leadership",
    singular: "Team member",
    description: "Leadership and practice heads shown on the About page.",
    publicPath: null,
    titleField: "title",
    fields: [
      { name: "title", label: "Full name", type: "text" },
      { name: "slug", label: "Reference key (optional)", type: "text" },
      {
        name: "summary",
        label: "Role / Title",
        type: "text",
        help: "e.g. Practice Lead, Financial Advisory",
      },
      {
        name: "department",
        label: "Practice / Department",
        type: "select",
        options: ["Leadership", "Financial", "IT", "Legal", "Engineering", "Operations"],
      },
      { name: "body", label: "Bio / Background summary", type: "textarea", rows: 5 },
      { name: "thumbnail", label: "Photo URL", type: "text" },
      { name: "email", label: "Email address", type: "text" },
      { name: "phone", label: "Phone / WhatsApp", type: "text" },
      { name: "linkedin", label: "LinkedIn profile URL", type: "text", json: true },
    ],
  },
  faqs: {
    key: "faqs",
    table: "cms_faqs",
    label: "FAQs",
    singular: "FAQ",
    description: "Questions shown on service, industry and FAQ sections.",
    publicPath: null,
    titleField: "question",
    fields: [
      { name: "question", label: "Question", type: "text" },
      { name: "answer", label: "Answer", type: "textarea", rows: 5 },
      { name: "category", label: "Category", type: "text" },
      { name: "service_id", label: "Related service", type: "select", options: [] },
      { name: "industry_id", label: "Related industry", type: "select", options: [] },
      { name: "slug", label: "Reference key (optional)", type: "text" },
    ],
  },
};

/** Public URL to preview a row, or null when the module has no own page. */
export function previewPath(module: string, slug: string | null | undefined): string | null {
  if (!slug) return null;
  if (module === "pages") return slug === "about" ? "/about" : "/";
  if (module === "downloads") return "/downloads";
  if (module === "products" || module === "testimonials") return "/";
  if (module === "team_members") return "/about";
  if (module === "jobs" || module === "careers") return `/careers/${slug}`;
  const def = moduleDef(module);
  return def?.publicPath ? `${def.publicPath}/${slug}` : null;
}

export function moduleDef(key: string): CmsModuleDef | null {
  if (key === "careers") return CMS_MODULE_DEFS["jobs"] ?? null;
  return (CMS_MODULE_DEFS as Record<string, CmsModuleDef>)[key] ?? null;
}

/** "Heading | body" → { a, b } */
export function splitPair(value: string): { a: string; b: string } {
  const i = value.indexOf("|");
  if (i === -1) return { a: value.trim(), b: "" };
  return { a: value.slice(0, i).trim(), b: value.slice(i + 1).trim() };
}

export function toLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "string" && value.trim())
    return value
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  return [];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}
