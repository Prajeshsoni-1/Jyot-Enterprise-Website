import { TOOLS } from "@/components/site/tools/registry";
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { SERVICES } from "@/data/site";
import {
  loadBlogPosts,
  loadCaseStudies,
  loadIndustries,
  loadJobs,
  loadProjects,
  loadResources,
  loadSubServices,
} from "@/lib/cms-loaders";

const BASE_URL = (
  process.env["SITE_URL"] ||
  process.env["VITE_SITE_URL"] ||
  "https://elevate-jyot-core.lovable.app"
).replace(/\/+$/, "");

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Published CMS pages are merged in automatically.
        const [subServices, industries, caseStudies, projects, resources, posts, jobs] =
          await Promise.all([
            loadSubServices(),
            loadIndustries(),
            loadCaseStudies(),
            loadProjects(),
            loadResources(),
            loadBlogPosts(),
            loadJobs(),
          ]);
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/services", changefreq: "monthly", priority: "0.9" },
          { path: "/contact", changefreq: "monthly", priority: "0.9" },
          { path: "/book", changefreq: "monthly", priority: "0.9" },
          { path: "/portfolio", changefreq: "monthly", priority: "0.8" },
          { path: "/case-studies", changefreq: "monthly", priority: "0.8" },
          { path: "/industries", changefreq: "monthly", priority: "0.8" },
          { path: "/resources", changefreq: "weekly", priority: "0.8" },
          { path: "/blogs", changefreq: "weekly", priority: "0.7" },
          { path: "/careers", changefreq: "monthly", priority: "0.5" },
          { path: "/tools", changefreq: "monthly", priority: "0.8" },
          { path: "/downloads", changefreq: "monthly", priority: "0.7" },
          { path: "/sitemap", changefreq: "weekly", priority: "0.8" },
          { path: "/privacy", changefreq: "monthly", priority: "0.5" },
          { path: "/terms", changefreq: "monthly", priority: "0.5" },
          ...TOOLS.map((t) => ({
            path: `/tools/${t.slug}`,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
          ...SERVICES.map((s) => ({
            path: `/services/${s.slug}`,
            changefreq: "monthly" as const,
            priority: "0.9",
          })),
          ...subServices.map((s) => ({
            path: `/service/${s.slug}`,
            changefreq: "monthly" as const,
            priority: "0.8",
          })),
          ...industries.map((i) => ({
            path: `/industries/${i.slug}`,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
          ...caseStudies.map((c) => ({
            path: `/case-studies/${c.slug}`,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
          ...projects.map((p) => ({
            path: `/portfolio/${p.slug}`,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
          ...resources.map((r) => ({
            path: `/resources/${r.slug}`,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
          ...posts.map((p) => ({
            path: `/blogs/${p.slug}`,
            changefreq: "monthly" as const,
            priority: "0.6",
          })),
          ...jobs.map((j) => ({
            path: `/careers/${j.slug}`,
            changefreq: "weekly" as const,
            priority: "0.5",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
