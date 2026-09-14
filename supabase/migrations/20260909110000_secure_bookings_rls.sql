-- Enforce strict RLS on public.bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Revoke public / anonymous permissions on bookings table
REVOKE ALL ON public.bookings FROM anon;
REVOKE ALL ON public.bookings FROM public;

-- Drop any potential open or overly permissive policies
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anon can read bookings" ON public.bookings;
DROP POLICY IF EXISTS "anon_select" ON public.bookings;
DROP POLICY IF EXISTS "anon_all" ON public.bookings;

-- Ensure only authenticated team members can read/write bookings directly via PostgREST
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Team can read bookings'
  ) THEN
    CREATE POLICY "Team can read bookings" ON public.bookings
      FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Team can create bookings'
  ) THEN
    CREATE POLICY "Team can create bookings" ON public.bookings
      FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Team can update bookings'
  ) THEN
    CREATE POLICY "Team can update bookings" ON public.bookings
      FOR UPDATE TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));
  END IF;
END $$;
