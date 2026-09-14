"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Lightbulb,
  Plus,
  Quote,
  Save,
  Search,
  Send,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  User,
  Video,
  X,
  Zap,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Minus,
  Table as TableIcon,
} from "lucide-react";
import {
  BLOG_CATEGORIES,
  type BlogCategory,
  type BlogPost,
  type BlogSection,
  type BlogSectionType,
} from "@/data/blog";
import { ConfirmModal, ErrorState, Loading, formatDate } from "@/components/admin/ui";
import { MediaButton, MediaPicker } from "@/components/admin/MediaPicker";
import { cmsGet, cmsSave, cmsList } from "@/lib/cms.functions";
import { slugify } from "@/lib/cms-schema";
import { parseArticleBody } from "@/lib/cms-content";

const SECTION_TYPE_OPTIONS: { value: BlogSectionType; label: string; desc: string }[] = [
  { value: "rich_text", label: "Rich Text / Markdown", desc: "Long-form editorial prose with headings and lists" },
  { value: "heading_text", label: "Heading + Text", desc: "Highlighted section with large headline and callout" },
  { value: "image_text", label: "Image + Text", desc: "Two-column side-by-side graphic and explanation" },
  { value: "full_image", label: "Full Width Image", desc: "High-impact visual banner or diagram" },
  { value: "gallery", label: "Image Gallery", desc: "Responsive 2/3 column image grid with captions" },
  { value: "key_takeaways", label: "Key Takeaways", desc: "Highlighted bullet points in an executive summary box" },
  { value: "quote", label: "Client / Expert Quote", desc: "Pull quote with author name and optional portrait" },
  { value: "stats", label: "Statistics / Metrics", desc: "Key numbers and percentage callouts in cards" },
  { value: "features", label: "Features / Key Points", desc: "Grid of icon-accented feature benefit items" },
  { value: "challenges", label: "Challenges", desc: "Problem statement callout box with amber accents" },
  { value: "solutions", label: "Solutions", desc: "Solution details box with brand blue accents" },
  { value: "results", label: "Results", desc: "Outcome highlights box with green growth accents" },
  { value: "technologies", label: "Technologies / Frameworks", desc: "Badge chips for tools and software mentioned" },
  { value: "faq", label: "Frequently Asked Questions", desc: "Q&A accordion or card list" },
  { value: "video", label: "Video Embed", desc: "YouTube, Vimeo, or direct video player" },
  { value: "cta", label: "Call to Action Band", desc: "Banner encouraging readers to book or enquire" },
  { value: "custom", label: "Custom Content", desc: "Flexible custom layout block" },
];

