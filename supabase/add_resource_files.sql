-- =============================================================================
-- JYOT ENTERPRISE — Resources CMS: cms_resource_files migration
-- =============================================================================
-- Run this in Supabase Project → SQL Editor → New Query.
-- This adds the cms_resource_files table that stores downloadable files linked
-- to each Resource. It does NOT touch the existing cms_resources table.
-- =============================================================================

-- 1. cms_resource_files: downloadable files per Resource
CREATE TABLE IF NOT EXISTS public.cms_resource_files (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id   uuid        NOT NULL REFERENCES public.cms_resources(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  description   text,
  -- The publicly accessible URL (from Supabase Storage public bucket)
  file_url      text,
  -- Path inside the jyot-enterprise bucket, e.g. website-documents/resources/guide.pdf
  storage_path  text,
  -- Original filename as uploaded
  file_name     text,
  -- File size in bytes
  file_size     bigint,
  -- MIME type, e.g. application/pdf
  mime_type     text,
  -- Human-readable type label shown to public, e.g. PDF, XLSX, DOCX
  file_type     text        NOT NULL DEFAULT 'PDF',
  -- Optional override for the download button label
  display_label text,
  -- Filename hint sent in Content-Disposition header when browser downloads
  download_filename text,
  sort_order    integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resource_files_resource_id
  ON public.cms_resource_files (resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_files_sort
  ON public.cms_resource_files (resource_id, sort_order);

-- Auto-update updated_at
CREATE TRIGGER update_resource_files_updated_at
  BEFORE UPDATE ON public.cms_resource_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.cms_resource_files ENABLE ROW LEVEL SECURITY;

-- Anyone can read files belonging to published resources
DROP POLICY IF EXISTS "anyone reads resource files for published resources" ON public.cms_resource_files;
CREATE POLICY "anyone reads resource files for published resources"
  ON public.cms_resource_files FOR SELECT
  USING (
    is_active = true
    OR (auth.role() = 'authenticated' AND public.is_team(auth.uid()))
  );

-- Editors can manage all files
DROP POLICY IF EXISTS "editors manage resource files" ON public.cms_resource_files;
CREATE POLICY "editors manage resource files"
  ON public.cms_resource_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Grants
GRANT SELECT ON public.cms_resource_files TO anon;
GRANT ALL   ON public.cms_resource_files TO authenticated;
GRANT ALL   ON public.cms_resource_files TO service_role;

-- =============================================================================
-- 2. Storage: jyot-enterprise bucket resource document policies
-- =============================================================================
-- The jyot-enterprise bucket is already public.
-- Add editor INSERT/UPDATE/DELETE policies for the resources sub-folder.

-- Allow editors to upload resource documents
DROP POLICY IF EXISTS "editors upload resource documents" ON storage.objects;
CREATE POLICY "editors upload resource documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'jyot-enterprise'
    AND (
      (storage.foldername(name))[1] = 'website-documents'
    )
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

DROP POLICY IF EXISTS "editors update resource documents" ON storage.objects;
CREATE POLICY "editors update resource documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'jyot-enterprise'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  )
  WITH CHECK (
    bucket_id = 'jyot-enterprise'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

DROP POLICY IF EXISTS "editors delete resource documents" ON storage.objects;
CREATE POLICY "editors delete resource documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'jyot-enterprise'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  );

-- Public reads on jyot-enterprise bucket (already public, but explicit policy)
DROP POLICY IF EXISTS "anyone reads jyot-enterprise" ON storage.objects;
CREATE POLICY "anyone reads jyot-enterprise"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'jyot-enterprise');
