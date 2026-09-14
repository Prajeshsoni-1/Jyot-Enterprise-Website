"use client";

import { useEffect } from "react";
import { trackEvent } from "./analytics";

/**
 * Business-event helpers. Everything here is client-only, non-identifying and
 * environment-driven: with no analytics IDs configured, trackEvent is a no-op.
 * Never pass names, emails, phone numbers, notes, documents or form contents.
 */

/** Fires once when a page/section becomes visible. */
export function useTrackedView(name: string, params: Record<string, unknown> = {}) {
  const key = JSON.stringify(params);
  useEffect(() => {
    trackEvent(name, { ...JSON.parse(key), ...campaignParams() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key]);
}

/** utm_* / gclid values from the current URL, if a campaign brought the visitor. */
export function campaignParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
  ]) {
    const v = q.get(k);
    if (v) out[k] = v.slice(0, 80);
  }
  return out;
}

export function trackCtaClick(label: string, location: string) {
  trackEvent("cta_click", { cta_label: label, cta_location: location, ...campaignParams() });
}
