-- Migration: Add position_type to cms_jobs and support dedicated Jobs & Internships separation
-- Adds position_type column with check constraint ('job', 'internship') and indexes

ALTER TABLE public.cms_jobs 
ADD COLUMN IF NOT EXISTS position_type text CHECK (position_type IN ('job', 'internship'));

-- Create index for position_type queries
CREATE INDEX IF NOT EXISTS idx_cms_jobs_position_type ON public.cms_jobs(position_type);

-- Ensure indexes exist for status, slug, featured, and sort_order
CREATE INDEX IF NOT EXISTS idx_cms_jobs_status ON public.cms_jobs(status);
CREATE INDEX IF NOT EXISTS idx_cms_jobs_slug ON public.cms_jobs(slug);
CREATE INDEX IF NOT EXISTS idx_cms_jobs_featured ON public.cms_jobs(featured);
CREATE INDEX IF NOT EXISTS idx_cms_jobs_sort_order ON public.cms_jobs(sort_order);

-- Backfill existing rows without position_type as 'internship' (or according to employment_type)
UPDATE public.cms_jobs
SET position_type = CASE 
  WHEN lower(coalesce(employment_type, '')) LIKE '%job%' OR lower(coalesce(employment_type, '')) LIKE '%full-time%' THEN 'job'
  ELSE 'internship'
END
WHERE position_type IS NULL;