export function BlogEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const get = useServerFn(cmsGet);
  const save = useServerFn(cmsSave);
  const list = useServerFn(cmsList);

  const [activeTab, setActiveTab] = useState<
    "basic" | "content" | "media" | "sections" | "gallery" | "author" | "cta" | "seo" | "controls" | "history"
  >("basic");

  // Basic info states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSlug, setManualSlug] = useState(!isNew);
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<string>("Finance");
  const [subCategory, setSubCategory] = useState("");
  const [industry, setIndustry] = useState("");
  const [readTime, setReadTime] = useState("6 min");
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  // Content & Markdown states
  const [markdownBody, setMarkdownBody] = useState("");
  const [takeaway, setTakeaway] = useState("");
  const [contentViewMode, setContentViewMode] = useState<"edit" | "preview">("edit");
  const [inlineMediaPickerOpen, setInlineMediaPickerOpen] = useState(false);
  const markdownTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Media states
  const [featuredImage, setFeaturedImage] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [twitterImage, setTwitterImage] = useState("");
  const [beforeImageUrl, setBeforeImageUrl] = useState("");
  const [beforeImageLabel, setBeforeImageLabel] = useState("Before");
  const [afterImageUrl, setAfterImageUrl] = useState("");
  const [afterImageLabel, setAfterImageLabel] = useState("After");

  // Gallery states
  const [gallery, setGallery] = useState<{ url: string; caption: string; alt?: string }[]>([]);

  // Sections states
  const [sections, setSections] = useState<BlogSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Author states
  const [author, setAuthor] = useState("Jyot Enterprise");
  const [authorRole, setAuthorRole] = useState("Advisory Team");
  const [authorPhoto, setAuthorPhoto] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorSocialUrl, setAuthorSocialUrl] = useState("");

  // CTA states
  const [ctaEnabled, setCtaEnabled] = useState(true);
  const [ctaHeading, setCtaHeading] = useState("Need specialist advice for your business?");
  const [ctaDesc, setCtaDesc] = useState("Speak with our practice leads across Finance, Technology, Legal and Engineering.");
  const [ctaPrimaryText, setCtaPrimaryText] = useState("Schedule Consultation");
  const [ctaPrimaryUrl, setCtaPrimaryUrl] = useState("/contact");
  const [ctaSecondaryText, setCtaSecondaryText] = useState("Explore Services");
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState("/services");
  const [ctaImage, setCtaImage] = useState("");

  // SEO states
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [twitterTitle, setTwitterTitle] = useState("");
  const [twitterDescription, setTwitterDescription] = useState("");
  const [noindex, setNoindex] = useState(false);
  const [nofollow, setNofollow] = useState(false);

  // Page Controls & Related
  const [controls, setControls] = useState({
    showAuthorBio: true,
    showTableOfContents: true,
    showShare: true,
    showTakeaway: true,
    showGallery: true,
    showRelated: true,
    showCta: true,
  });
  const [relatedBlogSlugs, setRelatedBlogSlugs] = useState<string[]>([]);
  const [relatedSearch, setRelatedSearch] = useState("");

  // Operational states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(isNew);
  const [isDirty, setIsDirty] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Fetch record
  const recordQuery = useQuery({
    enabled: !isNew,
    queryKey: ["cms", "item", "posts", id],
    queryFn: () => get({ data: { module: "posts", id } }),
  });

  // Fetch existing posts for related picker and slug uniqueness
  const allPostsQuery = useQuery({
    queryKey: ["cms", "list", "posts"],
    queryFn: () => list({ data: { module: "posts" } }),
  });

  // Populate data when loaded
  useEffect(() => {
    if (recordQuery.data?.row && !loaded) {
      const row = recordQuery.data.row;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: any = row.data ?? {};

      setTitle(row.title ?? "");
      setSlug(row.slug ?? "");
      setExcerpt(row.excerpt ?? row.summary ?? "");
      setCategory(row.category ?? "Finance");
      setSubCategory(d.subCategory ?? "");
      setIndustry(row.industry ?? d.industry ?? "");
      setReadTime(row.read_time ?? "6 min");
      if (row.published_at) {
        setPublishedAt(row.published_at.slice(0, 10));
      }
      setTags(row.tags ?? row.seo_keywords ?? []);
      setStatus(row.status as typeof status);
      setFeatured(Boolean(row.featured));
      setSortOrder(row.sort_order ?? 0);

      // Content & Markdown
      setMarkdownBody(row.body ?? d.rawBody ?? "");
      setTakeaway(d.takeaway ?? "");

      // Media
      setFeaturedImage(row.hero_image ?? d.featuredImage ?? "");
      setHeroImage(d.heroImage ?? row.hero_image ?? "");
      setThumbnailImage(d.thumbnailImage ?? row.thumbnail ?? "");
      setOgImage(row.og_image ?? d.ogImage ?? "");
      setTwitterImage(d.twitterImage ?? "");
      if (d.beforeImage) {
        setBeforeImageUrl(d.beforeImage.url ?? "");
        setBeforeImageLabel(d.beforeImage.label ?? "Before");
      }
      if (d.afterImage) {
        setAfterImageUrl(d.afterImage.url ?? "");
        setAfterImageLabel(d.afterImage.label ?? "After");
      }

      // Gallery
      if (Array.isArray(d.gallery)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGallery(d.gallery.map((g: any, i: number) => ({
          url: typeof g === "string" ? g : (g.url ?? ""),
          caption: typeof g === "string" ? `Image ${i + 1}` : (g.caption ?? `Image ${i + 1}`),
          alt: typeof g === "string" ? "" : (g.alt ?? ""),
        })));
      }

      // Sections
      if (Array.isArray(d.sections)) {
        setSections(d.sections);
      }

      // Author
      setAuthor(row.author ?? "Jyot Enterprise");
      setAuthorRole(row.author_role ?? "Advisory Team");
      setAuthorPhoto(d.authorPhoto ?? "");
      setAuthorBio(d.authorBio ?? "");
      setAuthorSocialUrl(d.authorSocialUrl ?? "");

      // CTA
      if (d.cta) {
        setCtaEnabled(d.cta.enabled !== false);
        setCtaHeading(d.cta.heading ?? "Need specialist advice for your business?");
        setCtaDesc(d.cta.description ?? "");
        setCtaPrimaryText(d.cta.primaryButtonText ?? "Schedule Consultation");
        setCtaPrimaryUrl(d.cta.primaryButtonUrl ?? "/contact");
        setCtaSecondaryText(d.cta.secondaryButtonText ?? "Explore Services");
        setCtaSecondaryUrl(d.cta.secondaryButtonUrl ?? "/services");
        setCtaImage(d.cta.image ?? "");
      }

      // SEO
      setSeoTitle(row.seo_title ?? d.seoTitle ?? "");
      setSeoDescription(row.seo_description ?? d.seoDescription ?? "");
      setSeoKeywords(row.seo_keywords ?? d.seoKeywords ?? []);
      setCanonicalUrl(d.canonicalUrl ?? "");
      setOgTitle(d.ogTitle ?? "");
      setOgDescription(d.ogDescription ?? "");
      setTwitterTitle(d.twitterTitle ?? "");
      setTwitterDescription(d.twitterDescription ?? "");
      setNoindex(Boolean(d.noindex));
      setNofollow(Boolean(d.nofollow));

      // Controls
      if (d.controls) {
        setControls({
          showAuthorBio: d.controls.showAuthorBio !== false,
          showTableOfContents: d.controls.showTableOfContents !== false,
          showShare: d.controls.showShare !== false,
          showTakeaway: d.controls.showTakeaway !== false,
          showGallery: d.controls.showGallery !== false,
          showRelated: d.controls.showRelated !== false,
          showCta: d.controls.showCta !== false,
        });
      }

      // Related
      if (Array.isArray(d.relatedBlogSlugs)) {
        setRelatedBlogSlugs(d.relatedBlogSlugs);
      }

      setLoaded(true);
    }
  }, [recordQuery.data, loaded]);

  // Handle title & slug auto-generation
  function handleTitleChange(val: string) {
    setTitle(val);
    setIsDirty(true);
    if (!manualSlug) {
      setSlug(slugify(val));
    }
  }

  // Tags management
  function addTag(tagToAdd: string) {
    const clean = tagToAdd.trim().replace(/^#/, "");
    if (!clean || tags.includes(clean)) return;
    setTags([...tags, clean]);
    setTagInput("");
    setIsDirty(true);
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove));
    setIsDirty(true);
  }

  // Section helper
  function updateSection(index: number, patch: Partial<BlogSection>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    setIsDirty(true);
  }

  function addSection(type: BlogSectionType) {
    const opt = SECTION_TYPE_OPTIONS.find((o) => o.value === type);
    const newSec: BlogSection = {
      id: "sec_" + Date.now().toString(36),
      type,
      enabled: true,
      title: opt?.label ?? "New Section",
      subtitle: "",
      content: "",
      order: sections.length,
      images: [],
      items: [],
    };
    setSections([...sections, newSec]);
    setSelectedSectionId(newSec.id);
    setIsDirty(true);
  }

  function moveSection(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const reordered = [...sections];
    const moved = reordered[index];
    if (!moved) return;
    reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setSections(reordered.map((s, i) => ({ ...s, order: i })));
    setIsDirty(true);
  }

  function deleteSection(idToDelete: string) {
    setSections(sections.filter((s) => s.id !== idToDelete).map((s, i) => ({ ...s, order: i })));
    if (selectedSectionId === idToDelete) setSelectedSectionId(null);
    setIsDirty(true);
  }

  // Formatting toolbar helpers
  function insertMarkdown(prefix: string, suffix = "") {
    const textarea = markdownTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const nextVal = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setMarkdownBody(nextVal);
    setIsDirty(true);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 50);
  }

  function handleInsertImage(url: string, item?: { name?: string }) {
    const textarea = markdownTextareaRef.current;
    const alt = item?.name ? item.name.replace(/\.[^/.]+$/, "") : "Article illustration";
    const snippet = `\n\n![${alt}](${url})\n\n`;
    if (!textarea) {
      setMarkdownBody((prev) => prev + snippet);
    } else {
      const start = textarea.selectionStart;
      const nextVal = textarea.value.substring(0, start) + snippet + textarea.value.substring(start);
      setMarkdownBody(nextVal);
    }
    setIsDirty(true);
    setInlineMediaPickerOpen(false);
  }

  // Validate form
  function validate(): string | null {
    if (!title.trim()) return "Blog title is required.";
    const cleanSlug = slug.trim();
    if (!cleanSlug) return "Web address (slug) is required.";
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      return "Slug may only contain lowercase letters, numbers, and hyphens.";
    }
    // Uniqueness check
    const existing = (allPostsQuery.data?.rows ?? []).find(
      (r) => r.slug === cleanSlug && r.id !== id
    );
    if (existing) {
      return `Slug “${cleanSlug}” is already used by another article (“${existing.title}”). Please choose a unique slug.`;
    }
    return null;
  }

  // Save handler
  async function handleSave(newStatus?: "draft" | "published" | "archived") {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const targetStatus = newStatus ?? status;

    const dataPayload: Record<string, unknown> = {
      subCategory,
      industry,
      authorPhoto,
      authorBio,
      authorSocialUrl,
      featuredImage: featuredImage || heroImage,
      heroImage: heroImage || featuredImage,
      thumbnailImage: thumbnailImage || heroImage || featuredImage,
      gallery,
      beforeImage: beforeImageUrl ? { url: beforeImageUrl, label: beforeImageLabel } : null,
      afterImage: afterImageUrl ? { url: afterImageUrl, label: afterImageLabel } : null,
      takeaway,
      rawBody: markdownBody,
      sections,
      cta: {
        enabled: ctaEnabled,
        heading: ctaHeading,
        description: ctaDesc,
        primaryButtonText: ctaPrimaryText,
        primaryButtonUrl: ctaPrimaryUrl,
        secondaryButtonText: ctaSecondaryText,
        secondaryButtonUrl: ctaSecondaryUrl,
        image: ctaImage,
      },
      controls,
      relatedBlogSlugs,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt,
      seoKeywords: seoKeywords.length > 0 ? seoKeywords : tags,
      canonicalUrl,
      ogTitle: ogTitle || seoTitle || title,
      ogDescription: ogDescription || seoDescription || excerpt,
      ogImage: ogImage || featuredImage || heroImage,
      twitterTitle: twitterTitle || ogTitle || seoTitle || title,
      twitterDescription: twitterDescription || ogDescription || seoDescription || excerpt,
      twitterImage: twitterImage || ogImage || featuredImage || heroImage,
      noindex,
      nofollow,
    };

    try {
      const res = await save({
        data: {
          module: "posts",
          id,
          status: targetStatus,
          featured,
          sortOrder,
          values: {
            title: title.trim(),
            slug: slug.trim(),
            excerpt: excerpt.trim(),
            body: markdownBody,
            category: category.trim(),
            author: author.trim(),
            author_role: authorRole.trim(),
            tags,
            read_time: readTime.trim(),
            published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
            hero_image: heroImage || featuredImage,
            seo_title: seoTitle.trim() || title.trim(),
            seo_description: seoDescription.trim() || excerpt.trim(),
            seo_keywords: seoKeywords.length > 0 ? seoKeywords : tags,
            og_image: ogImage || featuredImage || heroImage,
            ...dataPayload,
          },
        },
      });

      setStatus(targetStatus);
      setIsDirty(false);
      setNotice(
        targetStatus === "published"
          ? "Blog post published successfully to /blogs."
          : "Blog draft saved successfully."
      );

      await queryClient.invalidateQueries({ queryKey: ["cms"] });

      if (isNew && res.id) {
        navigate({
          to: "/admin/website/$module/$id",
          params: { module: "posts", id: res.id },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save blog post.");
    } finally {
      setSaving(false);
    }
  }

  // Duplicate handler
  async function handleDuplicate() {
    setSaving(true);
    setError(null);
    const newSlug = `${slug || "article"}-copy-${Date.now().toString(36).slice(-4)}`;
    try {
      const res = await save({
        data: {
          module: "posts",
          id: "new",
          status: "draft",
          featured: false,
          sortOrder: sortOrder + 1,
          values: {
            title: `${title} (Copy)`,
            slug: newSlug,
            excerpt,
            body: markdownBody,
            category,
            author,
            author_role: authorRole,
            tags,
            read_time: readTime,
            published_at: null,
            hero_image: heroImage || featuredImage,
            seo_title: seoTitle ? `${seoTitle} (Copy)` : "",
            seo_description: seoDescription,
            seoKeywords,
            og_image: ogImage,
            subCategory,
            industry,
            authorPhoto,
            authorBio,
            authorSocialUrl,
            featuredImage,
            thumbnailImage,
            gallery,
            beforeImage: beforeImageUrl ? { url: beforeImageUrl, label: beforeImageLabel } : null,
            afterImage: afterImageUrl ? { url: afterImageUrl, label: afterImageLabel } : null,
            takeaway,
            rawBody: markdownBody,
            sections,
            cta: {
              enabled: ctaEnabled,
              heading: ctaHeading,
              description: ctaDesc,
              primaryButtonText: ctaPrimaryText,
              primaryButtonUrl: ctaPrimaryUrl,
              secondaryButtonText: ctaSecondaryText,
              secondaryButtonUrl: ctaSecondaryUrl,
              image: ctaImage,
            },
            controls,
            relatedBlogSlugs,
          },
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      if (res.id) {
        navigate({
          to: "/admin/website/$module/$id",
          params: { module: "posts", id: res.id },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to duplicate blog post.");
    } finally {
      setSaving(false);
    }
  }

  // Delete handler
  async function handleDelete() {
    setSaving(true);
    try {
      const act = await import("@/lib/cms.functions").then((m) => m.cmsAction);
      await act({
        data: {
          module: "posts",
          id,
          action: "delete",
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      navigate({ to: "/admin/website/$module", params: { module: "posts" } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete article.");
      setDeleteModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (recordQuery.isLoading && !isNew) {
    return <Loading label="Loading blog article…" />;
  }

  const publicPreviewUrl = `/blogs/${slug || "preview"}?preview=true`;
  const parsedPreviewSections = parseArticleBody(markdownBody);

  return (
    <div className="space-y-6 pb-24">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-30 flex flex-col gap-4 rounded-3xl border border-border bg-background/95 p-4 sm:p-5 backdrop-blur-md shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/website/$module"
            params={{ module: "posts" }}
            className="grid h-9 w-9 place-items-center rounded-2xl border border-border text-muted-foreground hover:bg-secondary hover:text-ink transition"
            title="Back to Blog Articles"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl font-extrabold text-ink truncate max-w-[280px] sm:max-w-md">
                {title || "New Blog Post"}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ${
                  status === "published"
                    ? "bg-emerald-500/10 text-emerald-700"
                    : status === "archived"
                    ? "bg-amber-500/10 text-amber-700"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {status}
              </span>
              {isDirty && (
                <span className="hidden sm:inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700">
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {slug ? `/blogs/${slug}` : "Draft article"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <a
              href={publicPreviewUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
              title="Preview article before or after publishing"
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>Preview</span>
            </a>
          )}

          {!isNew && (
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-50"
              title="Clone this post into a new draft"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
          )}

          {!isNew && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
              title="Delete this article"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(status === "published" ? "draft" : "published")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4.5 py-2 text-xs font-bold text-primary-foreground shadow-ember hover:bg-primary-hover transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{status === "published" ? "Unpublish to Draft" : "Publish Live"}</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs font-semibold text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs font-semibold text-emerald-700 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-2 scrollbar-none">
        {[
          { key: "basic", label: "Basic Info", icon: FileText },
          { key: "content", label: "Content & Markdown", icon: Heading1 },
          { key: "media", label: "Images & Media", icon: ImageIcon },
          { key: "sections", label: `Sections (${sections.length})`, icon: Layers },
          { key: "gallery", label: `Gallery (${gallery.length})`, icon: LayoutTemplate },
          { key: "author", label: "Author Profile", icon: User },
          { key: "cta", label: "CTA", icon: Zap },
          { key: "seo", label: "SEO & SERP", icon: Globe },
          { key: "controls", label: "Page Controls", icon: Sparkles },
          { key: "history", label: "Record Info", icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-bold transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BASIC INFO                                                         */}
      {/* ========================================================================= */}
      {activeTab === "basic" && (
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div>
            <h2 className="text-base font-bold text-ink">Blog Basic Information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Core article details, URL slug, category tagging, and publishing status.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-ink">Article Title *</span>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. How to structure working capital before your growth quarter"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary font-semibold"
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Web Address (Slug) *</span>
                <span className="text-[0.68rem] text-muted-foreground">
                  URL: /blogs/{slug || "..."}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground pl-3 hidden sm:inline">
                  /blogs/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setManualSlug(true);
                    setIsDirty(true);
                  }}
                  placeholder="how-to-structure-working-capital"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs font-mono outline-none focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setSlug(slugify(title));
                    setManualSlug(false);
                    setIsDirty(true);
                  }}
                  className="shrink-0 rounded-2xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-ink hover:bg-secondary/80"
                  title="Regenerate slug from article title"
                >
                  Regenerate
                </button>
              </div>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-ink">
                Short Description / Excerpt (shown on cards and social previews)
              </span>
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="A compelling 1-2 sentence overview of the article..."
                className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Category *</span>
              <div className="mt-1 space-y-2">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary font-medium"
                >
                  {BLOG_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  {category && !BLOG_CATEGORIES.includes(category as BlogCategory) && (
                    <option value={category}>{category} (Custom)</option>
                  )}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Or add custom category..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCategoryInput.trim()) {
                        setCategory(customCategoryInput.trim());
                        setCustomCategoryInput("");
                        setIsDirty(true);
                      }
                    }}
                    className="shrink-0 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary/80"
                  >
                    Add
                  </button>
                </div>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Sub-category / Sub-topic</span>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => {
                  setSubCategory(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Working Capital, LLMs, ROC Filing"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Industry</span>
              <input
                type="text"
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Manufacturing, Logistics, Healthcare"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Estimated Reading Time</span>
              <input
                type="text"
                value={readTime}
                onChange={(e) => {
                  setReadTime(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. 6 min"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Publish Date</span>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => {
                  setPublishedAt(e.target.value);
                  setIsDirty(true);
                }}
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Display Sort Order</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(Number(e.target.value) || 0);
                  setIsDirty(true);
                }}
                placeholder="0"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            {/* Tags manager */}
            <div className="sm:col-span-2">
              <span className="text-xs font-semibold text-ink">Tags & Keywords</span>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-background p-3">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="hover:text-ink transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Type tag and press Enter..."
                    className="flex-1 border-none bg-transparent px-2 py-1 text-xs outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-ink hover:bg-secondary/80"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="sm:col-span-2 pt-2 grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-4 cursor-pointer hover:bg-secondary/50 transition">
                <input
                  type="checkbox"
                  checked={status === "published"}
                  onChange={(e) => {
                    setStatus(e.target.checked ? "published" : "draft");
                    setIsDirty(true);
                  }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-xs font-bold text-ink">Published Live</p>
                  <p className="text-[0.68rem] text-muted-foreground">
                    When checked, this article appears publicly on /blogs.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-4 cursor-pointer hover:bg-secondary/50 transition">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => {
                    setFeatured(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-xs font-bold text-ink">Featured Article</p>
                  <p className="text-[0.68rem] text-muted-foreground">
                    Highlighted with prominent badge on listings.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONTENT & MARKDOWN                                                 */}
      {/* ========================================================================= */}
      {activeTab === "content" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-ink">Article Content</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Write markdown with headings, paragraphs, bullet points, and inline images uploaded to storage.
                </p>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 rounded-2xl border border-border bg-background p-1 self-start">
                <button
                  type="button"
                  onClick={() => setContentViewMode("edit")}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                    contentViewMode === "edit"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  Write / Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setContentViewMode("preview")}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                    contentViewMode === "preview"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-ink"
                  }`}
                >
                  Preview Layout
                </button>
              </div>
            </div>

            {contentViewMode === "edit" ? (
              <div className="space-y-3">
                {/* Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-secondary/50 p-2 text-ink">
                  <button
                    type="button"
                    onClick={() => insertMarkdown("## ", "\n")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition"
                    title="Heading 2 (##)"
                  >
                    <Heading2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("### ", "\n")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition"
                    title="Heading 3 (###)"
                  >
                    <Heading3 className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <button
                    type="button"
                    onClick={() => insertMarkdown("**", "**")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition font-bold text-xs"
                    title="Bold (**text**)"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("*", "*")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition text-xs italic"
                    title="Italic (*text*)"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-border mx-1" />
                  <button
                    type="button"
                    onClick={() => insertMarkdown("- ", "\n")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition"
                    title="Bullet List (- item)"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("1. ", "\n")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition"
                    title="Numbered List (1. item)"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("> ", "\n")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition"
                    title="Blockquote (> quote)"
                  >
                    <Quote className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("[", "](https://...)")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition"
                    title="Link [text](url)"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("```\n", "\n```")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition"
                    title="Code Block"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("\n| Metric | Value |\n|---|---|\n| Item 1 | 100% |\n")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition"
                    title="Table"
                  >
                    <TableIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("\n\n---\n\n")}
                    className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition"
                    title="Horizontal Divider"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-border mx-1" />

                  {/* Insert Image Button */}
                  <button
                    type="button"
                    onClick={() => setInlineMediaPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition ml-auto"
                    title="Upload or pick an image to insert into markdown"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Insert Image</span>
                  </button>
                </div>

                <textarea
                  ref={markdownTextareaRef}
                  rows={20}
                  value={markdownBody}
                  onChange={(e) => {
                    setMarkdownBody(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="## Section Title&#10;&#10;Write your paragraphs here. You can use markdown freely...&#10;&#10;- Bullet point one&#10;- Bullet point two"
                  className="w-full rounded-2xl border border-border bg-background p-4 text-sm font-mono leading-relaxed outline-none focus:border-primary"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-background p-6 space-y-8">
                {parsedPreviewSections.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-12">
                    No content written yet. Switch to Write mode to draft article sections.
                  </p>
                ) : (
                  parsedPreviewSections.map((sec, idx) => (
                    <div key={idx} className="space-y-3">
                      {sec.heading ? (
                        <h3 className="font-display text-xl font-bold text-ink">{sec.heading}</h3>
                      ) : null}
                      {sec.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="text-sm text-muted-foreground leading-relaxed">
                          {p}
                        </p>
                      ))}
                      {sec.points && sec.points.length > 0 ? (
                        <ul className="grid gap-2 pl-4 list-disc text-sm text-muted-foreground">
                          {sec.points.map((pt, ptIdx) => (
                            <li key={ptIdx}>{pt}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Key Takeaways Box */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Lightbulb className="h-5 w-5" />
              <h2 className="text-base font-bold text-ink">Key Takeaway Highlight</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Prominently displayed in a featured highlight card at the bottom of the article.
            </p>
            <textarea
              rows={3}
              value={takeaway}
              onChange={(e) => {
                setTakeaway(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. Apply one quarter before you need the money, fix the cycle before you finance it, and present the calculation rather than asking the banker to make it."
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
            />
          </div>

          {/* Inline Media Picker Modal */}
          {inlineMediaPickerOpen && (
            <MediaPicker
              folderPrefix="blogs"
              onSelect={(url, item) => handleInsertImage(url, item)}
              onClose={() => setInlineMediaPickerOpen(false)}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IMAGES & MEDIA                                                     */}
      {/* ========================================================================= */}
      {activeTab === "media" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-ink">Article Visuals & Media</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage hero, featured, thumbnail, social cards, and before/after comparisons.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Featured Image */}
              <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Featured / Header Image</span>
                  <MediaButton
                    folderPrefix="blogs"
                    label="Choose / Upload"
                    onSelect={(url) => {
                      setFeaturedImage(url);
                      if (!heroImage) setHeroImage(url);
                      if (!thumbnailImage) setThumbnailImage(url);
                      setIsDirty(true);
                    }}
                  />
                </div>
                {featuredImage ? (
                  <div className="relative group overflow-hidden rounded-xl border border-border">
                    <img
                      src={featuredImage}
                      alt="Featured preview"
                      className="h-44 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFeaturedImage("")}
                        className="rounded-xl bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground shadow"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl border-2 border-dashed border-border grid place-items-center text-xs text-muted-foreground">
                    No featured image selected
                  </div>
                )}
                <input
                  type="text"
                  value={featuredImage}
                  onChange={(e) => {
                    setFeaturedImage(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Or paste image URL..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Thumbnail Image */}
              <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Card Thumbnail Image</span>
                  <MediaButton
                    folderPrefix="blogs"
                    label="Choose / Upload"
                    onSelect={(url) => {
                      setThumbnailImage(url);
                      setIsDirty(true);
                    }}
                  />
                </div>
                {thumbnailImage ? (
                  <div className="relative group overflow-hidden rounded-xl border border-border">
                    <img
                      src={thumbnailImage}
                      alt="Thumbnail preview"
                      className="h-44 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setThumbnailImage("")}
                        className="rounded-xl bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground shadow"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl border-2 border-dashed border-border grid place-items-center text-xs text-muted-foreground">
                    No thumbnail image (uses featured fallback)
                  </div>
                )}
                <input
                  type="text"
                  value={thumbnailImage}
                  onChange={(e) => {
                    setThumbnailImage(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Or paste thumbnail URL..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Hero Image */}
              <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Hero Background Banner</span>
                  <MediaButton
                    folderPrefix="blogs"
                    label="Choose / Upload"
                    onSelect={(url) => {
                      setHeroImage(url);
                      setIsDirty(true);
                    }}
                  />
                </div>
                {heroImage ? (
                  <div className="relative group overflow-hidden rounded-xl border border-border">
                    <img src={heroImage} alt="Hero preview" className="h-44 w-full object-cover" />
                    <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHeroImage("")}
                        className="rounded-xl bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground shadow"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl border-2 border-dashed border-border grid place-items-center text-xs text-muted-foreground">
                    No custom hero (uses featured fallback)
                  </div>
                )}
                <input
                  type="text"
                  value={heroImage}
                  onChange={(e) => {
                    setHeroImage(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Or paste hero URL..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Social Share Image */}
              <div className="rounded-2xl border border-border bg-background p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Social / OG Image</span>
                  <MediaButton
                    folderPrefix="blogs"
                    label="Choose / Upload"
                    onSelect={(url) => {
                      setOgImage(url);
                      setTwitterImage(url);
                      setIsDirty(true);
                    }}
                  />
                </div>
                {ogImage ? (
                  <div className="relative group overflow-hidden rounded-xl border border-border">
                    <img src={ogImage} alt="OG preview" className="h-44 w-full object-cover" />
                    <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOgImage("")}
                        className="rounded-xl bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground shadow"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl border-2 border-dashed border-border grid place-items-center text-xs text-muted-foreground">
                    No social image (uses featured image fallback)
                  </div>
                )}
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => {
                    setOgImage(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Or paste OG image URL..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Optional Before / After Comparison */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-ink">Before & After Comparison (Optional)</h2>
            <p className="text-xs text-muted-foreground">
              Add comparison graphics if the blog discusses operational transformations or redesigns.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={beforeImageLabel}
                    onChange={(e) => {
                      setBeforeImageLabel(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-24 rounded-lg border border-border px-2 py-0.5 text-xs font-bold text-ink"
                  />
                  <MediaButton
                    folderPrefix="blogs"
                    label="Select"
                    onSelect={(url) => {
                      setBeforeImageUrl(url);
                      setIsDirty(true);
                    }}
                  />
                </div>
                {beforeImageUrl && (
                  <img
                    src={beforeImageUrl}
                    alt={beforeImageLabel}
                    className="h-32 w-full object-cover rounded-xl border border-border"
                  />
                )}
                <input
                  type="text"
                  value={beforeImageUrl}
                  onChange={(e) => {
                    setBeforeImageUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Before image URL..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-1 text-xs outline-none"
                />
              </div>

              <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={afterImageLabel}
                    onChange={(e) => {
                      setAfterImageLabel(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-24 rounded-lg border border-border px-2 py-0.5 text-xs font-bold text-ink"
                  />
                  <MediaButton
                    folderPrefix="blogs"
                    label="Select"
                    onSelect={(url) => {
                      setAfterImageUrl(url);
                      setIsDirty(true);
                    }}
                  />
                </div>
                {afterImageUrl && (
                  <img
                    src={afterImageUrl}
                    alt={afterImageLabel}
                    className="h-32 w-full object-cover rounded-xl border border-border"
                  />
                )}
                <input
                  type="text"
                  value={afterImageUrl}
                  onChange={(e) => {
                    setAfterImageUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="After image URL..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-1 text-xs outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONTENT SECTIONS (BLOCK BUILDER)                                   */}
      {/* ========================================================================= */}
      {activeTab === "sections" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-ink">Structured Content Blocks</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Build dynamic editorial sections rendered in saved order on the article page.
                </p>
              </div>

              {/* Add Section dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-ember hover:bg-primary-hover transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Section</span>
                </button>
                <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-40 w-72 max-h-96 overflow-y-auto rounded-2xl border border-border bg-background p-2 shadow-2xl">
                  {SECTION_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => addSection(opt.value)}
                      className="w-full text-left p-2 rounded-xl hover:bg-secondary transition"
                    >
                      <p className="text-xs font-bold text-ink">{opt.label}</p>
                      <p className="text-[0.65rem] text-muted-foreground">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {sections.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center space-y-3">
                <Layers className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-ink">No structured sections added</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Your markdown content in Tab 2 will render normally. Add structured blocks if you want callout cards, statistics, galleries, or interactive FAQs.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((sec, index) => {
                  const isSelected = selectedSectionId === sec.id;
                  return (
                    <div
                      key={sec.id}
                      className={`rounded-2xl border transition ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-border bg-card hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center justify-between p-4 cursor-pointer">
                        <div
                          className="flex items-center gap-3 flex-1"
                          onClick={() => setSelectedSectionId(isSelected ? null : sec.id)}
                        >
                          <span className="grid h-6 w-6 place-items-center rounded-lg bg-secondary text-[0.68rem] font-bold text-muted-foreground font-mono">
                            {index + 1}
                          </span>
                          <input
                            type="checkbox"
                            checked={sec.enabled !== false}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateSection(index, { enabled: e.target.checked });
                            }}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            title="Enable / Disable"
                          />
                          <div>
                            <p className="text-xs font-bold text-ink">
                              {sec.title || "Untitled Block"}
                            </p>
                            <p className="text-[0.68rem] text-primary font-semibold uppercase tracking-wider">
                              Type: {sec.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveSection(index, "up")}
                            className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={index === sections.length - 1}
                            onClick={() => moveSection(index, "down")}
                            className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSectionId(isSelected ? null : sec.id)}
                            className="rounded-lg px-2.5 py-1 text-xs font-bold text-ink hover:bg-secondary"
                          >
                            {isSelected ? "Collapse" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSection(sec.id)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Section Editor */}
                      {isSelected && (
                        <div className="border-t border-border/80 p-5 space-y-4 bg-background/50 rounded-b-2xl animate-in fade-in">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-xs font-semibold text-ink">Section Title</span>
                              <input
                                type="text"
                                value={sec.title}
                                onChange={(e) => updateSection(index, { title: e.target.value })}
                                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-semibold text-ink">Subtitle / Eyebrow</span>
                              <input
                                type="text"
                                value={sec.subtitle || ""}
                                onChange={(e) => updateSection(index, { subtitle: e.target.value })}
                                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                              />
                            </label>

                            <label className="block sm:col-span-2">
                              <span className="text-xs font-semibold text-ink">Section Content / Body</span>
                              <textarea
                                rows={4}
                                value={sec.content || ""}
                                onChange={(e) => updateSection(index, { content: e.target.value })}
                                placeholder="Write section copy, details, or embed code..."
                                className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-semibold text-ink">Button Label</span>
                              <input
                                type="text"
                                value={sec.buttonText || ""}
                                onChange={(e) => updateSection(index, { buttonText: e.target.value })}
                                placeholder="e.g. Schedule Call"
                                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-semibold text-ink">Button URL</span>
                              <input
                                type="text"
                                value={sec.buttonUrl || ""}
                                onChange={(e) => updateSection(index, { buttonUrl: e.target.value })}
                                placeholder="e.g. /contact or https://..."
                                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                              />
                            </label>
                          </div>

                          {/* Images in section */}
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-ink">Section Images</span>
                              <MediaButton
                                folderPrefix="blogs"
                                label="Add Image"
                                onSelect={(url) => {
                                  const curImages = sec.images || [];
                                  updateSection(index, { images: [...curImages, { url }] });
                                }}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {sec.images?.map((img, imgIdx) => (
                                <div key={imgIdx} className="relative group">
                                  <img
                                    src={img.url}
                                    alt="Section preview"
                                    className="h-16 w-24 object-cover rounded-xl border border-border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextImages = (sec.images || []).filter((_, i) => i !== imgIdx);
                                      updateSection(index, { images: nextImages });
                                    }}
                                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center text-[0.65rem] shadow"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GALLERY                                                            */}
      {/* ========================================================================= */}
      {activeTab === "gallery" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Article Gallery Images</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add high-resolution screenshots, infographics, or photos with captions.
                </p>
              </div>
              <MediaButton
                folderPrefix="blogs"
                label="Add Gallery Image"
                onSelect={(url) => {
                  setGallery([...gallery, { url, caption: `Image ${gallery.length + 1}`, alt: "" }]);
                  setIsDirty(true);
                }}
              />
            </div>

            {gallery.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center space-y-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-ink">No gallery images added</p>
                <p className="text-xs text-muted-foreground">
                  Click “Add Gallery Image” to select or upload images.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {gallery.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-border bg-background p-4"
                  >
                    <img
                      src={item.url}
                      alt={item.caption}
                      className="h-16 w-24 object-cover rounded-xl border border-border shrink-0"
                    />
                    <div className="flex-1 space-y-1.5 w-full">
                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) => {
                          setGallery((prev) =>
                            prev.map((it, i) => (i === index ? { ...it, caption: e.target.value } : it))
                          );
                          setIsDirty(true);
                        }}
                        placeholder="Image caption..."
                        className="w-full rounded-xl border border-border bg-background px-3 py-1 text-xs outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={item.alt || ""}
                        onChange={(e) => {
                          setGallery((prev) =>
                            prev.map((it, i) => (i === index ? { ...it, alt: e.target.value } : it))
                          );
                          setIsDirty(true);
                        }}
                        placeholder="Alt text for SEO & accessibility..."
                        className="w-full rounded-xl border border-border bg-background px-3 py-1 text-[0.68rem] outline-none focus:border-primary text-muted-foreground"
                      />
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => {
                          const next = [...gallery];
                          const moved = next[index];
                          if (moved) {
                            next.splice(index, 1);
                            next.splice(index - 1, 0, moved);
                            setGallery(next);
                            setIsDirty(true);
                          }
                        }}
                        className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === gallery.length - 1}
                        onClick={() => {
                          const next = [...gallery];
                          const moved = next[index];
                          if (moved) {
                            next.splice(index, 1);
                            next.splice(index + 1, 0, moved);
                            setGallery(next);
                            setIsDirty(true);
                          }
                        }}
                        className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGallery(gallery.filter((_, i) => i !== index));
                          setIsDirty(true);
                        }}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AUTHOR PROFILE                                                     */}
      {/* ========================================================================= */}
      {activeTab === "author" && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-ink">Author Details & Bio</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Author metadata rendered on the blog header and author card.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Author Name *</span>
              <input
                type="text"
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Hiren Patel"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary font-semibold"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Designation / Role *</span>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => {
                  setAuthorRole(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Head of Financial Advisory"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary"
                required
              />
            </label>

            {/* Author Photo */}
            <div className="sm:col-span-2 rounded-2xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Author Profile Photo</span>
                <MediaButton
                  folderPrefix="blogs"
                  label="Upload / Choose Photo"
                  onSelect={(url) => {
                    setAuthorPhoto(url);
                    setIsDirty(true);
                  }}
                />
              </div>
              <div className="flex items-center gap-4">
                {authorPhoto ? (
                  <img
                    src={authorPhoto}
                    alt={author}
                    className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center text-muted-foreground">
                    <User className="h-7 w-7" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={authorPhoto}
                    onChange={(e) => {
                      setAuthorPhoto(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Author photo URL..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                  {authorPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthorPhoto("");
                        setIsDirty(true);
                      }}
                      className="text-[0.7rem] font-semibold text-destructive hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-ink">Short Author Bio</span>
              <textarea
                rows={3}
                value={authorBio}
                onChange={(e) => {
                  setAuthorBio(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Hiren leads debt structuring and capital advisory at Jyot Enterprise with 15+ years advising manufacturers across Gujarat."
                className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-ink">Author LinkedIn / Profile URL</span>
              <input
                type="text"
                value={authorSocialUrl}
                onChange={(e) => {
                  setAuthorSocialUrl(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="https://linkedin.com/in/..."
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary font-mono"
              />
            </label>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: CTA                                                                */}
      {/* ========================================================================= */}
      {activeTab === "cta" && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Bottom Call to Action Band</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customizable conversion banner rendered at the bottom of the article.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ctaEnabled}
                onChange={(e) => {
                  setCtaEnabled(e.target.checked);
                  setIsDirty(true);
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs font-bold text-ink">Enable CTA</span>
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-ink">CTA Heading</span>
              <input
                type="text"
                value={ctaHeading}
                onChange={(e) => {
                  setCtaHeading(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Ready to scale your business operations?"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary font-bold"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-ink">CTA Description</span>
              <textarea
                rows={2}
                value={ctaDesc}
                onChange={(e) => {
                  setCtaDesc(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Get in touch with our team for a direct consultation."
                className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Primary Button Text</span>
              <input
                type="text"
                value={ctaPrimaryText}
                onChange={(e) => {
                  setCtaPrimaryText(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Schedule Consultation"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Primary Button URL</span>
              <input
                type="text"
                value={ctaPrimaryUrl}
                onChange={(e) => {
                  setCtaPrimaryUrl(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="/contact"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Secondary Button Text</span>
              <input
                type="text"
                value={ctaSecondaryText}
                onChange={(e) => {
                  setCtaSecondaryText(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Explore Services"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Secondary Button URL</span>
              <input
                type="text"
                value={ctaSecondaryUrl}
                onChange={(e) => {
                  setCtaSecondaryUrl(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="/services"
                className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: SEO & SERP                                                         */}
      {/* ========================================================================= */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          {/* Live Google Search Preview */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-ink">Google Search Snippet Preview</h2>
            <div className="rounded-2xl border border-border bg-background p-5 font-sans max-w-2xl space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>https://jyotenterprise.com</span>
                <span>›</span>
                <span>blogs</span>
                <span>›</span>
                <span>{slug || "slug"}</span>
              </p>
              <h3 className="text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer">
                {seoTitle || title || "Blog Post Title"} — Jyot Enterprise
              </h3>
              <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                {seoDescription || excerpt || "Article short description will appear in Google search results here."}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-base font-bold text-ink">Search Engine Optimization (SEO)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize titles, meta tags, OpenGraph cards, and robot directives.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">SEO Title</span>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={title || "Article Title"}
                  className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary font-medium"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">Meta Description</span>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={excerpt || "Search description..."}
                  className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Canonical URL</span>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => {
                    setCanonicalUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="https://jyotenterprise.com/blogs/..."
                  className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary font-mono"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">OpenGraph Title</span>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => {
                    setOgTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={seoTitle || title}
                  className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2 text-xs outline-none focus:border-primary"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">OpenGraph Description</span>
                <textarea
                  rows={2}
                  value={ogDescription}
                  onChange={(e) => {
                    setOgDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={seoDescription || excerpt}
                  className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
                />
              </label>

              <div className="sm:col-span-2 pt-2 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noindex}
                    onChange={(e) => {
                      setNoindex(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink">Noindex</span>
                    <p className="text-[0.68rem] text-muted-foreground">Prevent Google indexing</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nofollow}
                    onChange={(e) => {
                      setNofollow(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink">Nofollow</span>
                    <p className="text-[0.68rem] text-muted-foreground">Prevent search engines following links</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: PAGE CONTROLS & RELATED                                            */}
      {/* ========================================================================= */}
      {activeTab === "controls" && (
        <div className="space-y-6">
          {/* Section Visibility Switches */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-ink">Public Page Element Visibility</h2>
            <p className="text-xs text-muted-foreground">
              Toggle which peripheral components appear on the public article page.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
              {[
                { key: "showAuthorBio", label: "Author Profile Card" },
                { key: "showTableOfContents", label: "Table of Contents Sidebar" },
                { key: "showShare", label: "Social Share Links" },
                { key: "showTakeaway", label: "Key Takeaways Box" },
                { key: "showGallery", label: "Gallery Section" },
                { key: "showRelated", label: "Related Articles Grid" },
                { key: "showCta", label: "Call to Action Band" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 cursor-pointer hover:bg-secondary/40 transition"
                >
                  <input
                    type="checkbox"
                    checked={controls[item.key as keyof typeof controls]}
                    onChange={(e) => {
                      setControls({ ...controls, [item.key]: e.target.checked });
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-ink">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Related Articles Selector */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-ink">Select Related Articles</h2>
            <p className="text-xs text-muted-foreground">
              Manually pin specific articles to display in the &quot;Related Articles&quot; section.
            </p>

            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={relatedSearch}
                onChange={(e) => setRelatedSearch(e.target.value)}
                placeholder="Search articles by title..."
                className="flex-1 border-none bg-transparent text-xs outline-none"
              />
            </div>

            {/* Selected related articles */}
            {relatedBlogSlugs.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-ink">Selected Articles:</span>
                <div className="flex flex-wrap gap-2">
                  {relatedBlogSlugs.map((s) => {
                    const postMatch = (allPostsQuery.data?.rows ?? []).find((r) => r.slug === s);
                    return (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-ink"
                      >
                        <span>{postMatch?.title || s}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setRelatedBlogSlugs(relatedBlogSlugs.filter((it) => it !== s));
                            setIsDirty(true);
                          }}
                          className="hover:text-destructive transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available articles to pick */}
            <div className="max-h-60 overflow-y-auto rounded-2xl border border-border bg-background p-2 divide-y divide-border">
              {(allPostsQuery.data?.rows ?? [])
                .filter(
                  (r) =>
                    r.id !== id &&
                    !relatedBlogSlugs.includes(r.slug || "") &&
                    (!relatedSearch || (r.title || "").toLowerCase().includes(relatedSearch.toLowerCase()))
                )
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 hover:bg-secondary/50 rounded-xl transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-ink">{r.title}</p>
                      <p className="text-[0.68rem] text-muted-foreground">
                        {r.category || "General"} · {r.slug}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (r.slug) {
                          setRelatedBlogSlugs([...relatedBlogSlugs, r.slug]);
                          setIsDirty(true);
                        }
                      }}
                      className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition"
                    >
                      + Add
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: RECORD INFO                                                       */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-5">
          <h2 className="text-base font-bold text-ink">Record History & Metadata</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-4 space-y-1">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                Record ID
              </span>
              <p className="font-mono text-xs text-ink">{id}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4 space-y-1">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                Status
              </span>
              <p className="text-xs font-bold text-primary uppercase">{status}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4 space-y-1">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                Public URL
              </span>
              <a
                href={`/blogs/${slug}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                <span>/blogs/{slug}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4 space-y-1">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                Draft Preview URL
              </span>
              <a
                href={publicPreviewUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs font-mono text-amber-700 hover:underline flex items-center gap-1"
              >
                <span>{publicPreviewUrl}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Universal Confirm Modal for Delete */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Blog Article"
        message={`Are you sure you want to permanently delete “${title}”? This action cannot be undone.`}
        confirmLabel="Delete Article"
        isDestructive
        busy={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
