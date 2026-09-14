"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/primitives";
import { CtaBand } from "@/components/site/CtaBand";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { BLOG_CATEGORIES, BLOG_POSTS } from "@/data/blog";
import { canonical, breadcrumbSchema, jsonLd, pageMeta } from "@/lib/seo";
import { loadBlogPosts } from "@/lib/cms-loaders";

export const Route = createFileRoute("/blogs/")({
  loader: async () => ({ posts: await loadBlogPosts() }),
  head: () => ({
    meta: pageMeta({
      title: "Insights & Blogs — Jyot Enterprise",
      description:
        "Practical writing on loans, technology, AI, legal compliance, engineering and business operations from the Jyot Enterprise team.",
      path: "/blogs",
      type: "website",
    }),
    links: [canonical("/blogs")],
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Insights & Blogs", path: "/blogs" },
        ]),
      ),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Jyot Enterprise Insights",
        url: "/blogs",
        blogPost: BLOG_POSTS.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          datePublished: p.date,
          url: `/blogs/${p.slug}`,
          author: { "@type": "Person", name: p.author },
        })),
      }),
    ],
  }),
  component: Blogs,
});

function Blogs() {
  const [category, setCategory] = useState<string>("All");
  const { posts: allPosts } = Route.useLoaderData();
  const posts = category === "All" ? allPosts : allPosts.filter((p) => p.category === category);

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Notes from the desks that do the work."
        body="No thought leadership theatre — just what we have learned delivering the mandates."
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Insights", path: "/blogs" },
        ]}
      />

      <section className="bg-background py-24">
        <div className="container-x">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter articles by category"
          >
            {["All", ...BLOG_CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  category === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 0.06}>
                <Link
                  to="/blogs/$slug"
                  params={{ slug: p.slug }}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-soft transition-shadow hover:shadow-lift overflow-hidden"
                >
                  {p.thumbnailImage || p.featuredImage || p.heroImage ? (
                    <div className="mb-5 -mx-5 -mt-5 sm:-mx-7 sm:-mt-7 overflow-hidden border-b border-border bg-muted">
                      <img
                        src={p.thumbnailImage || p.featuredImage || p.heroImage}
                        alt={p.title}
                        className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-fit rounded-full bg-primary/8 px-3 py-1 text-[0.7rem] font-bold tracking-wide text-primary uppercase">
                      {p.category}
                    </span>
                    {p.subCategory ? (
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[0.68rem] font-semibold text-muted-foreground">
                        {p.subCategory}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-4 font-display text-lg leading-snug font-bold text-ink">
                    {p.title}
                  </h2>
                  <p className="mt-3 flex-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {p.excerpt}
                  </p>
                  <div className="mt-7 flex items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      {p.authorPhoto ? (
                        <img
                          src={p.authorPhoto}
                          alt={p.author}
                          className="h-4 w-4 rounded-full object-cover"
                        />
                      ) : null}
                      <span>{p.author}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" /> {p.read}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {posts.length === 0 ? (
            <p className="mt-16 text-center text-muted-foreground">
              No articles in this category yet — more are published every month.
            </p>
          ) : null}
        </div>
      </section>

      <CtaBand
        eyebrow="Newsletter"
        title="One practical note a month."
        body="Written by the people running the mandates — loans, compliance calendars, ERP rollouts and AI automation, explained plainly."
      />
    </>
  );
}
