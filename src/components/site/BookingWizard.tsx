"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { SERVICES, type ServiceKey } from "@/data/site";
import { SUBS_BY_PARENT } from "@/data/catalog";
import { createBooking, getAvailability } from "@/lib/booking.functions";
import { fetchAvailability, submitBookingRequest } from "@/lib/booking-client";
import {
  MEETING_TYPES,
  bookingWindow,
  formatIstDate,
  formatSlotLabel,
  istToday,
  type MeetingType,
} from "@/lib/booking-slots";
import { trackEvent } from "@/lib/analytics";

const field =
  "w-full min-w-0 max-w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none";
const label = "mb-2 block text-xs font-semibold text-ink";
const errorText = "mt-1.5 text-xs text-destructive";

type Slot = { time: string; available: boolean };

const STEPS = ["Service", "Date", "Time", "Details", "Done"] as const;

export function BookingWizard({ defaultDivision }: { defaultDivision?: ServiceKey }) {
  const availability = useServerFn(getAvailability);
  const book = useServerFn(createBooking);

  const [step, setStep] = useState(0);
  const [division, setDivision] = useState<ServiceKey | "">(defaultDivision ?? "");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("video");
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    message: "",
  });
  const [honeypot, setHoneypot] = useState("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [closedReason, setClosedReason] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reference, setReference] = useState<string | null>(null);

  const liveRef = useRef<HTMLParagraphElement>(null);
  const window60 = useMemo(() => bookingWindow(), []);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    fetchAvailability(date, availability)
      .then((res) => {
        if (cancelled) return;
        setSlots(res.slots as Slot[]);
        setClosedReason(res.closed ? (res.reason ?? "We are closed that day.") : null);
      })
      .catch(() => {
        if (!cancelled) setSlotsError("We could not load available times. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, availability]);

  function validateDetails() {
    const next: Record<string, string> = {};
    if (details.name.trim().length < 2) next["name"] = "Please enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(details.email.trim()))
      next["email"] = "Enter a valid email address";
    if (!/^[+\d][\d\s()-]{7,19}$/.test(details.phone.trim()))
      next["phone"] = "Enter a valid phone number";
    if (details.message.trim().length > 1500)
      next["message"] = "Please keep this under 1500 characters";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validateDetails()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitBookingRequest(
        {
          division: division as ServiceKey,
          service: service || undefined,
          date,
          time,
          meetingType,
          name: details.name.trim(),
          email: details.email.trim(),
          phone: details.phone.trim(),
          company: details.company.trim() || undefined,
          city: details.city.trim() || undefined,
          message: details.message.trim() || undefined,
          honeypot: honeypot || undefined,
        },
        book,
      );
      setReference(res.reference);
      setStep(4);
      trackEvent("booking_created", { division, service, meeting_type: meetingType });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        /slot|Sunday|date|time|passed|taken/i.test(message) && message.length < 160
          ? message
          : "We could not confirm that booking. Please try again or call us directly.",
      );
      if (/taken|passed/i.test(message)) {
        setTime("");
        setStep(2);
        fetchAvailability(date, availability)
          .then((r) => setSlots(r.slots as Slot[]))
          .catch(() => undefined);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canNext =
    (step === 0 && division !== "") ||
    (step === 1 && date !== "" && !closedReason) ||
    (step === 2 && time !== "");

  return (
    <div className="min-w-0">
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2" aria-label="Booking progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-1.5 sm:gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[0.68rem] sm:text-[0.7rem] font-semibold ${
                i === step
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : i < step
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
              <span className={i === step ? "inline" : "hidden xs:inline sm:inline"}>{s}</span>
            </span>
          </li>
        ))}
      </ol>

      <p ref={liveRef} aria-live="polite" className="sr-only">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      <div className="mt-8 min-w-0">
        {step === 0 ? (
          <fieldset className="min-w-0">
            <legend className="font-display text-lg font-bold text-ink">
              Which department do you need?
            </legend>
            <div className="mt-5 grid gap-3">
              {SERVICES.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => {
                    setDivision(s.slug);
                    setService("");
                  }}
                  aria-pressed={division === s.slug}
                  className={`rounded-2xl border px-5 py-4 text-left transition-colors ${
                    division === s.slug
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="block font-display text-sm font-bold text-ink">{s.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{s.tagline}</span>
                </button>
              ))}
            </div>

            {division ? (
              <div className="mt-6">
                <label htmlFor="bk-service" className={label}>
                  Specific service{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <select
                  id="bk-service"
                  className={field}
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="">General {division} consultation</option>
                  {SUBS_BY_PARENT[division].map((sub) => (
                    <option key={sub.slug} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-ink">Pick a date</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Monday to Saturday, 10:00–18:00 IST. Slots open from two hours ahead.
            </p>
            <label htmlFor="bk-date" className={`${label} mt-5`}>
              Consultation date
            </label>
            <input
              id="bk-date"
              type="date"
              className={field}
              value={date}
              min={window60.min}
              max={window60.max}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
              }}
            />
            {date ? (
              <p className="mt-2 text-xs text-muted-foreground">{formatIstDate(date)}</p>
            ) : null}
            {closedReason ? <p className={errorText}>{closedReason}</p> : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-ink">Choose a time</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatIstDate(date)} · all times IST
            </p>

            {slotsLoading ? (
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading available times…
              </p>
            ) : slotsError ? (
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> {slotsError}
              </p>
            ) : slots.filter((s) => s.available).length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No free slots on this date. Please go back and choose another day.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    aria-pressed={time === s.time}
                    onClick={() => setTime(s.time)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      time === s.time
                        ? "border-primary bg-primary text-primary-foreground"
                        : s.available
                          ? "border-border text-ink hover:border-primary/40"
                          : "cursor-not-allowed border-border bg-secondary text-muted-foreground/60 line-through"
                    }`}
                  >
                    {formatSlotLabel(s.time)}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8">
              <span className={label}>Meeting type</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {MEETING_TYPES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={meetingType === m.value}
                    onClick={() => setMeetingType(m.value)}
                    className={`rounded-xl border px-4 py-3 text-xs font-semibold transition-colors ${
                      meetingType === m.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-ink hover:border-primary/40"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <form
            className="grid min-w-0 gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            aria-label="Booking details"
          >
            <div aria-hidden="true" className="hidden">
              <label htmlFor="bk-web">Website</label>
              <input
                id="bk-web"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm">
              <p className="font-semibold text-ink">
                {SERVICES.find((s) => s.slug === division)?.name}
                {service ? ` · ${service}` : ""}
              </p>
              <p className="mt-1 text-muted-foreground">
                {formatIstDate(date)} · {formatSlotLabel(time)} IST ·{" "}
                {MEETING_TYPES.find((m) => m.value === meetingType)?.label}
              </p>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bk-name" className={label}>
                  Full name
                </label>
                <input
                  id="bk-name"
                  className={field}
                  autoComplete="name"
                  aria-invalid={fieldErrors["name"] ? "true" : "false"}
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                />
                {fieldErrors["name"] ? <p className={errorText}>{fieldErrors["name"]}</p> : null}
              </div>
              <div>
                <label htmlFor="bk-phone" className={label}>
                  Phone
                </label>
                <input
                  id="bk-phone"
                  type="tel"
                  className={field}
                  autoComplete="tel"
                  aria-invalid={fieldErrors["phone"] ? "true" : "false"}
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                />
                {fieldErrors["phone"] ? <p className={errorText}>{fieldErrors["phone"]}</p> : null}
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bk-email" className={label}>
                  Work email
                </label>
                <input
                  id="bk-email"
                  type="email"
                  className={field}
                  autoComplete="email"
                  aria-invalid={fieldErrors["email"] ? "true" : "false"}
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                />
                {fieldErrors["email"] ? <p className={errorText}>{fieldErrors["email"]}</p> : null}
              </div>
              <div>
                <label htmlFor="bk-company" className={label}>
                  Company <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="bk-company"
                  className={field}
                  autoComplete="organization"
                  value={details.company}
                  onChange={(e) => setDetails({ ...details, company: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="bk-city" className={label}>
                City <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="bk-city"
                className={field}
                value={details.city}
                onChange={(e) => setDetails({ ...details, city: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="bk-message" className={label}>
                What would you like to cover?{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="bk-message"
                rows={4}
                className={field}
                value={details.message}
                onChange={(e) => setDetails({ ...details, message: e.target.value })}
              />
              {fieldErrors["message"] ? (
                <p className={errorText}>{fieldErrors["message"]}</p>
              ) : null}
            </div>

            {error ? (
              <p
                role="alert"
                className="inline-flex items-start gap-2 rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Confirming…" : "Confirm booking"}
            </button>
          </form>
        ) : null}

        {step === 4 && reference ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Check className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-xl font-extrabold text-ink">Booking received</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatIstDate(date)} at {formatSlotLabel(time)} IST. We confirm the exact slot by
              phone or email within one working day.
            </p>
            <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Your reference
            </p>
            <p className="font-display text-2xl font-extrabold text-ink">{reference}</p>
          </div>
        ) : null}
      </div>

      {step < 3 ? (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-ink disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <button
          type="button"
          onClick={() => setStep(2)}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Change time
        </button>
      ) : null}

      {step === 4 ? (
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setDate("");
            setTime("");
            setReference(null);
            setDetails({ name: "", email: "", phone: "", company: "", city: "", message: "" });
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-ink"
        >
          Book another consultation
        </button>
      ) : null}

      <p className="sr-only">Today is {istToday()}.</p>
    </div>
  );
}
