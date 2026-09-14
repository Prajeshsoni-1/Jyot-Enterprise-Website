-- ============ CMS CORE ============

CREATE TABLE public.cms_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  service_key text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text,
  hero_title text,
  hero_description text,
  hero_image text,
  icon text,
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

CREATE TABLE public.cms_sub_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  service_id uuid REFERENCES public.cms_services(id) ON DELETE CASCADE,
  parent_key text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text,
  hero_title text,
  hero_description text,
  hero_image text,
  icon text,
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

CREATE TABLE public.cms_industries (
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
  icon text,
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

CREATE TABLE public.cms_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  client text,
  industry text,
  service text,
  project_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text,
  hero_image text,
  technologies text[] NOT NULL DEFAULT '{}',
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

CREATE TABLE public.cms_case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  client text,
  industry text,
  service text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text,
  hero_image text,
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

CREATE TABLE public.cms_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body text,
  author text,
  author_role text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  read_time text,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  hero_image text,
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

CREATE TABLE public.cms_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  resource_type text,
  category text,
  author text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text,
  hero_image text,
  icon text,
  thumbnail text,
  file_path text,
  file_bucket text,
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

CREATE TABLE public.cms_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  service_id uuid REFERENCES public.cms_services(id) ON DELETE SET NULL,
  industry_id uuid REFERENCES public.cms_industries(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cms_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  module text NOT NULL,
  entity_id uuid,
  entity_slug text,
  entity_title text,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ GRANTS ============

GRANT SELECT ON public.cms_services TO anon;
GRANT SELECT ON public.cms_sub_services TO anon;
GRANT SELECT ON public.cms_industries TO anon;
GRANT SELECT ON public.cms_projects TO anon;
GRANT SELECT ON public.cms_case_studies TO anon;
GRANT SELECT ON public.cms_posts TO anon;
GRANT SELECT ON public.cms_resources TO anon;
GRANT SELECT ON public.cms_faqs TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_sub_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_industries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_case_studies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_resources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_faqs TO authenticated;
GRANT SELECT, INSERT ON public.cms_audit_log TO authenticated;

GRANT ALL ON public.cms_services TO service_role;
GRANT ALL ON public.cms_sub_services TO service_role;
GRANT ALL ON public.cms_industries TO service_role;
GRANT ALL ON public.cms_projects TO service_role;
GRANT ALL ON public.cms_case_studies TO service_role;
GRANT ALL ON public.cms_posts TO service_role;
GRANT ALL ON public.cms_resources TO service_role;
GRANT ALL ON public.cms_faqs TO service_role;
GRANT ALL ON public.cms_audit_log TO service_role;

-- ============ RLS ============

ALTER TABLE public.cms_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cms_services','cms_sub_services','cms_industries','cms_projects','cms_case_studies','cms_posts','cms_resources','cms_faqs']
  LOOP
    EXECUTE format('CREATE POLICY "Public reads published %1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (status = ''published'')', t);
    EXECUTE format('CREATE POLICY "Team reads all %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.is_team(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Editors insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''manager''::app_role))', t);
    EXECUTE format('CREATE POLICY "Editors update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''manager''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''manager''::app_role))', t);
    EXECUTE format('CREATE POLICY "Editors delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role) OR public.has_role(auth.uid(), ''manager''::app_role))', t);
    EXECUTE format('CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
    EXECUTE format('CREATE INDEX idx_%1$s_status ON public.%1$I (status)', t);
    EXECUTE format('CREATE INDEX idx_%1$s_order ON public.%1$I (sort_order)', t);
    EXECUTE format('CREATE INDEX idx_%1$s_featured ON public.%1$I (featured)', t);
  END LOOP;
END $$;

CREATE POLICY "Team reads cms audit" ON public.cms_audit_log
  FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "Editors write cms audit" ON public.cms_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role)));

CREATE INDEX idx_cms_sub_services_service ON public.cms_sub_services (service_id);
CREATE INDEX idx_cms_faqs_service ON public.cms_faqs (service_id);
CREATE INDEX idx_cms_faqs_industry ON public.cms_faqs (industry_id);
CREATE INDEX idx_cms_posts_published_at ON public.cms_posts (published_at DESC);
CREATE INDEX idx_cms_audit_created ON public.cms_audit_log (created_at DESC);
CREATE INDEX idx_cms_audit_module ON public.cms_audit_log (module, entity_id);