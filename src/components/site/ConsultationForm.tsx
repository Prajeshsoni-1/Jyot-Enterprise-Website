"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Check, Loader2, Paperclip } from "lucide-react";
import { SERVICES } from "@/data/site";
import { SUBS_BY_PARENT } from "@/data/catalog";
import { BUDGETS, CONTACT_METHODS, INDUSTRY_OPTIONS, TIMELINES } from "@/data/lead-options";
import { LeadError, submitLead } from "@/lib/leads";
import { uploadLeadFile } from "@/lib/lead-uploads";
import { useHydrated } from "@/hooks/use-hydrated";

export { BUDGETS, CONTACT_METHODS, TIMELINES };

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(120),
  phone: z
    .string()
    .trim()
    .min(8, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d][\d\s()-]{7,19}$/, "Enter a valid phone number"),
  company: z.string().trim().max(100).optional(),
  industry: z.string().trim().max(60).optional(),
  service: z.string().min(1, "Select a service"),
  budget: z.string().min(1, "Select an indicative budget"),
  timeline: z.string().min(1, "Select a timeline"),
  meetingDate: z.string().optional(),
  contactMethod: z.string().min(1, "Select a contact method"),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(1500),
  company_website: z.string().max(0).optional(), // honeypot
});

type Values = z.infer<typeof schema>;

const field =
  "w-full min-w-0 max-w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none";
const label = "mb-2 block text-xs font-semibold text-ink";
const errorText = "mt-1.5 text-xs text-destructive";

