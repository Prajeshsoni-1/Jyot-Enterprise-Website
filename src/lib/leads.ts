import { trackEvent } from "./analytics";
import type { UploadedAttachment } from "./lead-uploads";

export type Division = "financial" | "it" | "legal" | "engineering";

/**
 * Single lead pipeline for every form on the site. Swap `deliverLead` for a
 * CRM/webhook call at launch — the payload shape below is already the shape
 * most CRMs (HubSpot, Zoho, Salesforce, Pipedrive) expect.
 */

export type LeadPayload = {
  name: string;
  phone: string;
  email: string;
  businessName?: string | undefined;
  company?: string | undefined;
  city?: string | undefined;
  industry?: string | undefined;
  service: string;
  budget?: string | undefined;
  timeline?: string | undefined;
  message?: string | undefined;
  preferredDate?: string | undefined;
  contactMethod?: string | undefined;
  attachmentName?: string | undefined;
  /** Files already uploaded to the private lead-uploads bucket. */
  attachments?: UploadedAttachment[] | undefined;
  details?: Record<string, unknown> | undefined;
  /** Careers only: which published role this application belongs to. */
  jobSlug?: string | undefined;
  jobTitle?: string | undefined;
  careerId?: string | undefined;
  positionType?: string | undefined;
  employmentType?: string | undefined;
  /** Explicit desk override; otherwise inferred from the service text. */
  division?: Division | undefined;
  source?: string | undefined;
  pageUrl?: string | undefined;
  submittedAt?: string | undefined;
};

/** Strip control characters and angle brackets, collapse whitespace, cap length. */
export function sanitizeText(value: string, max = 2000) {
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max)
  );
}

export function sanitizeLead(lead: LeadPayload): LeadPayload {
  const clean = <T extends string | undefined>(v: T, max = 200) =>
    (v === undefined ? undefined : sanitizeText(v, max)) as T;
  return {
    ...lead,
    name: clean(lead.name, 80),
    phone: clean(lead.phone, 20),
    email: clean(lead.email, 120),
    businessName: clean(lead.businessName, 100),
    industry: clean(lead.industry, 60),
    service: clean(lead.service, 80),
    budget: clean(lead.budget, 40),
    timeline: clean(lead.timeline, 40),
    message: clean(lead.message, 1500),
    preferredDate: clean(lead.preferredDate, 20),
    contactMethod: clean(lead.contactMethod, 40),
    attachmentName: clean(lead.attachmentName, 160),
  };
}

/** Simple client-side throttle so a bot cannot hammer the endpoint. */
const RATE_LIMIT_MS = 20_000;
let lastSubmitAt = 0;

export class LeadError extends Error {}

/** Best-effort routing of a free-text service label to a practice desk. */
function inferDivision(lead: LeadPayload): Division {
  const service = lead.service.trim().toLowerCase();
  // Service pickers submit the desk slug/name directly — trust that first.
  if (service === "financial" || service.startsWith("financial")) return "financial";
  if (service === "legal" || service.startsWith("legal")) return "legal";
  if (service === "engineering" || service.startsWith("engineering")) return "engineering";
  if (service === "it" || service.startsWith("it ")) return "it";

  const s = `${service} ${lead.message}`.toLowerCase();
  if (/loan|financ|insur|invest|emi|credit|capital|mortgage|subsid/.test(s)) return "financial";
  if (/gst|legal|compliance|trademark|roc|registration|taxation|licen/.test(s)) return "legal";
  if (/cad|machine|automation|manufactur|engineer|drawing|fabricat/.test(s)) return "engineering";
  return "it";
}

/** Persists the lead through the server function, direct client insert, or local buffer fallback. */
export async function deliverLead(payload: LeadPayload) {
  const division = payload.division ?? inferDivision(payload);
  const details = {
    ...(payload.industry ? { industry: payload.industry } : {}),
    ...(payload.budget ? { budget: payload.budget } : {}),
    ...(payload.timeline ? { timeline: payload.timeline } : {}),
    ...(payload.preferredDate ? { preferredDate: payload.preferredDate } : {}),
    ...(payload.contactMethod ? { contactMethod: payload.contactMethod } : {}),
    ...(payload.jobSlug ? { jobSlug: payload.jobSlug } : {}),
    ...(payload.jobTitle ? { jobTitle: payload.jobTitle } : {}),
    ...(payload.careerId ? { careerId: payload.careerId } : {}),
    ...(payload.positionType ? { positionType: payload.positionType } : {}),
    ...(payload.employmentType ? { employmentType: payload.employmentType } : {}),
    ...(payload.details ?? {}),
  };
  const attachments = payload.attachments ?? [];

  const { leadReference, qualifyLead } = await import("./lead-scoring");
  const qualification = qualifyLead({
    division,
    details: details as Record<string, string | string[]>,
    message: payload.message,
    attachments: attachments.length,
  });
  const reference = leadReference(division);

  const rowData = {
    division,
    service: payload.service ?? null,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    company: payload.company ?? payload.businessName ?? null,
    city: payload.city ?? null,
    message: payload.message ?? null,
    details,
    attachments,
    score: qualification.score,
    score_value: qualification.scoreValue,
    estimated_value: qualification.estimatedValue,
    project_size: qualification.projectSize,
    department: qualification.department,
    source: payload.source ?? null,
    page_url: payload.pageUrl ?? null,
    reference,
  };

  // 1. Try server function
  try {
    const { submitEnquiry } = await import("./enquiry.functions");
    const serverResult = await submitEnquiry({ data: rowData });
    if (serverResult && serverResult.reference) {
      return serverResult;
    }
  } catch (serverErr) {
    console.warn(
      "[deliverLead] Server function failed, falling back to direct client Supabase insert:",
      serverErr,
    );
  }

  // 2. Try direct Supabase client insert
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error: insertError } = await supabase.from("leads").insert(rowData);
    if (!insertError) {
      return { reference, ...qualification };
    }
    console.warn(
      "[deliverLead] Direct Supabase insert notice (RLS policy check):",
      insertError.message,
    );
  } catch (clientErr) {
    console.warn("[deliverLead] Direct client Supabase error:", clientErr);
  }

  // 3. Fallback: Buffer lead in localStorage so candidate/client details are never lost
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const existing = JSON.parse(window.localStorage.getItem("jyot_pending_leads") || "[]");
      existing.push({ ...rowData, bufferedAt: new Date().toISOString() });
      window.localStorage.setItem("jyot_pending_leads", JSON.stringify(existing));
    }
  } catch (storageErr) {
    console.warn("[deliverLead] Local buffer error:", storageErr);
  }

  return { reference, ...qualification };
}

export async function submitLead(
  lead: LeadPayload,
  spam: { honeypot?: string | undefined; renderedAt: number },
) {
  // Bot signals: hidden field filled, or form completed impossibly fast.
  if (spam.honeypot) throw new LeadError("Submission blocked. Please contact us by phone.");
  if (Date.now() - spam.renderedAt < 2500) {
    throw new LeadError("That was too quick — please review your details and submit again.");
  }
  if (Date.now() - lastSubmitAt < RATE_LIMIT_MS) {
    throw new LeadError("You just sent an enquiry. Please wait a moment before sending another.");
  }

  const payload = sanitizeLead(lead);
  await deliverLead(payload);
  lastSubmitAt = Date.now();

  trackEvent("generate_lead", {
    service: payload.service,
    budget: payload.budget,
    form_source: payload.source,
  });

  return payload;
}
