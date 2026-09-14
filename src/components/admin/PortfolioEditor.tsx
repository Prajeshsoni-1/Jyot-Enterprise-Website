"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  Send,
  Sparkles,
  Layers,
  FileText,
  Image as ImageIcon,
  Search,
  Check,
  AlertCircle,
  Copy,
  Trash2,
  Eye,
  Plus,
  ArrowUp,
  ArrowDown,
  X,
  CheckCircle2,
  TrendingUp,
  Quote,
  MessageSquare,
  Sliders,
  Compass,
  CheckSquare,
  Square,
  HelpCircle,
} from "lucide-react";
import { slugify, type CmsRow } from "@/lib/cms-schema";
import { cmsAction, cmsGet, cmsList, cmsSave } from "@/lib/cms.functions";
import { ConfirmModal, ErrorState, Loading, formatDate } from "@/components/admin/ui";
import { MediaButton } from "@/components/admin/MediaPicker";
import type { PortfolioSection, PortfolioSectionType } from "@/data/projects";

const SECTION_TYPE_OPTIONS: { value: PortfolioSectionType; label: string; desc: string }[] = [
  { value: "rich_text", label: "Rich Text", desc: "Long formatted text block with headings and paragraphs" },
  { value: "heading_text", label: "Heading + Text", desc: "Section heading with subtitle, copy and action button" },
  { value: "image_text", label: "Image + Text", desc: "Two column side-by-side showcase" },
  { value: "full_image", label: "Full Width Image", desc: "Edge-to-edge featured banner graphic" },
  { value: "gallery", label: "Image Gallery", desc: "Grid of project photos and deliverables" },
  { value: "video", label: "Video", desc: "Embed YouTube, Vimeo, or MP4 video" },
  { value: "quote", label: "Client Quote", desc: "Highlighted testimonial block with client attribution" },
  { value: "stats", label: "Statistics / Metrics", desc: "Large outcome numbers and percentage badges" },
  { value: "features", label: "Features", desc: "Cards highlighting deliverables and capabilities" },
  { value: "challenges", label: "Challenges", desc: "Pain points and operational obstacles addressed" },
  { value: "solutions", label: "Solutions", desc: "Interventions and architectural implementations" },
  { value: "results", label: "Results", desc: "Business impact and quantitative returns" },
  { value: "technologies", label: "Technologies", desc: "Tech stack badges and toolchain used" },
  { value: "timeline", label: "Timeline", desc: "Milestone phases with duration and deliverables" },
  { value: "cta", label: "Call to Action", desc: "Conversion band with action buttons" },
  { value: "custom", label: "Custom Content", desc: "Flexible custom section" },
];

