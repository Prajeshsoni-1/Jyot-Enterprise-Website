-- ============ CMS RESOURCE FILES: DOWNLOADABLE ASSETS ============

CREATE TABLE IF NOT EXISTS public.cms_resource_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.cms_resources(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  storage_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  file_type text NOT NULL DEFAULT 'PDF',
  display_label text,
  download_filename text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by resource_id
CREATE INDEX IF NOT EXISTS cms_resource_files_resource_id_idx ON public.cms_resource_files(resource_id);
CREATE INDEX IF NOT EXISTS cms_resource_files_active_idx ON public.cms_resource_files(is_active);

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_cms_resource_files_updated_at ON public.cms_resource_files;
CREATE TRIGGER update_cms_resource_files_updated_at
  BEFORE UPDATE ON public.cms_resource_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cms_resource_files ENABLE ROW LEVEL SECURITY;

-- 1. Public can read active files that belong to published resources
CREATE POLICY "anyone reads published resource files" ON public.cms_resource_files
  FOR SELECT USING (
    (is_active = true AND EXISTS (
      SELECT 1 FROM public.cms_resources r
      WHERE r.id = cms_resource_files.resource_id AND r.status = 'published'
    ))
    OR (auth.role() = 'authenticated' AND public.is_team(auth.uid()))
  );

-- 2. Authenticated team / admin / manager can insert resource files
CREATE POLICY "editors insert resource files" ON public.cms_resource_files
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.is_team(auth.uid()));

-- 3. Authenticated team / admin / manager can update resource files
CREATE POLICY "editors update resource files" ON public.cms_resource_files
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.is_team(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.is_team(auth.uid()));

-- 4. Authenticated team / admin / manager can delete resource files
CREATE POLICY "editors delete resource files" ON public.cms_resource_files
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.is_team(auth.uid()));
