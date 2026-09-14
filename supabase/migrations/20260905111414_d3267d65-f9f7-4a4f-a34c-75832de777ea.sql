-- Common publishing shape reused by the existing website manager
CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text,
  hero_title text,
  hero_description text,
  hero_image text,
  cta_label text,
  cta_href text,
  seo_title text,
  seo_description text,
  seo_keywords text[] NOT NULL DEFAULT '{}',
  og_image text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cms_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived','closed')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  department text,
  employment_type text,
  location text,
  work_mode text,
  experience text,
  salary text,
  openings integer,
  deadline date,
  skills text[] NOT NULL DEFAULT '{}',
  summary text,
  body text,
  hero_image text,
  cta_label text,
  cta_href text,
  seo_title text,
  seo_description text,
  seo_keywords text[] NOT NULL DEFAULT '{}',
  og_image text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cms_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  category text,
  summary text,
  body text,
  thumbnail text,
  hero_image text,
  file_path text,
  file_bucket text,
  file_url text,
  cta_label text,
  seo_title text,
  seo_description text,
  seo_keywords text[] NOT NULL DEFAULT '{}',
  og_image text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cms_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  city text,
  address text,
  maps_url text,
  embed_url text,
  latitude numeric,
  longitude numeric,
  phone text,
  email text,
  hours text,
  summary text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL DEFAULT 'site-media',
  path text NOT NULL UNIQUE,
  url text NOT NULL,
  name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cms_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS application_stage text
  CHECK (application_stage IN ('new','reviewing','shortlisted','interview','selected','rejected'));

-- Grants
GRANT SELECT ON public.cms_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;
GRANT ALL ON public.cms_pages TO service_role;
GRANT SELECT ON public.cms_jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_jobs TO authenticated;
GRANT ALL ON public.cms_jobs TO service_role;
GRANT SELECT ON public.cms_downloads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_downloads TO authenticated;
GRANT ALL ON public.cms_downloads TO service_role;
GRANT SELECT ON public.cms_offices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_offices TO authenticated;
GRANT ALL ON public.cms_offices TO service_role;
GRANT SELECT ON public.cms_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media TO authenticated;
GRANT ALL ON public.cms_media TO service_role;
GRANT SELECT ON public.cms_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_settings TO authenticated;
GRANT ALL ON public.cms_settings TO service_role;

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;

-- Public read of published content only
CREATE POLICY "public reads published pages" ON public.cms_pages FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "team reads all pages" ON public.cms_pages FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "editors write pages" ON public.cms_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "public reads published jobs" ON public.cms_jobs FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "team reads all jobs" ON public.cms_jobs FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "editors write jobs" ON public.cms_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "public reads published downloads" ON public.cms_downloads FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "team reads all downloads" ON public.cms_downloads FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "editors write downloads" ON public.cms_downloads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "public reads published offices" ON public.cms_offices FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "team reads all offices" ON public.cms_offices FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "editors write offices" ON public.cms_offices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "public reads media" ON public.cms_media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "editors write media" ON public.cms_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "public reads settings" ON public.cms_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "editors write settings" ON public.cms_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE TRIGGER update_cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_jobs_updated_at BEFORE UPDATE ON public.cms_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_downloads_updated_at BEFORE UPDATE ON public.cms_downloads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_offices_updated_at BEFORE UPDATE ON public.cms_offices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_media_updated_at BEFORE UPDATE ON public.cms_media FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_settings_updated_at BEFORE UPDATE ON public.cms_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cms_jobs_status ON public.cms_jobs(status, sort_order);
CREATE INDEX idx_cms_downloads_status ON public.cms_downloads(status, sort_order);
CREATE INDEX idx_cms_offices_status ON public.cms_offices(status, sort_order);
CREATE INDEX idx_cms_media_created ON public.cms_media(created_at DESC);