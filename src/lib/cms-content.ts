/**
 * Bridge between CMS rows and the website's existing content types.
 *
 * Published CMS rows override the built-in entry with the same slug and
 * CMS-only rows are appended. The built-in content stays in src/data as the
 * fallback, so the public site keeps working even if the database is
 * unreachable and nothing ever "disappears".
 */

import type { CmsRow } from "@/lib/cms-schema";
import { splitPair, toLines } from "@/lib/cms-schema";
import { BLOG_POSTS, BLOG_CATEGORIES, type BlogPost, type BlogCategory } from "@/data/blog";
import { PROJECTS, type Project } from "@/data/projects";
import { CASE_DETAILS, type CaseStudy } from "@/data/case-studies";
import { INDUSTRY_PAGES, type IndustryPage } from "@/data/industries";
import {
  RESOURCE_LIBRARY,
  type ResourceItem,
  type ResourceSection,
  type ResourceDownload,
  type ResourceCta,
  type ResourceCategory,
  type ResourcePractice,
} from "@/data/resources";
import { SUB_SERVICES, type SubService } from "@/data/catalog";
import { PRODUCTS, TESTIMONIALS, type ServiceKey } from "@/data/site";
import { JOBS, type Job } from "@/data/careers";

const j = (row: CmsRow, key: string): unknown => (row.data ?? {})[key];
const s = (v: unknown, fallback = ""): string => (typeof v === "string" && v.trim() ? v : fallback);

function pairs(value: unknown): { a: string; b: string }[] {
  return toLines(value).map(splitPair);
}

function mergeBySlug<T extends { slug: string }>(base: T[], incoming: T[]): T[] {
  if (!incoming || incoming.length === 0) return base;
  const incomingMap = new Map(incoming.map((item) => [item.slug, item]));
  const merged = base.map((item) => incomingMap.get(item.slug) ?? item);
  const baseSlugs = new Set(base.map((item) => item.slug));
  for (const item of incoming) {
    if (!baseSlugs.has(item.slug)) {
      merged.push(item);
    }
  }
  return merged;
}

/* ------------------------------------------------------------------ blog */

/** "## Heading" starts a section; "- " lines become bullet points. */
export function parseArticleBody(text: string): BlogPost["body"] {
  const sections: BlogPost["body"] = [];
  let current: BlogPost["body"][number] | null = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("##")) {
      current = { heading: line.replace(/^#+\s*/, ""), paragraphs: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { heading: "", paragraphs: [] };
      sections.push(current);
    }
    if (line.startsWith("- ")) {
      current.points = [...(current.points ?? []), line.slice(2)];
    } else {
      current.paragraphs.push(line);
    }
  }
  return sections;
}

