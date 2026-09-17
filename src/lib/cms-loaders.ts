/**
 * Route-loader helpers: fetch published CMS rows and merge them over the
 * built-in content. Every helper falls back to the built-in content if the
 * database is unreachable, so the public site can never go blank.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  getBlogPost,
  getCareerRole,
  getPortfolioProject,
  getPublishedContent,
} from "@/lib/cms.functions";
import { getResourceBySlug, resourceFileList } from "@/lib/resource.functions";
import { CMS_MODULE_DEFS, type CmsModule, type CmsRow } from "@/lib/cms-schema";
import {
  cmsDownloads,
  jobExtras,
  mergeJobs,
  toJob,
  pageContent,
  mergeBlogPosts,
  toBlogPost,
  mergeCaseStudies,
  mergeIndustries,
  mergeProjects,
  toProject,
  mergeResources,
  toResourceFull,
  mergeSubServices,
  mergeProducts,
  mergeTestimonials,
  mergeTeamMembers,
  serviceOverrides,
} from "@/lib/cms-content";
import { BLOG_POSTS, type BlogPost } from "@/data/blog";
import { PROJECTS, type Project } from "@/data/projects";
import { CASE_DETAILS } from "@/data/case-studies";
import { INDUSTRY_PAGES } from "@/data/industries";
import { RESOURCE_LIBRARY } from "@/data/resources";
import { SUB_SERVICES } from "@/data/catalog";
import { JOBS } from "@/data/careers";
import { PRODUCTS, TESTIMONIALS } from "@/data/site";

async function rows(module: CmsModule): Promise<CmsRow[]> {
  const table = (CMS_MODULE_DEFS[module]?.table ?? `cms_${module}`) as any;

  // In browser, query Supabase directly using the real table
  if (typeof window !== "undefined") {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && Array.isArray(data)) {
        return data as unknown as CmsRow[];
      }
    } catch {
      // ignore
    }
  }

  // During SSR or as server fallback, call server function
  try {
    const res = await getPublishedContent({ data: { module } });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).rows)) return (res as any).rows;
  } catch {
    // ignore
  }

  // Final fallback to direct client query
  try {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && Array.isArray(data)) {
      return data as unknown as CmsRow[];
    }
  } catch {
    // ignore
  }

  return [];
}

export async function loadBlogPosts() {
  try {
    return mergeBlogPosts(await rows("posts"));
  } catch {
    return BLOG_POSTS;
  }
}

export async function loadBlogPost(slug: string, preview = false): Promise<BlogPost | null> {
  if (typeof window !== "undefined") {
    try {
      const { data, error } = await supabase
        .from("cms_posts" as any)
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (!error && data) {
        return toBlogPost(data as unknown as CmsRow);
      }
    } catch {
      // ignore
    }
  }
  try {
    const row = await getBlogPost({ data: { slug, preview } });
    if (row) {
      return toBlogPost(row);
    }
  } catch {
    // fallback to static BLOG_POSTS
  }
  const fallback = BLOG_POSTS.find((p) => p.slug === slug);
  return fallback ?? null;
}

export async function loadProjects() {
  try {
    return mergeProjects(await rows("projects"));
  } catch {
    return PROJECTS;
  }
}

export async function loadProject(slug: string, preview = false): Promise<Project | null> {
  if (typeof window !== "undefined") {
    try {
      const { data, error } = await supabase
        .from("cms_projects" as any)
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (!error && data) {
        return toProject(data as unknown as CmsRow);
      }
    } catch {
      // ignore
    }
  }
  try {
    const row = await getPortfolioProject({ data: { slug, preview } });
    if (row) {
      return toProject(row);
    }
  } catch {
    // fallback to static PROJECTS
  }
  const fallback = PROJECTS.find((p) => p.slug === slug);
  return fallback ?? null;
}

export async function loadCaseStudies() {
  try {
    return mergeCaseStudies(await rows("case_studies"));
  } catch {
    return CASE_DETAILS;
  }
}

export async function loadIndustries() {
  try {
    return mergeIndustries(await rows("industries"));
  } catch {
    return INDUSTRY_PAGES;
  }
}

export async function loadResources() {
  try {
    const cmsRows = await rows("resources");
    const resources = mergeResources(cmsRows);
    // Inject real download files from cms_resource_files for each CMS row
    // (static fallback resources don't have a DB id so we skip them)
    await Promise.all(
      cmsRows.map(async (row) => {
        try {
          const files = await resourceFileList({
            data: { resourceId: row.id, includeInactive: false },
          });
          if (files && files.length > 0) {
            // Find the matching resource and inject files into its data so toResource picks them up
            const res = resources.find((r) => r.slug === row.slug);
            if (res) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (res as any)._resourceFiles = files;
              res.downloads = files
                .filter((f) => f.is_active)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((f) => ({
                  id: f.id,
                  name: f.title,
                  format: f.file_type,
                  size: f.file_size ? formatBytesForDisplay(f.file_size) : (f.display_label ?? ""),
                  fileUrl: f.file_url ?? undefined,
                  storagePath: f.storage_path ?? undefined,
                  mimeType: f.mime_type ?? undefined,
                  fileSize: f.file_size ?? undefined,
                  displayLabel: f.display_label ?? undefined,
                  downloadFilename: f.download_filename ?? undefined,
                  isActive: f.is_active,
                }));
            }
          }
        } catch {
          // Non-blocking; resource still renders without files from DB
        }
      }),
    );
    return resources;
  } catch {
    return RESOURCE_LIBRARY;
  }
}

function formatBytesForDisplay(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** Load a single resource by slug, with optional draft preview support. */
export async function loadResourceBySlug(
  slug: string,
  preview = false,
): Promise<import("@/data/resources").ResourceItem | null> {
  try {
    const row = await getResourceBySlug({ data: { slug, preview } });
    if (!row) {
      // Fallback to static
      return RESOURCE_LIBRARY.find((r) => r.slug === slug) ?? null;
    }
    // Inject real files
    let files: import("@/lib/resource.functions").ResourceFile[] = [];
    try {
      files = await resourceFileList({ data: { resourceId: row.id, includeInactive: false } });
    } catch {
      // Non-blocking
    }
    const d = (row.data ?? {}) as Record<string, unknown>;
    const activeFiles =
      files.length > 0
        ? files.filter((f) => f.is_active).sort((a, b) => a.sort_order - b.sort_order)
        : Array.isArray(d["resourceFiles"])
          ? (d["resourceFiles"] as import("@/lib/resource.functions").ResourceFile[])
          : [];

    // Build enriched row with files injected
    const enriched = {
      ...row,
      data: {
        ...d,
        resourceFiles: activeFiles,
      },
    };
    return toResourceFull(enriched as CmsRow);
  } catch {
    return RESOURCE_LIBRARY.find((r) => r.slug === slug) ?? null;
  }
}

