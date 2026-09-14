import { CONTACT } from "@/data/site";

/**
 * Central SEO helpers. All URLs are relative because no production domain is
 * assigned yet — crawlers resolve them against the serving host.
 */

export const SITE_NAME = "Jyot Enterprise";
export const SITE_TAGLINE = "Empowering Dreams. Enabling Growth.";

export const SOCIAL_PROFILES = [
  "https://www.linkedin.com/company/jyot-enterprise",
  "https://www.facebook.com/jyotenterprise",
  "https://www.instagram.com/jyotenterprise",
  "https://twitter.com/jyotenterprise",
];

export const SERVICE_AREAS = [
  "Gandhinagar",
  "Palanpur",
  "Surat",
  "Ahmedabad",
  "Vadodara",
  "Rajkot",
  "Mumbai",
  "Gujarat",
  "India",
];

export const BUSINESS_CATEGORIES = [
  "Business management consultant",
  "Financial consultant",
  "Software company",
  "Legal services",
  "Engineering consultant",
];

type Json = Record<string, unknown>;

export function jsonLd(data: Json) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

export function canonical(path: string) {
  return { rel: "canonical" as const, href: path };
}

/** Standard meta block for a page: title, description, OG + Twitter cards. */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
}) {
  const meta: Array<Record<string, string>> = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:type", content: opts.type ?? "website" },
    { property: "og:url", content: opts.path },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
  ];
  if (opts.image) {
    meta.push({ property: "og:image", content: opts.image });
    meta.push({ name: "twitter:image", content: opts.image });
  }
  if (opts.noindex) meta.push({ name: "robots", content: "noindex, follow" });
  return meta;
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "/#organization",
  name: SITE_NAME,
  slogan: SITE_TAGLINE,
  logo: "/brand/logo-cropped.png",
  image: "/brand/logo.png",
  description:
    "Jyot Enterprise delivers financial, IT, legal and engineering services to growing Indian businesses under one accountable partnership.",
  url: "/",
  email: CONTACT.email,
  telephone: CONTACT.phone,
  contactPoint: [
    { "@type": "ContactPoint", telephone: CONTACT.phone, contactType: "sales" },
    { "@type": "ContactPoint", telephone: CONTACT.phone2, contactType: "sales" },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "B2 Building, 6th Floor, Office B-616, The Landmark, Near Kudasan",
    addressLocality: "Gandhinagar",
    addressRegion: "Gujarat",
    postalCode: "382419",
    addressCountry: "IN",
  },
  location: [
    {
      "@type": "Place",
      name: "Jyot Enterprise — Gandhinagar Office",
      address: {
        "@type": "PostalAddress",
        streetAddress: "B2 Building, 6th Floor, Office B-616, The Landmark, Near Kudasan",
        addressLocality: "Gandhinagar",
        addressRegion: "Gujarat",
        postalCode: "382419",
        addressCountry: "IN",
      },
      hasMap: "https://maps.app.goo.gl/EQVGn84UQ1WEL81n8",
    },
    {
      "@type": "Place",
      name: "Jyot Enterprise — Palanpur Office",
      address: {
        "@type": "PostalAddress",
        streetAddress: "47, Sanskrit Complex, Abu Highway",
        addressLocality: "Palanpur",
        addressRegion: "Gujarat",
        postalCode: "385001",
        addressCountry: "IN",
      },
      hasMap: "https://maps.app.goo.gl/UyqfmrF2ohsvhKTn9",
    },
  ],
  sameAs: SOCIAL_PROFILES,
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "/#localbusiness",
  name: SITE_NAME,
  image: "/favicon.ico",
  description:
    "Financial, IT, legal and engineering services firm serving MSMEs, startups and enterprises across Gujarat and India.",
  url: "/",
  email: CONTACT.email,
  telephone: CONTACT.phone,
  priceRange: "₹₹",
  address: {
    "@type": "PostalAddress",
    streetAddress: "B2 Building, 6th Floor, Office B-616, The Landmark, Near Kudasan",
    addressLocality: "Gandhinagar",
    addressRegion: "Gujarat",
    postalCode: "382419",
    addressCountry: "IN",
  },
  hasMap: "https://maps.app.goo.gl/EQVGn84UQ1WEL81n8",
  areaServed: SERVICE_AREAS.map((name) => ({ "@type": "AdministrativeArea", name })),
  knowsAbout: BUSINESS_CATEGORIES,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:30",
      closes: "19:00",
    },
  ],
  sameAs: SOCIAL_PROFILES,
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: "/",
  potentialAction: {
    "@type": "SearchAction",
    target: "/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path,
    })),
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType ?? opts.name,
    url: opts.path,
    provider: { "@type": "Organization", name: SITE_NAME, url: "/" },
    areaServed: SERVICE_AREAS.map((name) => ({ "@type": "AdministrativeArea", name })),
  };
}