export function toBlogPost(row: CmsRow): BlogPost {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = row.data ?? {};
  const date = row.published_at
    ? row.published_at.slice(0, 10)
    : row.created_at
      ? row.created_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  const category = row.category || "Business";

  // Gallery
  let gallery: { caption: string; url: string; alt?: string | undefined }[] = [];
  if (Array.isArray(d.gallery) && d.gallery.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gallery = d.gallery.map((g: any, i: number) => {
      if (typeof g === "string") {
        return { caption: `Image ${i + 1}`, url: g };
      }
      return {
        caption: s(g?.caption, `Image ${i + 1}`),
        url: s(g?.url),
        alt: s(g?.alt, g?.caption),
      };
    });
  }

  // Sections
  const sections = Array.isArray(d.sections)
    ? d.sections
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((sec: any) => sec && sec.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  return {
    slug: row.slug!,
    category,
    title: s(row.title, "Untitled"),
    excerpt: s(row.excerpt) || s(row.summary),
    date,
    displayDate: new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    read: s(row.read_time, "5 min"),
    author: s(row.author, "Jyot Enterprise"),
    authorRole: s(row.author_role, "Advisory Team"),
    keywords: row.seo_keywords ?? row.tags ?? [],
    body: parseArticleBody(s(row.body)),
    takeaway: s(d.takeaway) || s(j(row, "takeaway")),
    // Extended fields
    subCategory: s(d.subCategory),
    industry: s(row.industry) || s(d.industry),
    authorPhoto: s(d.authorPhoto),
    authorBio: s(d.authorBio),
    authorSocialUrl: s(d.authorSocialUrl),
    featured: Boolean(row.featured),
    published: row.status === "published",
    status: (d.status || row.status || "draft") as "draft" | "published" | "archived",
    sortOrder: row.sort_order ?? 0,
    featuredImage: s(row.hero_image) || s(d.featuredImage) || s(d.heroImage),
    heroImage: s(d.heroImage) || s(row.hero_image) || s(d.featuredImage),
    thumbnailImage: s(d.thumbnailImage) || s(row.thumbnail) || s(row.hero_image),
    gallery,
    beforeImage: d.beforeImage,
    afterImage: d.afterImage,
    contentHtml: s(d.contentHtml),
    rawBody: s(row.body),
    sections,
    keyTakeaways: Array.isArray(d.keyTakeaways) ? d.keyTakeaways : [],
    cta: d.cta,
    controls: d.controls ?? {
      showAuthorBio: true,
      showTableOfContents: true,
      showShare: true,
      showTakeaway: true,
      showGallery: true,
      showRelated: true,
      showCta: true,
    },
    relatedBlogSlugs: Array.isArray(d.relatedBlogSlugs) ? d.relatedBlogSlugs : [],
    seoTitle: s(row.seo_title) || s(d.seoTitle),
    seoDescription: s(row.seo_description) || s(d.seoDescription),
    seoKeywords: row.seo_keywords ?? d.seoKeywords ?? [],
    canonicalUrl: s(d.canonicalUrl),
    ogTitle: s(d.ogTitle),
    ogDescription: s(d.ogDescription),
    ogImage: s(row.og_image) || s(d.ogImage) || s(row.hero_image),
    twitterTitle: s(d.twitterTitle),
    twitterDescription: s(d.twitterDescription),
    twitterImage: s(d.twitterImage),
    noindex: Boolean(d.noindex),
    nofollow: Boolean(d.nofollow),
    updatedAt: row.updated_at,
  };
}

export function mergeBlogPosts(rows: CmsRow[] | null | undefined): BlogPost[] {
  const safe = Array.isArray(rows) ? rows : [];
  const merged = mergeBySlug(BLOG_POSTS, safe.filter((r) => r && r.slug).map(toBlogPost));
  return merged.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/* -------------------------------------------------------------- projects */

export function toProject(row: CmsRow): Project {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = row.data ?? {};

  // Gallery items mapping
  let gallery: {
    caption: string;
    hue: number;
    url?: string | undefined;
    alt?: string | undefined;
  }[] = [];
  if (Array.isArray(d.gallery) && d.gallery.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gallery = d.gallery.map((g: any, i: number) => {
      if (typeof g === "string") {
        return { caption: `Project Image ${i + 1}`, hue: (i * 24) % 360, url: g };
      }
      return {
        caption: s(g?.caption, `Project Image ${i + 1}`),
        hue: typeof g?.hue === "number" ? g.hue : (i * 24) % 360,
        url: s(g?.url),
        alt: s(g?.alt, g?.caption),
      };
    });
  } else {
    gallery = toLines(j(row, "gallery")).map((caption, i) => {
      const isUrl =
        caption.startsWith("http://") || caption.startsWith("https://") || caption.startsWith("/");
      return {
        caption: isUrl ? `View ${i + 1}` : caption,
        hue: (i * 24) % 360,
        url: isUrl ? caption : undefined,
      };
    });
  }

  // Technologies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detailedTech =
    Array.isArray(d.technologiesDetailed) && d.technologiesDetailed.length > 0
      ? d.technologiesDetailed
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((t: any) =>
            typeof t === "string" ? { name: t } : { name: s(t.name), icon: s(t.icon) },
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((t: any) => Boolean(t.name))
      : (row.technologies ?? []).map((t) => ({ name: t }));

  const techNames = (detailedTech as Array<{ name: string; icon?: string }>).map((t) => t.name);

  // Metrics
  const rawMetrics =
    d.resultDetails?.metrics || pairs(j(row, "metrics")).map((p) => ({ k: p.a, v: p.b }));
  const parsedMetrics = Array.isArray(rawMetrics)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawMetrics.map((m: any) => ({ k: s(m.k), v: s(m.v), label: s(m.label) }))
    : [];

  const quoteText = s(d.clientQuote?.quote) || s(j(row, "quote"));
  const quoteAuthor =
    s(d.clientQuote?.name) ||
    s(j(row, "quoteBy")) ||
    (d.clientQuote?.designation ? `${d.clientQuote?.name} · ${d.clientQuote?.designation}` : "");

  return {
    slug: row.slug!,
    client: s(row.client),
    industry: s(row.industry),
    practice: s(row.service),
    title: s(row.title),
    summary: s(row.summary),
    body: s(row.body),
    challenge: s(d.challengeDetails?.description) || s(j(row, "challenge")),
    solution: s(d.solutionDetails?.description) || s(j(row, "solution")),
    outcome: s(d.resultDetails?.description) || s(j(row, "outcome")) || s(row.body),
    metrics: parsedMetrics,
    tech: techNames,
    gallery,
    duration: s(d.duration) || s(j(row, "duration")),
    year: s(d.year) || s(j(row, "year")),
    hue: 24,
    ...(quoteText ? { quote: quoteText } : {}),
    ...(quoteAuthor ? { quoteBy: quoteAuthor } : {}),
    // Extended fields
    subCategory: s(d.subCategory),
    clientLocation: s(d.clientLocation),
    projectUrl: s(row.project_url) || s(d.projectUrl),
    projectStatus: d.projectStatus || (row.status === "archived" ? "archived" : "completed"),
    featured: Boolean(row.featured),
    published: row.status === "published",
    featuredImage: s(d.featuredImage) || s(row.hero_image),
    heroImage: s(row.hero_image) || s(d.heroImage) || s(d.featuredImage),
    thumbnailImage: s(d.thumbnailImage) || s(row.thumbnail) || s(row.hero_image),
    beforeImage: d.beforeImage,
    afterImage: d.afterImage,
    clientLogo: s(d.clientLogo),
    screenshots: Array.isArray(d.screenshots) ? d.screenshots : [],
    additionalMedia: Array.isArray(d.additionalMedia) ? d.additionalMedia : [],
    challengeDetails: d.challengeDetails,
    solutionDetails: d.solutionDetails,
    resultDetails: d.resultDetails,
    technologiesDetailed: detailedTech,
    clientQuote: d.clientQuote,
    cta: d.cta,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sections: Array.isArray(d.sections)
      ? d.sections
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((sec: any) => sec && sec.id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      : [],
    controls: d.controls ?? {
      showProject: true,
      showRelated: true,
      showTechnologies: true,
      showClientQuote: true,
      showCta: true,
      showGallery: true,
    },
    relatedProjectSlugs: Array.isArray(d.relatedProjectSlugs) ? d.relatedProjectSlugs : [],
    seoTitle: s(row.seo_title) || s(d.seoTitle),
    seoDescription: s(row.seo_description) || s(d.seoDescription),
    seoKeywords: row.seo_keywords ?? d.seoKeywords ?? [],
    canonicalUrl: s(d.canonicalUrl),
    ogTitle: s(d.ogTitle),
    ogDescription: s(d.ogDescription),
    ogImage: s(row.og_image) || s(d.ogImage) || s(row.hero_image),
    twitterTitle: s(d.twitterTitle),
    twitterDescription: s(d.twitterDescription),
    twitterImage: s(d.twitterImage),
    noindex: Boolean(d.noindex),
    nofollow: Boolean(d.nofollow),
  };
}

export function mergeProjects(rows: CmsRow[] | null | undefined): Project[] {
  const safe = Array.isArray(rows) ? rows : [];
  return mergeBySlug(PROJECTS, safe.filter((r) => r && r.slug).map(toProject));
}

/* ----------------------------------------------------------- case studies */

function toCaseStudy(row: CmsRow): CaseStudy {
  return {
    slug: row.slug!,
    client: s(row.client),
    practice: s(row.service),
    industry: s(row.industry),
    title: s(row.title),
    summary: s(row.summary),
    problem: s(j(row, "problem")),
    research: toLines(j(row, "research")),
    solution: toLines(j(row, "solutionPoints")),
    implementation: pairs(j(row, "implementation")).map((p) => ({ phase: p.a, body: p.b })),
    timeline: pairs(j(row, "timeline")).map((p) => ({ label: p.a, body: p.b })),
    roi: pairs(j(row, "roi")).map((p) => ({ k: p.a, v: p.b })),
    roiSummary: s(j(row, "roiSummary")),
    feedback: s(j(row, "feedback")),
    person: s(j(row, "person")),
    hue: 24,
  };
}

export function mergeCaseStudies(rows: CmsRow[] | null | undefined): CaseStudy[] {
  const safe = Array.isArray(rows) ? rows : [];
  return mergeBySlug(CASE_DETAILS, safe.filter((r) => r && r.slug).map(toCaseStudy));
}

/* ------------------------------------------------------------ industries */

function toIndustry(row: CmsRow): IndustryPage {
  const stat = splitPair(s(j(row, "stat")));
  const caseSlug = s(j(row, "caseSlug"));
  return {
    slug: row.slug!,
    name: s(row.title),
    icon: s(row.icon, "Building2"),
    headline: s(row.hero_title) || s(row.title),
    intro: s(row.summary) || s(row.body),
    painPoints: toLines(j(row, "painPoints")),
    solutions: pairs(j(row, "solutions")).map((p) => ({ title: p.a, body: p.b })),
    services: toLines(j(row, "services")).map((line) => {
      const [name, parent, sub] = line.split("|").map((v) => v.trim());
      return {
        name: name ?? "",
        parent: (parent ?? "financial") as ServiceKey,
        ...(sub ? { sub } : {}),
      };
    }),
    ...(caseSlug ? { caseSlug } : {}),
    stat: { k: stat.a, v: stat.b },
  };
}

export function mergeIndustries(rows: CmsRow[] | null | undefined): IndustryPage[] {
  const safe = Array.isArray(rows) ? rows : [];
  return mergeBySlug(INDUSTRY_PAGES, safe.filter((r) => r && r.slug).map(toIndustry));
}

/* ------------------------------------------------------------- resources */

export function toResource(row: CmsRow): ResourceItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = row.data ?? {};

  // ── Content blocks (sections)
  // Priority: data.sections array (from ResourceEditor) → legacy pipe-delimited "heading | body" lines
  let sections: ResourceSection[] = [];
  if (Array.isArray(d.sections) && d.sections.length > 0) {
    sections = d.sections
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((sec: any) => sec && (sec.heading || sec.type))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((sec: any) => ({
        id: s(sec.id),
        type: s(sec.type, "heading_text"),
        order: sec.order ?? 0,
        enabled: sec.enabled !== false,
        heading: s(sec.heading),
        body: s(sec.body),
        points: Array.isArray(sec.points) ? sec.points : undefined,
        imageUrl: s(sec.imageUrl),
        imageAlt: s(sec.imageAlt),
        quote: s(sec.quote),
        quoteBy: s(sec.quoteBy),
        stats: Array.isArray(sec.stats) ? sec.stats : undefined,
        faqs: Array.isArray(sec.faqs) ? sec.faqs : undefined,
        items: Array.isArray(sec.items) ? sec.items : undefined,
        steps: Array.isArray(sec.steps) ? sec.steps : undefined,
        tableHeaders: Array.isArray(sec.tableHeaders) ? sec.tableHeaders : undefined,
        tableRows: Array.isArray(sec.tableRows) ? sec.tableRows : undefined,
        calloutType: sec.calloutType,
        downloadIds: Array.isArray(sec.downloadIds) ? sec.downloadIds : undefined,
        videoUrl: s(sec.videoUrl),
        videoCaption: s(sec.videoCaption),
        ctaHeading: s(sec.ctaHeading),
        ctaBody: s(sec.ctaBody),
        ctaPrimaryText: s(sec.ctaPrimaryText),
        ctaPrimaryUrl: s(sec.ctaPrimaryUrl),
        html: s(sec.html),
      }));
  } else {
    // Legacy: "Heading | body" pipe-separated lines
    sections = pairs(j(row, "sections")).map((p) => ({ heading: p.a, body: p.b }));
  }

  // ── Downloads
  // Priority: data.resourceFiles array (injected by loader from cms_resource_files or data.resourceFiles) →
  //           data.downloads array/lines (legacy) → nothing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let downloads: ResourceDownload[] = [];
  if (Array.isArray(d.resourceFiles) && d.resourceFiles.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    downloads = d.resourceFiles.map((f: any) => ({
      id: s(f.id),
      name: s(f.title),
      format: s(f.file_type, "PDF"),
      size: f.file_size ? formatFileSize(f.file_size) : s(f.display_label, ""),
      fileUrl: s(f.file_url),
      storagePath: s(f.storage_path),
      mimeType: s(f.mime_type),
      fileSize: typeof f.file_size === "number" ? f.file_size : undefined,
      fileName: s(f.file_name),
      displayLabel: s(f.display_label),
      downloadFilename: s(f.download_filename),
      isActive: f.is_active !== false,
    }));
  } else {
    downloads = toLines(j(row, "downloads")).map((line) => {
      const [name, format, size] = line.split("|").map((v) => v.trim());
      return { name: name ?? "", format: format ?? "PDF", size: size ?? "" };
    });
  }

  // Single file column fallback if row.file_url exists and no downloads array
  if (downloads.length === 0 && row.file_url) {
    downloads.push({
      id: row.id,
      name: s(row.title, "Download Resource"),
      format: s(row.file_type, "PDF"),
      size: row.file_size ? formatFileSize(row.file_size) : "",
      fileUrl: s(row.file_url),
      storagePath: s(row.storage_path),
      fileSize: typeof row.file_size === "number" ? row.file_size : undefined,
      fileName: s(row.file_name),
      isActive: true,
    });
  }

  // ── CTA
  const ctaRaw = d.cta;
  const cta: ResourceCta | undefined = ctaRaw
    ? {
        enabled: ctaRaw.enabled !== false,
        heading: s(ctaRaw.heading),
        description: s(ctaRaw.description),
        primaryText: s(ctaRaw.primaryText),
        primaryUrl: s(ctaRaw.primaryUrl),
        secondaryText: s(ctaRaw.secondaryText),
        secondaryUrl: s(ctaRaw.secondaryUrl),
      }
    : undefined;

  // ── Updated date
  const updatedDate = row.updated_at
    ? new Date(row.updated_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";

  // ── Category / practice
  const ALL_TYPES = [
    "Guide",
    "Checklist",
    "Template",
    "Calculator",
    "Report",
    "Ebook",
    "Whitepaper",
    "Case Study",
    "Other",
  ];
  const ALL_PRACTICES = ["Financial", "IT", "Legal", "Engineering", "Business", "Other"];

  return {
    slug: row.slug!,
    title: s(row.title, "Untitled"),
    category: (ALL_TYPES.includes(row.resource_type ?? "")
      ? row.resource_type
      : "Guide") as ResourceCategory,
    practice: (ALL_PRACTICES.includes(row.category ?? "")
      ? row.category
      : "Business") as ResourcePractice,
    icon: s(row.icon, "FileText"),
    summary: s(row.summary),
    description: s(row.body) || s(d.description),
    readTime: s(d.read_time, "6 min"),
    updated: updatedDate,
    subCategory: s(d.subCategory),
    industry: s(row.industry) || s(d.industry),
    author: s(row.author) || s(d.author),
    authorRole: s(row.author_role) || s(d.authorRole),
    authorImage: s(d.author_image) || s(d.authorImage),
    publishedAt: row.published_at ? row.published_at.slice(0, 10) : undefined,
    featuredImage: s(row.hero_image) || s(d.featuredImage) || s(d.heroImage),
    thumbnailImage: s(row.thumbnail) || s(d.thumbnailImage) || s(row.hero_image),
    sections,
    downloads,
    faqs: pairs(j(row, "faqs")).map((p) => ({ q: p.a, a: p.b })),
    cta,
    // SEO
    seoTitle: s(row.seo_title) || s(d.seoTitle),
    seoDescription: s(row.seo_description) || s(d.seoDescription),
    seoKeywords: row.seo_keywords ?? d.seoKeywords ?? [],
    canonicalUrl: s(d.canonicalUrl),
    ogTitle: s(d.ogTitle),
    ogDescription: s(d.ogDescription),
    ogImage: s(row.og_image) || s(d.ogImage) || s(row.hero_image),
    twitterTitle: s(d.twitterTitle),
    twitterDescription: s(d.twitterDescription),
    twitterImage: s(d.twitterImage),
    noindex: Boolean(d.noindex),
    nofollow: Boolean(d.nofollow),
    // CMS metadata
    featured: Boolean(row.featured),
    status: (row.status ?? "draft") as "draft" | "published" | "archived",
    sortOrder: row.sort_order ?? 0,
    updatedAt: row.updated_at,
  };
}

/** Format bytes to human-readable size. */
function formatFileSize(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function mergeResources(rows: CmsRow[] | null | undefined): ResourceItem[] {
  const safe = Array.isArray(rows) ? rows : [];
  return mergeBySlug(RESOURCE_LIBRARY, safe.filter((r) => r && r.slug).map(toResource));
}

/** Full detailed resource mapper ensuring all rich CMS attributes are present. */
export function toResourceFull(row: CmsRow): ResourceItem {
  return toResource(row);
}

/* ---------------------------------------------------------- sub-services */

function toSubService(row: CmsRow): SubService {
  const pricing = Array.isArray(j(row, "pricing"))
    ? (j(row, "pricing") as SubService["pricing"])
    : undefined;
  return {
    slug: row.slug!,
    parent: (row.parent_key ?? "financial") as ServiceKey,
    name: s(row.title),
    tagline: s(row.summary),
    overview: s(row.body),
    benefits: toLines(j(row, "benefits")),
    process: toLines(j(row, "process")),
    timeline: s(j(row, "timeline")),
    ...(pricing ? { pricing } : {}),
    faqs: toLines(j(row, "faqs")),
    testimonial: s(j(row, "testimonial")),
  };
}

export function mergeSubServices(rows: CmsRow[] | null | undefined): SubService[] {
  const safe = Array.isArray(rows) ? rows : [];
  return mergeBySlug(SUB_SERVICES, safe.filter((r) => r && r.slug).map(toSubService));
}

/* -------------------------------------------------------------- services */

export type ServiceOverrides = Record<
  string,
  {
    name?: string;
    tagline?: string;
    description?: string;
    items?: string[];
    heroTitle?: string;
    heroBody?: string;
  }
>;

/** Services keep their built-in icon and route key; CMS supplies the copy. */
export function serviceOverrides(rows: CmsRow[] | null | undefined): ServiceOverrides {
  const safe = Array.isArray(rows) ? rows : [];
  const out: ServiceOverrides = {};
  for (const row of safe) {
    if (!row) continue;
    const key = row.service_key || row.slug;
    if (!key) continue;
    const features = toLines(j(row, "features")).map((line) => splitPair(line).a);
    out[key] = {
      ...(row.title ? { name: row.title } : {}),
      ...(row.summary ? { tagline: row.summary } : {}),
      ...(row.body ? { description: row.body } : {}),
      ...(features.length ? { items: features } : {}),
      ...(row.hero_title ? { heroTitle: row.hero_title } : {}),
      ...(row.hero_description ? { heroBody: row.hero_description } : {}),
    };
  }
  return out;
}

/* ------------------------------------------------------------------ FAQs */

export type CmsFaq = { q: string; a: string; category: string };

export function cmsFaqs(rows: CmsRow[] | null | undefined): CmsFaq[] {
  const safe = Array.isArray(rows) ? rows : [];
  return safe
    .filter((r) => r && r.question && r.answer)
    .map((r) => ({ q: r.question!, a: r.answer!, category: s(r.category, "General") }));
}

/* -------------------------------------------------------------- SEO help */

export function cmsSeo(row: CmsRow | undefined, fallback: { title: string; description: string }) {
  return {
    title: s(row?.seo_title, fallback.title),
    description: s(row?.seo_description, fallback.description),
    keywords: row?.seo_keywords ?? [],
    ogImage: s(row?.og_image) || s(row?.hero_image),
  };
}

export function bySlug(rows: CmsRow[] | null | undefined): Map<string, CmsRow> {
  const safe = Array.isArray(rows) ? rows : [];
  return new Map(safe.filter((r) => r && r.slug).map((r) => [r.slug as string, r]));
}

/* ------------------------------------------------------------------ jobs */

export function getEmploymentType(
  rawType?: string | null,
  rawTitle?: string | null,
): "job" | "internship" | "needs_review" {
  if (rawType) {
    const lower = rawType.toLowerCase().trim();
    if (lower === "internship" || lower.includes("intern")) return "internship";
    if (
      lower === "job" ||
      lower === "full-time" ||
      lower === "part-time" ||
      lower === "contract" ||
      lower === "remote"
    ) {
      return "job";
    }
  }
  if (rawTitle) {
    const titleLower = rawTitle.toLowerCase().trim();
    if (titleLower.includes("intern")) return "internship";
  }
  if (!rawType) return "needs_review";
  return "needs_review";
}

export function toJob(row: CmsRow): Job {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = row.data ?? {};
  const rawType = s(row.employment_type) || s(d.employmentType) || s(d.type);
  const employmentType = getEmploymentType(rawType, row.title);
  const date = row.created_at ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

  // Responsibilities & Requirements / Qualifications
  const responsibilities =
    Array.isArray(d.responsibilities) && d.responsibilities.length > 0
      ? d.responsibilities.map((r: unknown) =>
          typeof r === "string" ? r.replace(/^[•-]\s*/, "") : s(r),
        )
      : toLines(j(row, "responsibilities"));

  const qualifications =
    Array.isArray(d.qualifications) && d.qualifications.length > 0
      ? d.qualifications.map((q: unknown) =>
          typeof q === "string" ? q.replace(/^[•-]\s*/, "") : s(q),
        )
      : toLines(j(row, "qualifications"));

  const niceToHave =
    Array.isArray(d.niceToHave) && d.niceToHave.length > 0
      ? d.niceToHave.map((n: unknown) => (typeof n === "string" ? n.replace(/^[•-]\s*/, "") : s(n)))
      : toLines(j(row, "niceToHave"));

  const benefits =
    Array.isArray(d.benefits) && d.benefits.length > 0
      ? d.benefits.map((b: unknown) => (typeof b === "string" ? b.replace(/^[•-]\s*/, "") : s(b)))
      : toLines(j(row, "benefits"));

  // Skills
  const rawSkills = row.skills ?? d.skills ?? [];
  let skills: string[] = [];
  if (Array.isArray(rawSkills)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skills = rawSkills.flatMap((item: any) => {
      if (typeof item === "string" && item.includes(",")) {
        return item
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
      }
      return typeof item === "string" ? [item.trim()] : [];
    });
  }

  const rowRecord = row as Record<string, unknown>;
  const rawPosType = s(rowRecord["position_type"]) || s(d.positionType) || s(d.position_type);
  const positionType: "job" | "internship" =
    rawPosType === "job" || rawPosType === "internship"
      ? rawPosType
      : employmentType === "internship"
        ? "internship"
        : "job";

  const rawTypeDisplay = rawType
    ? rawType.toLowerCase() === "internship"
      ? "Internship"
      : rawType.toLowerCase() === "job"
        ? "Full-time"
        : rawType
    : positionType === "internship"
      ? "Internship"
      : "Full-time";

  return {
    id: row.id,
    slug: row.slug!,
    title: s(row.title, "Open Role"),
    department: s(row.department, "Cross-practice"),
    type: rawTypeDisplay as Job["type"],
    positionType,
    employmentType,
    category: s(d.category) || s(row.department),
    location: s(row.location, "Gandhinagar, Gujarat"),
    workMode: s(row.work_mode) || s(d.workMode) || "On-site",
    experience: s(row.experience, "Fresher / experienced can apply"),
    education: s(d.education),
    duration: s(d.duration, positionType === "internship" ? "6 months" : undefined),
    salary: s(row.salary, "Performance-based"),
    showSalary: d.showSalary !== false,
    openings:
      typeof row.openings === "number"
        ? row.openings
        : typeof d.openings === "number"
          ? d.openings
          : 1,
    deadline: s(row.deadline) || s(d.deadline),
    applicationInstructions:
      s(d.applicationInstructions) || s(rowRecord["application_instructions"]),
    logo: s(d.logo) || s(rowRecord["logo"]),
    summary: s(row.summary),
    body: s(row.body) || s(d.body),
    responsibilities,
    requirements: qualifications.length > 0 ? qualifications : toLines(j(row, "requirements")),
    qualifications,
    skills,
    preferredSkills: niceToHave,
    niceToHave,
    benefits,
    learningOpportunities: Array.isArray(d.learningOpportunities)
      ? d.learningOpportunities
      : benefits,
    workingHours: s(d.workingHours),
    reportingTo: s(d.reportingTo),
    featured: Boolean(row.featured),
    published: row.status === "published",
    status: (row.status ?? d.status ?? "draft") as "draft" | "published" | "archived" | "closed",
    sortOrder: row.sort_order ?? 0,
    posted: date,
    publishedAt: row.created_at,
    updatedAt: row.updated_at,
    heroImage: s(row.hero_image) || s(d.heroImage),
    seoTitle: s(row.seo_title) || s(d.seoTitle),
    seoDescription: s(row.seo_description) || s(d.seoDescription),
    seoKeywords: row.seo_keywords ?? d.seoKeywords ?? [],
    canonicalUrl: s(d.canonicalUrl),
    ogImage: s(row.og_image) || s(d.ogImage) || s(row.hero_image),
    noindex: Boolean(d.noindex),
    nofollow: Boolean(d.nofollow),
    controls: d.controls ?? {
      showBenefits: true,
      showSkills: true,
      showApplyForm: true,
      showDeadline: true,
    },
  };
}

/** Extra job details the built-in type does not carry. */
export type JobExtras = {
  workMode: string;
  openings: number | null;
  deadline: string | null;
  skills: string[];
  benefits: string[];
  body: string;
  seoTitle: string;
  seoDescription: string;
  applicationInstructions?: string | null;
  logo?: string | null;
  positionType?: "job" | "internship";
};

export function jobExtras(row: CmsRow | undefined): JobExtras | null {
  if (!row) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = row.data ?? {};
  const rowRecord = row as Record<string, unknown>;
  const rawPosType = s(rowRecord["position_type"]) || s(d.positionType) || s(d.position_type);
  const positionType: "job" | "internship" =
    rawPosType === "job" || rawPosType === "internship" ? rawPosType : "job";
  return {
    workMode: s(row.work_mode) || s(d.workMode) || "On-site",
    openings: (row.openings as number | null) ?? (d.openings as number | null) ?? null,
    deadline: (row.deadline as string | null) ?? (d.deadline as string | null) ?? null,
    skills: row.skills && row.skills.length ? row.skills : (d.skills ?? []),
    benefits: toLines(j(row, "benefits")),
    body: s(row.body) || s(d.body),
    seoTitle: s(row.seo_title) || s(d.seoTitle),
    seoDescription: s(row.seo_description) || s(d.seoDescription),
    applicationInstructions:
      s(d.applicationInstructions) || s(rowRecord["application_instructions"]) || null,
    logo: s(d.logo) || s(rowRecord["logo"]) || null,
    positionType,
  };
}

export function mergeJobs(rows: CmsRow[] | null | undefined): Job[] {
  const safe = Array.isArray(rows) ? rows : [];
  const cms = safe.filter((r) => r && r.slug).map(toJob);
  const merged = mergeBySlug(JOBS, cms);
  return merged.sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return a.featured ? -1 : 1;
    }
    if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }
    return a.posted < b.posted ? 1 : -1;
  });
}

/* ------------------------------------------------------------- downloads */

export type CmsDownload = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  thumbnail: string;
  fileUrl: string;
  ctaLabel: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number | undefined;
};