export async function loadSubServices() {
  try {
    return mergeSubServices(await rows("sub_services"));
  } catch {
    return SUB_SERVICES;
  }
}

export async function loadServiceOverrides() {
  try {
    return serviceOverrides(await rows("services"));
  } catch {
    return {};
  }
}

export async function loadCmsFaqs(): Promise<CmsRow[]> {
  try {
    const r = await rows("faqs");
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function loadJobs() {
  try {
    return mergeJobs(await rows("jobs"));
  } catch {
    return JOBS;
  }
}

/** Job plus the CMS-only extras for its detail page, supporting draft preview. */
export async function loadJob(slug: string, preview = false) {
  try {
    const row = await getCareerRole({ data: { slug, preview } });
    if (row) {
      return { job: toJob(row), extras: jobExtras(row) };
    }
  } catch {
    // Fall through to rows/JOBS
  }
  const cmsRows = await rows("jobs");
  const jobs = (() => {
    try {
      return mergeJobs(cmsRows);
    } catch {
      return JOBS;
    }
  })();
  const job = jobs.find((j) => j.slug === slug) ?? null;
  return { job, extras: jobExtras(cmsRows.find((r) => r.slug === slug)) };
}

export async function loadDownloads() {
  try {
    return cmsDownloads(await rows("downloads"));
  } catch {
    return [];
  }
}

export async function loadProducts() {
  try {
    return mergeProducts(await rows("products"));
  } catch {
    return PRODUCTS;
  }
}

export async function loadTestimonials() {
  try {
    return mergeTestimonials(await rows("testimonials"));
  } catch {
    return TESTIMONIALS;
  }
}

export async function loadTeamMembers() {
  try {
    return mergeTeamMembers(await rows("team_members"));
  } catch {
    return [];
  }
}

/** Published page content, or empty fallbacks. */
export async function loadPage(slug: "home" | "about" | "contact" | string) {
  try {
    const all = await rows("pages");
    return pageContent(all.find((r) => r.slug === slug) ?? null);
  } catch {
    return pageContent(null);
  }
}
