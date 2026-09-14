-- ============ CMS EXTENSIONS: PRODUCTS, TESTIMONIALS, TEAM MEMBERS ============

CREATE TABLE IF NOT EXISTS public.cms_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text,
  icon text,
  thumbnail text,
  hero_image text,
  cta_label text DEFAULT 'Request a demo',
  cta_href text DEFAULT '/contact',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
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

CREATE TABLE IF NOT EXISTS public.cms_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text,
  title text NOT NULL, -- Client/Person name
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text, -- Role / Company designation (e.g. Director, Meridian Polymers)
  body text NOT NULL, -- Quote text
  author text, -- Full client name
  author_role text, -- Title & Organization
  category text, -- Division / Practice (financial, it, legal, engineering)
  thumbnail text, -- Avatar / Client photo
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text,
  title text NOT NULL, -- Full name
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text, -- Role title (e.g. Practice Lead, Financial Advisory)
  body text, -- Bio / background
  department text, -- Practice division (Financial, IT, Legal, Engineering)
  thumbnail text, -- Photo URL
  email text,
  phone text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS cms_products_status_idx ON public.cms_products (status);
CREATE INDEX IF NOT EXISTS cms_products_slug_idx ON public.cms_products (slug);
CREATE INDEX IF NOT EXISTS cms_testimonials_status_idx ON public.cms_testimonials (status);
CREATE INDEX IF NOT EXISTS cms_team_members_status_idx ON public.cms_team_members (status);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_cms_products_updated_at ON public.cms_products;
CREATE TRIGGER update_cms_products_updated_at
  BEFORE UPDATE ON public.cms_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cms_testimonials_updated_at ON public.cms_testimonials;
CREATE TRIGGER update_cms_testimonials_updated_at
  BEFORE UPDATE ON public.cms_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cms_team_members_updated_at ON public.cms_team_members;
CREATE TRIGGER update_cms_team_members_updated_at
  BEFORE UPDATE ON public.cms_team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Enablement
ALTER TABLE public.cms_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_team_members ENABLE ROW LEVEL SECURITY;

-- Products RLS Policies
CREATE POLICY "anyone reads published products" ON public.cms_products
  FOR SELECT USING (status = 'published' OR (auth.role() = 'authenticated' AND public.is_team(auth.uid())));

CREATE POLICY "editors insert products" ON public.cms_products
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "editors update products" ON public.cms_products
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "editors delete products" ON public.cms_products
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- Testimonials RLS Policies
CREATE POLICY "anyone reads published testimonials" ON public.cms_testimonials
  FOR SELECT USING (status = 'published' OR (auth.role() = 'authenticated' AND public.is_team(auth.uid())));

CREATE POLICY "editors insert testimonials" ON public.cms_testimonials
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "editors update testimonials" ON public.cms_testimonials
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "editors delete testimonials" ON public.cms_testimonials
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- Team Members RLS Policies
CREATE POLICY "anyone reads published team members" ON public.cms_team_members
  FOR SELECT USING (status = 'published' OR (auth.role() = 'authenticated' AND public.is_team(auth.uid())));

CREATE POLICY "editors insert team members" ON public.cms_team_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "editors update team members" ON public.cms_team_members
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "editors delete team members" ON public.cms_team_members
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
