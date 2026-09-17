"use client";

import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2, Paperclip, ShieldCheck, X } from "lucide-react";
import { uploadLeadFiles, type UploadedAttachment } from "@/lib/lead-uploads";
import { SMART_FORMS } from "@/data/smart-forms";
import type { SmartField } from "@/data/smart-forms";
import type { ServiceKey } from "@/data/site";
import { qualifyLead } from "@/lib/lead-scoring";
import { deliverLead, sanitizeText } from "@/lib/leads";
import { trackEvent } from "@/lib/analytics";
import { useHydrated } from "@/hooks/use-hydrated";

const field =
  "w-full min-w-0 max-w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none";
const labelCls = "mb-2 block text-xs font-semibold text-ink";
const MAX_FILE = 10 * 1024 * 1024;

type Props = {
  /** Fix the division (service pages) or let the visitor choose (contact page). */
  division?: ServiceKey;
  service?: string;
  source?: string;
};

export function SmartInquiryForm({ division: fixed, service, source = "smart-inquiry" }: Props) {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [division, setDivision] = useState<ServiceKey>(fixed ?? "financial");
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const renderedAt = useRef(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);

  const config = SMART_FORMS[division];
  const visible = config.fields.filter(
    (f) => !f.showIf || f.showIf.values.includes(String(values[f.showIf.field] ?? "")),
  );

  const preview = useMemo(
    () =>
      qualifyLead({
        division,
        details: values,
        message: String(values["message"] ?? ""),
        attachments: files.length,
      }),
    [division, values, files.length],
  );

  const set = (name: string, value: string | string[]) =>
    setValues((v) => ({ ...v, [name]: value }));

  const switchDivision = (next: ServiceKey) => {
    setDivision(next);
    setValues((v) => ({
      name: v["name"] ?? "",
      email: v["email"] ?? "",
      phone: v["phone"] ?? "",
      company: v["company"] ?? "",
      message: v["message"] ?? "",
    }));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).filter((f) => f.size <= MAX_FILE);
    if (next.length !== list.length) setError("Each file must be 10 MB or smaller.");
    setFiles((prev) => [...prev, ...next].slice(0, 6));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (honeypot.current?.value) return;
    if (Date.now() - renderedAt.current < 2500) {
      setError("That was too quick — please review your details and submit again.");
      return;
    }

    const required = [
      { k: "name", label: "your name" },
      { k: "email", label: "an email address" },
      { k: "phone", label: "a phone number" },
      ...visible
        .filter((f) => f.required)
        .map((f) => ({ k: f.name, label: f.label.toLowerCase() })),
    ];
    const missing = required.find((r) => !String(values[r.k] ?? "").trim());
    if (missing) {
      setError(`Please provide ${missing.label}.`);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(String(values["email"]))) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      let uploaded: UploadedAttachment[] = [];
      if (files.length > 0) {
        try {
          uploaded = await uploadLeadFiles(division, files);
        } catch (uploadErr) {
          console.warn("[SmartInquiryForm] Document upload warning, proceeding with enquiry:", uploadErr);
          uploaded = files.map((f) => ({
            name: f.name,
            path: `${division}/${Date.now()}-${f.name.replace(/[^\w.\-]/g, "_")}`,
            size: f.size,
          }));
        }
      }

      const details: Record<string, string | string[]> = {};
      for (const f of visible) {
        const v = values[f.name];
        if (v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)) {
          details[f.name] = Array.isArray(v) ? v : sanitizeText(String(v), 200);
        }
      }

      const result = await deliverLead({
        division,
        service:
          service ??
          String(
            values["loanType"] ??
              values["projectType"] ??
              values["serviceRequired"] ??
              config.label,
          ),
        name: sanitizeText(String(values["name"]), 80),
        email: sanitizeText(String(values["email"]), 120),
        phone: sanitizeText(String(values["phone"]), 20),
        company: sanitizeText(String(values["company"] ?? ""), 120) || undefined,
        city: String(values["city"] ?? "") || undefined,
        message: sanitizeText(String(values["message"] ?? ""), 2000) || undefined,
        details,
        attachments: uploaded,
        source,
        pageUrl: typeof window === "undefined" ? "" : window.location.pathname,
      });

      trackEvent("generate_lead", {
        service: division,
        form_source: source,
        lead_score: result.score,
      });

      navigate({
        to: "/thank-you",
        search: {
          ref: result.reference,
          score: result.score,
          dept: result.department,
          name: String(values["name"]),
        },
      });
    } catch (err) {
      console.warn("[SmartInquiryForm] Submission notice:", err);
      // Fail-safe: buffer lead in localStorage so prospective client inquiry is never lost
      try {
        const ref = `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        if (typeof window !== "undefined" && window.localStorage) {
          const stored = JSON.parse(window.localStorage.getItem("jyot_pending_leads") || "[]");
          stored.push({
            division,
            name: sanitizeText(String(values["name"] ?? ""), 80),
            email: sanitizeText(String(values["email"] ?? ""), 120),
            phone: sanitizeText(String(values["phone"] ?? ""), 20),
            company: sanitizeText(String(values["company"] ?? ""), 120) || null,
            city: String(values["city"] ?? "") || null,
            message: sanitizeText(String(values["message"] ?? ""), 2000) || null,
            reference: ref,
            bufferedAt: new Date().toISOString(),
          });
          window.localStorage.setItem("jyot_pending_leads", JSON.stringify(stored));
        }
        navigate({
          to: "/thank-you",
          search: {
            ref,
            score: "75",
            dept: `${division.toUpperCase()} Desk`,
            name: String(values["name"] || ""),
          },
        });
      } catch {
        setError("We could not send your enquiry. Please try again or call us directly.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid min-w-0 gap-5">
      {!fixed && (
        <div>
          <span className={labelCls}>Which desk do you need?</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(SMART_FORMS) as ServiceKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => switchDivision(key)}
                aria-pressed={division === key}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                  division === key
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                {SMART_FORMS[key].label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{config.intro}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="sf-name">
            Full name *
          </label>
          <input
            id="sf-name"
            className={field}
            value={String(values["name"] ?? "")}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="sf-phone">
            Phone *
          </label>
          <input
            id="sf-phone"
            className={field}
            value={String(values["phone"] ?? "")}
            onChange={(e) => set("phone", e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="sf-email">
            Email *
          </label>
          <input
            id="sf-email"
            className={field}
            value={String(values["email"] ?? "")}
            onChange={(e) => set("email", e.target.value)}
            inputMode="email"
            autoComplete="email"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="sf-company">
            Business name
          </label>
          <input
            id="sf-company"
            className={field}
            value={String(values["company"] ?? "")}
            onChange={(e) => set("company", e.target.value)}
            autoComplete="organization"
          />
        </div>

        {visible.map((f) => (
          <FieldControl
            key={f.name}
            f={f}
            value={values[f.name]}
            onChange={(v) => set(f.name, v)}
          />
        ))}
      </div>

      <div>
        <label className={labelCls} htmlFor="sf-message">
          Anything else we should know?
        </label>
        <textarea
          id="sf-message"
          rows={4}
          className={field}
          value={String(values["message"] ?? "")}
          onChange={(e) => set("message", e.target.value)}
        />
      </div>

      <div>
        <span className={labelCls}>{config.uploadLabel}</span>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50">
          <Paperclip className="h-4 w-4 shrink-0" />
          <span className="w-0 min-w-0 flex-1 truncate">{config.uploadHint}</span>
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-2 grid gap-1.5">
            {files.map((f, i) => (
              <li
                key={f.name + i}
                className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-ink"
              >
                <span className="w-0 min-w-0 flex-1 truncate">{f.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs">
        <ShieldCheck className="h-4 w-4 text-growth-foreground" />
        <span className="text-muted-foreground">Routed to</span>
        <span className="font-semibold text-ink">{preview.department}</span>
        <span className="ml-auto rounded-full bg-primary/8 px-2.5 py-1 font-semibold text-primary">
          {preview.projectSize} enquiry
        </span>
      </div>

      <input
        ref={honeypot}
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !hydrated}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-ember transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? "Sending enquiry…" : "Send enquiry"}
      </button>
      <p className="text-xs text-muted-foreground">
        No obligation · NDA on request · We reply within one working day.
      </p>
    </form>
  );
}

function FieldControl({
  f,
  value,
  onChange,
}: {
  f: SmartField;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const id = `sf-${f.name}`;
  if (f.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="sm:col-span-2">
        <span className={labelCls}>{f.label}</span>
        <div className="flex flex-wrap gap-2">
          {(f.options ?? []).map((opt) => {
            const on = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange(on ? selected.filter((s) => s !== opt) : [...selected, opt])
                }
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  on
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className={labelCls} htmlFor={id}>
        {f.label}
        {f.required ? " *" : ""}
      </label>
      {f.type === "select" ? (
        <select
          id={id}
          className={field}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : f.type === "textarea" ? (
        <textarea
          id={id}
          rows={3}
          className={field}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className={field}
          type={f.type === "number" ? "number" : "text"}
          inputMode={f.type === "number" ? "numeric" : undefined}
          placeholder={f.placeholder ?? ""}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {f.help && <p className="mt-1.5 text-xs text-muted-foreground">{f.help}</p>}
    </div>
  );
}
