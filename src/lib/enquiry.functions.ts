import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { qualifyLead, leadReference } from "@/lib/lead-scoring";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const attachmentSchema = z.object({
  name: z.string().max(200),
  // Storage keys only: no absolute URLs, no traversal.
  path: z
    .string()
    .max(400)
    .regex(/^[a-z0-9-]+\/[\w.\-]+$/i, "Invalid attachment path"),
  size: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES),
});

const leadSchema = z.object({
  division: z.enum(["financial", "it", "legal", "engineering"]),
  service: z.string().trim().max(120).optional(),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(8).max(20),
  company: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  message: z.string().trim().max(2000).optional(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])).default({}),
  attachments: z.array(attachmentSchema).max(6).default([]),
  source: z.string().trim().max(80).optional(),
  pageUrl: z.string().trim().max(300).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

/**
 * Persists a qualified enquiry. Scoring runs server-side so the stored score
 * cannot be tampered with from the browser.
 */
export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const qualification = qualifyLead({
      division: data.division,
      details: data.details,
      message: data.message,
      attachments: data.attachments.length,
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Server-side throttle: the same person cannot flood the desk with the
    // identical enquiry. Client-side rate limiting alone is trivially bypassed.
    const since = new Date(Date.now() - 60_000).toISOString();
    const { data: recent, error: recentError } = await supabaseAdmin
      .from("leads")
      .select("reference")
      .eq("email", data.email)
      .eq("division", data.division)
      .gte("created_at", since)
      .limit(1);
    if (recentError) throw new Error("We could not reach our systems. Please try again shortly.");
    if (recent && recent.length > 0) {
      throw new Error(
        "We already received this enquiry a moment ago. Our team will be in touch shortly.",
      );
    }

    const insertRow = (reference: string) => ({
      division: data.division,
      service: data.service ?? null,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company ?? null,
      city: data.city ?? null,
      message: data.message ?? null,
      details: data.details,
      attachments: data.attachments,
      score: qualification.score,
      score_value: qualification.scoreValue,
      estimated_value: qualification.estimatedValue,
      project_size: qualification.projectSize,
      department: qualification.department,
      source: data.source ?? null,
      page_url: data.pageUrl ?? null,
      reference,
    });
    // Reference numbers are unique in the database; retry on the rare clash.
    let reference = leadReference(data.division);
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: insertedLead, error } = await supabaseAdmin
        .from("leads")
        .insert(insertRow(reference))
        .select("id")
        .maybeSingle();

      if (!error) {
        // 1. Trigger automated email notifications asynchronously
        try {
          const { sendLeadNotifications } = await import("@/lib/notifications.server");
          void sendLeadNotifications({
            reference,
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            city: data.city,
            division: data.division,
            service: data.service,
            message: data.message,
            score: qualification.score,
            scoreValue: qualification.scoreValue,
            estimatedValue: qualification.estimatedValue,
          }).catch((err) => console.error("[submitEnquiry] Notification dispatch failed:", err));
        } catch (notifErr) {
          console.error("[submitEnquiry] Could not load notifications module:", notifErr);
        }

        // 2. Trigger real-time admin panel notification asynchronously
        try {
          const { triggerAdminNotification } = await import("@/lib/notifications.functions");
          const isCareer = data.source === "careers";
          const details = (data.details ?? {}) as Record<string, unknown>;
          const roleTitle = String(details["jobTitle"] || details["role"] || data.service || "Open Role");
          const positionType = String(
            details["positionType"] ||
              (String(details["employmentType"] || "").toLowerCase().includes("internship")
                ? "internship"
                : "job"),
          );
          const isInternship =
            positionType === "internship" || roleTitle.toLowerCase().includes("internship");

          if (isCareer) {
            void triggerAdminNotification({
              type: "job_application",
              title: isInternship
                ? "New internship application received"
                : "New job application received",
              message: `${data.name} applied for ${roleTitle} (${isInternship ? "Internship" : "Job"}).`,
              entity_type: "job_application",
              entity_id: insertedLead?.id ? String(insertedLead.id) : null,
              entity_reference: reference,
              data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                jobTitle: roleTitle,
                positionType: isInternship ? "internship" : "job",
                reference,
              },
            }).catch((err) =>
              console.error("[submitEnquiry] Real-time job application notification error:", err),
            );
          } else {
            const serviceName =
              data.service ||
              (data.division ? `${data.division.toUpperCase()} Services` : "General Enquiry");
            void triggerAdminNotification({
              type: "enquiry",
              title: "New enquiry received",
              message: `${data.name} submitted an enquiry for ${serviceName}.`,
              entity_type: "lead",
              entity_id: insertedLead?.id ? String(insertedLead.id) : null,
              entity_reference: reference,
              data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company,
                service: serviceName,
                division: data.division,
                reference,
              },
            }).catch((err) =>
              console.error("[submitEnquiry] Real-time enquiry notification error:", err),
            );
          }
        } catch (adminNotifErr) {
          console.error("[submitEnquiry] Could not trigger admin notification:", adminNotifErr);
        }

        return { reference, ...qualification };
      }
      lastError = error.message;
      if (!/duplicate key|unique/i.test(error.message)) break;
      reference = leadReference(data.division);
    }
    console.error("[submitEnquiry] insert failed:", lastError);
    throw new Error("We could not save your enquiry. Please try again or call us directly.");
  });
