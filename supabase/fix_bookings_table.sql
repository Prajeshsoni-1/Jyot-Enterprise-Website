-- =============================================================================
-- FIX BOOKINGS TABLE SCHEMA & PERMISSIONS
-- =============================================================================
-- Run this in your Supabase Project -> SQL Editor -> New Query -> Run
-- This aligns the bookings table with slot_at, meeting types, and public availability.
-- =============================================================================

DROP TABLE IF EXISTS public.bookings CASCADE;

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  division text NOT NULL,
  service text,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  city text,
  message text,
  meeting_type text NOT NULL DEFAULT 'video',
  slot_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 45,
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid,
  internal_notes text,
  cancel_reason text,
  rescheduled_from timestamptz,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending','confirmed','completed','cancelled','rescheduled')),
  CONSTRAINT bookings_meeting_type_check CHECK (meeting_type IN ('video','phone','office')),
  CONSTRAINT bookings_division_check CHECK (division IN ('financial','it','legal','engineering')),
  CONSTRAINT bookings_duration_check CHECK (duration_minutes BETWEEN 15 AND 240)
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT INSERT, SELECT ON public.bookings TO anon;
GRANT ALL ON public.bookings TO service_role;

DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public can check booked slots" ON public.bookings;
CREATE POLICY "Public can check booked slots" ON public.bookings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Team can manage bookings" ON public.bookings;
CREATE POLICY "Team can manage bookings" ON public.bookings FOR ALL TO authenticated USING (public.is_team(auth.uid()));

CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_unique
  ON public.bookings (slot_at)
  WHERE status IN ('pending','confirmed','rescheduled');

CREATE INDEX IF NOT EXISTS bookings_slot_at_idx ON public.bookings (slot_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings (status);
CREATE INDEX IF NOT EXISTS bookings_email_idx ON public.bookings (email);

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure lead_activity and lead_notes tables also exist for booking audit logs
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_notes TO authenticated;
GRANT ALL ON public.lead_notes TO service_role;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team can manage notes" ON public.lead_notes;
CREATE POLICY "Team can manage notes" ON public.lead_notes
  FOR ALL TO authenticated USING (public.is_team(auth.uid()));

CREATE TABLE IF NOT EXISTS public.lead_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lead_activity TO authenticated;
GRANT ALL ON public.lead_activity TO service_role;
ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team can manage activity" ON public.lead_activity;
CREATE POLICY "Team can manage activity" ON public.lead_activity
  FOR ALL TO authenticated USING (public.is_team(auth.uid()));
