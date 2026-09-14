import { SERVICES, FAQ_GROUPS, PRODUCTS } from "@/data/site";
import { SUB_SERVICES } from "@/data/catalog";
import { BLOG_POSTS } from "@/data/blog";
import { RESOURCE_LIBRARY } from "@/data/resources";
import { CASE_DETAILS } from "@/data/case-studies";
import { INDUSTRY_PAGES } from "@/data/industries";
import { PROJECTS } from "@/data/projects";
import { TOOLS } from "@/components/site/tools/registry";
import { JOBS } from "@/data/careers";

export type SearchKind =
  | "Service"
  | "Product"
  | "Blog"
  | "Resource"
  | "Case Study"
  | "Industry"
  | "Project"
  | "FAQ"
  | "Tool"
  | "Job";

export type SearchRecord = {
  kind: SearchKind;
  title: string;
  body: string;
  href: string;
  meta: string;
};

function build(): SearchRecord[] {
  const records: SearchRecord[] = [];

  for (const s of SERVICES) {
    records.push({
      kind: "Service",
      title: s.name,
      body: `${s.tagline} ${s.description} ${s.items.join(" ")}`,
      href: `/services/${s.slug}`,
      meta: "Practice",
    });
  }

  for (const s of SUB_SERVICES) {
    records.push({
      kind: "Service",
      title: s.name,
      body: `${s.tagline} ${s.overview}`,
      href: `/service/${s.slug}`,
      meta: s.parent === "it" ? "IT" : s.parent.charAt(0).toUpperCase() + s.parent.slice(1),
    });
  }

  for (const p of BLOG_POSTS) {
    records.push({
      kind: "Blog",
      title: p.title,
      body: `${p.excerpt} ${p.keywords.join(" ")}`,
      href: `/blogs/${p.slug}`,
      meta: p.category,
    });
  }

  for (const r of RESOURCE_LIBRARY) {
    records.push({
      kind: "Resource",
      title: r.title,
      body: `${r.summary} ${r.sections.map((s) => s.heading).join(" ")}`,
      href: `/resources/${r.slug}`,
      meta: `${r.category} · ${r.practice}`,
    });
    for (const f of r.faqs) {
      records.push({
        kind: "FAQ",
        title: f.q,
        body: f.a,
        href: `/resources/${r.slug}`,
        meta: r.practice,
      });
    }
  }

  for (const c of CASE_DETAILS) {
    records.push({
      kind: "Case Study",
      title: `${c.client} — ${c.title}`,
      body: `${c.summary} ${c.problem}`,
      href: `/case-studies/${c.slug}`,
      meta: c.practice,
    });
  }

  for (const i of INDUSTRY_PAGES) {
    records.push({
      kind: "Industry",
      title: i.name,
      body: `${i.headline} ${i.intro} ${i.painPoints.join(" ")}`,
      href: `/industries/${i.slug}`,
      meta: "Industry",
    });
  }

  for (const p of PROJECTS) {
    records.push({
      kind: "Project",
      title: `${p.client} — ${p.title}`,
      body: `${p.summary} ${p.tech.join(" ")}`,
      href: `/portfolio/${p.slug}`,
      meta: p.industry,
    });
  }

  for (const prod of PRODUCTS) {
    records.push({
      kind: "Product",
      title: prod.name,
      body: `${prod.body} ${prod.tags.join(" ")}`,
      href: "/#products",
      meta: "Platform",
    });
  }

  for (const t of TOOLS) {
    records.push({
      kind: "Tool",
      title: t.name,
      body: `${t.summary} ${t.description}`,
      href: `/tools/${t.slug}`,
      meta: "Free tool",
    });
  }

  for (const j of JOBS) {
    const isInternship = j.employmentType === "internship" || j.type === "Internship";
    records.push({
      kind: "Job",
      title: `${j.title} (${isInternship ? "Internship" : "Job"})`,
      body: `${j.summary} ${j.body ?? ""} ${j.department ?? ""} ${j.location ?? ""} ${(j.skills ?? []).join(" ")}`,
      href: `/careers/${j.slug}`,
      meta: j.department ? `${j.department} · Career` : "Career Opening",
    });
  }

  for (const g of FAQ_GROUPS) {
    for (const f of g.items) {
      records.push({ kind: "FAQ", title: f.q, body: f.a, href: "/#faqs", meta: g.category });
    }
  }

  for (const s of SUB_SERVICES) {
    for (const f of s.faqs) {
      const idx = f.indexOf("|");
      records.push({
        kind: "FAQ",
        title: f.slice(0, idx).trim(),
        body: f.slice(idx + 1).trim(),
        href: `/service/${s.slug}`,
        meta: s.name,
      });
    }
  }

  return records;
}

export const SEARCH_INDEX: SearchRecord[] = build();

export function searchSite(query: string, limit = 40, extra: SearchRecord[] = []): SearchRecord[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  // Published CMS pages are merged in; a CMS page replaces the built-in
  // record with the same link so results are never duplicated.
  const byHref = new Map(SEARCH_INDEX.map((r) => [r.href, r]));
  for (const record of extra) byHref.set(record.href, record);

  const scored = [...byHref.values()]
    .map((record) => {
      const title = record.title.toLowerCase();
      const body = record.body.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += title.startsWith(term) ? 6 : 4;
        if (body.includes(term)) score += 1;
        if (record.meta.toLowerCase().includes(term)) score += 2;
      }
      return { record, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.record);
}
