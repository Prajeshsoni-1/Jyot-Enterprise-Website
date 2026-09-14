/**
 * Analytics loader. Every provider is optional and driven by an environment
 * variable, so production launch only requires filling in the IDs — no code
 * change. Nothing loads (and no cookies are set) when an ID is absent.
 *
 * Set in your deployment environment:
 *   VITE_GA4_ID            e.g. G-XXXXXXXXXX
 *   VITE_GTM_ID            e.g. GTM-XXXXXXX
 *   VITE_META_PIXEL_ID     e.g. 1234567890
 *   VITE_LINKEDIN_ID       e.g. 1234567
 *   VITE_CLARITY_ID        e.g. abcdefghij
 *   VITE_GSC_VERIFICATION  Google Search Console meta verification token
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

const env = import.meta.env as Record<string, string | undefined>;

export const ANALYTICS_IDS = {
  ga4: env["VITE_GA4_ID"],
  gtm: env["VITE_GTM_ID"],
  metaPixel: env["VITE_META_PIXEL_ID"],
  linkedin: env["VITE_LINKEDIN_ID"],
  clarity: env["VITE_CLARITY_ID"],
  searchConsole: env["VITE_GSC_VERIFICATION"],
};

let initialised = false;

function injectScript(src: string, attrs: Record<string, string> = {}) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
  document.head.appendChild(script);
}

export function initAnalytics() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;

  window.dataLayer = window.dataLayer || [];

  if (ANALYTICS_IDS.ga4) {
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_IDS.ga4}`);
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", ANALYTICS_IDS.ga4, { send_page_view: true });
  }

  if (ANALYTICS_IDS.gtm) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${ANALYTICS_IDS.gtm}`);
  }

  if (ANALYTICS_IDS.metaPixel) {
    if (!window.fbq) {
      const fbq = Object.assign(
        (...args: unknown[]) => {
          const f = window.fbq!;
          if (f.callMethod) f.callMethod(...args);
          else (f.queue ??= []).push(args);
        },
        { queue: [] as unknown[], version: "2.0" },
      );
      window.fbq = fbq;
    }
    injectScript("https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", ANALYTICS_IDS.metaPixel);
    window.fbq("track", "PageView");
  }

  if (ANALYTICS_IDS.linkedin) {
    window._linkedin_data_partner_ids = [ANALYTICS_IDS.linkedin];
    window.lintrk ??= Object.assign(
      (...args: unknown[]) => {
        (window.lintrk!.q ??= []).push(args);
      },
      { q: [] as unknown[] },
    );
    injectScript("https://snap.licdn.com/li.lms-analytics/insight.min.js");
  }

  if (ANALYTICS_IDS.clarity) {
    window.clarity ??= Object.assign(
      (...args: unknown[]) => {
        (window.clarity!.q ??= []).push(args);
      },
      { q: [] as unknown[] },
    );
    injectScript(`https://www.clarity.ms/tag/${ANALYTICS_IDS.clarity}`);
  }
}

/** Fire a page view on client-side route changes (SPA navigations). */
export function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href });
  window.dataLayer?.push({ event: "spa_page_view", page_path: path });
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
