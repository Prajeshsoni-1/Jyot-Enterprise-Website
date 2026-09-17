import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, CalendarDays, Clock, Eye, Share2, User } from "lucide-react";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CtaBand } from "@/components/site/CtaBand";
import { RelatedGrid } from "@/components/site/RelatedGrid";
import { Reveal } from "@/components/site/primitives";
import type { BlogPost } from "@/data/blog";
import { canonical, breadcrumbSchema, jsonLd, pageMeta, SITE_NAME } from "@/lib/seo";
import { loadBlogPost, loadBlogPosts } from "@/lib/cms-loaders";
import { BlogSectionsRenderer } from "@/components/blog/BlogSectionsRenderer";

export const Route = createFileRoute("/blogs/$slug")({
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } => {
    const isP = search["preview"] === "true" || search["preview"] === true || search["preview"] === "1";
    return isP ? { preview: true } : {};
  },
  loader: async ({ params, location }) => {
    const isPreview = Boolean(
      typeof location.search === "object" && (location.search as any)?.preview,
    );
    const post = await loadBlogPost(params.slug, isPreview);
    if (!post) throw notFound();
    const allPosts = await loadBlogPosts();
    return { post, allPosts, isPreview };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Article not found — Jyot Enterprise" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { post, isPreview } = loaderData as { post: BlogPost; isPreview?: boolean };
    const path = `/blogs/${params.slug}`;
    const title = post.seoTitle || `${post.title} — ${SITE_NAME}`;
    const description = post.seoDescription || post.excerpt;
    const ogImage = post.ogImage || post.featuredImage || post.heroImage;

    const metaOpts: Parameters<typeof pageMeta>[0] = {
      title,
      description,
      path,
      type: "article",
      noindex: Boolean(post.noindex || isPreview),
    };
    if (ogImage) {
      metaOpts.image = ogImage;
    }

    const keywords = (post.keywords && post.keywords.length > 0)
      ? post.keywords.join(", ")
      : (post.seoKeywords && post.seoKeywords.length > 0 ? post.seoKeywords.join(", ") : "");

    return {
      meta: [
        ...pageMeta(metaOpts),
        ...(keywords ? [{ name: "keywords", content: keywords }] : []),
        ...(post.nofollow ? [{ name: "robots", content: "nofollow" }] : []),
        { property: "article:published_time", content: post.date },
        { property: "article:section", content: post.category },
      ],
      links: [canonical(post.canonicalUrl || path)],
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: ogImage ? [ogImage] : undefined,
          datePublished: post.date,
          dateModified: post.updatedAt || post.date,
          keywords,
          articleSection: post.category,
          author: {
            "@type": "Person",
            name: post.author,
            jobTitle: post.authorRole,
            image: post.authorPhoto,
          },
          publisher: { "@type": "Organization", name: SITE_NAME },
          mainEntityOfPage: path,
        }),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Insights", path: "/blogs" },
            { name: post.title, path },
          ]),
        ),
      ],
    };
  },
  component: BlogPostPage,
  errorComponent: () => <NotFoundBlock />,
  notFoundComponent: () => <NotFoundBlock />,
});

