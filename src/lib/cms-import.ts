/**
 * Converts the website's built-in content (src/data) into CMS records so an
 * admin can edit it from the panel. Import is additive and skips slugs that
 * already exist, so running it twice never duplicates or overwrites content.
 */

import type { CmsModule } from "@/lib/cms-schema";
import { SERVICES } from "@/data/site";
import { FAQ_GROUPS } from "@/data/site";
import { SUB_SERVICES } from "@/data/catalog";
import { INDUSTRY_PAGES } from "@/data/industries";
import { PROJECTS } from "@/data/projects";
import { CASE_DETAILS } from "@/data/case-studies";
import { BLOG_POSTS } from "@/data/blog";
import { RESOURCE_LIBRARY } from "@/data/resources";
import { JOBS } from "@/data/careers";
import { DOWNLOADS } from "@/data/downloads";
import { CONTACT, OFFICES, PROCESS, PRODUCTS, STATS, TESTIMONIALS, WHY_US } from "@/data/site";

type Record_ = Record<string, unknown>;

function articleToText(post: (typeof BLOG_POSTS)[number]): string {
  return post.body
    .map((section) => {
      const lines = [`## ${section.heading}`, ...section.paragraphs];
      if (section.points) lines.push(...section.points.map((p) => `- ${p}`));
      return lines.join("\n");
    })
    .join("\n\n");
}