export function cmsDownloads(rows: CmsRow[] | null | undefined): CmsDownload[] {
  const safe = Array.isArray(rows) ? rows : [];
  return safe
    .filter((r) => r && r.slug)
    .map((r) => ({
      slug: r.slug!,
      title: s(r.title),
      category: s(r.category),
      summary: s(r.summary) || s(r.description),
      thumbnail: s(r.thumbnail),
      fileUrl:
        s(r.file_url) ||
        (r.storage_path
          ? `https://xmveofqeunsqzyxhakyj.supabase.co/storage/v1/object/public/jyot-enterprise/${r.storage_path}`
          : ""),
      ctaLabel: s(r.cta_label, "Download"),
      storagePath: s(r.storage_path) || s(r.file_path) || s(j(r, "storage_path")),
      fileName: s(r.file_name) || s(j(r, "file_name")),
      fileSize: typeof r.file_size === "number" ? r.file_size : undefined,
    }));
}

/* ------------------------------------------------------------- products */

export type ProductItem = {
  name: string;
  slug?: string | undefined;
  icon: string;
  body: string;
  tags: string[];
  ctaLabel?: string | undefined;
  ctaHref?: string | undefined;
  category?: string | undefined;
};

export function mergeProducts(rows: CmsRow[] | null | undefined): ProductItem[] {
  const defaultProducts: ProductItem[] = PRODUCTS.map((p) => ({
    ...p,
    ctaLabel: "Request a demo",
    ctaHref: "/contact",
    category: "Enterprise Software",
  }));
  if (!Array.isArray(rows) || rows.length === 0) return defaultProducts;
  return rows.map((r) => ({
    name: s(r.title, "Product"),
    slug: r.slug || undefined,
    icon: s(r.icon, "Boxes"),
    body: s(r.body) || s(r.summary, ""),
    tags: r.tags && r.tags.length ? r.tags : toLines(j(r, "tags")),
    ctaLabel: s(r.cta_label, "Request a demo"),
    ctaHref: s(r.cta_href, "/contact"),
    category: s(r.category, "Enterprise Software"),
  }));
}