function NotFoundBlock() {
  return (
    <section className="container-x py-32 text-center">
      <h1 className="font-display text-3xl font-extrabold text-ink">Article not found</h1>
      <p className="mt-3 text-muted-foreground">This article may have moved, be in draft status, or been retired.</p>
      <Link to="/blogs" className="mt-6 inline-block font-semibold text-primary">
        Back to all insights
      </Link>
    </section>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function BlogPostPage() {
  const { post, allPosts, isPreview } = Route.useLoaderData() as {
    post: BlogPost;
    allPosts: BlogPost[];
    isPreview: boolean;
  };

  const controls = post.controls ?? {
    showAuthorBio: true,
    showTableOfContents: true,
    showShare: true,
    showTakeaway: true,
    showGallery: true,
    showRelated: true,
    showCta: true,
  };

  // Dynamic related articles computation
  const related = (
    post.relatedBlogSlugs && post.relatedBlogSlugs.length > 0
      ? allPosts.filter((p) => post.relatedBlogSlugs?.includes(p.slug) && p.slug !== post.slug)
      : allPosts
          .filter((p) => p.slug !== post.slug)
          .sort(
            (a, b) => (a.category === post.category ? -1 : 0) - (b.category === post.category ? -1 : 0),
          )
  )
    .slice(0, 3)
    .map((p) => ({
      title: p.title,
      meta: p.category,
      href: `/blogs/${p.slug}`,
      body: p.excerpt,
    }));

  const path = `/blogs/${post.slug}`;
  const shareText = encodeURIComponent(post.title);
  const displayHeroImage = post.heroImage || post.featuredImage;

  // Compute table of contents items from body or sections
  const tocItems: { label: string; href: string }[] = [];
  if (post.sections && post.sections.length > 0) {
    post.sections.forEach((sec) => {
      if (sec.enabled !== false && sec.title) {
        tocItems.push({ label: sec.title, href: `#${slugify(sec.title)}` });
      }
    });
  } else if (post.body && post.body.length > 0) {
    post.body.forEach((b) => {
      if (b.heading) {
        tocItems.push({ label: b.heading, href: `#${slugify(b.heading)}` });
      }
    });
  }

  return (
    <>
      {/* Draft Preview Bar */}
      {isPreview ? (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-xs font-bold tracking-wide flex items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            PREVIEW MODE — Viewing {post.published ? "published" : "draft"} version. Public visitors will only see this article once published.
          </span>
        </div>
      ) : null}

      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Insights", path: "/blogs" },
          { name: post.title, path },
        ]}
      />

      <article>
        <header className="border-b border-border bg-surface py-16 lg:py-20">
          <div className="container-x max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-primary">{post.category}</span>
              {post.subCategory ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-primary">
                  {post.subCategory}
                </span>
              ) : null}
              {post.industry ? (
                <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[0.68rem] font-semibold text-muted-foreground">
                  {post.industry}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl leading-[1.1] font-extrabold tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 font-medium text-ink">
                {post.authorPhoto ? (
                  <img
                    src={post.authorPhoto}
                    alt={post.author}
                    className="h-6 w-6 rounded-full object-cover border border-border"
                  />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
                {post.author} · {post.authorRole}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> {post.displayDate}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {post.read} read
              </span>
            </div>

            {/* Display Hero/Featured Image */}
            {displayHeroImage ? (
              <figure className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
                <img
                  src={displayHeroImage}
                  alt={post.title}
                  className="max-h-[500px] w-full object-cover"
                />
              </figure>
            ) : null}
          </div>
        </header>

        <div className="bg-background py-20">
          <div className="container-x grid gap-14 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0 max-w-3xl">
              {/* If structured dynamic sections exist, render via BlogSectionsRenderer */}
              {post.sections && post.sections.length > 0 ? (
                <div className="space-y-12">
                  <BlogSectionsRenderer sections={post.sections} />
                </div>
              ) : (
                /* Traditional Body Blocks */
                post.body.map((block) => (
                  <Reveal key={block.heading} className="mb-12">
                    {block.heading ? (
                      <h2
                        id={slugify(block.heading)}
                        className="scroll-mt-28 font-display text-2xl font-bold text-ink"
                      >
                        {block.heading}
                      </h2>
                    ) : null}
                    {block.paragraphs.map((p) => (
                      <p
                        key={p.slice(0, 40)}
                        className="mt-4 text-base leading-relaxed text-muted-foreground"
                      >
                        {p}
                      </p>
                    ))}
                    {block.points && block.points.length > 0 ? (
                      <ul className="mt-5 grid gap-2.5">
                        {block.points.map((pt) => (
                          <li
                            key={pt}
                            className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                          >
                            <span
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                              aria-hidden="true"
                            />
                            {pt}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </Reveal>
                ))
              )}

              {/* Key Takeaway */}
              {controls.showTakeaway !== false && post.takeaway ? (
                <div className="mt-12 rounded-3xl border border-primary/20 bg-primary/5 p-7">
                  <p className="eyebrow text-primary">Key takeaway</p>
                  <p className="mt-3 text-base leading-relaxed text-ink">{post.takeaway}</p>
                </div>
              ) : null}

              {/* Before & After Comparison */}
              {post.beforeImage?.url && post.afterImage?.url ? (
                <div className="mt-12">
                  <h3 className="font-display text-xl font-bold text-ink mb-6">Before & After Comparison</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                      <img
                        src={post.beforeImage.url}
                        alt="Before"
                        className="h-52 w-full object-cover"
                      />
                      <figcaption className="border-t border-border bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground flex items-center justify-between">
                        <span>{post.beforeImage.label || "Before"}</span>
                        <span className="text-[0.65rem] text-destructive uppercase tracking-wider font-semibold">
                          Legacy state
                        </span>
                      </figcaption>
                    </figure>

                    <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                      <img
                        src={post.afterImage.url}
                        alt="After"
                        className="h-52 w-full object-cover"
                      />
                      <figcaption className="border-t border-border bg-card px-4 py-2.5 text-xs font-bold text-ink flex items-center justify-between">
                        <span>{post.afterImage.label || "After"}</span>
                        <span className="text-[0.65rem] text-emerald-600 uppercase tracking-wider font-semibold">
                          Optimized state
                        </span>
                      </figcaption>
                    </figure>
                  </div>
                </div>
              ) : null}

              {/* Gallery */}
              {controls.showGallery !== false && post.gallery && post.gallery.length > 0 ? (
                <div className="mt-12 border-t border-border pt-10">
                  <h3 className="font-display text-xl font-bold text-ink mb-6">Gallery & Media</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {post.gallery.map((g, i) => (
                      <figure key={i} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                        <img
                          src={g.url}
                          alt={g.alt || g.caption || `Gallery Image ${i + 1}`}
                          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {g.caption ? (
                          <figcaption className="border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
                            {g.caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Author Bio Card */}
              {controls.showAuthorBio !== false && (post.authorBio || post.authorPhoto) ? (
                <div className="mt-14 rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {post.authorPhoto ? (
                    <img
                      src={post.authorPhoto}
                      alt={post.author}
                      className="h-16 w-16 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                      {post.author.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="eyebrow text-primary text-xs">About the Author</p>
                    <h3 className="font-display text-base font-bold text-ink mt-1">
                      {post.author}
                    </h3>
                    <p className="text-xs text-muted-foreground">{post.authorRole}</p>
                    {post.authorBio ? (
                      <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                        {post.authorBio}
                      </p>
                    ) : null}
                    {post.authorSocialUrl ? (
                      <a
                        href={post.authorSocialUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        Author Profile <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Tags */}
              {post.keywords && post.keywords.length > 0 ? (
                <div className="mt-10 flex flex-wrap gap-2">
                  {post.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                    >
                      #{k}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Sidebar Aside */}
            <aside className="lg:sticky lg:top-28 lg:self-start space-y-4">
              {/* Table of Contents */}
              {controls.showTableOfContents !== false && tocItems.length > 0 ? (
                <nav
                  aria-label="Table of contents"
                  className="rounded-3xl border border-border bg-card p-6"
                >
                  <p className="eyebrow">On this page</p>
                  <ol className="mt-4 grid gap-2.5">
                    {tocItems.map((item, i) => (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          className="flex gap-2 text-sm leading-snug text-muted-foreground transition-colors hover:text-primary"
                        >
                          <span className="tabular-nums text-primary/60">{i + 1}.</span>
                          <span className="line-clamp-2">{item.label}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}

              {/* Share */}
              {controls.showShare !== false ? (
                <div className="rounded-3xl border border-border bg-card p-6">
                  <p className="eyebrow inline-flex items-center gap-2">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </p>
                  <div className="mt-4 grid gap-2 text-sm font-semibold">
                    <a
                      className="text-muted-foreground transition-colors hover:text-primary"
                      href={`https://wa.me/?text=${shareText}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ) : null}

              {/* Newsletter Subscription */}
              <div className="rounded-3xl border border-border bg-ink p-6 text-background">
                <p className="font-display text-base font-bold">Get these in your inbox</p>
                <p className="mt-2 text-sm text-background/70">
                  One practical note a month. No newsletter theatre.
                </p>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  Subscribe <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Dynamic Related Articles */}
      {controls.showRelated !== false && related.length > 0 ? (
        <RelatedGrid
          items={related}
          eyebrow="Keep reading"
          title="Related articles."
          tone="surface"
        />
      ) : null}

      {/* Custom Editable CTA or Default CtaBand */}
      {controls.showCta !== false ? (
        post.cta && post.cta.enabled !== false ? (
          <section className="container-x py-20">
            <div
              className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-8 sm:p-14 text-center shadow-xs"
              style={
                (post.cta.backgroundImage || post.cta.image)
                  ? {
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(${post.cta.backgroundImage || post.cta.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "#fff",
                    }
                  : undefined
              }
            >
              <p className={`eyebrow mb-2 ${post.cta.backgroundImage || post.cta.image ? "text-primary-foreground/90" : "text-primary"}`}>
                Next Steps
              </p>
              <h2 className={`font-display text-2xl font-extrabold sm:text-4xl ${post.cta.backgroundImage || post.cta.image ? "text-white" : "text-ink"}`}>
                {post.cta.heading}
              </h2>
              {post.cta.description ? (
                <p className={`mx-auto mt-4 max-w-xl text-base leading-relaxed ${post.cta.backgroundImage || post.cta.image ? "text-white/80" : "text-muted-foreground"}`}>
                  {post.cta.description}
                </p>
              ) : null}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={post.cta.primaryButtonUrl || "/contact"}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
                >
                  <span>{post.cta.primaryButtonText || "Schedule Consultation"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {post.cta.secondaryButtonText && post.cta.secondaryButtonUrl ? (
                  <Link
                    to={post.cta.secondaryButtonUrl}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-5 py-3 text-sm font-bold text-ink hover:bg-secondary transition"
                  >
                    <span>{post.cta.secondaryButtonText}</span>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <CtaBand />
        )
      ) : null}
    </>
  );
}
