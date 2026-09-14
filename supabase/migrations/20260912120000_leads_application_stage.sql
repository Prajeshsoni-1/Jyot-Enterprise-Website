-- Add application_stage column to public.leads if it doesn't exist
-- Backfill existing career leads with their stage or 'new'

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS application_stage text DEFAULT 'new';

-- Backfill from details->>'application_stage' or details->>'stage' or status
UPDATE public.leads
SET application_stage = COALESCE(
  details->>'application_stage',
  details->>'stage',
  CASE
    WHEN status IN ('new', 'reviewing', 'shortlisted', 'interview', 'selected', 'rejected') THEN status
    ELSE 'new'
  END
)
WHERE application_stage IS NULL AND source = 'careers';

-- Add index for fast querying by source and stage
CREATE INDEX IF NOT EXISTS idx_leads_source_stage ON public.leads (source, application_stage);
