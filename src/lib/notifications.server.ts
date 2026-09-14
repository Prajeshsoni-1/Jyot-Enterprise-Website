/**
 * Automated Transactional Email Notifications
 *
 * Sends automated email alerts for:
 * 1. New Consultation Bookings (Admin notification + Client confirmation)
 * 2. New Lead / Contact Inquiries (Admin notification + Client acknowledgement)
 *
 * Uses the Resend REST API (zero npm dependencies, 100% native fetch).
 * Operates with graceful fallback: if RESEND_API_KEY is not configured yet,
 * it safely logs the payload and never interrupts user transactions.
 */

const ADMIN_EMAIL = process.env["ADMIN_NOTIFICATION_EMAIL"] || "prajesh.8511@gmail.com";
const DEFAULT_FROM =
  process.env["NOTIFICATION_FROM_EMAIL"] || "Jyot Enterprise <notifications@jyotenterprise.com>";
const FALLBACK_TEST_FROM = "Jyot Enterprise <onboarding@resend.dev>";

type EmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | undefined;
};

async function dispatchEmail({
  to,
  subject,
  html,
  replyTo,
}: EmailOptions): Promise<{ ok: boolean; simulated?: boolean; error?: string }> {
  const apiKey = process.env["RESEND_API_KEY"] || process.env["VITE_RESEND_API_KEY"];
  const recipientList = Array.isArray(to) ? to : [to];

  if (!apiKey) {
    console.info(
      `[Email Notifications] RESEND_API_KEY is not set. Simulated email dispatch to: ${recipientList.join(", ")} | Subject: "${subject}"`,
    );
    return { ok: true, simulated: true };
  }

  // If using default onboarding domain in test mode, sender must be onboarding@resend.dev
  const fromAddress =
    apiKey.startsWith("re_") && !process.env["NOTIFICATION_FROM_EMAIL"]
      ? FALLBACK_TEST_FROM
      : DEFAULT_FROM;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipientList,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(
        `[Email Notifications] Resend API responded with status ${res.status}: ${errorText}`,
      );
      return { ok: false, error: errorText };
    }

    const data = (await res.json()) as { id?: string };
    console.info(
      `[Email Notifications] Successfully delivered email [ID: ${data.id}] to ${recipientList.join(", ")}`,
    );
    return { ok: true };
  } catch (err) {
    console.error("[Email Notifications] Unexpected failure dispatching email:", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function baseEmailTemplate({
  headline,
  preheader,
  contentHtml,
  ctaText,
  ctaUrl,
}: {
  headline: string;
  preheader: string;
  contentHtml: string;
  ctaText?: string | undefined;
  ctaUrl?: string | undefined;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 16px; }
    .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04); }
    .header { background: linear-gradient(135deg, #F04A23 0%, #D83B16 100%); padding: 32px 36px; text-align: left; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px; }
    .body { padding: 36px; }
    .table-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table-details td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .table-details td.label { font-weight: 600; color: #64748b; width: 34%; }
    .table-details td.val { color: #0f172a; font-weight: 500; }
    .btn { display: inline-block; background-color: #F04A23; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-top: 20px; }
    .footer { padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Jyot Enterprise</h1>
        <p>${headline}</p>
      </div>
      <div class="body">
        ${contentHtml}
        ${
          ctaText && ctaUrl
            ? `<div style="text-align: center; margin-top: 28px;">
                <a href="${ctaUrl}" class="btn" target="_blank">${ctaText}</a>
               </div>`
            : ""
        }
      </div>
      <div class="footer">
        <p style="margin: 0;">Jyot Enterprise &bull; Kudasan, Gandhinagar, Gujarat 382419</p>
        <p style="margin: 4px 0 0;">Financial Advisory &bull; Technology &amp; AI &bull; Legal Compliance &bull; Engineering</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* =======================================================================
   1. Consultation Booking Notifications
   ======================================================================= */

export type BookingNotificationPayload = {
  reference: string;
  name: string;
  email: string;
  phone: string;
  company?: string | null | undefined;
  division: string;
  service?: string | null | undefined;
  slotAt: string;
  meetingType: string;
  message?: string | null | undefined;
};

export async function sendBookingNotifications(booking: BookingNotificationPayload) {
  const formattedDate = new Date(booking.slotAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

  const divisionLabel = booking.division.toUpperCase();

  // A. Admin Alert (to prajesh.8511@gmail.com)
  const adminHtml = baseEmailTemplate({
    headline: `New Consultation Booked: ${booking.reference}`,
    preheader: `${booking.name} scheduled a ${booking.meetingType} meeting for ${formattedDate}`,
    contentHtml: `
      <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">
        A new client consultation has been scheduled on the website:
      </p>
      <table class="table-details">
        <tr><td class="label">Reference ID</td><td class="val"><strong style="color:#F04A23;">${booking.reference}</strong></td></tr>
        <tr><td class="label">Client Name</td><td class="val">${booking.name}</td></tr>
        <tr><td class="label">Email</td><td class="val"><a href="mailto:${booking.email}">${booking.email}</a></td></tr>
        <tr><td class="label">Phone</td><td class="val"><a href="tel:${booking.phone}">${booking.phone}</a></td></tr>
        <tr><td class="label">Company</td><td class="val">${booking.company || "Not specified"}</td></tr>
        <tr><td class="label">Practice Division</td><td class="val">${divisionLabel} ${booking.service ? `(${booking.service})` : ""}</td></tr>
        <tr><td class="label">Scheduled Slot</td><td class="val"><strong>${formattedDate} IST</strong></td></tr>
        <tr><td class="label">Meeting Type</td><td class="val" style="text-transform: capitalize;">${booking.meetingType}</td></tr>
        ${booking.message ? `<tr><td class="label">Client Notes</td><td class="val">${booking.message}</td></tr>` : ""}
      </table>
    `,
    ctaText: "Open in Admin Desk",
    ctaUrl: `${process.env["SITE_URL"] || "https://elevate-jyot-core.lovable.app"}/admin/bookings`,
  });

  // B. Client Confirmation (to client's email)
  const clientHtml = baseEmailTemplate({
    headline: "Your Consultation is Confirmed",
    preheader: `Thank you for booking with Jyot Enterprise. Slot: ${formattedDate}`,
    contentHtml: `
      <p style="font-size: 15px; margin-top: 0;">Dear ${booking.name},</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        Thank you for scheduling a consultation with <strong>Jyot Enterprise</strong>. Our advisory specialists have reserved your slot, and we look forward to discussing your business requirements.
      </p>
      <table class="table-details">
        <tr><td class="label">Booking Ref</td><td class="val"><strong style="color:#F04A23;">${booking.reference}</strong></td></tr>
        <tr><td class="label">Date &amp; Time</td><td class="val"><strong>${formattedDate} IST</strong></td></tr>
        <tr><td class="label">Discussion Area</td><td class="val">${divisionLabel} Advisory</td></tr>
        <tr><td class="label">Meeting Format</td><td class="val" style="text-transform: capitalize;">${booking.meetingType}</td></tr>
      </table>
      <p style="color: #475569; font-size: 13px; line-height: 1.6;">
        If you need to reschedule or share additional project files prior to our meeting, reply directly to this email or call our direct desk at <strong>+91 95374 30101</strong>.
      </p>
    `,
  });

  // Dispatch both asynchronously
  await Promise.allSettled([
    dispatchEmail({
      to: ADMIN_EMAIL,
      subject: `[Consultation] New Booking (${booking.reference}) — ${booking.name}`,
      html: adminHtml,
      replyTo: booking.email,
    }),
    dispatchEmail({
      to: booking.email,
      subject: `Booking Confirmed (${booking.reference}) — Jyot Enterprise`,
      html: clientHtml,
    }),
  ]);
}

/* =======================================================================
   2. Lead / Inquiry Notifications
   ======================================================================= */

export type LeadNotificationPayload = {
  reference: string;
  name: string;
  email: string;
  phone: string;
  company?: string | null | undefined;
  city?: string | null | undefined;
  division: string;
  service?: string | null | undefined;
  message?: string | null | undefined;
  score?: string | null | undefined;
  scoreValue?: number | null | undefined;
  estimatedValue?: string | null | undefined;
};

export async function sendLeadNotifications(lead: LeadNotificationPayload) {
  const divisionLabel = lead.division.toUpperCase();

  // A. Admin Alert (to prajesh.8511@gmail.com)
  const adminHtml = baseEmailTemplate({
    headline: `New Inbound Lead: ${lead.reference}`,
    preheader: `New enquiry from ${lead.name} (${lead.company || lead.city || "Client"})`,
    contentHtml: `
      <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 0;">
        A new prospective enquiry has been submitted on the website:
      </p>
      <table class="table-details">
        <tr><td class="label">Lead Reference</td><td class="val"><strong style="color:#F04A23;">${lead.reference}</strong></td></tr>
        <tr><td class="label">Contact Person</td><td class="val">${lead.name}</td></tr>
        <tr><td class="label">Email</td><td class="val"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
        <tr><td class="label">Phone</td><td class="val"><a href="tel:${lead.phone}">${lead.phone}</a></td></tr>
        <tr><td class="label">Company / City</td><td class="val">${lead.company ? `${lead.company} (${lead.city || ""})` : lead.city || "Not specified"}</td></tr>
        <tr><td class="label">Division</td><td class="val">${divisionLabel} ${lead.service ? `(${lead.service})` : ""}</td></tr>
        ${lead.score ? `<tr><td class="label">Lead Score</td><td class="val"><strong>${lead.score} Priority</strong> (${lead.scoreValue ?? 0}/100)</td></tr>` : ""}
        ${lead.estimatedValue ? `<tr><td class="label">Estimated Deal</td><td class="val">${lead.estimatedValue}</td></tr>` : ""}
        ${lead.message ? `<tr><td class="label">Message</td><td class="val">${lead.message}</td></tr>` : ""}
      </table>
    `,
    ctaText: "Review Lead in Admin",
    ctaUrl: `${process.env["SITE_URL"] || "https://elevate-jyot-core.lovable.app"}/admin/enquiries`,
  });

  // B. Client Acknowledgment
  const clientHtml = baseEmailTemplate({
    headline: "We Received Your Enquiry",
    preheader: `Thank you for contacting Jyot Enterprise. Reference: ${lead.reference}`,
    contentHtml: `
      <p style="font-size: 15px; margin-top: 0;">Dear ${lead.name},</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        Thank you for contacting <strong>Jyot Enterprise</strong>. Our team has received your enquiry regarding our <strong>${divisionLabel}</strong> services.
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        A senior practice advisor will review your project details and reach out within <strong>1 business day</strong> to discuss next steps.
      </p>
      <table class="table-details">
        <tr><td class="label">Enquiry Ref</td><td class="val"><strong style="color:#F04A23;">${lead.reference}</strong></td></tr>
        <tr><td class="label">Assigned Practice</td><td class="val">${divisionLabel} Practice Group</td></tr>
      </table>
      <p style="color: #475569; font-size: 13px; line-height: 1.6;">
        If your requirement is urgent, please connect directly with our coordination office at <strong>+91 95374 30101</strong> or via WhatsApp.
      </p>
    `,
  });

  // Dispatch both asynchronously
  await Promise.allSettled([
    dispatchEmail({
      to: ADMIN_EMAIL,
      subject: `[New Lead] ${lead.name} — ${divisionLabel} (${lead.reference})`,
      html: adminHtml,
      replyTo: lead.email,
    }),
    dispatchEmail({
      to: lead.email,
      subject: `Enquiry Received (${lead.reference}) — Jyot Enterprise`,
      html: clientHtml,
    }),
  ]);
}
