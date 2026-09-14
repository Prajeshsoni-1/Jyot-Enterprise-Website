/**
 * Shared (client + server) slot maths for the consultation booking flow.
 * Office hours are Indian Standard Time; slots are stored in UTC.
 */

export const IST_OFFSET_MINUTES = 330;
export const SLOT_DURATION_MINUTES = 45;

/** 24-hour IST start times, Monday–Saturday. Sunday is closed. */
export const SLOT_TIMES = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"] as const;

export const MEETING_TYPES = [
  { value: "video", label: "Google Meet (video call)" },
  { value: "phone", label: "Phone or WhatsApp" },
  { value: "office", label: "Office visit" },
] as const;

export type MeetingType = (typeof MEETING_TYPES)[number]["value"];

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rescheduled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** ISO date (YYYY-MM-DD) for "today" in IST. */
export function istToday(now = new Date()): string {
  const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 10);
}

/** Converts an IST date + HH:mm into the exact UTC instant. */
export function slotInstant(date: string, time: string): Date | null {
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) return null;
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - IST_OFFSET_MINUTES * 60_000;
  const instant = new Date(utcMs);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/** Day of week in IST: 0 = Sunday. */
export function istWeekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isOpenDay(date: string): boolean {
  return DATE_RE.test(date) && istWeekday(date) !== 0;
}

/** Bookable window: today + 60 days. */
export function bookingWindow(now = new Date()) {
  const min = istToday(now);
  const [y, m, d] = min.split("-").map(Number) as [number, number, number];
  const maxDate = new Date(Date.UTC(y, m - 1, d + 60));
  return { min, max: maxDate.toISOString().slice(0, 10) };
}

export function isWithinWindow(date: string, now = new Date()): boolean {
  const { min, max } = bookingWindow(now);
  return date >= min && date <= max;
}

/** Slots must start at least 2 hours from now. */
export function isFutureEnough(date: string, time: string, now = new Date()): boolean {
  const instant = slotInstant(date, time);
  if (!instant) return false;
  return instant.getTime() - now.getTime() >= 2 * 60 * 60 * 1000;
}

export function formatSlotLabel(time: string): string {
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const suffix = hh >= 12 ? "PM" : "AM";
  const hour = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour}:${String(mm).padStart(2, "0")} ${suffix}`;
}

/** Human date in IST, e.g. "Mon, 8 Sep 2026". */
export function formatIstDate(value: string | Date): string {
  const d =
    typeof value === "string" && DATE_RE.test(value)
      ? new Date(`${value}T00:00:00Z`)
      : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: typeof value === "string" && DATE_RE.test(value) ? "UTC" : "Asia/Kolkata",
  });
}

/** Human date + time in IST for a stored instant. */
export function formatIstDateTime(value: string | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  })}, ${d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  })} IST`;
}