export function ConsultationForm({
  defaultService,
  compact = false,
}: {
  defaultService?: string;
  compact?: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const renderedAt = useRef(Date.now());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      service: defaultService ?? "",
      budget: "",
      timeline: "",
      contactMethod: "",
      industry: "",
    },
  });
  const hydrated = useHydrated();

  const onSubmit = async (values: Values) => {
    setError(null);
    try {
      const attachments = file ? [await uploadLeadFile("consultations", file)] : [];
      await submitLead(
        {
          attachments,
          name: values.name,
          phone: values.phone,
          email: values.email,
          businessName: values.company,
          industry: values.industry,
          service: values.service,
          budget: values.budget,
          timeline: values.timeline,
          message: values.message,
          preferredDate: values.meetingDate,
          contactMethod: values.contactMethod,
          attachmentName: fileName ?? undefined,
          source: "consultation-form",
          pageUrl: typeof window === "undefined" ? "" : window.location.pathname,
          submittedAt: new Date().toISOString(),
        },
        { honeypot: values.company_website, renderedAt: renderedAt.current },
      );
      setSent(true);
      setFileName(null);
      setFile(null);
      reset({
        service: defaultService ?? "",
        budget: "",
        timeline: "",
        contactMethod: "",
        industry: "",
      });
      renderedAt.current = Date.now();
      setTimeout(() => setSent(false), 8000);
    } catch (err) {
      setError(
        err instanceof LeadError
          ? err.message
          : "We could not send your request. Please try again or call us directly.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid min-w-0 gap-4"
      noValidate
      aria-label="Consultation request form"
    >
      <div aria-hidden="true" className="hidden">
        <label htmlFor="cf-website">Company website</label>
        <input id="cf-website" tabIndex={-1} autoComplete="off" {...register("company_website")} />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={label}>
            Full name
          </label>
          <input
            id="cf-name"
            className={field}
            placeholder="Rakesh Mehta"
            autoComplete="name"
            aria-invalid={errors.name ? "true" : "false"}
            {...register("name")}
          />
          {errors.name ? <p className={errorText}>{errors.name.message}</p> : null}
        </div>
        <div>
          <label htmlFor="cf-phone" className={label}>
            Phone
          </label>
          <input
            id="cf-phone"
            type="tel"
            className={field}
            placeholder="+91 98250 00000"
            autoComplete="tel"
            aria-invalid={errors.phone ? "true" : "false"}
            {...register("phone")}
          />
          {errors.phone ? <p className={errorText}>{errors.phone.message}</p> : null}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-email" className={label}>
            Work email
          </label>
          <input
            id="cf-email"
            type="email"
            className={field}
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={errors.email ? "true" : "false"}
            {...register("email")}
          />
          {errors.email ? <p className={errorText}>{errors.email.message}</p> : null}
        </div>
        <div>
          <label htmlFor="cf-company" className={label}>
            Company <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="cf-company"
            className={field}
            placeholder="Company name"
            autoComplete="organization"
            {...register("company")}
          />
        </div>
      </div>

      <div>
        <label htmlFor="cf-industry" className={label}>
          Industry <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <select id="cf-industry" className={field} {...register("industry")}>
          <option value="">Select an industry</option>
          {INDUSTRY_OPTIONS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cf-service" className={label}>
          Service required
        </label>
        <select id="cf-service" className={field} {...register("service")}>
          <option value="">Select a service</option>
          {SERVICES.map((s) => (
            <optgroup key={s.slug} label={s.name}>
              <option value={s.slug}>{s.short} — general enquiry</option>
              {SUBS_BY_PARENT[s.slug].map((sub) => (
                <option key={sub.slug} value={sub.slug}>
                  {sub.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors.service ? <p className={errorText}>{errors.service.message}</p> : null}
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-budget" className={label}>
            Indicative budget
          </label>
          <select id="cf-budget" className={field} {...register("budget")}>
            <option value="">Select a range</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {errors.budget ? <p className={errorText}>{errors.budget.message}</p> : null}
        </div>
        <div>
          <label htmlFor="cf-timeline" className={label}>
            Timeline
          </label>
          <select id="cf-timeline" className={field} {...register("timeline")}>
            <option value="">Select a timeline</option>
            {TIMELINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.timeline ? <p className={errorText}>{errors.timeline.message}</p> : null}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-date" className={label}>
            Preferred meeting date{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="cf-date" type="date" className={field} {...register("meetingDate")} />
        </div>
        <div>
          <label htmlFor="cf-method" className={label}>
            Preferred contact method
          </label>
          <select id="cf-method" className={field} {...register("contactMethod")}>
            <option value="">Select a method</option>
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {errors.contactMethod ? (
            <p className={errorText}>{errors.contactMethod.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="cf-file" className={label}>
          Attach a brief, drawing or statement{" "}
          <span className="font-normal text-muted-foreground">(optional, max 10 MB)</span>
        </label>
        <label
          htmlFor="cf-file"
          className="flex w-full min-w-0 overflow-hidden cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-3.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-ink"
        >
          <Paperclip className="h-4 w-4 shrink-0 text-primary" />
          <span className="w-0 min-w-0 flex-1 truncate">{fileName ?? "Choose a file"}</span>
        </label>
        <input
          id="cf-file"
          type="file"
          className="sr-only"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.png,.jpg,.jpeg,.zip"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              setFileName(null);
              setFile(null);
              setFileError(null);
              return;
            }
            if (file.size > 10 * 1024 * 1024) {
              setFileError("File is larger than 10 MB. Please share a link instead.");
              setFileName(null);
              setFile(null);
              e.target.value = "";
              return;
            }
            setFileError(null);
            setFileName(file.name);
            setFile(file);
          }}
        />
        {fileError ? <p className={errorText}>{fileError}</p> : null}
      </div>

      <div>
        <label htmlFor="cf-message" className={label}>
          How can we help?
        </label>
        <textarea
          id="cf-message"
          rows={compact ? 3 : 4}
          className={field}
          placeholder="Briefly describe your requirement"
          {...register("message")}
        />
        {errors.message ? <p className={errorText}>{errors.message.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !hydrated}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-ember transition-colors hover:bg-primary-hover disabled:opacity-70"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {isSubmitting ? "Sending" : "Request Consultation"}
      </button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        We reply within one working day. Your details are used only to respond to this enquiry.
      </p>

      <div aria-live="polite">
        {error ? (
          <p className="inline-flex items-start gap-2 text-sm font-semibold text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        {sent ? (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-growth-foreground">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-growth">
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            Received. A consultant will contact you within 24 hours.
          </p>
        ) : null}
      </div>
    </form>
  );
}
