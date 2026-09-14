"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { SERVICES } from "@/data/site";
import { INDUSTRY_OPTIONS, BUDGETS, TIMELINES } from "@/data/lead-options";
import { LeadError, submitLead } from "@/lib/leads";
import { useHydrated } from "@/hooks/use-hydrated";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(120),
  phone: z
    .string()
    .trim()
    .min(8, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d][\d\s()-]{7,19}$/, "Enter a valid phone number"),
  businessName: z.string().trim().max(100).optional(),
  industry: z.string().trim().max(60).optional(),
  service: z.string().min(1, "Select a service"),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(1500),
  company_website: z.string().max(0).optional(), // honeypot
});

type Values = z.infer<typeof schema>;

const field =
  "w-full min-w-0 max-w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none";
const labelCls = "mb-2 block text-xs font-semibold text-ink";

export function InquiryForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderedAt = useRef(Date.now());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { service: "", budget: "", timeline: "", industry: "" },
  });
  const hydrated = useHydrated();

  const onSubmit = async (values: Values) => {
    setError(null);
    try {
      await submitLead(
        {
          name: values.name,
          phone: values.phone,
          email: values.email,
          businessName: values.businessName,
          industry: values.industry,
          service: values.service,
          budget: values.budget,
          timeline: values.timeline,
          message: values.message,
          source: "inquiry-form",
          pageUrl: typeof window === "undefined" ? "" : window.location.pathname,
          submittedAt: new Date().toISOString(),
        },
        { honeypot: values.company_website, renderedAt: renderedAt.current },
      );
      setSent(true);
      reset({ service: "", budget: "", timeline: "", industry: "" });
      renderedAt.current = Date.now();
      setTimeout(() => setSent(false), 8000);
    } catch (err) {
      setError(
        err instanceof LeadError
          ? err.message
          : "We could not send your enquiry. Please try again or call us directly.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid min-w-0 gap-4"
      noValidate
      aria-label="Enquiry form"
    >
      {/* honeypot — hidden from users, catches bots */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          tabIndex={-1}
          autoComplete="off"
          {...register("company_website")}
        />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>
            Full name
          </label>
          <input
            id="name"
            className={field}
            placeholder="Rakesh Mehta"
            autoComplete="name"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="name-error" className="mt-1.5 text-xs text-destructive">
              {errors.name.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="phone" className={labelCls}>
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            className={field}
            placeholder="+91 98250 00000"
            autoComplete="tel"
            aria-invalid={errors.phone ? "true" : "false"}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
          />
          {errors.phone ? (
            <p id="phone-error" className="mt-1.5 text-xs text-destructive">
              {errors.phone.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelCls}>
            Work email
          </label>
          <input
            id="email"
            type="email"
            className={field}
            placeholder="you@company.com"
            autoComplete="email"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="email-error" className="mt-1.5 text-xs text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="businessName" className={labelCls}>
            Business name <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="businessName"
            className={field}
            placeholder="Company name"
            autoComplete="organization"
            {...register("businessName")}
          />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="service" className={labelCls}>
            Service line
          </label>
          <select
            id="service"
            className={field}
            aria-invalid={errors.service ? "true" : "false"}
            {...register("service")}
          >
            <option value="">Select a service</option>
            {SERVICES.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.service ? (
            <p className="mt-1.5 text-xs text-destructive">{errors.service.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="industry" className={labelCls}>
            Industry <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select id="industry" className={field} {...register("industry")}>
            <option value="">Select an industry</option>
            {INDUSTRY_OPTIONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="budget" className={labelCls}>
            Indicative budget <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select id="budget" className={field} {...register("budget")}>
            <option value="">Select a range</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="timeline" className={labelCls}>
            Timeline <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select id="timeline" className={field} {...register("timeline")}>
            <option value="">Select a timeline</option>
            {TIMELINES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelCls}>
          How can we help?
        </label>
        <textarea
          id="message"
          rows={4}
          className={field}
          placeholder="Briefly describe your requirement"
          aria-invalid={errors.message ? "true" : "false"}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
        />
        {errors.message ? (
          <p id="message-error" className="mt-1.5 text-xs text-destructive">
            {errors.message.message}
          </p>
        ) : null}
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

      <div aria-live="polite" className="min-h-0">
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