/* --------------------------------------------------------- testimonials */

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  category?: string | undefined;
  thumbnail?: string | undefined;
};

export function mergeTestimonials(rows: CmsRow[] | null | undefined): TestimonialItem[] {
  if (!Array.isArray(rows) || rows.length === 0) return TESTIMONIALS;
  return rows.map((r) => ({
    quote: s(r.body, ""),
    name: s(r.author) || s(r.title, "Client"),
    role: s(r.author_role) || s(r.summary, ""),
    category: s(r.category, "All"),
    thumbnail: s(r.thumbnail) || undefined,
  }));
}

/* --------------------------------------------------------- team members */

export type TeamMemberItem = {
  name: string;
  role: string;
  department: string;
  bio: string;
  thumbnail: string;
  email?: string | undefined;
  phone?: string | undefined;
  linkedin?: string | undefined;
};

export function mergeTeamMembers(rows: CmsRow[] | null | undefined): TeamMemberItem[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map((r) => ({
    name: s(r.title, "Team Member"),
    role: s(r.summary, "Lead"),
    department: s(r.department, "Advisory"),
    bio: s(r.body, ""),
    thumbnail: s(r.thumbnail, ""),
    email: s(r.email) || undefined,
    phone: s(r.phone) || undefined,
    linkedin: s(j(r, "linkedin")) || undefined,
  }));
}

/* ------------------------------------------------------------------ page */

export type PageContent = {
  row: CmsRow | null;
  text: (field: string, fallback: string) => string;
  list: (field: string) => { a: string; b: string }[];
  tags: (field: string) => string[];
  hidden: (section: string) => boolean;
};

export function pageContent(row: CmsRow | null | undefined): PageContent {
  const hiddenList = row ? toLines(j(row, "hiddenSections")).map((v) => v.toLowerCase()) : [];
  return {
    row: row ?? null,
    text: (field, fallback) => {
      if (!row) return fallback;
      const direct = (row as unknown as Record<string, unknown>)[field];
      return s(direct, s(j(row, field), fallback));
    },
    list: (field) => (row ? pairs(j(row, field)) : []),
    tags: (field) => (row ? toLines(j(row, field)) : []),
    hidden: (section) => hiddenList.includes(section.toLowerCase()),
  };
}
