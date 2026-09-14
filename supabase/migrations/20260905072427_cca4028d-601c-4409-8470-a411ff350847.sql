CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  lead_id uuid REFERENCES public.leads(id),
  customer_id uuid REFERENCES public.customers(id),
  division text NOT NULL,
  service text,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  city text,
  message text,
  meeting_type text NOT NULL DEFAULT 'video',
  slot_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 45,
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid,
  internal_notes text,
  cancel_reason text,
  rescheduled_from timestamp with time zone,
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending','confirmed','completed','cancelled','rescheduled')),
  CONSTRAINT bookings_meeting_type_check CHECK (meeting_type IN ('video','phone','office')),
  CONSTRAINT bookings_division_check CHECK (division IN ('financial','it','legal','engineering')),
  CONSTRAINT bookings_duration_check CHECK (duration_minutes BETWEEN 15 AND 240)
);

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can read bookings" ON public.bookings
  FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "Team can create bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team can update bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));

-- One live booking per slot.
CREATE UNIQUE INDEX bookings_active_slot_unique
  ON public.bookings (slot_at)
  WHERE status IN ('pending','confirmed','rescheduled');

CREATE INDEX bookings_slot_at_idx ON public.bookings (slot_at);
CREATE INDEX bookings_status_idx ON public.bookings (status);
CREATE INDEX bookings_email_idx ON public.bookings (email);
CREATE INDEX bookings_lead_id_idx ON public.bookings (lead_id);
CREATE INDEX bookings_customer_id_idx ON public.bookings (customer_id);
CREATE INDEX bookings_assigned_to_idx ON public.bookings (assigned_to);

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.lead_activity
  ADD COLUMN booking_id uuid REFERENCES public.bookings(id);
CREATE INDEX lead_activity_booking_id_idx ON public.lead_activity (booking_id);