"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Settings2,
  Building,
  Phone,
  Share2,
  PanelsTopLeft,
  Search,
  BarChart3,
  Check,
} from "lucide-react";
import { adminGetSiteSettings, saveSiteSettings } from "@/lib/settings.functions";
import type { SiteSettings } from "@/lib/site-settings";
import { ErrorState, Loading, Panel } from "@/components/admin/ui";
import { MediaButton } from "@/components/admin/MediaPicker";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/website/settings")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search["tab"] === "string" ? search["tab"] : "brand",
  }),
  head: () => ({
    meta: pageMeta({
      title: "Site Settings & Configuration — Jyot Enterprise",
      description: "Brand, contact, social, header/footer and default SEO settings.",
      path: "/admin/website/settings",
      noindex: true,
    }),
  }),
  component: SettingsPage,
});

type Section = keyof SiteSettings;

const TABS = [
  { id: "brand", label: "Brand Identity", icon: Building },
  { id: "contact", label: "Contact Details", icon: Phone },
  { id: "social", label: "Social Links", icon: Share2 },
  { id: "website", label: "Header & Footer", icon: PanelsTopLeft },
  { id: "seo", label: "Default SEO", icon: Search },
  { id: "analytics", label: "Analytics & Tracking", icon: BarChart3 },
] as const;

