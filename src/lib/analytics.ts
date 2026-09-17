/**
 * Google Analytics 4 & Web Tracking Loader for Jyot Enterprise.
 *
 * Designed for Single Page Applications (SPAs):
 * - Initialised once with `send_page_view: false` to prevent duplicate initial page_views.
 * - Single authoritative `trackPageView(pathname)` fires on initial visit and client route transitions.
 * - Automatically excludes internal admin dashboard (/admin/*) and auth (/auth/*) routes.
 * - Idempotent, lightweight, zero dependencies, privacy-conscious.
 *
 * Configured via environment variable:
 *   VITE_GA4_MEASUREMENT_ID  e.g. G-XXXXXXXXXX (also supports legacy VITE_GA4_ID)
 * Optional marketing tags:
 *   VITE_GTM_ID              e.g. GTM-XXXXXXX
 *   VITE_META_PIXEL_ID       e.g. 1234567890
 *   VITE_LINKEDIN_ID         e.g. 1234567
 *   VITE_CLARITY_ID          e.g. abcdefghij
 *   VITE_GSC_VERIFICATION    Google Search Console meta verification token
 */

type AnyFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: AnyFn;
    fbq?: AnyFn & { callMethod?: AnyFn; queue?: unknown[]; loaded?: boolean; version?: string };
    _linkedin_data_partner_ids?: string[];
    lintrk?: AnyFn & { q?: unknown[] };
    clarity?: AnyFn & { q?: unknown[] };
  }
}

const env = (typeof import.meta !== "undefined" && import.meta.env
  ? import.meta.env
  : process.env) as Record<string, string | undefined>;

export const ANALYTICS_IDS = {
  ga4: env["VITE_GA4_MEASUREMENT_ID"] || env["VITE_GA4_ID"] || "",
  gtm: env["VITE_GTM_ID"] || "",
  metaPixel: env["VITE_META_PIXEL_ID"] || "",
  linkedin: env["VITE_LINKEDIN_ID"] || "",
  clarity: env["VITE_CLARITY_ID"] || "",
  searchConsole: env["VITE_GSC_VERIFICATION"] || "",
};

let dynamicGa4Id: string | null = null;
let initialised = false;
let lastTrackedPath: string | null = null;

/** Sets or overrides the GA4 Measurement ID at runtime (e.g. from CMS site settings). */
export function setGa4MeasurementId(id: string | undefined | null) {
  if (id && typeof id === "string" && id.trim()) {
    dynamicGa4Id = id.trim();
  }
}

/** Resolves active GA4 Measurement ID (runtime override takes precedence, fallback to env). */
export function getGa4MeasurementId(): string {
  return dynamicGa4Id || ANALYTICS_IDS.ga4 || "";
}

/**
 * Checks whether a pathname belongs to the public website.
 * Excludes internal admin dashboard (/admin/*), authentication (/auth/*), and API routes (/api/*).
 */
export function isPublicPath(pathname: string | undefined | null): boolean {
  if (!pathname || typeof pathname !== "string") return false;
  const p = pathname.toLowerCase().trim();
  if (
    p.startsWith("/admin") ||
    p.startsWith("/auth") ||
    p.startsWith("/api")
  ) {
    return false;
  }
  return true;
}

function injectScript(src: string, attrs: Record<string, string> = {}) {
  if (typeof document === "undefined") return;
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
  document.head.appendChild(script);
}

/**
 * Initialise Google Analytics 4 and any configured auxiliary tags.
 * Idempotent: guaranteed to execute script injection and dataLayer creation only once.
 */
export function initAnalytics(overrideGa4Id?: string | null) {
  if (overrideGa4Id) {
    setGa4MeasurementId(overrideGa4Id);
  }

  if (typeof window === "undefined") return;

  const ga4Id = getGa4MeasurementId();

  // If already initialised and gtag script exists in DOM, avoid duplicate init
  if (initialised && (window.gtag || document.querySelector('script[src*="googletagmanager.com/gtag/js"]'))) {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  if (ga4Id && !document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${ga4Id}"]`)) {
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`);
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    // CRITICAL FOR SPAs: set send_page_view to false so the initial config call does NOT send
    // a redundant page_view. trackPageView() handles both initial visit and route changes.
    window.gtag("config", ga4Id, { send_page_view: false });
  }

  if (ANALYTICS_IDS.gtm && !document.querySelector(`script[src*="gtm.js?id=${ANALYTICS_IDS.gtm}"]`)) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(ANALYTICS_IDS.gtm)}`);
  }

  if (ANALYTICS_IDS.metaPixel && !window.fbq) {
    const fbq = Object.assign(
      (...args: unknown[]) => {
        const f = window.fbq!;
        if (f.callMethod) f.callMethod(...args);
        else (f.queue ??= []).push(args);
      },
      { queue: [] as unknown[], version: "2.0" },
    );
    window.fbq = fbq;
    injectScript("https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", ANALYTICS_IDS.metaPixel);
  }

  if (ANALYTICS_IDS.linkedin && !window.lintrk) {
    window._linkedin_data_partner_ids = [ANALYTICS_IDS.linkedin];
    window.lintrk = Object.assign(
      (...args: unknown[]) => {
        (window.lintrk!.q ??= []).push(args);
      },
      { q: [] as unknown[] },
    );
    injectScript("https://snap.licdn.com/li.lms-analytics/insight.min.js");
  }

  if (ANALYTICS_IDS.clarity && !window.clarity) {
    window.clarity = Object.assign(
      (...args: unknown[]) => {
        (window.clarity!.q ??= []).push(args);
      },
      { q: [] as unknown[] },
    );
    injectScript(`https://www.clarity.ms/tag/${encodeURIComponent(ANALYTICS_IDS.clarity)}`);
  }

  initialised = true;
}

/**
 * Tracks a page view for public website routes.
 *
 * - Strictly ignores internal administrative and authentication paths.
 * - Prevents duplicate page_views when component re-renders for the same route.
 * - Automatically pushes standard GA4 'page_view' event with path, location, and title.
 */
export function trackPageView(path: string, options?: { title?: string; location?: string }) {
  if (typeof window === "undefined") return;

  // 1. Strict public route filter
  if (!isPublicPath(path)) return;

  // 2. Duplicate prevention for same route
  if (lastTrackedPath === path) return;
  lastTrackedPath = path;

  // 3. Ensure GA4 is initialized if configured
  const ga4Id = getGa4MeasurementId();
  if (ga4Id && !initialised) {
    initAnalytics();
  }

  const pageLocation = options?.location || window.location.href;
  const pageTitle = options?.title || document.title;

  if (window.gtag && ga4Id) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: pageLocation,
      page_title: pageTitle,
    });
  }

  window.dataLayer?.push({
    event: "spa_page_view",
    page_path: path,
    page_location: pageLocation,
    page_title: pageTitle,
  });

  window.fbq?.("track", "PageView");
}

/** Fire a conversion / interaction event across every configured provider. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
  window.dataLayer?.push({ event: name, ...params });
  if (name === "generate_lead") {
    window.fbq?.("track", "Lead", params);
    window.lintrk?.("track", { conversion_id: params["conversion_id"] });
  }
}