export function PortfolioEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const get = useServerFn(cmsGet);
  const save = useServerFn(cmsSave);
  const act = useServerFn(cmsAction);
  const listFn = useServerFn(cmsList);

  const [activeTab, setActiveTab] = useState<
    | "basic"
    | "media"
    | "sections"
    | "challenges"
    | "tech"
    | "quote"
    | "cta"
    | "seo"
    | "controls"
    | "related"
  >("basic");

  // Record Base Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [client, setClient] = useState("");
  const [industry, setIndustry] = useState("");
  const [service, setService] = useState("IT");
  const [subCategory, setSubCategory] = useState("");
  const [clientLocation, setClientLocation] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [duration, setDuration] = useState("");
  const [projectStatus, setProjectStatus] = useState<
    "completed" | "in_progress" | "maintenance" | "archived"
  >("completed");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");

  // Media Fields
  const [featuredImage, setFeaturedImage] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState("");
  const [clientLogo, setClientLogo] = useState("");
  const [beforeImageUrl, setBeforeImageUrl] = useState("");
  const [beforeImageLabel, setBeforeImageLabel] = useState("Before");
  const [afterImageUrl, setAfterImageUrl] = useState("");
  const [afterImageLabel, setAfterImageLabel] = useState("After");
  const [gallery, setGallery] = useState<
    { url: string; caption: string; alt?: string; hue?: number }[]
  >([]);
  const [screenshots, setScreenshots] = useState<
    { url: string; caption?: string; alt?: string }[]
  >([]);

  // Sections
  const [sections, setSections] = useState<PortfolioSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Challenge / Solution / Result
  const [challengeTitle, setChallengeTitle] = useState("Business Challenge");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengePoints, setChallengePoints] = useState<string[]>([]);
  const [newChallengePoint, setNewChallengePoint] = useState("");

  const [solutionTitle, setSolutionTitle] = useState("Our Solution");
  const [solutionDesc, setSolutionDesc] = useState("");
  const [solutionPoints, setSolutionPoints] = useState<string[]>([]);
  const [newSolutionPoint, setNewSolutionPoint] = useState("");

  const [resultTitle, setResultTitle] = useState("Business Outcomes");
  const [resultDesc, setResultDesc] = useState("");
  const [resultMetrics, setResultMetrics] = useState<
    { k: string; v: string; label?: string }[]
  >([]);
  const [newMetricK, setNewMetricK] = useState("");
  const [newMetricV, setNewMetricV] = useState("");

  // Technologies
  const [techList, setTechList] = useState<{ name: string; icon?: string }[]>([]);
  const [newTechName, setNewTechName] = useState("");

  // Quote
  const [quoteText, setQuoteText] = useState("");
  const [quoteName, setQuoteName] = useState("");
  const [quoteRole, setQuoteRole] = useState("");
  const [quoteCompany, setQuoteCompany] = useState("");
  const [quotePhoto, setQuotePhoto] = useState("");
  const [quoteSource, setQuoteSource] = useState("");

  // CTA
  const [ctaEnabled, setCtaEnabled] = useState(true);
  const [ctaHeading, setCtaHeading] = useState("Ready to transform your operations?");
  const [ctaDesc, setCtaDesc] = useState(
    "Tell us where your operation leaks time or cash and we will scope what it takes to fix it."
  );
  const [ctaPrimaryText, setCtaPrimaryText] = useState("Schedule Consultation");
  const [ctaPrimaryUrl, setCtaPrimaryUrl] = useState("/contact");
  const [ctaSecondaryText, setCtaSecondaryText] = useState("Explore Services");
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState("/services");

  // Controls
  const [showProject, setShowProject] = useState(true);
  const [showRelated, setShowRelated] = useState(true);
  const [showTechnologies, setShowTechnologies] = useState(true);
  const [showClientQuote, setShowClientQuote] = useState(true);
  const [showCta, setShowCta] = useState(true);
  const [showGallery, setShowGallery] = useState(true);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [twitterTitle, setTwitterTitle] = useState("");
  const [twitterDescription, setTwitterDescription] = useState("");
  const [twitterImage, setTwitterImage] = useState("");
  const [noindex, setNoindex] = useState(false);
  const [nofollow, setNofollow] = useState(false);

  // Related
  const [relatedProjectSlugs, setRelatedProjectSlugs] = useState<string[]>([]);
  const [relatedSearch, setRelatedSearch] = useState("");

  // State flags
  const [manualSlug, setManualSlug] = useState(!isNew);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  // Load record
  const recordQuery = useQuery({
    enabled: !isNew,
    queryKey: ["cms", "item", "projects", id],
    queryFn: () => get({ data: { module: "projects", id } }),
  });

  // Load all projects for related picker
  const allProjectsQuery = useQuery({
    queryKey: ["cms", "list", "projects"],
    queryFn: () => listFn({ data: { module: "projects", search: "" } }),
  });

  const allProjects = (allProjectsQuery.data?.rows ?? []) as CmsRow[];

  useEffect(() => {
    if (recordQuery.data?.row && !loaded) {
      const row = recordQuery.data.row;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: any = row.data ?? {};

      setTitle(row.title ?? "");
      setSlug(row.slug ?? "");
      setClient(row.client ?? "");
      setIndustry(row.industry ?? "");
      setService(row.service ?? "IT");
      setSummary(row.summary ?? "");
      setBody(row.body ?? "");
      setStatus(row.status as typeof status);
      setFeatured(Boolean(row.featured));
      setSortOrder(row.sort_order ?? 0);
      setProjectUrl(row.project_url ?? d.projectUrl ?? "");
      setSubCategory(d.subCategory ?? "");
      setClientLocation(d.clientLocation ?? "");
      setYear(d.year ?? "2024");
      setDuration(d.duration ?? "");
      setProjectStatus(d.projectStatus ?? "completed");

      // Media
      setFeaturedImage(d.featuredImage ?? row.hero_image ?? "");
      setHeroImage(row.hero_image ?? d.heroImage ?? "");
      setThumbnailImage(d.thumbnailImage ?? row.thumbnail ?? "");
      setClientLogo(d.clientLogo ?? "");
      if (d.beforeImage) {
        setBeforeImageUrl(d.beforeImage.url ?? "");
        setBeforeImageLabel(d.beforeImage.label ?? "Before");
      }
      if (d.afterImage) {
        setAfterImageUrl(d.afterImage.url ?? "");
        setAfterImageLabel(d.afterImage.label ?? "After");
      }
      if (Array.isArray(d.gallery)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGallery(d.gallery.map((g: any, i: number) => ({
          url: typeof g === "string" ? g : (g.url ?? ""),
          caption: typeof g === "string" ? `Image ${i + 1}` : (g.caption ?? `Image ${i + 1}`),
          alt: typeof g === "string" ? "" : (g.alt ?? ""),
          hue: typeof g === "string" ? 24 : (g.hue ?? 24),
        })));
      }
      if (Array.isArray(d.screenshots)) {
        setScreenshots(d.screenshots);
      }

      // Sections
      if (Array.isArray(d.sections)) {
        setSections(d.sections);
      }

      // Challenge / Solution / Result
      if (d.challengeDetails) {
        setChallengeTitle(d.challengeDetails.title ?? "Business Challenge");
        setChallengeDesc(d.challengeDetails.description ?? "");
        setChallengePoints(d.challengeDetails.points ?? []);
      } else if (d.challenge) {
        setChallengeDesc(String(d.challenge));
      }

      if (d.solutionDetails) {
        setSolutionTitle(d.solutionDetails.title ?? "Our Solution");
        setSolutionDesc(d.solutionDetails.description ?? "");
        setSolutionPoints(d.solutionDetails.points ?? []);
      } else if (d.solution) {
        setSolutionDesc(String(d.solution));
      }

      if (d.resultDetails) {
        setResultTitle(d.resultDetails.title ?? "Business Outcomes");
        setResultDesc(d.resultDetails.description ?? "");
        setResultMetrics(d.resultDetails.metrics ?? []);
      } else if (d.outcome) {
        setResultDesc(String(d.outcome));
      }

      // Tech
      if (Array.isArray(d.technologiesDetailed) && d.technologiesDetailed.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTechList(d.technologiesDetailed.map((t: any) => ({
          name: typeof t === "string" ? t : t.name,
          icon: typeof t === "string" ? "" : (t.icon ?? ""),
        })));
      } else if (row.technologies) {
        setTechList(row.technologies.map((t) => ({ name: t })));
      }

      // Quote
      if (d.clientQuote) {
        setQuoteText(d.clientQuote.quote ?? "");
        setQuoteName(d.clientQuote.name ?? "");
        setQuoteRole(d.clientQuote.designation ?? "");
        setQuoteCompany(d.clientQuote.company ?? "");
        setQuotePhoto(d.clientQuote.photoUrl ?? "");
        setQuoteSource(d.clientQuote.source ?? "");
      } else if (d.quote) {
        setQuoteText(String(d.quote));
        setQuoteName(String(d.quoteBy ?? ""));
      }

      // CTA
      if (d.cta) {
        setCtaEnabled(d.cta.enabled !== false);
        setCtaHeading(d.cta.heading ?? "Ready to transform your operations?");
        setCtaDesc(d.cta.description ?? "");
        setCtaPrimaryText(d.cta.primaryButtonText ?? "Schedule Consultation");
        setCtaPrimaryUrl(d.cta.primaryButtonUrl ?? "/contact");
        setCtaSecondaryText(d.cta.secondaryButtonText ?? "Explore Services");
        setCtaSecondaryUrl(d.cta.secondaryButtonUrl ?? "/services");
      }

      // Controls
      if (d.controls) {
        setShowProject(d.controls.showProject !== false);
        setShowRelated(d.controls.showRelated !== false);
        setShowTechnologies(d.controls.showTechnologies !== false);
        setShowClientQuote(d.controls.showClientQuote !== false);
        setShowCta(d.controls.showCta !== false);
        setShowGallery(d.controls.showGallery !== false);
      }

      // SEO
      setSeoTitle(row.seo_title ?? d.seoTitle ?? "");
      setSeoDescription(row.seo_description ?? d.seoDescription ?? "");
      setSeoKeywords(row.seo_keywords ?? d.seoKeywords ?? []);
      setCanonicalUrl(d.canonicalUrl ?? "");
      setOgTitle(d.ogTitle ?? "");
      setOgDescription(d.ogDescription ?? "");
      setOgImage(row.og_image ?? d.ogImage ?? "");
      setTwitterTitle(d.twitterTitle ?? "");
      setTwitterDescription(d.twitterDescription ?? "");
      setTwitterImage(d.twitterImage ?? "");
      setNoindex(Boolean(d.noindex));
      setNofollow(Boolean(d.nofollow));

      // Related
      if (Array.isArray(d.relatedProjectSlugs)) {
        setRelatedProjectSlugs(d.relatedProjectSlugs);
      }

      setLoaded(true);
    }
  }, [recordQuery.data, loaded]);

  // Auto-slug from title if not manually changed
  function handleTitleChange(val: string) {
    setTitle(val);
    setIsDirty(true);
    if (!manualSlug) {
      setSlug(slugify(val));
    }
  }

  // Save handler
  async function submit(targetStatus?: typeof status) {
    const finalStatus = targetStatus ?? status;
    if (!title.trim()) {
      setError("Please enter a project title.");
      setActiveTab("basic");
      return;
    }
    const cleanSlug = slugify(slug || title);
    if (!cleanSlug) {
      setError("Please enter a valid project slug.");
      setActiveTab("basic");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const valuesPayload: Record<string, unknown> = {
      title: title.trim(),
      slug: cleanSlug,
      client: client.trim(),
      industry: industry.trim(),
      service: service.trim(),
      summary: summary.trim(),
      body: body.trim(),
      project_url: projectUrl.trim(),
      hero_image: heroImage || featuredImage,
      technologies: techList.map((t) => t.name.trim()).filter(Boolean),
      seo_title: seoTitle.trim() || undefined,
      seo_description: seoDescription.trim() || undefined,
      seo_keywords: seoKeywords.length > 0 ? seoKeywords : undefined,
      og_image: ogImage || featuredImage || heroImage || undefined,

      // Rich data JSONB bag
      extraData: {
        featuredImage,
        heroImage,
        thumbnailImage,
        clientLogo,
        subCategory,
        clientLocation,
        year,
        duration,
        projectStatus,
        beforeImage: beforeImageUrl ? { url: beforeImageUrl, label: beforeImageLabel } : undefined,
        afterImage: afterImageUrl ? { url: afterImageUrl, label: afterImageLabel } : undefined,
        gallery,
        screenshots,
        sections,
        challengeDetails: {
          title: challengeTitle,
          description: challengeDesc,
          points: challengePoints,
        },
        solutionDetails: {
          title: solutionTitle,
          description: solutionDesc,
          points: solutionPoints,
        },
        resultDetails: {
          title: resultTitle,
          description: resultDesc,
          metrics: resultMetrics,
        },
        technologiesDetailed: techList,
        clientQuote: quoteText
          ? {
              quote: quoteText,
              name: quoteName,
              designation: quoteRole,
              company: quoteCompany || client,
              photoUrl: quotePhoto,
              source: quoteSource,
            }
          : undefined,
        cta: {
          enabled: ctaEnabled,
          heading: ctaHeading,
          description: ctaDesc,
          primaryButtonText: ctaPrimaryText,
          primaryButtonUrl: ctaPrimaryUrl,
          secondaryButtonText: ctaSecondaryText,
          secondaryButtonUrl: ctaSecondaryUrl,
        },
        controls: {
          showProject,
          showRelated,
          showTechnologies,
          showClientQuote,
          showCta,
          showGallery,
        },
        relatedProjectSlugs,
        canonicalUrl,
        ogTitle,
        ogDescription,
        twitterTitle,
        twitterDescription,
        twitterImage,
        noindex,
        nofollow,
      },
    };

    try {
      const res = await save({
        data: {
          module: "projects",
          id: isNew ? undefined : id,
          status: finalStatus,
          featured,
          sortOrder,
          values: valuesPayload,
        },
      });
      setStatus(finalStatus);
      setIsDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setNotice(
        finalStatus === "published"
          ? "Project published successfully! It is now live."
          : "Draft project saved successfully."
      );
      if (isNew && res.id) {
        navigate({
          to: "/admin/website/$module/$id",
          params: { module: "projects", id: res.id },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save portfolio project.");
    } finally {
      setSaving(false);
    }
  }

  // Duplicate handler
  async function handleDuplicate() {
    if (isNew) return;
    setSaving(true);
    try {
      const res = await act({
        data: {
          module: "projects",
          id,
          action: "duplicate",
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setNotice("Project duplicated! You are now viewing the new draft copy.");
      if (res.id) {
        navigate({
          to: "/admin/website/$module/$id",
          params: { module: "projects", id: res.id },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not duplicate project.");
    } finally {
      setSaving(false);
    }
  }

  // Delete handler
  async function handleDelete() {
    if (isNew) return;
    setSaving(true);
    try {
      await act({
        data: {
          module: "projects",
          id,
          action: "delete",
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      navigate({ to: "/admin/website/$module", params: { module: "projects" } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete project.");
      setDeleteModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  // Section helpers
  function updateSection(index: number, patch: Partial<PortfolioSection>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    setIsDirty(true);
  }

  function addSection(type: PortfolioSectionType) {
    const opt = SECTION_TYPE_OPTIONS.find((o) => o.value === type);
    const newSec: PortfolioSection = {
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

  if (recordQuery.isLoading && !isNew) {
    return <Loading label="Loading portfolio project…" />;
  }

  const publicPreviewUrl = `/portfolio/${slug || "preview"}?preview=true`;

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header & Sticky Action Bar */}
      <div className="sticky top-0 z-30 flex flex-col gap-4 rounded-3xl border border-border bg-background/95 p-4 sm:p-5 backdrop-blur-md shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/website/$module"
            params={{ module: "projects" }}
            className="grid h-9 w-9 place-items-center rounded-2xl border border-border text-muted-foreground hover:bg-secondary hover:text-ink transition"
            title="Back to Portfolio Projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl font-extrabold text-ink truncate max-w-[280px] sm:max-w-md">
                {title || "New Portfolio Project"}
              </h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ${
                  status === "published"
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                    : status === "archived"
                      ? "bg-muted text-muted-foreground border-border"
                      : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                }`}
              >
                {status}
              </span>
              {featured ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-amber-700">
                  Featured
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              /portfolio/{slug || "slug-preview"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preview Project Button */}
          <a
            href={publicPreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-bold text-ink hover:bg-secondary transition shadow-2xs"
            title="Preview draft or published project exactly like visitors see it"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>Preview</span>
          </a>

          {!isNew ? (
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-bold text-ink hover:bg-secondary disabled:opacity-50 transition shadow-2xs"
              title="Duplicate into a new draft project"
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Duplicate</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => submit("draft")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-ink hover:bg-secondary disabled:opacity-50 transition shadow-2xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => submit("published")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{saving ? "Publishing…" : "Publish Live"}</span>
          </button>

          {!isNew ? (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={saving}
              className="grid h-8 w-8 place-items-center rounded-full border border-destructive/20 text-destructive hover:bg-destructive/10 transition"
              title="Delete Project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Notifications */}
      {notice ? (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-800 animate-in fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-between rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-semibold text-destructive animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto rounded-2xl border border-border bg-secondary/30 p-1.5 scrollbar-none gap-1">
        {[
          { id: "basic", label: "Basic Info", icon: Sparkles },
          { id: "media", label: "Hero & Media", icon: ImageIcon },
          { id: "sections", label: `Sections (${sections.length})`, icon: Layers },
          { id: "challenges", label: "Challenge & Solution", icon: CheckCircle2 },
          { id: "tech", label: `Tech Stack (${techList.length})`, icon: Compass },
          { id: "quote", label: "Client Quote", icon: Quote },
          { id: "cta", label: "CTA Banner", icon: MessageSquare },
          { id: "seo", label: "SEO & Social", icon: Search },
          { id: "controls", label: "Display Controls", icon: Sliders },
          { id: "related", label: `Related (${relatedProjectSlugs.length})`, icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? "bg-background text-ink shadow-2xs"
                  : "text-muted-foreground hover:bg-background/60 hover:text-ink"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BASIC INFORMATION */}
      {activeTab === "basic" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3">
              Project Identification
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">Project Title *</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. ERP rollout and ₹18 Cr working capital restructure"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary font-medium"
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">URL Slug *</span>
                  <span className="text-[0.68rem] text-muted-foreground">
                    {manualSlug ? "Manual editing" : "Auto-generated"}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center rounded-2xl border border-border bg-background px-3 py-2 text-sm focus-within:border-primary">
                  <span className="text-xs text-muted-foreground font-mono">/portfolio/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setManualSlug(true);
                      setSlug(slugify(e.target.value));
                      setIsDirty(true);
                    }}
                    placeholder="project-slug"
                    className="ml-1 w-full bg-transparent text-xs font-mono outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Client / Company Name *</span>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => {
                    setClient(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Meridian Polymers"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Practice / Category *</span>
                <select
                  value={service}
                  onChange={(e) => {
                    setService(e.target.value);
                    setIsDirty(true);
                  }}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="IT">IT & Technology</option>
                  <option value="Financial">Financial Advisory</option>
                  <option value="Legal">Legal & Compliance</option>
                  <option value="Engineering">Engineering & Manufacturing</option>
                  <option value="IT · Financial">IT · Financial</option>
                  <option value="IT · Legal">IT · Legal</option>
                  <option value="Business">Business Advisory</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Sub-category</span>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => {
                    setSubCategory(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. ERP Implementation, GST Restructure"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Industry *</span>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Polymer Manufacturing, Logistics, Healthcare"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Client Location</span>
                <input
                  type="text"
                  value={clientLocation}
                  onChange={(e) => {
                    setClientLocation(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Ahmedabad, Gujarat, India"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">External Project URL</span>
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => {
                    setProjectUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="https://client-project.com"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Delivery Year</span>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="2024"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Project Duration</span>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. 18 weeks, Ongoing retainer"
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Project Status</span>
                <select
                  value={projectStatus}
                  onChange={(e) => {
                    setProjectStatus(e.target.value as typeof projectStatus);
                    setIsDirty(true);
                  }}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary font-medium"
                >
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
          </div>

          {/* Publishing & Display Controls */}
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3">
              Publishing & Visibility
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink">Publication State</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as typeof status);
                    setIsDirty(true);
                  }}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary font-medium"
                >
                  <option value="draft">Draft (Private in Admin)</option>
                  <option value="published">Published (Live on Website)</option>
                  <option value="archived">Archived (Hidden from Website)</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Display Order</span>
                <input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(Number(e.target.value) || 0);
                    setIsDirty(true);
                  }}
                  className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary font-mono"
                />
                <span className="text-[0.68rem] text-muted-foreground mt-1 block">
                  Lower numbers display first on the portfolio index.
                </span>
              </label>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="featured-toggle"
                  checked={featured}
                  onChange={(e) => {
                    setFeatured(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label
                  htmlFor="featured-toggle"
                  className="text-xs font-semibold text-ink cursor-pointer"
                >
                  Mark as Featured Project
                </label>
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3">
              Descriptions & Summaries
            </h2>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Short Description (Card Teaser)</span>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Three plants, eleven spreadsheets and a 47-day order-to-cash cycle replaced with one system..."
                className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Full Overview Description</span>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="In-depth explanation of the scope, business goals, and implementation..."
                className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: HERO & MEDIA */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {/* Main Display Images */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Featured Image */}
            <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Featured Image</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Main card thumbnail and social share preview.
                  </p>
                </div>
                <MediaButton
                  label="Choose"
                  onSelect={(url) => {
                    setFeaturedImage(url);
                    if (!heroImage) setHeroImage(url);
                    setIsDirty(true);
                  }}
                />
              </div>

              {featuredImage ? (
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl border border-border bg-secondary">
                  <img
                    src={featuredImage}
                    alt="Featured preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFeaturedImage("");
                      setIsDirty(true);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-ink/80 p-1 text-background hover:bg-destructive transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="aspect-16/9 grid place-items-center rounded-2xl border border-dashed border-border bg-secondary/20 text-xs text-muted-foreground">
                  No featured image selected
                </div>
              )}
            </div>

            {/* Hero Image */}
            <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Hero Image</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Shown in the header of the public detail page.
                  </p>
                </div>
                <MediaButton
                  label="Choose"
                  onSelect={(url) => {
                    setHeroImage(url);
                    setIsDirty(true);
                  }}
                />
              </div>

              {heroImage ? (
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl border border-border bg-secondary">
                  <img src={heroImage} alt="Hero preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setHeroImage("");
                      setIsDirty(true);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-ink/80 p-1 text-background hover:bg-destructive transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="aspect-16/9 grid place-items-center rounded-2xl border border-dashed border-border bg-secondary/20 text-xs text-muted-foreground">
                  No hero image selected
                </div>
              )}
            </div>

            {/* Thumbnail Image */}
            <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Thumbnail Image</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Compact thumbnail for list tables & related grids.
                  </p>
                </div>
                <MediaButton
                  label="Choose"
                  onSelect={(url) => {
                    setThumbnailImage(url);
                    setIsDirty(true);
                  }}
                />
              </div>

              {thumbnailImage ? (
                <div className="relative aspect-4/3 w-36 overflow-hidden rounded-2xl border border-border bg-secondary">
                  <img
                    src={thumbnailImage}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailImage("");
                      setIsDirty(true);
                    }}
                    className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-background hover:bg-destructive transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-36 grid place-items-center rounded-2xl border border-dashed border-border bg-secondary/20 text-xs text-muted-foreground">
                  No thumbnail
                </div>
              )}
            </div>

            {/* Client Logo */}
            <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Client Logo</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Shown next to client name and in case badges.
                  </p>
                </div>
                <MediaButton
                  label="Choose"
                  onSelect={(url) => {
                    setClientLogo(url);
                    setIsDirty(true);
                  }}
                />
              </div>

              {clientLogo ? (
                <div className="relative h-20 w-36 overflow-hidden rounded-2xl border border-border bg-secondary p-2">
                  <img
                    src={clientLogo}
                    alt="Client logo preview"
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setClientLogo("");
                      setIsDirty(true);
                    }}
                    className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-background hover:bg-destructive transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-36 grid place-items-center rounded-2xl border border-dashed border-border bg-secondary/20 text-xs text-muted-foreground">
                  No client logo
                </div>
              )}
            </div>
          </div>

          {/* Before & After Images */}
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3">
              Before & After Comparison (Optional)
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-ink">Before Image</span>
                <input
                  type="text"
                  value={beforeImageLabel}
                  onChange={(e) => {
                    setBeforeImageLabel(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Label: Before"
                  className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={beforeImageUrl}
                    onChange={(e) => {
                      setBeforeImageUrl(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Before image URL..."
                    className="flex-1 rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                  <MediaButton
                    label="Pick"
                    onSelect={(url) => {
                      setBeforeImageUrl(url);
                      setIsDirty(true);
                    }}
                  />
                </div>
                {beforeImageUrl ? (
                  <img
                    src={beforeImageUrl}
                    alt="Before"
                    className="h-32 w-full object-cover rounded-xl border border-border"
                  />
                ) : null}
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-ink">After Image</span>
                <input
                  type="text"
                  value={afterImageLabel}
                  onChange={(e) => {
                    setAfterImageLabel(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Label: After"
                  className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={afterImageUrl}
                    onChange={(e) => {
                      setAfterImageUrl(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="After image URL..."
                    className="flex-1 rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                  <MediaButton
                    label="Pick"
                    onSelect={(url) => {
                      setAfterImageUrl(url);
                      setIsDirty(true);
                    }}
                  />
                </div>
                {afterImageUrl ? (
                  <img
                    src={afterImageUrl}
                    alt="After"
                    className="h-32 w-full object-cover rounded-xl border border-border"
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* Gallery Images List */}
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Gallery Images ({gallery.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Screenshots, plant views, dashboards, and deliverables shown on the detail page.
                </p>
              </div>
              <MediaButton
                label="Add Gallery Image"
                onSelect={(url, item) => {
                  setGallery([
                    ...gallery,
                    {
                      url,
                      caption: item?.name ? item.name.replace(/\.[^/.]+$/, "") : `Image ${gallery.length + 1}`,
                      alt: "",
                      hue: (gallery.length * 24) % 360,
                    },
                  ]);
                  setIsDirty(true);
                }}
              />
            </div>

            <div className="space-y-3">
              {gallery.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-border bg-secondary/20 p-3"
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
                      placeholder="Caption e.g. Production dashboard"
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
                      placeholder="Alt text for SEO & accessibility"
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
                      className="p-1 text-destructive hover:bg-destructive/10 rounded transition"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {!gallery.length ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No gallery images added yet. Click &ldquo;Add Gallery Image&rdquo; above.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT SECTIONS */}
      {activeTab === "sections" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Project Content & Dynamic Sections
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add, configure, and reorder modular content blocks rendered on the project detail page.
                </p>
              </div>

              {/* Add section selector */}
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addSection(e.target.value as PortfolioSectionType);
                      e.target.value = "";
                    }
                  }}
                  className="rounded-2xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-ink outline-none focus:border-primary shadow-2xs"
                  defaultValue=""
                >
                  <option value="" disabled>
                    + Add Section Block…
                  </option>
                  {SECTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of sections */}
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
                    {/* Header bar */}
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
                          title="Enable / Disable Section"
                        />
                        <div>
                          <p className="text-xs font-bold text-ink">
                            {sec.title || "Untitled Section"}
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
                          title="Delete Section"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Section Edit Panel */}
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
                            <span className="text-xs font-semibold text-ink">
                              Subtitle / Eyebrow
                            </span>
                            <input
                              type="text"
                              value={sec.subtitle || ""}
                              onChange={(e) => updateSection(index, { subtitle: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                            />
                          </label>

                          <label className="block sm:col-span-2">
                            <span className="text-xs font-semibold text-ink">
                              Section Content / Body
                            </span>
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
                              placeholder="e.g. View Case Details"
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
                                    const nextImages = (sec.images || []).filter(
                                      (_, i) => i !== imgIdx
                                    );
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

              {!sections.length ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-secondary/10">
                  <Layers className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-semibold text-ink">No content sections added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a section type from the dropdown above to add rich content blocks.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHALLENGE, SOLUTION & RESULTS */}
      {activeTab === "challenges" && (
        <div className="space-y-6">
          {/* Challenge Block */}
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                1
              </span>
              Challenge
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">Heading</span>
                <input
                  type="text"
                  value={challengeTitle}
                  onChange={(e) => {
                    setChallengeTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">Description</span>
                <textarea
                  rows={4}
                  value={challengeDesc}
                  onChange={(e) => {
                    setChallengeDesc(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Production, dispatch and finance each maintained their own records..."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
                />
              </label>
            </div>

            {/* Bullet Points */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-ink">Challenge Bullet Points</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChallengePoint}
                  onChange={(e) => setNewChallengePoint(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newChallengePoint.trim()) {
                      e.preventDefault();
                      setChallengePoints([...challengePoints, newChallengePoint.trim()]);
                      setNewChallengePoint("");
                      setIsDirty(true);
                    }
                  }}
                  placeholder="Type a point and press Add or Enter..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newChallengePoint.trim()) {
                      setChallengePoints([...challengePoints, newChallengePoint.trim()]);
                      setNewChallengePoint("");
                      setIsDirty(true);
                    }
                  }}
                  className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-ink hover:bg-secondary/80"
                >
                  Add Point
                </button>
              </div>

              <div className="space-y-1.5 mt-2">
                {challengePoints.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-xl bg-secondary/30 px-3 py-1.5 text-xs"
                  >
                    <span>• {pt}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setChallengePoints(challengePoints.filter((_, idx) => idx !== i));
                        setIsDirty(true);
                      }}
                      className="text-destructive hover:opacity-70"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Solution Block */}
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600">
                2
              </span>
              Solution
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">Heading</span>
                <input
                  type="text"
                  value={solutionTitle}
                  onChange={(e) => {
                    setSolutionTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">Description</span>
                <textarea
                  rows={4}
                  value={solutionDesc}
                  onChange={(e) => {
                    setSolutionDesc(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="A phased custom ERP covering production, inventory, dispatch and finance..."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
                />
              </label>
            </div>

            {/* Solution Bullet Points */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-ink">Solution Implementation Points</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSolutionPoint}
                  onChange={(e) => setNewSolutionPoint(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSolutionPoint.trim()) {
                      e.preventDefault();
                      setSolutionPoints([...solutionPoints, newSolutionPoint.trim()]);
                      setNewSolutionPoint("");
                      setIsDirty(true);
                    }
                  }}
                  placeholder="Type a point and press Add or Enter..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSolutionPoint.trim()) {
                      setSolutionPoints([...solutionPoints, newSolutionPoint.trim()]);
                      setNewSolutionPoint("");
                      setIsDirty(true);
                    }
                  }}
                  className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-ink hover:bg-secondary/80"
                >
                  Add Point
                </button>
              </div>

              <div className="space-y-1.5 mt-2">
                {solutionPoints.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-xl bg-secondary/30 px-3 py-1.5 text-xs"
                  >
                    <span>• {pt}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSolutionPoints(solutionPoints.filter((_, idx) => idx !== i));
                        setIsDirty(true);
                      }}
                      className="text-destructive hover:opacity-70"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results Block & Dynamic Metrics */}
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                3
              </span>
              Results & Quantitative Metrics
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">Heading</span>
                <input
                  type="text"
                  value={resultTitle}
                  onChange={(e) => {
                    setResultTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">Description</span>
                <textarea
                  rows={4}
                  value={resultDesc}
                  onChange={(e) => {
                    setResultDesc(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Order-to-cash fell to 21 days within two quarters..."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
                />
              </label>
            </div>

            {/* Metric Cards Form */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-ink">
                Outcome Metric Cards (e.g. +40% Lead Generation)
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newMetricK}
                  onChange={(e) => setNewMetricK(e.target.value)}
                  placeholder="Metric value e.g. +40% or 21 days"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary font-bold"
                />
                <input
                  type="text"
                  value={newMetricV}
                  onChange={(e) => setNewMetricV(e.target.value)}
                  placeholder="Label e.g. Lead Generation or Order-to-cash"
                  className="flex-2 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newMetricK.trim() && newMetricV.trim()) {
                      setResultMetrics([
                        ...resultMetrics,
                        { k: newMetricK.trim(), v: newMetricV.trim() },
                      ]);
                      setNewMetricK("");
                      setNewMetricV("");
                      setIsDirty(true);
                    }
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Add Metric
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-3">
                {resultMetrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-2xl border border-border bg-secondary/30 p-4 text-center"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setResultMetrics(resultMetrics.filter((_, i) => i !== idx));
                        setIsDirty(true);
                      }}
                      className="absolute right-2 top-2 text-destructive hover:opacity-70"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <p className="font-display text-2xl font-extrabold text-growth">{m.k}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{m.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TECHNOLOGIES */}
      {activeTab === "tech" && (
        <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Project Technologies & Toolchain
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add software, frameworks, databases, ERP systems, or AI toolchains applied to this project.
            </p>
          </div>

          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newTechName}
              onChange={(e) => setNewTechName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTechName.trim()) {
                  e.preventDefault();
                  if (!techList.some((t) => t.name.toLowerCase() === newTechName.trim().toLowerCase())) {
                    setTechList([...techList, { name: newTechName.trim() }]);
                    setNewTechName("");
                    setIsDirty(true);
                  }
                }
              }}
              placeholder="e.g. React, PostgreSQL, Power BI, Tally Sync"
              className="flex-1 rounded-2xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => {
                if (newTechName.trim()) {
                  if (!techList.some((t) => t.name.toLowerCase() === newTechName.trim().toLowerCase())) {
                    setTechList([...techList, { name: newTechName.trim() }]);
                    setNewTechName("");
                    setIsDirty(true);
                  }
                }
              }}
              className="rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {techList.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 pl-3.5 pr-2 py-1.5 text-xs font-semibold text-ink"
              >
                <span>{t.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTechList(techList.filter((_, i) => i !== idx));
                    setIsDirty(true);
                  }}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive hover:text-white transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {!techList.length ? (
              <p className="text-xs text-muted-foreground">No technologies added yet.</p>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 6: CLIENT QUOTE */}
      {activeTab === "quote" && (
        <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Client Testimonial & Quote
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Highlight what the business sponsor or stakeholder said about the engagement.
            </p>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-ink">Quote Body</span>
            <textarea
              rows={3}
              value={quoteText}
              onChange={(e) => {
                setQuoteText(e.target.value);
                setIsDirty(true);
              }}
              placeholder="“One team, one point of contact, zero excuses.”"
              className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary italic"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Client Name</span>
              <input
                type="text"
                value={quoteName}
                onChange={(e) => {
                  setQuoteName(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Rakesh Mehta"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Designation / Role</span>
              <input
                type="text"
                value={quoteRole}
                onChange={(e) => {
                  setQuoteRole(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Director / Accounts Head"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Company</span>
              <input
                type="text"
                value={quoteCompany}
                onChange={(e) => {
                  setQuoteCompany(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Company Name (defaults to client)"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Quote Photo URL</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={quotePhoto}
                  onChange={(e) => {
                    setQuotePhoto(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Photo URL..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
                <MediaButton
                  label="Pick"
                  onSelect={(url) => {
                    setQuotePhoto(url);
                    setIsDirty(true);
                  }}
                />
              </div>
            </label>
          </div>
        </div>
      )}

      {/* TAB 7: CTA BANNER */}
      {activeTab === "cta" && (
        <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                Bottom Call to Action Banner
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize the conversion action shown at the bottom of this portfolio page.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cta-enable-toggle"
                checked={ctaEnabled}
                onChange={(e) => {
                  setCtaEnabled(e.target.checked);
                  setIsDirty(true);
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label
                htmlFor="cta-enable-toggle"
                className="text-xs font-semibold text-ink cursor-pointer"
              >
                Enable CTA Banner
              </label>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-ink">Heading</span>
            <input
              type="text"
              value={ctaHeading}
              onChange={(e) => {
                setCtaHeading(e.target.value);
                setIsDirty(true);
              }}
              className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary font-bold"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-ink">Description</span>
            <textarea
              rows={3}
              value={ctaDesc}
              onChange={(e) => {
                setCtaDesc(e.target.value);
                setIsDirty(true);
              }}
              className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Primary Button Label</span>
              <input
                type="text"
                value={ctaPrimaryText}
                onChange={(e) => {
                  setCtaPrimaryText(e.target.value);
                  setIsDirty(true);
                }}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
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
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Secondary Button Label (Optional)</span>
              <input
                type="text"
                value={ctaSecondaryText}
                onChange={(e) => {
                  setCtaSecondaryText(e.target.value);
                  setIsDirty(true);
                }}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Secondary Button URL (Optional)</span>
              <input
                type="text"
                value={ctaSecondaryUrl}
                onChange={(e) => {
                  setCtaSecondaryUrl(e.target.value);
                  setIsDirty(true);
                }}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 8: SEO & SOCIAL SHARE */}
      {activeTab === "seo" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
            <div className="border-b border-border pb-3">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                Google Search & Social Optimization
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure meta tags, canonical links, OpenGraph cards and crawler directives.
              </p>
            </div>

            {/* Live Google Search Preview Card */}
            <div className="rounded-2xl border border-border/80 bg-secondary/15 p-4 space-y-1">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                Google Search Result Preview
              </span>
              <p className="text-sm font-semibold text-blue-600 truncate hover:underline cursor-pointer">
                {seoTitle || (title ? `${client} — ${title} | Jyot Enterprise` : "Project Title")}
              </p>
              <p className="text-xs text-emerald-700 font-mono">
                https://jyotenterprise.com/portfolio/{slug || "project-slug"}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {seoDescription || summary || "Short summary that appears below your title in Google search results."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">SEO Title</span>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Defaults to Project Title"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">Meta Description</span>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Under 160 characters..."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Canonical URL</span>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => {
                    setCanonicalUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="https://jyotenterprise.com/portfolio/..."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">OpenGraph / Social Image</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={ogImage}
                    onChange={(e) => {
                      setOgImage(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Defaults to Featured Image"
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                  <MediaButton
                    label="Pick"
                    onSelect={(url) => {
                      setOgImage(url);
                      setIsDirty(true);
                    }}
                  />
                </div>
              </label>

              <div className="flex items-center gap-6 sm:col-span-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="noindex-toggle"
                    checked={noindex}
                    onChange={(e) => {
                      setNoindex(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="noindex-toggle" className="text-xs font-semibold text-ink cursor-pointer">
                    Noindex (Hide from search engines)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="nofollow-toggle"
                    checked={nofollow}
                    onChange={(e) => {
                      setNofollow(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="nofollow-toggle" className="text-xs font-semibold text-ink cursor-pointer">
                    Nofollow (Do not follow links)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: SECTION DISPLAY CONTROLS */}
      {activeTab === "controls" && (
        <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Public Page Visibility Controls
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control which modular sections are visible on the public project detail page.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Show Project Publicly", checked: showProject, set: setShowProject, desc: "Controls public route visibility" },
              { label: "Show Technologies", checked: showTechnologies, set: setShowTechnologies, desc: "Show technologies badge bar" },
              { label: "Show Gallery", checked: showGallery, set: setShowGallery, desc: "Show project screens & gallery" },
              { label: "Show Client Quote", checked: showClientQuote, set: setShowClientQuote, desc: "Show client testimonial card" },
              { label: "Show Related Projects", checked: showRelated, set: setShowRelated, desc: "Show related projects grid" },
              { label: "Show Bottom CTA", checked: showCta, set: setShowCta, desc: "Show contact call to action" },
            ].map((c, i) => (
              <label
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/20 p-4 cursor-pointer hover:bg-secondary/40 transition"
              >
                <input
                  type="checkbox"
                  checked={c.checked}
                  onChange={(e) => {
                    c.set(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-xs font-bold text-ink block">{c.label}</span>
                  <span className="text-[0.68rem] text-muted-foreground">{c.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: RELATED PROJECTS */}
      {activeTab === "related" && (
        <div className="rounded-3xl border border-border bg-background p-6 shadow-2xs space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Related Projects Selector
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select specific portfolio projects to cross-link on the detail page.
            </p>
          </div>

          {/* Search available projects */}
          <input
            type="text"
            value={relatedSearch}
            onChange={(e) => setRelatedSearch(e.target.value)}
            placeholder="Search projects to attach..."
            className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:border-primary"
          />

          {/* Selected related */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-ink">Selected Related Projects:</span>
            <div className="space-y-2">
              {relatedProjectSlugs.map((relSlug, i) => {
                const pRow = allProjects.find((p) => p.slug === relSlug);
                return (
                  <div
                    key={relSlug}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 px-3.5 py-2 text-xs"
                  >
                    <span className="font-semibold text-ink">
                      {pRow ? `${pRow.client} — ${pRow.title}` : relSlug}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRelatedProjectSlugs(relatedProjectSlugs.filter((s) => s !== relSlug));
                        setIsDirty(true);
                      }}
                      className="text-destructive hover:opacity-70"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              {!relatedProjectSlugs.length ? (
                <p className="text-xs text-muted-foreground">
                  No specific projects selected. Automatic fallback to other portfolio projects will be used.
                </p>
              ) : null}
            </div>
          </div>

          {/* Available projects to pick */}
          <div className="pt-2 border-t border-border">
            <span className="text-xs font-bold text-ink block mb-2">Available Projects:</span>
            <div className="grid gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
              {allProjects
                .filter(
                  (p) =>
                    p.slug &&
                    p.slug !== slug &&
                    !relatedProjectSlugs.includes(p.slug) &&
                    (!relatedSearch ||
                      (p.title && p.title.toLowerCase().includes(relatedSearch.toLowerCase())) ||
                      (p.client && p.client.toLowerCase().includes(relatedSearch.toLowerCase())))
                )
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.slug) {
                        setRelatedProjectSlugs([...relatedProjectSlugs, p.slug]);
                        setIsDirty(true);
                      }
                    }}
                    className="flex items-center justify-between rounded-xl border border-border bg-background p-2.5 text-left text-xs font-semibold text-ink hover:border-primary transition"
                  >
                    <span className="truncate">{p.client} — {p.title}</span>
                    <Plus className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Portfolio Project"
        message={`Are you sure you want to permanently delete “${title}”? This action cannot be undone.`}
        confirmLabel="Delete Project"
        isDestructive
        busy={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