function SettingsPage() {
  const { tab: initialTab } = Route.useSearch();
  const navigate = useNavigate();
  const get = useServerFn(adminGetSiteSettings);
  const save = useServerFn(saveSiteSettings);
  const query = useQuery({ queryKey: ["cms", "settings"], queryFn: () => get() });

  const [activeTab, setActiveTab] = useState<string>(initialTab || "brand");
  const [values, setValues] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (query.data?.settings) setValues(query.data.settings);
  }, [query.data]);

  if (query.isLoading || !values) return <Loading label="Loading site configuration…" />;
  if (query.error)
    return (
      <ErrorState message="Could not load the settings." onRetry={() => void query.refetch()} />
    );

  const canEdit = query.data?.canEdit ?? false;

  function set(section: Section, field: string, value: unknown) {
    setValues((prev) =>
      prev ? { ...prev, [section]: { ...(prev[section] as object), [field]: value } } : prev,
    );
  }

  async function submit() {
    if (!values) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await save({
        data: {
          brand: values.brand,
          contact: values.contact,
          social: values.social,
          website: values.website,
          seo: values.seo,
          analytics: values.analytics,
        },
      });
      setNotice("Settings saved successfully — changes are active across the entire website.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  const input =
    "mt-1.5 w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary transition disabled:opacity-60";

  function Text({
    section,
    field,
    label,
    help,
    image,
  }: {
    section: Section;
    field: string;
    label: string;
    help?: string;
    image?: boolean;
  }) {
    const current = (values![section] as Record<string, unknown>)[field];
    return (
      <label className="block">
        <span className="text-xs font-bold text-ink">{label}</span>
        <input
          disabled={!canEdit}
          value={String(current ?? "")}
          onChange={(e) => set(section, field, e.target.value)}
          className={input}
        />
        {image && canEdit ? <MediaButton onSelect={(url) => set(section, field, url)} /> : null}
        {help ? (
          <span className="mt-1 block text-[0.7rem] text-muted-foreground leading-relaxed">
            {help}
          </span>
        ) : null}
      </label>
    );
  }

  function Area({
    section,
    field,
    label,
    help,
  }: {
    section: Section;
    field: string;
    label: string;
    help?: string;
  }) {
    const current = (values![section] as Record<string, unknown>)[field];
    return (
      <label className="block sm:col-span-2">
        <span className="text-xs font-bold text-ink">{label}</span>
        <textarea
          disabled={!canEdit}
          rows={3}
          value={String(current ?? "")}
          onChange={(e) => set(section, field, e.target.value)}
          className={input}
        />
        {help ? (
          <span className="mt-1 block text-[0.7rem] text-muted-foreground leading-relaxed">
            {help}
          </span>
        ) : null}
      </label>
    );
  }

  function Toggle({ section, field, label }: { section: Section; field: string; label: string }) {
    const current = Boolean((values![section] as Record<string, unknown>)[field]);
    return (
      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id={`${section}-${field}`}
          disabled={!canEdit}
          checked={current}
          onChange={(e) => set(section, field, e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <label
          htmlFor={`${section}-${field}`}
          className="text-xs font-semibold text-ink cursor-pointer"
        >
          {label}
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link
            to="/admin/website"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Website Management Hub
          </Link>
          <h1 className="mt-1 flex items-center gap-2.5 font-display text-2xl font-extrabold text-ink">
            <Settings2 className="h-6 w-6 text-primary" /> Global Website Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Single source of truth used across the website header, footer, contact pages, and search
            meta tags.
          </p>
        </div>
        {canEdit ? (
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-xs"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
          </button>
        ) : null}
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
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                navigate({ to: "/admin/website/settings", search: { tab: t.id } as any });
              }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                isActive
                  ? "bg-ink text-background shadow-xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="space-y-6">
        {/* Brand Tab */}
        {activeTab === "brand" ? (
          <Panel title="Brand & Identity">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text
                section="brand"
                field="companyName"
                label="Company Name"
                help="Legal or display name."
              />
              <Text
                section="brand"
                field="tagline"
                label="Official Tagline"
                help="Displayed below logo or hero."
              />
              <Text
                section="brand"
                field="logoUrl"
                label="Logo Image URL"
                image
                help="Displayed in header and footer."
              />
              <Text
                section="brand"
                field="faviconUrl"
                label="Favicon Icon URL"
                image
                help="Browser tab icon."
              />
              <Area
                section="brand"
                field="description"
                label="Company Overview"
                help="Brief introductory description used on about and contact sections."
              />
            </div>
          </Panel>
        ) : null}

        {/* Contact Tab */}
        {activeTab === "contact" ? (
          <Panel title="Official Contact Channels">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text
                section="contact"
                field="email"
                label="Official Email"
                help="Primary inbox for notifications."
              />
              <Text
                section="contact"
                field="hours"
                label="Working Hours"
                help="e.g. Mon–Sat, 9:00 AM – 7:00 PM"
              />
              <Text
                section="contact"
                field="phone"
                label="Primary Phone Number"
                help="e.g. +91 98765 43210"
              />
              <Text section="contact" field="phone2" label="Secondary Phone Number" />
              <Text
                section="contact"
                field="whatsapp"
                label="WhatsApp 1"
                help="Number or direct wa.me link."
              />
              <Text section="contact" field="whatsapp2" label="WhatsApp 2" />
              <Area section="contact" field="address" label="Headquarters Address" />
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Specific branch and city locations are managed in Offices.</span>
              <Link
                to="/admin/website/$module"
                params={{ module: "offices" }}
                className="font-bold text-primary hover:underline"
              >
                Manage Offices →
              </Link>
            </div>
          </Panel>
        ) : null}

        {/* Social Links Tab */}
        {activeTab === "social" ? (
          <Panel title="Social Media Profiles">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text
                section="social"
                field="linkedin"
                label="LinkedIn Company Page"
                help="https://linkedin.com/company/..."
              />
              <Text section="social" field="facebook" label="Facebook Page" />
              <Text section="social" field="instagram" label="Instagram Profile" />
              <Text section="social" field="youtube" label="YouTube Channel" />
              <Text section="social" field="twitter" label="X / Twitter" />
            </div>
          </Panel>
        ) : null}

        {/* Header & Footer Tab */}
        {activeTab === "website" ? (
          <Panel title="Header & Footer Elements">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text
                section="website"
                field="ctaLabel"
                label="Header Button Text"
                help="e.g. Book Consultation"
              />
              <Text
                section="website"
                field="ctaHref"
                label="Header Button Link"
                help="Path such as /book or /contact"
              />
              <Area
                section="website"
                field="footerText"
                label="Footer Brand Description"
                help="Short paragraph shown under footer logo."
              />
              <Text
                section="website"
                field="copyright"
                label="Footer Copyright Line"
                help="e.g. © 2026 Jyot Enterprise. All rights reserved."
              />
              <div className="sm:col-span-2 border-t border-border pt-3 space-y-2">
                <Toggle
                  section="website"
                  field="headerCtaVisible"
                  label="Show primary button in website header"
                />
                <Toggle
                  section="website"
                  field="headerContactVisible"
                  label="Show direct phone & WhatsApp links in website header"
                />
              </div>
            </div>
          </Panel>
        ) : null}

        {/* Default SEO Tab */}
        {activeTab === "seo" ? (
          <Panel title="Global Search Engine Optimization (SEO)">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text
                section="seo"
                field="title"
                label="Default Page Title"
                help="Used when a specific page has no custom SEO title."
              />
              <Text
                section="seo"
                field="ogImage"
                label="Default Social Share Image (OG Image)"
                image
                help="Preview graphic shown on LinkedIn, WhatsApp, and Facebook shares."
              />
              <Area
                section="seo"
                field="description"
                label="Default Meta Description"
                help="Summary shown in Google search result listings."
              />
            </div>
          </Panel>
        ) : null}

        {/* Analytics Tab */}
        {activeTab === "analytics" ? (
          <Panel title="Website Analytics & Measurement">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text
                section="analytics"
                field="ga4"
                label="Google Analytics 4 Measurement ID"
                help="Format: G-XXXXXXXXXX"
              />
              <Text
                section="analytics"
                field="gtm"
                label="Google Tag Manager Container ID"
                help="Format: GTM-XXXXXXX"
              />
              <Text section="analytics" field="clarity" label="Microsoft Clarity Project ID" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Only public measurement IDs are stored here — never private server keys.
            </p>
          </Panel>
        ) : null}

        {/* Bottom Save Action */}
        {canEdit ? (
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shadow-xs"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save All Settings"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
