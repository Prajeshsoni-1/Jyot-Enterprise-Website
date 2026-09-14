"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Banknote,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  ImagePlus,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { ConfirmModal, ErrorState, Loading, formatDate } from "@/components/admin/ui";
import { MediaButton } from "@/components/admin/MediaPicker";
import { cmsGet, cmsSave, cmsList, cmsAction } from "@/lib/cms.functions";
import { slugify, type CmsRow } from "@/lib/cms-schema";
import { getEmploymentType } from "@/lib/cms-content";
import { APPLICATION_STAGES, applicationList, applicationSetStage } from "@/lib/settings.functions";
import { getAttachmentLink } from "@/lib/admin.functions";

interface CareerEditorProps {
  id: string;
}

export function CareerEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const get = useServerFn(cmsGet);
  const save = useServerFn(cmsSave);
  const list = useServerFn(cmsList);
  const act = useServerFn(cmsAction);
  const appList = useServerFn(applicationList);
  const appSetStage = useServerFn(applicationSetStage);
  const signAttachment = useServerFn(getAttachmentLink);
  const [openingDocPath, setOpeningDocPath] = useState<string | null>(null);

  async function handleOpenDoc(path?: string | null, fallbackUrl?: string | null) {
    if (fallbackUrl && (fallbackUrl.startsWith("http://") || fallbackUrl.startsWith("https://"))) {
      window.open(fallbackUrl, "_blank", "noopener");
      return;
    }
    if (!path) {
      if (fallbackUrl) window.open(fallbackUrl, "_blank", "noopener");
      return;
    }
    setOpeningDocPath(path);
    try {
      const { url } = await signAttachment({ data: { path } });
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error("Could not sign attachment link", err);
      setError("Could not open this resume document. The link may have expired.");
    } finally {
      setOpeningDocPath(null);
    }
  }

  // Read initial type from URL search params if present (?type=job or ?type=internship)
  const initialTypeFromUrl = useMemo(() => {
    if (typeof window === "undefined") return "job";
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    return t === "internship" ? "internship" : "job";
  }, []);

  const [activeTab, setActiveTab] = useState<
    "basic" | "details" | "media" | "publishing" | "seo" | "applications"
  >("basic");

  // Basic info states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSlug, setManualSlug] = useState(!isNew);
  const [positionType, setPositionType] = useState<"job" | "internship">(
    initialTypeFromUrl === "internship" ? "internship" : "job",
  );
  const [employmentType, setEmploymentType] = useState<"job" | "internship" | "needs_review">(
    isNew ? initialTypeFromUrl : "job",
  );
  const [subEmploymentType, setSubEmploymentType] = useState<string>("Full-time");
  const [department, setDepartment] = useState("Cross-practice");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Gandhinagar, Gujarat");
  const [workMode, setWorkMode] = useState<"On-site" | "Hybrid" | "Remote">("On-site");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [duration, setDuration] = useState("6 Months");
  const [openings, setOpenings] = useState(1);
  const [salary, setSalary] = useState("");
  const [showSalary, setShowSalary] = useState(true);
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");

  // Role details states
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [newRespInput, setNewRespInput] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newReqInput, setNewReqInput] = useState("");
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newQualInput, setNewQualInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [newPreferredInput, setNewPreferredInput] = useState("");
  const [niceToHave, setNiceToHave] = useState<string[]>([]);
  const [newNiceInput, setNewNiceInput] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefitInput, setNewBenefitInput] = useState("");
  const [learningOpportunities, setLearningOpportunities] = useState<string[]>([]);
  const [newLearningInput, setNewLearningInput] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [reportingTo, setReportingTo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [applicationInstructions, setApplicationInstructions] = useState("");

  // Media states
  const [featuredImage, setFeaturedImage] = useState("");
  const [logo, setLogo] = useState("");

  // Publishing states
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [featured, setFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [publishDate, setPublishDate] = useState(() => new Date().toISOString().slice(0, 10));

  // SEO states
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [noindex, setNoindex] = useState(false);
  const [nofollow, setNofollow] = useState(false);

  // Form management states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(isNew);
  const [isDirty, setIsDirty] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Load existing career opening
  const recordQuery = useQuery({
    enabled: !isNew,
    queryKey: ["cms", "get", "jobs", id],
    queryFn: () => get({ data: { module: "jobs", id } }),
  });

  // Query all roles for slug uniqueness check
  const allRolesQuery = useQuery({
    queryKey: ["cms", "list", "jobs"],
    queryFn: () => list({ data: { module: "jobs" } }),
  });

  // Applications query for this specific role
  const applicationsQuery = useQuery({
    queryKey: ["cms", "applications", "all"],
    queryFn: () => appList({ data: { stage: "all" } }),
  });

  // Filter applications belonging to this role
  const roleApplications = useMemo(() => {
    const apps = applicationsQuery.data?.rows ?? [];
    if (!slug && !id) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apps.filter((app: any) => {
      const d = (app.details ?? {}) as Record<string, any>;
      return (
        d["careerId"] === id ||
        d["jobId"] === id ||
        d["jobSlug"] === slug ||
        (d["jobTitle"] && title && String(d["jobTitle"]).toLowerCase() === title.toLowerCase())
      );
    });
  }, [applicationsQuery.data?.rows, id, slug, title]);

  useEffect(() => {
    if (recordQuery.data?.row && !loaded) {
      const row = recordQuery.data.row;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: any = row.data ?? {};

      setTitle(row.title ?? "");
      setSlug(row.slug ?? "");

      const rawPosType = (row as any).position_type || d.positionType || d.position_type;
      const rawType = (row.employment_type as string) || (d.employmentType as string) || (d.type as string);
      const parsedType = rawPosType === "job" || rawPosType === "internship"
        ? rawPosType
        : getEmploymentType(rawType, row.title) === "internship" ? "internship" : "job";
      
      setPositionType(parsedType);
      setEmploymentType(parsedType);
      setSubEmploymentType(row.employment_type || d.employmentType || (parsedType === "internship" ? "Internship" : "Full-time"));

      setDepartment(row.department ?? "Cross-practice");
      setCategory(d.category ?? row.department ?? "");
      setLocation(row.location ?? "Gandhinagar, Gujarat");
      setWorkMode((row.work_mode as typeof workMode) || (d.workMode as typeof workMode) || "On-site");
      setExperience(row.experience ?? "");
      setEducation(d.education ?? "");
      setDuration(d.duration ?? (parsedType === "internship" ? "6 Months" : ""));
      setOpenings(typeof row.openings === "number" ? row.openings : (typeof d.openings === "number" ? d.openings : 1));
      setSalary(row.salary ?? "");
      setShowSalary(d.showSalary !== false);
      setSummary(row.summary ?? "");
      setBody(row.body ?? d.body ?? "");

      // Role details
      if (Array.isArray(d.responsibilities)) {
        setResponsibilities(d.responsibilities);
      } else if (typeof (row as any).responsibilities === "string") {
        setResponsibilities((row as any).responsibilities.split("\n").filter(Boolean));
      }

      if (Array.isArray(d.requirements)) {
        setRequirements(d.requirements);
      } else if (typeof (row as any).requirements === "string") {
        setRequirements((row as any).requirements.split("\n").filter(Boolean));
      }

      if (Array.isArray(d.qualifications)) {
        setQualifications(d.qualifications);
      } else if (typeof (row as any).qualifications === "string") {
        setQualifications((row as any).qualifications.split("\n").filter(Boolean));
      }

      const rawSkills = row.skills ?? d.skills ?? [];
      if (Array.isArray(rawSkills)) {
        setSkills(rawSkills.map(String).filter(Boolean));
      }

      const rawPref = d.preferredSkills ?? d.niceToHave ?? [];
      if (Array.isArray(rawPref)) {
        setPreferredSkills(rawPref.map(String).filter(Boolean));
        setNiceToHave(rawPref.map(String).filter(Boolean));
      }

      if (Array.isArray(d.benefits)) setBenefits(d.benefits);
      if (Array.isArray(d.learningOpportunities)) setLearningOpportunities(d.learningOpportunities);

      setWorkingHours(d.workingHours ?? "");
      setReportingTo(d.reportingTo ?? "");
      setDeadline(row.deadline ?? d.deadline ?? "");
      setApplicationInstructions(d.applicationInstructions ?? (row as any).application_instructions ?? "");

      // Media
      setFeaturedImage(row.hero_image ?? d.featuredImage ?? d.heroImage ?? "");
      setLogo(d.logo ?? (row as any).logo ?? "");

      // Publishing
      setStatus((row.status as typeof status) ?? "draft");
      setFeatured(Boolean(row.featured));
      setSortOrder(row.sort_order ?? 0);
      if (row.created_at) {
        setPublishDate(row.created_at.slice(0, 10));
      }

      // SEO
      setSeoTitle(row.seo_title ?? d.seoTitle ?? "");
      setSeoDescription(row.seo_description ?? d.seoDescription ?? "");
      setSeoKeywords(row.seo_keywords ?? d.seoKeywords ?? []);
      setCanonicalUrl(d.canonicalUrl ?? "");
      setOgImage(row.og_image ?? d.ogImage ?? row.hero_image ?? "");
      setNoindex(Boolean(d.noindex));
      setNofollow(Boolean(d.nofollow));

      setLoaded(true);
    }
  }, [recordQuery.data?.row, loaded]);

  // Title change auto-slug
  function handleTitleChange(val: string) {
    setTitle(val);
    setIsDirty(true);
    if (!manualSlug) {
      setSlug(slugify(val));
    }
  }

  // Skills tag handling
  function addSkill(item: string) {
    const clean = item.trim();
    if (!clean || skills.includes(clean)) return;
    setSkills([...skills, clean]);
    setSkillInput("");
    setIsDirty(true);
  }

  function removeSkill(skillToRemove: string) {
    setSkills(skills.filter((s) => s !== skillToRemove));
    setIsDirty(true);
  }

  // SEO Keywords tag handling
  function addKeyword(item: string) {
    const clean = item.trim();
    if (!clean || seoKeywords.includes(clean)) return;
    setSeoKeywords([...seoKeywords, clean]);
    setKeywordInput("");
    setIsDirty(true);
  }

  function removeKeyword(kwToRemove: string) {
    setSeoKeywords(seoKeywords.filter((k) => k !== kwToRemove));
    setIsDirty(true);
  }

  // Validation
  function validate(): string | null {
    if (!title.trim()) return "Role title is required.";
    const cleanSlug = slug.trim();
    if (!cleanSlug) return "Slug / URL is required.";
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      return "Slug may only contain lowercase letters, numbers, and hyphens.";
    }
    const existing = (allRolesQuery.data?.rows ?? []).find(
      (r) => r.slug === cleanSlug && r.id !== id,
    );
    if (existing) {
      return `Slug “${cleanSlug}” is already in use by “${existing.title}”. Please choose a unique slug.`;
    }
    if (!positionType) {
      return "Please select whether this career opening is a Job or an Internship.";
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
      positionType,
      position_type: positionType,
      employmentType: subEmploymentType,
      category,
      education,
      duration: positionType === "internship" ? duration : undefined,
      showSalary,
      responsibilities,
      requirements: requirements.length > 0 ? requirements : qualifications,
      qualifications,
      skills,
      preferredSkills,
      niceToHave: preferredSkills,
      benefits,
      learningOpportunities: positionType === "internship" ? learningOpportunities : [],
      workingHours,
      reportingTo,
      deadline,
      applicationInstructions,
      featuredImage,
      logo,
      body,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || summary,
      seoKeywords: seoKeywords.length > 0 ? seoKeywords : skills,
      canonicalUrl,
      ogImage: ogImage || featuredImage || undefined,
      noindex,
      nofollow,
    };

    try {
      const res = await save({
        data: {
          module: "jobs",
          id,
          status: targetStatus,
          featured,
          sortOrder,
          values: {
            title: title.trim(),
            slug: slug.trim(),
            position_type: positionType,
            summary: summary.trim(),
            body: body.trim(),
            department: department.trim(),
            employment_type: subEmploymentType,
            location: location.trim(),
            work_mode: workMode,
            experience: experience.trim(),
            salary: salary.trim(),
            openings: Number(openings) || 1,
            deadline: deadline.trim(),
            skills,
            hero_image: featuredImage || ogImage || "",
            seo_title: seoTitle.trim() || title.trim(),
            seo_description: seoDescription.trim() || summary.trim(),
            seo_keywords: seoKeywords.length > 0 ? seoKeywords : skills,
            og_image: ogImage || featuredImage || "",
            data: dataPayload,
          },
        },
      });

      setStatus(targetStatus);
      setIsDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      setNotice(
        targetStatus === "published"
          ? "Role published successfully — now live on the public Careers page!"
          : targetStatus === "archived"
            ? "Role archived successfully."
            : "Draft saved successfully.",
      );

      if (isNew && res?.id) {
        navigate({
          to: "/admin/website/$module/$id",
          params: { module: "jobs", id: res.id },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save career opening.");
    } finally {
      setSaving(false);
    }
  }

  // Duplicate handler
  async function handleDuplicate() {
    if (isNew) return;
    setSaving(true);
    setError(null);
    try {
      const copyTitle = `${title} (Copy)`;
      const copySlug = `${slug}-copy-${Date.now().toString(36).slice(-4)}`;
      const res = await save({
        data: {
          module: "jobs",
          id: "new",
          status: "draft",
          featured: false,
          sortOrder: sortOrder + 1,
          values: {
            title: copyTitle,
            slug: copySlug,
            position_type: positionType,
            summary,
            body,
            department,
            employment_type: subEmploymentType,
            location,
            work_mode: workMode,
            experience,
            salary,
            openings,
            deadline,
            skills,
            hero_image: featuredImage || ogImage || "",
            seo_title: `${seoTitle || title} (Copy)`,
            seo_description: seoDescription || summary,
            seo_keywords: seoKeywords,
            og_image: ogImage || featuredImage || "",
            data: {
              positionType,
              position_type: positionType,
              employmentType: subEmploymentType,
              category,
              education,
              duration,
              showSalary,
              responsibilities,
              requirements,
              qualifications,
              skills,
              preferredSkills,
              niceToHave: preferredSkills,
              benefits,
              learningOpportunities,
              workingHours,
              reportingTo,
              deadline,
              applicationInstructions,
              featuredImage,
              logo,
              body,
              seoTitle: `${seoTitle || title} (Copy)`,
              seoDescription: seoDescription || summary,
              seoKeywords,
              canonicalUrl,
              ogImage,
              noindex,
              nofollow,
            },
          },
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      if (res?.id) {
        navigate({
          to: "/admin/website/$module/$id",
          params: { module: "jobs", id: res.id },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate role.");
    } finally {
      setSaving(false);
    }
  }

  // Delete handler
  async function handleDelete() {
    if (isNew) return;
    setSaving(true);
    setError(null);
    try {
      await act({ data: { module: "jobs", id, action: "delete" } });
      await queryClient.invalidateQueries({ queryKey: ["cms"] });
      navigate({ to: "/admin/website/$module", params: { module: "jobs" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete role.");
      setDeleteModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  // Update application stage
  async function handleUpdateApplicationStage(appId: string, nextStage: (typeof APPLICATION_STAGES)[number]) {
    try {
      await appSetStage({ data: { id: appId, stage: nextStage } });
      await applicationsQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application stage.");
    }
  }

  if (!isNew && recordQuery.isLoading) {
    return <Loading label="Loading career opening…" />;
  }

  if (!isNew && recordQuery.error) {
    return <ErrorState message="Could not load career opening." onRetry={() => void recordQuery.refetch()} />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Sticky Action Bar */}
      <div className="sticky top-0 z-20 -mx-4 -mt-6 border-b border-border bg-background/95 px-4 py-3.5 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/website/$module"
              params={{ module: "jobs" }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-ink"
              title="Back to Career Openings"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Careers CMS</span>
                <span className="text-muted-foreground/40">/</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    employmentType === "internship"
                      ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      : employmentType === "job"
                        ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                        : "bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse"
                  }`}
                >
                  {employmentType === "internship"
                    ? "Internship"
                    : employmentType === "job"
                      ? "Job (Full-Time)"
                      : "Type Needs Review"}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                    status === "published"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : status === "archived"
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  }`}
                >
                  {status}
                </span>
              </div>
              <h1 className="font-display text-lg font-bold text-ink truncate max-w-[280px] sm:max-w-md">
                {title || (employmentType === "internship" ? "New Internship Opening" : "New Job Opening")}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isNew && slug ? (
              <a
                href={`/careers/${slug}?preview=true`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-ink transition hover:bg-secondary"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Preview</span>
              </a>
            ) : null}

            {!isNew ? (
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-ink transition hover:bg-secondary disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Duplicate</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-ink transition hover:bg-secondary disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Save Draft</span>
            </button>

            {status === "published" ? (
              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
              >
                <span>Unpublish</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave("published")}
                disabled={saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:brightness-105 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Publish Live</span>
              </button>
            )}

            {!isNew ? (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                disabled={saving}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50"
                title="Delete opening"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Notice & Error Alerts */}
      {notice ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {employmentType === "needs_review" ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">Employment Type Needs Review</p>
              <p className="text-xs font-normal opacity-90">
                This existing career record could not be automatically determined. Please select whether it is an Internship or a Full-Time Job.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEmploymentType("job");
                setIsDirty(true);
              }}
              className="rounded-xl bg-background px-3 py-1.5 text-xs font-bold text-ink shadow-xs hover:bg-secondary"
            >
              Set as Job
            </button>
            <button
              type="button"
              onClick={() => {
                setEmploymentType("internship");
                setIsDirty(true);
              }}
              className="rounded-xl bg-background px-3 py-1.5 text-xs font-bold text-ink shadow-xs hover:bg-secondary"
            >
              Set as Internship
            </button>
          </div>
        </div>
      ) : null}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {[
          { id: "basic", label: "Basic Information", icon: FileText },
          { id: "details", label: "Role Details & Requirements", icon: Briefcase },
          { id: "media", label: "Media & Branding", icon: Layers },
          { id: "publishing", label: "Publishing & Schedule", icon: Calendar },
          { id: "seo", label: "SEO & Social Preview", icon: Sparkles },
          {
            id: "applications",
            label: `Applications (${roleApplications.length})`,
            icon: Users,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Basic Information */}
      {activeTab === "basic" ? (
        <div className="grid gap-6">
          {/* Position Type Switcher Card */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Position Type *
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose whether this opening is a <strong>Job</strong> or an <strong>Internship</strong>. This automatically directs the listing into the respective section on the public Careers page.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setPositionType("job");
                  setEmploymentType("job");
                  setIsDirty(true);
                }}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  positionType === "job"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-background hover:bg-secondary/60"
                }`}
              >
                <Briefcase className={`mt-0.5 h-5 w-5 shrink-0 ${positionType === "job" ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-ink">Job / Full-Time</p>
                    {positionType === "job" ? (
                      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Direct salaried role, experienced hire, or enterprise associate. Automatically placed in the <strong>JOBS</strong> section.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPositionType("internship");
                  setEmploymentType("internship");
                  setIsDirty(true);
                }}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  positionType === "internship"
                    ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                    : "border-border bg-background hover:bg-secondary/60"
                }`}
              >
                <GraduationCap className={`mt-0.5 h-5 w-5 shrink-0 ${positionType === "internship" ? "text-amber-500" : "text-muted-foreground"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-ink">Internship Programme</p>
                    {positionType === "internship" ? (
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Student, graduate, or fresher training programme with mentorship. Automatically placed in the <strong>INTERNSHIPS</strong> section.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid gap-6 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {positionType === "internship" ? "Internship Title" : "Job Title"} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={positionType === "internship" ? "e.g. AI Engineer Intern" : "e.g. Senior AI Engineer"}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Web Address Slug *
                  </label>
                  <button
                    type="button"
                    onClick={() => setManualSlug(!manualSlug)}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    {manualSlug ? "Auto-generate" : "Edit manually"}
                  </button>
                </div>
                <div className="mt-1.5 flex rounded-xl border border-border bg-background text-sm text-ink focus-within:border-primary">
                  <span className="rounded-l-xl bg-secondary/60 px-3 py-2.5 text-xs font-semibold text-muted-foreground select-none">
                    /careers/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setManualSlug(true);
                      setIsDirty(true);
                    }}
                    placeholder="role-slug"
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setIsDirty(true);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                >
                  <option value="Cross-practice">Cross-practice</option>
                  <option value="AI & Technology">AI & Technology</option>
                  <option value="Finance & Tax">Finance & Tax</option>
                  <option value="Legal & Corporate">Legal & Corporate</option>
                  <option value="Engineering & Infrastructure">Engineering & Infrastructure</option>
                  <option value="Marketing & Growth">Marketing & Growth</option>
                  <option value="Sales & Enterprise Partnerships">Sales & Enterprise Partnerships</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Software Development"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Employment Type
                </label>
                <select
                  value={subEmploymentType}
                  onChange={(e) => {
                    setSubEmploymentType(e.target.value);
                    setIsDirty(true);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Gandhinagar, Gujarat"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Work Mode
                </label>
                <select
                  value={workMode}
                  onChange={(e) => {
                    setWorkMode(e.target.value as typeof workMode);
                    setIsDirty(true);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                >
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Experience Required
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => {
                    setExperience(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Fresher / 2-4 years"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Duration (if Internship/Contract)
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. 6 Months"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Number of Openings
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={openings}
                  onChange={(e) => {
                    setOpenings(parseInt(e.target.value, 10) || 1);
                    setIsDirty(true);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Education Required / Eligibility
                </label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => {
                    setEducation(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. B.Tech / BE in CS / IT, MCA, or Equivalent"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {positionType === "internship" ? "Stipend" : "Salary / Compensation"}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSalary}
                      onChange={(e) => {
                        setShowSalary(e.target.checked);
                        setIsDirty(true);
                      }}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Show publicly</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => {
                    setSalary(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={positionType === "internship" ? "e.g. ₹15,000 - ₹25,000 / month" : "e.g. ₹6,00,000 - ₹9,00,000 PA"}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Short Summary (Card Preview)
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="A concise 1-2 sentence overview shown on Careers listing cards."
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Role Description / Overview
              </label>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Comprehensive overview of the practice team, role context, day-to-day engagement, and mission."
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 2: Role Details & Requirements */}
      {activeTab === "details" ? (
        <div className="grid gap-6">
          {/* Key Responsibilities */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink">Key Responsibilities</h2>
                <p className="text-xs text-muted-foreground">What the candidate will do on a day-to-day basis.</p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{responsibilities.length} items</span>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newRespInput}
                onChange={(e) => setNewRespInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newRespInput.trim()) {
                    e.preventDefault();
                    setResponsibilities([...responsibilities, newRespInput.trim()]);
                    setNewRespInput("");
                    setIsDirty(true);
                  }
                }}
                placeholder="Add a responsibility and press Enter..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => {
                  if (newRespInput.trim()) {
                    setResponsibilities([...responsibilities, newRespInput.trim()]);
                    setNewRespInput("");
                    setIsDirty(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-105"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            {responsibilities.length ? (
              <ul className="mt-4 grid gap-2">
                {responsibilities.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 text-xs text-ink"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-growth" />
                      <span className="truncate">{r}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => {
                          const copy = [...responsibilities];
                          const prev = copy[i - 1];
                          const curr = copy[i];
                          if (prev !== undefined && curr !== undefined) {
                            copy[i - 1] = curr;
                            copy[i] = prev;
                            setResponsibilities(copy);
                            setIsDirty(true);
                          }
                        }}
                        className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={i === responsibilities.length - 1}
                        onClick={() => {
                          const copy = [...responsibilities];
                          const next = copy[i + 1];
                          const curr = copy[i];
                          if (next !== undefined && curr !== undefined) {
                            copy[i + 1] = curr;
                            copy[i] = next;
                            setResponsibilities(copy);
                            setIsDirty(true);
                          }
                        }}
                        className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResponsibilities(responsibilities.filter((_, idx) => idx !== i));
                          setIsDirty(true);
                        }}
                        className="p-1 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground italic">No responsibilities added yet.</p>
            )}
          </div>

          {/* Required Skills Tags */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold text-ink">Required Skills & Technologies</h2>
            <p className="text-xs text-muted-foreground">Type skill name and press Enter (e.g. Python, PyTorch, LangChain).</p>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                placeholder="e.g. Python, Docker, PostgreSQL..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-105"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            {skills.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-ink"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Qualifications & Requirements */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink">Qualifications & Requirements</h2>
                <p className="text-xs text-muted-foreground">What you need from the applicant (education, proficiency, background).</p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{qualifications.length} items</span>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newQualInput}
                onChange={(e) => setNewQualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newQualInput.trim()) {
                    e.preventDefault();
                    setQualifications([...qualifications, newQualInput.trim()]);
                    setNewQualInput("");
                    setIsDirty(true);
                  }
                }}
                placeholder="Add requirement and press Enter..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => {
                  if (newQualInput.trim()) {
                    setQualifications([...qualifications, newQualInput.trim()]);
                    setNewQualInput("");
                    setIsDirty(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-105"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            {qualifications.length ? (
              <ul className="mt-4 grid gap-2">
                {qualifications.map((q, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 text-xs text-ink"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="truncate">{q}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQualifications(qualifications.filter((_, idx) => idx !== i));
                        setIsDirty(true);
                      }}
                      className="p-1 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Preferred Skills / Nice to have */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold text-ink">Nice to Have / Preferred Skills</h2>
            <p className="text-xs text-muted-foreground">Bonus attributes that strengthen an application.</p>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newNiceInput}
                onChange={(e) => setNewNiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newNiceInput.trim()) {
                    e.preventDefault();
                    setNiceToHave([...niceToHave, newNiceInput.trim()]);
                    setNewNiceInput("");
                    setIsDirty(true);
                  }
                }}
                placeholder="Add preferred skill..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => {
                  if (newNiceInput.trim()) {
                    setNiceToHave([...niceToHave, newNiceInput.trim()]);
                    setNewNiceInput("");
                    setIsDirty(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-105"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            {niceToHave.length ? (
              <ul className="mt-3 grid gap-2">
                {niceToHave.map((n, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-2.5 text-xs text-ink"
                  >
                    <span className="truncate">{n}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNiceToHave(niceToHave.filter((_, idx) => idx !== i));
                        setIsDirty(true);
                      }}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* If Internship: Learning Opportunities */}
          {employmentType === "internship" ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300">Learning Opportunities & Mentorship</h2>
              <p className="text-xs text-amber-700/80 dark:text-amber-400">What the intern will master during this programme.</p>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newLearningInput}
                  onChange={(e) => setNewLearningInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newLearningInput.trim()) {
                      e.preventDefault();
                      setLearningOpportunities([...learningOpportunities, newLearningInput.trim()]);
                      setNewLearningInput("");
                      setIsDirty(true);
                    }
                  }}
                  placeholder="e.g. Hands-on production deployment of LLMs..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-ink outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newLearningInput.trim()) {
                      setLearningOpportunities([...learningOpportunities, newLearningInput.trim()]);
                      setNewLearningInput("");
                      setIsDirty(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {learningOpportunities.length ? (
                <ul className="mt-3 grid gap-2">
                  {learningOpportunities.map((lo, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-background p-2.5 text-xs text-ink"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{lo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLearningOpportunities(learningOpportunities.filter((_, idx) => idx !== i));
                          setIsDirty(true);
                        }}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {/* Benefits & Perks */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold text-ink">
              {employmentType === "internship" ? "Perks & Benefits" : "Benefits & What We Offer"}
            </h2>
            <p className="text-xs text-muted-foreground">Healthcare, learning stipend, equipment, flexible leave, etc.</p>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newBenefitInput}
                onChange={(e) => setNewBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newBenefitInput.trim()) {
                    e.preventDefault();
                    setBenefits([...benefits, newBenefitInput.trim()]);
                    setNewBenefitInput("");
                    setIsDirty(true);
                  }
                }}
                placeholder="e.g. Modern MacBook Pro M3 provided..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => {
                  if (newBenefitInput.trim()) {
                    setBenefits([...benefits, newBenefitInput.trim()]);
                    setNewBenefitInput("");
                    setIsDirty(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-105"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            {benefits.length ? (
              <ul className="mt-3 grid gap-2">
                {benefits.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-2.5 text-xs text-ink"
                  >
                    <span className="truncate">{b}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBenefits(benefits.filter((_, idx) => idx !== i));
                        setIsDirty(true);
                      }}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Operational Details */}
          <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border border-border bg-card p-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Working Hours
              </label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => {
                  setWorkingHours(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Mon-Fri 9:30 AM - 6:30 PM"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Reporting To
              </label>
              <input
                type="text"
                value={reportingTo}
                onChange={(e) => {
                  setReportingTo(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. Head of Engineering"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Application Deadline
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="e.g. 31 October 2026 or Rolling"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Application Instructions */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold text-ink">Application Instructions</h2>
            <p className="text-xs text-muted-foreground">
              Optional guidance for candidates (e.g. portfolio format, github repo link, assessment instructions).
            </p>
            <textarea
              rows={3}
              value={applicationInstructions}
              onChange={(e) => {
                setApplicationInstructions(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. Please ensure your portfolio or GitHub profile link is included in your cover note."
              className="mt-3 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
        </div>
      ) : null}

      {/* Tab 3: Media & Branding */}
      {activeTab === "media" ? (
        <div className="grid gap-6">
          {/* Featured Image */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink">Featured Image</h2>
                <p className="text-xs text-muted-foreground">
                  Hero banner image displayed on the job posting and open graph social preview.
                </p>
              </div>
              <MediaButton onSelect={(url) => { setFeaturedImage(url); setIsDirty(true); }} />
            </div>

            {featuredImage ? (
              <div className="mt-4 relative rounded-2xl overflow-hidden border border-border max-w-md bg-secondary/30">
                <img
                  src={featuredImage}
                  alt="Featured role preview"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-2 p-4">
                  <MediaButton
                    onSelect={(url) => { setFeaturedImage(url); setIsDirty(true); }}
                    label="Replace Image"
                  />
                  <button
                    type="button"
                    onClick={() => { setFeaturedImage(""); setIsDirty(true); }}
                    className="rounded-xl bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 p-8 text-center">
                <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs font-semibold text-ink">No featured image uploaded</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Upload a banner image via the Media Library</p>
                <div className="mt-3">
                  <MediaButton onSelect={(url) => { setFeaturedImage(url); setIsDirty(true); }} label="Upload Featured Image" />
                </div>
              </div>
            )}
          </div>

          {/* Company / Department Logo */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink">Company / Department Logo</h2>
                <p className="text-xs text-muted-foreground">
                  Custom department badge or client/partner branding displayed next to this role.
                </p>
              </div>
              <MediaButton onSelect={(url) => { setLogo(url); setIsDirty(true); }} />
            </div>

            {logo ? (
              <div className="mt-4 relative rounded-2xl overflow-hidden border border-border w-32 h-32 bg-secondary/30 p-2 flex items-center justify-center">
                <img
                  src={logo}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                  <MediaButton
                    onSelect={(url) => { setLogo(url); setIsDirty(true); }}
                    label="Replace"
                  />
                  <button
                    type="button"
                    onClick={() => { setLogo(""); setIsDirty(true); }}
                    className="rounded-lg bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-center max-w-sm">
                <ImagePlus className="h-6 w-6 text-muted-foreground mb-1.5" />
                <p className="text-xs font-semibold text-ink">No logo uploaded</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">SVG or PNG format recommended</p>
                <div className="mt-2.5">
                  <MediaButton onSelect={(url) => { setLogo(url); setIsDirty(true); }} label="Upload Logo" />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Tab 4: Publishing & Schedule */}
      {activeTab === "publishing" ? (
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Publishing Status
            </label>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: "draft",
                  label: "Draft",
                  desc: "Only visible to authenticated administrators in admin preview mode.",
                },
                {
                  value: "published",
                  label: "Published",
                  desc: "Publicly visible on the careers page and searchable via search engines.",
                },
                {
                  value: "archived",
                  label: "Archived",
                  desc: "Hidden from the public site. Existing applications remain preserved.",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setStatus(opt.value as typeof status);
                    setIsDirty(true);
                  }}
                  className={`flex flex-col rounded-xl border p-4 text-left transition ${
                    status === opt.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-background hover:bg-secondary/60"
                  }`}
                >
                  <span className="text-sm font-bold text-ink capitalize">{opt.label}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Publish Date / Posted Date
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => {
                  setPublishDate(e.target.value);
                  setIsDirty(true);
                }}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sort Order Priority
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(parseInt(e.target.value, 10) || 0);
                  setIsDirty(true);
                }}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Lower numbers appear first within their section.</p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Featured Position
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => {
                    setFeatured(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-sm font-semibold text-ink">Feature this role at the top</span>
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 4: SEO & Social Preview */}
      {activeTab === "seo" ? (
        <div className="grid gap-6">
          <div className="grid gap-6 rounded-2xl border border-border bg-card p-5">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  SEO Meta Title
                </label>
                <span className="text-[11px] text-muted-foreground">{seoTitle.length} / 60</span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => {
                  setSeoTitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={title ? `${title} — Careers | Jyot Enterprise` : "Page Title"}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Meta Description
                </label>
                <span className="text-[11px] text-muted-foreground">{seoDescription.length} / 160</span>
              </div>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => {
                  setSeoDescription(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={summary || "Meta description for Google search results."}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Keywords
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword(keywordInput);
                    }
                  }}
                  placeholder="Type keyword and press Enter..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-ink outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => addKeyword(keywordInput)}
                  className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-105"
                >
                  Add
                </button>
              </div>
              {seoKeywords.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {seoKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-ink"
                    >
                      <span>{kw}</span>
                      <button type="button" onClick={() => removeKeyword(kw)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Canonical URL
                </label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => {
                    setCanonicalUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="https://jyotenterprise.com/careers/..."
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Social Sharing Image (OG Banner)
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={ogImage}
                    onChange={(e) => {
                      setOgImage(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="https://... image url"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-ink outline-none focus:border-primary"
                  />
                  <MediaButton onSelect={(url) => { setOgImage(url); setIsDirty(true); }} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={noindex}
                  onChange={(e) => {
                    setNoindex(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Noindex (tell search engines not to index this role)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={nofollow}
                  onChange={(e) => {
                    setNofollow(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Nofollow (tell search engines not to follow outbound links)</span>
              </label>
            </div>
          </div>

          {/* Google SERP Preview */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Google Search Result Preview
            </h2>
            <div className="mt-3 rounded-xl border border-border/80 bg-background p-4 max-w-xl">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                https://jyotenterprise.com › careers › {slug || "role-slug"}
              </p>
              <p className="mt-1 text-base font-semibold text-blue-600 hover:underline cursor-pointer truncate">
                {seoTitle || title || "Role Title — Careers | Jyot Enterprise"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {seoDescription || summary || "Explore career openings and internship opportunities at Jyot Enterprise."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab 5: Applications Received */}
      {activeTab === "applications" ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink">Applications for this opening</h2>
              <p className="text-xs text-muted-foreground">
                Candidates who submitted an application specifically for “{title}”.
              </p>
            </div>
            <Link
              to="/admin/website/applications"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View All Applications</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {roleApplications.length ? (
            <div className="mt-5 overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-xs">
                <thead className="bg-secondary/60 text-left uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Resume</th>
                    <th className="px-4 py-3">Applied Date</th>
                    <th className="px-4 py-3">Hiring Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roleApplications.map((app: any) => {
                    const d = (app.details ?? {}) as Record<string, any>;
                    const att =
                      (Array.isArray(app.attachments) && app.attachments[0]) ||
                      (Array.isArray(d["attachments"]) && d["attachments"][0]) ||
                      (typeof d["resumeUrl"] === "string" ? { name: "Resume", url: d["resumeUrl"] } : null) ||
                      (typeof d["resume"] === "string" ? { name: "Resume", url: d["resume"] } : null);

                    const hasAttachment = Boolean(att && (att.path || att.url));

                    return (
                      <tr key={app.id} className="hover:bg-secondary/30 transition">
                        <td className="px-4 py-3">
                          <Link
                            to="/admin/enquiries/$id"
                            params={{ id: app.id }}
                            className="font-bold text-ink hover:text-primary"
                          >
                            {app.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <p>{app.email}</p>
                          <p>{app.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          {hasAttachment ? (
                            <button
                              type="button"
                              disabled={openingDocPath === att?.path}
                              onClick={() => void handleOpenDoc(att?.path, att?.url)}
                              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline hover:text-primary/80 transition disabled:opacity-60 text-left"
                              title={att?.name ? `${att.name}${att.size ? ` (${Math.round(att.size / 1024)} KB)` : ""}` : "View Resume"}
                            >
                              {openingDocPath === att?.path ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                              <span className="truncate max-w-[120px] sm:max-w-[160px]">
                                {att?.name || "View Resume"}
                              </span>
                              {att?.size ? (
                                <span className="text-[10px] text-muted-foreground font-normal shrink-0">
                                  ({Math.round(att.size / 1024)} KB)
                                </span>
                              ) : null}
                            </button>
                          ) : (
                            <span className="text-muted-foreground italic">None attached</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(app.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={app.application_stage ?? "new"}
                            onChange={(e) =>
                              handleUpdateApplicationStage(
                                app.id,
                                e.target.value as (typeof APPLICATION_STAGES)[number],
                              )
                            }
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold capitalize outline-none focus:border-primary"
                          >
                            {APPLICATION_STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 font-semibold text-ink">No applications received yet</p>
              <p className="mt-1">When candidates apply for this role online, their details and resumes will appear here.</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={`Delete “${title}”?`}
        message={
          roleApplications.length > 0
            ? `Warning: There are ${roleApplications.length} candidate applications linked to this career opening. Deleting it will leave applications without an active role. Archiving is recommended instead.`
            : "Are you sure you want to permanently delete this career opening? This action cannot be undone."
        }
        confirmLabel="Delete Role"
        isDestructive
      />
    </div>
  );
}
