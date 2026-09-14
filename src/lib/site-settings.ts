/**
 * Central site settings.
 *
 * The built-in values below stay the source of truth until an admin saves
 * settings in Admin → Website → Site settings. Everything public reads
 * through `useSiteSettings()`, so contact details, social links, footer copy
 * and default SEO live in exactly one place.
 */

import { createContext, useContext } from "react";
import { CONTACT, NAV, OFFICES } from "@/data/site";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export type OfficeEntry = {
  id?: string;
  title: string;
  city: string;
  address: string;
  maps: string;
  embed: string;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type SiteSettings = {
  brand: {
    companyName: string;
    tagline: string;
    description: string;
    logoUrl: string;
    faviconUrl: string;
  };
  contact: {
    email: string;
    phone: string;
    phone2: string;
    whatsapp: string;
    whatsapp2: string;
    address: string;
    hours: string;
  };
  social: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    twitter: string;
  };
  website: {
    ctaLabel: string;
    ctaHref: string;
    footerText: string;
    copyright: string;
    headerCtaVisible: boolean;
    headerContactVisible: boolean;
    hiddenNav: string[];
    navOrder: string[];
    footerLinks: { label: string; to: string }[];
  };
  seo: {
    title: string;
    description: string;
    ogImage: string;
    keywords: string[];
  };
  analytics: {
    ga4: string;
    gtm: string;
    clarity: string;
  };
  offices: OfficeEntry[];
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand: {
    companyName: SITE_NAME,
    tagline: SITE_TAGLINE,
    description:
      "One accountable partner for financial, technology, legal and engineering mandates — built for businesses that intend to grow deliberately.",
    logoUrl: "/brand/logo-cropped.png",
    faviconUrl: "/brand/logo-mark.png",
  },
  contact: {
    email: CONTACT.email,
    phone: CONTACT.phone,
    phone2: CONTACT.phone2,
    whatsapp: CONTACT.whatsapp,
    whatsapp2: CONTACT.whatsapp2,
    address: CONTACT.address,
    hours: CONTACT.hours,
  },
  social: {
    facebook: "https://www.facebook.com/jyotenterprise",
    instagram: "https://www.instagram.com/jyotenterprise",
    linkedin: "https://www.linkedin.com/company/jyot-enterprise",
    youtube: "",
    twitter: "https://twitter.com/jyotenterprise",
  },
  website: {
    ctaLabel: "Book a consultation",
    ctaHref: "/book",
    footerText:
      "One accountable partner for financial, technology, legal and engineering mandates — built for businesses that intend to grow deliberately.",
    copyright: `© ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.`,
    headerCtaVisible: true,
    headerContactVisible: true,
    hiddenNav: [],
    navOrder: NAV.map((n) => n.to),
    footerLinks: [],
  },
  seo: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Financial, IT, legal and engineering services for growing Indian businesses, delivered under one accountable partner.",
    ogImage: "",
    keywords: [],
  },
  analytics: { ga4: "", gtm: "", clarity: "" },
  offices: OFFICES.map((o) => ({
    title: o.label,
    city: o.city,
    address: o.address,
    maps: o.maps,
    embed: o.embed,
  })),
};

/** Digits-only phone → tel: / wa.me helpers, so admins can type any format. */
export function telHref(phone: string): string {
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits.startsWith("+") ? digits : `+${digits}`}` : "";
}

export function waHref(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Saved values win, built-in values fill every gap. */
export function mergeSettings(saved: DeepPartial<SiteSettings> | null | undefined): SiteSettings {
  if (!saved) return DEFAULT_SITE_SETTINGS;
  const out = { ...DEFAULT_SITE_SETTINGS } as SiteSettings;
  for (const key of Object.keys(DEFAULT_SITE_SETTINGS) as (keyof SiteSettings)[]) {
    const base = DEFAULT_SITE_SETTINGS[key];
    const patch = (saved as Record<string, unknown>)[key];
    if (Array.isArray(base)) {
      (out as Record<string, unknown>)[key] = Array.isArray(patch) && patch.length ? patch : base;
    } else if (base && typeof base === "object") {
      const merged: Record<string, unknown> = { ...(base as Record<string, unknown>) };
      if (patch && typeof patch === "object") {
        for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
          if (v === undefined || v === null || v === "") continue;
          merged[k] = v;
        }
      }
      (out as Record<string, unknown>)[key] = merged;
    }
  }
  return out;
}

export const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
