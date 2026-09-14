-- Portfolio CMS and Media Library Schema
-- Adds cms_media table and documents cms_projects extended JSONB fields

CREATE TABLE IF NOT EXISTS public.cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL,
  url text NOT NULL,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_media_created_at ON public.cms_media (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_media_path ON public.cms_media (path);

ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.cms_media TO anon, authenticated;
GRANT ALL ON public.cms_media TO authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cms_media' AND policyname = 'Public reads cms_media'
  ) THEN
    CREATE POLICY "Public reads cms_media" ON public.cms_media
      FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cms_media' AND policyname = 'Team inserts cms_media'
  ) THEN
    CREATE POLICY "Team inserts cms_media" ON public.cms_media
      FOR INSERT TO authenticated
      WITH CHECK (public.is_team(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cms_media' AND policyname = 'Team updates cms_media'
  ) THEN
    CREATE POLICY "Team updates cms_media" ON public.cms_media
      FOR UPDATE TO authenticated
      USING (public.is_team(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cms_media' AND policyname = 'Team deletes cms_media'
  ) THEN
    CREATE POLICY "Team deletes cms_media" ON public.cms_media
      FOR DELETE TO authenticated
      USING (public.is_team(auth.uid()));
  END IF;
END $$;

COMMENT ON TABLE public.cms_projects IS 'Stores full portfolio projects with core relational columns and rich content blocks in data JSONB (sections, gallery, challengeDetails, solutionDetails, resultDetails, technologiesDetailed, clientQuote, cta, controls, seo)';