export function staticRecords(module: CmsModule): Record_[] {
  switch (module) {
    case "services":
      return SERVICES.map((s) => ({
        title: s.name,
        slug: s.slug,
        service_key: s.slug,
        summary: s.tagline,
        body: s.description,
        hero_title: s.name,
        hero_description: s.tagline,
        features: s.items,
      }));

    case "sub_services":
      return SUB_SERVICES.map((s) => ({
        title: s.name,
        slug: s.slug,
        parent_key: s.parent,
        summary: s.tagline,
        body: s.overview,
        benefits: s.benefits,
        process: s.process,
        timeline: s.timeline,
        faqs: s.faqs,
        testimonial: s.testimonial,
      }));

    case "industries":
      return INDUSTRY_PAGES.map((i) => ({
        title: i.name,
        slug: i.slug,
        icon: i.icon,
        hero_title: i.headline,
        summary: i.intro,
        painPoints: i.painPoints,
        solutions: i.solutions.map((s) => `${s.title} | ${s.body}`),
        services: i.services.map((s) => `${s.name} | ${s.parent} | ${s.sub ?? ""}`),
        caseSlug: i.caseSlug ?? "",
        stat: `${i.stat.k} | ${i.stat.v}`,
      }));

    case "projects":
      return PROJECTS.map((p) => ({
        title: p.title,
        slug: p.slug,
        client: p.client,
        industry: p.industry,
        service: p.practice,
        summary: p.summary,
        challenge: p.challenge,
        solution: p.solution,
        outcome: p.outcome,
        metrics: p.metrics.map((m) => `${m.k} | ${m.v}`),
        technologies: p.tech,
        gallery: p.gallery.map((g) => g.caption),
        duration: p.duration,
        year: p.year,
        quote: p.quote ?? "",
        quoteBy: p.quoteBy ?? "",
      }));

    case "case_studies":
      return CASE_DETAILS.map((c) => ({
        title: c.title,
        slug: c.slug,
        client: c.client,
        industry: c.industry,
        service: c.practice,
        summary: c.summary,
        problem: c.problem,
        research: c.research,
        solutionPoints: c.solution,
        implementation: c.implementation.map((i) => `${i.phase} | ${i.body}`),
        timeline: c.timeline.map((t) => `${t.label} | ${t.body}`),
        roi: c.roi.map((r) => `${r.k} | ${r.v}`),
        roiSummary: c.roiSummary,
        feedback: c.feedback,
        person: c.person,
      }));

    case "posts":
      return BLOG_POSTS.map((p) => ({
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        author: p.author,
        author_role: p.authorRole,
        category: p.category,
        tags: p.keywords,
        read_time: p.read,
        published_at: p.date,
        body: articleToText(p),
        takeaway: p.takeaway,
        seo_keywords: p.keywords,
      }));

    case "resources":
      return RESOURCE_LIBRARY.map((r) => ({
        title: r.title,
        slug: r.slug,
        resource_type: r.category,
        category: r.practice,
        icon: r.icon,
        summary: r.summary,
        read_time: r.readTime,
        sections: r.sections.map((s) => `${s.heading} | ${s.body}`),
        downloads: r.downloads.map((d) => `${d.name} | ${d.format} | ${d.size}`),
        faqs: r.faqs.map((f) => `${f.q} | ${f.a}`),
      }));

    case "faqs":
      return FAQ_GROUPS.flatMap((group) =>
        group.items.map((item) => ({
          question: item.q,
          answer: item.a,
          category: group.category,
        })),
      );

    case "jobs":
      return JOBS.map((j) => ({
        title: j.title,
        slug: j.slug,
        department: j.department,
        employment_type: j.type,
        location: j.location,
        work_mode: j.location.toLowerCase().includes("hybrid") ? "Hybrid" : "On-site",
        experience: j.experience,
        salary: j.salary,
        openings: 1,
        summary: j.summary,
        responsibilities: j.responsibilities,
        qualifications: j.requirements,
        niceToHave: j.niceToHave ?? [],
      }));

    case "downloads":
      return DOWNLOADS.map((d) => ({
        title: d.title,
        slug: d.slug,
        category: d.division,
        summary: d.summary,
        cta_label: "Download",
        body: d.sections
          .map((s) => [s.heading, ...s.lines.map((l) => `- ${l}`)].join("\n"))
          .join("\n\n"),
      }));

    case "offices":
      return OFFICES.map((o) => ({
        title: o.label,
        slug: o.city.toLowerCase(),
        city: o.city,
        address: o.address,
        maps_url: o.maps,
        embed_url: o.embed,
        phone: CONTACT.phone,
        email: CONTACT.email,
        hours: CONTACT.hours,
      }));

    case "products":
      return PRODUCTS.map((p) => ({
        title: p.name,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        icon: p.icon,
        body: p.body,
        tags: p.tags,
        category: "Enterprise Software",
        cta_label: "Request a demo",
        cta_href: "/contact",
      }));

    case "testimonials":
      return TESTIMONIALS.map((t, idx) => ({
        title: t.name,
        slug: `testimonial-${idx + 1}`,
        author: t.name,
        author_role: t.role,
        body: t.quote,
        category: "All",
      }));

    case "team_members":
      return [
        {
          title: "Principal Partner",
          slug: "principal-partner",
          summary: "Managing Partner",
          department: "Executive Leadership",
          body: "Over 20 years leading multidisciplinary enterprise mandates spanning corporate finance, technology strategy, and regulatory compliance across India.",
        },
        {
          title: "Head of Technology",
          slug: "head-of-technology",
          summary: "Partner & CTO",
          department: "Technology",
          body: "Directs enterprise software architecture, custom ERP development, cybersecurity implementations, and AI/ML operational automation.",
        },
        {
          title: "Head of Corporate Advisory",
          slug: "head-of-corporate-advisory",
          summary: "Partner, Corporate Finance",
          department: "Finance",
          body: "Specializes in working capital optimization, debt syndication, cross-border M&A advisory, and balance sheet structuring.",
        },
      ];

    case "pages":
      return [
        {
          title: "Home",
          slug: "home",
          stats: STATS.map((s) => `${s.value}${s.suffix} | ${s.label}`),
          whyUs: WHY_US.map((w) => `${w.title} | ${w.body}`),
          process: PROCESS.map((p) => `${p.step} | ${p.body}`),
          testimonials: TESTIMONIALS.map((t) => `${t.quote} | ${t.name} | ${t.role}`),
        },
        {
          title: "About",
          slug: "about",
          whyUs: WHY_US.map((w) => `${w.title} | ${w.body}`),
          stats: STATS.map((s) => `${s.value}${s.suffix} | ${s.label}`),
        },
        {
          title: "Contact",
          slug: "contact",
          hero_title: "Start with a conversation.",
          hero_description:
            "Tell us the objective. We will tell you honestly whether we are the right partner for it — and what it should cost.",
        },
      ];

    default:
      return [];
  }
}
