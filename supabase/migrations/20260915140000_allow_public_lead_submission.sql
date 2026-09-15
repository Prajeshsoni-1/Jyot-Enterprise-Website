-- Allow website visitors to insert inquiries into public.leads table
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.leads TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Public can insert leads'
  ) THEN
    CREATE POLICY "Public can insert leads" ON public.leads
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;
