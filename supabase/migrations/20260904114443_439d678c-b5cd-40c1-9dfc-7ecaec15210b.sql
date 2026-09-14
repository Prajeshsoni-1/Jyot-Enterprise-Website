-- Deduplicate any existing references before adding the unique index
WITH d AS (
  SELECT id, row_number() OVER (PARTITION BY reference ORDER BY created_at) AS rn
  FROM public.leads
)
UPDATE public.leads l
SET reference = l.reference || '-' || d.rn
FROM d WHERE d.id = l.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS leads_reference_key ON public.leads (reference);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_division_idx ON public.leads (division);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (lower(email));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new','contacted','qualified','won','lost','archived'));
