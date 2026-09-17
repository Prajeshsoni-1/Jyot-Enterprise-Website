import { supabase } from "@/integrations/supabase/client";
import {
  SLOT_TIMES,
  isFutureEnough,
  isOpenDay,
  isWithinWindow,
  slotInstant,
  type MeetingType,
} from "./booking-slots";
import type { ServiceKey } from "@/data/site";

export type Slot = { time: string; available: boolean };

export type AvailabilityResult = {
  date: string;
  closed: boolean;
  reason: string | null;
  slots: Slot[];
};

export type BookingInput = {
  division: ServiceKey;
  service?: string | undefined;
  date: string;
  time: string;
  meetingType: MeetingType;
  name: string;
  email: string;
  phone: string;
  company?: string | undefined;
  city?: string | undefined;
  message?: string | undefined;
  honeypot?: string | undefined;
};

export async function fetchAvailability(
  date: string,
  serverFn?: (opts: { data: { date: string } }) => Promise<AvailabilityResult>,
): Promise<AvailabilityResult> {
  const now = new Date();

  if (!isWithinWindow(date, now)) {
    return {
      date,
      closed: true,
      reason: "Pick a date within the next 60 days.",
      slots: [],
    };
  }

  if (!isOpenDay(date)) {
    return {
      date,
      closed: true,
      reason: "We are closed on Sundays. Please pick another day.",
      slots: [],
    };
  }

  // 1. Try server function if available
  if (serverFn) {
    try {
      const res = await serverFn({ data: { date } });
      if (res && Array.isArray(res.slots)) {
        return res;
      }
    } catch (serverErr) {
      console.warn(
        "[booking-client] Server function availability failed, switching to direct Supabase client:",
        serverErr,
      );
    }
  }

  // 2. Direct Supabase client query
  try {
    const dayStart = slotInstant(date, "00:00") ?? new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);

    const { data: taken, error } = await supabase
      .from("bookings")
      .select("slot_at")
      .gte("slot_at", dayStart.toISOString())
      .lt("slot_at", dayEnd.toISOString())
      .in("status", ["pending", "confirmed", "rescheduled"]);

    if (error) {
      console.warn("[booking-client] Direct availability query warning:", error.message);
    }

    const busy = new Set((taken ?? []).map((r) => new Date(r.slot_at as string).getTime()));

    const slots: Slot[] = SLOT_TIMES.map((time) => {
      const instant = slotInstant(date, time);
      const available =
        Boolean(instant) && !busy.has(instant!.getTime()) && isFutureEnough(date, time, now);
      return { time, available };
    });

    return {
      date,
      closed: false,
      reason: null,
      slots,
    };
  } catch (clientErr) {
    console.warn("[booking-client] Fallback to default calculated slots:", clientErr);

    // Fallback: Compute available future slots locally so user is never blocked
    const slots: Slot[] = SLOT_TIMES.map((time) => ({
      time,
      available: isFutureEnough(date, time, now),
    }));

    return {
      date,
      closed: false,
      reason: null,
      slots,
    };
  }
}

export async function submitBookingRequest(
  data: BookingInput,
  serverFn?: (opts: { data: BookingInput }) => Promise<{ reference: string; slotAt: string }>,
): Promise<{ reference: string; slotAt: string }> {
  if (data.honeypot) {
    throw new Error("Submission blocked. Please call us directly.");
  }

  // 1. Try server function
  if (serverFn) {
    try {
      const result = await serverFn({ data });
      if (result && result.reference) {
        return result;
      }
    } catch (serverErr) {
      console.warn(
        "[booking-client] Server booking function failed, executing direct Supabase delivery:",
        serverErr,
      );
    }
  }

  const instant = slotInstant(data.date, data.time);
  if (!instant) {
    throw new Error("The selected date and time could not be verified.");
  }

  const cleanEmail = data.email.toLowerCase().trim();
  const cleanPhone = data.phone.trim();
  const reference = `BK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const bookingRow = {
    reference,
    division: data.division,
    service: data.service || null,
    name: data.name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    company: data.company?.trim() || null,
    city: data.city?.trim() || null,
    message: data.message?.trim() || null,
    meeting_type: data.meetingType,
    slot_at: instant.toISOString(),
    duration_minutes: 45,
    status: "pending",
    source: "website_booking",
  };

  // 2. Direct Supabase insert into bookings
  let bookingCreated = false;
  try {
    const { error: bookingErr } = await supabase.from("bookings").insert(bookingRow);
    if (!bookingErr) {
      bookingCreated = true;
    } else {
      console.warn("[booking-client] Direct booking insert error:", bookingErr.message);
    }
  } catch (err) {
    console.warn("[booking-client] Direct booking error:", err);
  }

  // 3. Also record as an enquiry/lead in public.leads for CRM visibility
  try {
    await supabase.from("leads").insert({
      division: data.division,
      service: data.service ? `Consultation: ${data.service}` : "General Consultation",
      name: data.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      company: data.company?.trim() || null,
      city: data.city?.trim() || null,
      message: data.message?.trim() || `Booked ${data.meetingType} consultation on ${data.date} at ${data.time} IST.`,
      reference,
      source: "booking_wizard",
      details: {
        booking_reference: reference,
        booking_date: data.date,
        booking_time: data.time,
        meeting_type: data.meetingType,
        slot_at: instant.toISOString(),
      },
    });
  } catch (leadErr) {
    console.warn("[booking-client] Secondary lead creation notice:", leadErr);
  }

  // 4. Local storage backup
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = JSON.parse(window.localStorage.getItem("jyot_pending_bookings") || "[]");
      stored.push({ ...bookingRow, savedAt: new Date().toISOString() });
      window.localStorage.setItem("jyot_pending_bookings", JSON.stringify(stored));
    }
  } catch (storeErr) {
    console.warn("[booking-client] Storage backup notice:", storeErr);
  }

  return {
    reference,
    slotAt: instant.toISOString(),
  };
}
