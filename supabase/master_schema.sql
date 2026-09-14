-- =============================================================================
-- JYOT ENTERPRISE SUITE — MASTER SUPABASE SQL SCHEMA
-- =============================================================================
-- Run this complete script in your Supabase Project -> SQL Editor -> New Query.
-- It creates all tables, functions, triggers, and Row Level Security policies.
-- =============================================================================

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Auth Roles & Team Membership
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_team(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

DROP POLICY IF EXISTS "Team can read roles" ON public.user_roles;
CREATE POLICY "Team can read roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-assign first authenticated user as admin if no admin exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team can read profiles" ON public.profiles;
CREATE POLICY "Team can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Leads / Enquiries
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  division text NOT NULL,
  service text,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  city text,
  message text,
  details jsonb DEFAULT '{}'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  score text,
  score_value numeric,
  estimated_value text,
  project_size text,
  department text,
  source text,
  page_url text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','won','lost','archived')),
  priority text NOT NULL DEFAULT 'Medium',
  assigned_to uuid,
  customer_id uuid,
  follow_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;

DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
CREATE POLICY "Public can insert leads" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);


DROP POLICY IF EXISTS "Team can manage leads" ON public.leads;
CREATE POLICY "Team can manage leads" ON public.leads FOR ALL TO authenticated USING (public.is_team(auth.uid()));

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  city text,
  address text,
  division text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

DROP POLICY IF EXISTS "Team can manage customers" ON public.customers;
CREATE POLICY "Team can manage customers" ON public.customers FOR ALL TO authenticated USING (public.is_team(auth.uid()));

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Follow-ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  assigned_to uuid,
  due_at timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;

DROP POLICY IF EXISTS "Team can manage follow ups" ON public.follow_ups;
CREATE POLICY "Team can manage follow ups" ON public.follow_ups FOR ALL TO authenticated USING (public.is_team(auth.uid()));

-- 7. Tasks
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date timestamptz,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;

DROP POLICY IF EXISTS "Team can manage crm tasks" ON public.crm_tasks;
CREATE POLICY "Team can manage crm tasks" ON public.crm_tasks FOR ALL TO authenticated USING (public.is_team(auth.uid()));

-- 8. Documents
CREATE TABLE IF NOT EXISTS public.crm_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  category text NOT NULL DEFAULT 'general',
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.crm_documents TO authenticated;
GRANT ALL ON public.crm_documents TO service_role;

DROP POLICY IF EXISTS "Team can manage crm documents" ON public.crm_documents;
CREATE POLICY "Team can manage crm documents" ON public.crm_documents FOR ALL TO authenticated USING (public.is_team(auth.uid()));

-- 9. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  division text NOT NULL,
  service text,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  city text,
  message text,
  meeting_type text NOT NULL DEFAULT 'video',
  slot_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 45,
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid,
  internal_notes text,
  cancel_reason text,
  rescheduled_from timestamptz,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending','confirmed','completed','cancelled','rescheduled')),
  CONSTRAINT bookings_meeting_type_check CHECK (meeting_type IN ('video','phone','office')),
  CONSTRAINT bookings_division_check CHECK (division IN ('financial','it','legal','engineering')),
  CONSTRAINT bookings_duration_check CHECK (duration_minutes BETWEEN 15 AND 240)
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT INSERT, SELECT ON public.bookings TO anon;
GRANT ALL ON public.bookings TO service_role;

DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public can check booked slots" ON public.bookings;
CREATE POLICY "Public can check booked slots" ON public.bookings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Team can manage bookings" ON public.bookings;
CREATE POLICY "Team can manage bookings" ON public.bookings FOR ALL TO authenticated USING (public.is_team(auth.uid()));

CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_unique
  ON public.bookings (slot_at)
  WHERE status IN ('pending','confirmed','rescheduled');

CREATE INDEX IF NOT EXISTS bookings_slot_at_idx ON public.bookings (slot_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings (status);
CREATE INDEX IF NOT EXISTS bookings_email_idx ON public.bookings (email);

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Job Applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_slug text NOT NULL,
  job_title text NOT NULL,
  department text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  current_company text,
  experience_years text,
  portfolio_url text,
  resume_url text,
  cover_letter text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','shortlisted','rejected','hired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.job_applications TO authenticated;
GRANT INSERT ON public.job_applications TO anon;
GRANT ALL ON public.job_applications TO service_role;

DROP POLICY IF EXISTS "Public can apply to jobs" ON public.job_applications;
CREATE POLICY "Public can apply to jobs" ON public.job_applications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Team can view job applications" ON public.job_applications;
CREATE POLICY "Team can view job applications" ON public.job_applications FOR ALL TO authenticated USING (public.is_team(auth.uid()));

-- =============================================================================
-- CMS MODULES (ALL 15 CONTENT TABLES)
-- =============================================================================

-- CMS Services
CREATE TABLE IF NOT EXISTS public.cms_services (
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

-- CMS Sub-Services
CREATE TABLE IF NOT EXISTS public.cms_sub_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  service_id uuid REFERENCES public.cms_services(id) ON DELETE SET NULL,
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

-- CMS Products / Platforms
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

-- CMS Industries
CREATE TABLE IF NOT EXISTS public.cms_industries (
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

-- CMS Projects / Portfolio
CREATE TABLE IF NOT EXISTS public.cms_projects (
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

-- CMS Case Studies
CREATE TABLE IF NOT EXISTS public.cms_case_studies (
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

-- CMS Posts / Blog
CREATE TABLE IF NOT EXISTS public.cms_posts (
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

-- CMS Resources
CREATE TABLE IF NOT EXISTS public.cms_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text,
  resource_type text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text,
  icon text,
  hero_image text,
  read_time text,
  file_url text,
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

-- CMS Testimonials
CREATE TABLE IF NOT EXISTS public.cms_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text NOT NULL,
  author text,
  author_role text,
  category text,
  thumbnail text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CMS Team Members
CREATE TABLE IF NOT EXISTS public.cms_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  summary text,
  body text,
  department text,
  thumbnail text,
  email text,
  phone text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CMS FAQs
CREATE TABLE IF NOT EXISTS public.cms_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- CMS Pages (Home, About, Contact)
CREATE TABLE IF NOT EXISTS public.cms_pages (
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

-- CMS Jobs / Careers
CREATE TABLE IF NOT EXISTS public.cms_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  position_type text CHECK (position_type IN ('job', 'internship')),
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
CREATE INDEX IF NOT EXISTS idx_cms_jobs_position_type ON public.cms_jobs(position_type);
CREATE INDEX IF NOT EXISTS idx_cms_jobs_status ON public.cms_jobs(status);
CREATE INDEX IF NOT EXISTS idx_cms_jobs_slug ON public.cms_jobs(slug);
CREATE INDEX IF NOT EXISTS idx_cms_jobs_featured ON public.cms_jobs(featured);
CREATE INDEX IF NOT EXISTS idx_cms_jobs_sort_order ON public.cms_jobs(sort_order);

-- CMS Downloads
CREATE TABLE IF NOT EXISTS public.cms_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text,
  file_path text,
  file_bucket text,
  file_url text,
  summary text,
  body text,
  thumbnail text,
  cta_label text DEFAULT 'Download',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CMS Offices / Locations
CREATE TABLE IF NOT EXISTS public.cms_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  city text,
  address text,
  maps_url text,
  embed_url text,
  latitude double precision,
  longitude double precision,
  phone text,
  email text,
  hours text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Central Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE DEFAULT 'default',
  brand jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  website jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  analytics jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CMS Audit Log
CREATE TABLE IF NOT EXISTS public.cms_audit_log (
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

-- Enable RLS across all CMS tables
ALTER TABLE public.cms_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_audit_log ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated & service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.cms_services TO anon;
GRANT SELECT ON public.cms_sub_services TO anon;
GRANT SELECT ON public.cms_products TO anon;
GRANT SELECT ON public.cms_industries TO anon;
GRANT SELECT ON public.cms_projects TO anon;
GRANT SELECT ON public.cms_case_studies TO anon;
GRANT SELECT ON public.cms_posts TO anon;
GRANT SELECT ON public.cms_resources TO anon;
GRANT SELECT ON public.cms_testimonials TO anon;
GRANT SELECT ON public.cms_team_members TO anon;
GRANT SELECT ON public.cms_faqs TO anon;
GRANT SELECT ON public.cms_pages TO anon;
GRANT SELECT ON public.cms_jobs TO anon;
GRANT SELECT ON public.cms_downloads TO anon;
GRANT SELECT ON public.cms_offices TO anon;
GRANT SELECT ON public.site_settings TO anon;

-- Apply standard public read policies for published items
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'cms_%' AND tablename <> 'cms_audit_log'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anyone reads published" ON public.%I', t);
    EXECUTE format('CREATE POLICY "anyone reads published" ON public.%I FOR SELECT USING (status = ''published'' OR (auth.role() = ''authenticated'' AND public.is_team(auth.uid())))', t);

    EXECUTE format('DROP POLICY IF EXISTS "editors manage" ON public.%I', t);
    EXECUTE format('CREATE POLICY "editors manage" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''manager'')) WITH CHECK (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''manager''))', t);
  END LOOP;
END $$;

-- Site Settings policies
DROP POLICY IF EXISTS "anyone reads site settings" ON public.site_settings;
CREATE POLICY "anyone reads site settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "editors manage site settings" ON public.site_settings;
CREATE POLICY "editors manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Audit log policies
DROP POLICY IF EXISTS "team reads audit log" ON public.cms_audit_log;
CREATE POLICY "team reads audit log" ON public.cms_audit_log FOR SELECT TO authenticated USING (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "team inserts audit log" ON public.cms_audit_log;
CREATE POLICY "team inserts audit log" ON public.cms_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));

-- =============================================================================
-- 10. STORAGE BUCKETS & STORAGE RLS POLICIES
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-uploads', 'lead-uploads', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

-- Lead uploads policies (resumes, inquiry documents)
DROP POLICY IF EXISTS "Visitors can upload enquiry documents" ON storage.objects;
DROP POLICY IF EXISTS "Visitors can upload enquiry documents to known folders" ON storage.objects;
CREATE POLICY "Visitors can upload enquiry documents to known folders"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'lead-uploads'
  AND array_length(storage.foldername(name), 1) = 1
  AND (storage.foldername(name))[1] IN (
    'financial','it','legal','engineering','careers','consultations','customer','team','general'
  )
  AND lower(storage.extension(name)) IN (
    'pdf','doc','docx','xls','xlsx','csv','txt','png','jpg','jpeg','webp','zip','dwg','dxf','ppt','pptx'
  )
);

DROP POLICY IF EXISTS "Team can read enquiry documents" ON storage.objects;
CREATE POLICY "Team can read enquiry documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lead-uploads' AND public.is_team(auth.uid()));

-- Site media policies (CMS image uploads)
DROP POLICY IF EXISTS "anyone reads site media" ON storage.objects;
CREATE POLICY "anyone reads site media" ON storage.objects FOR SELECT
  USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "editors upload site media" ON storage.objects;
CREATE POLICY "editors upload site media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-media'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  );

DROP POLICY IF EXISTS "editors update site media" ON storage.objects;
CREATE POLICY "editors update site media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (bucket_id = 'site-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

DROP POLICY IF EXISTS "editors delete site media" ON storage.objects;
CREATE POLICY "editors delete site media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

-- 25. User Granular Permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module, action)
);
GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team can view own permissions" ON public.user_permissions;
CREATE POLICY "Team can view own permissions" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage permissions" ON public.user_permissions;
CREATE POLICY "Admins manage permissions" ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 26. CMS Media Library
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

DROP POLICY IF EXISTS "Public reads cms_media" ON public.cms_media;
CREATE POLICY "Public reads cms_media" ON public.cms_media
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Team inserts cms_media" ON public.cms_media;
CREATE POLICY "Team inserts cms_media" ON public.cms_media
  FOR INSERT TO authenticated
  WITH CHECK (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Team updates cms_media" ON public.cms_media;
CREATE POLICY "Team updates cms_media" ON public.cms_media
  FOR UPDATE TO authenticated
  USING (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Team deletes cms_media" ON public.cms_media;
CREATE POLICY "Team deletes cms_media" ON public.cms_media
  FOR DELETE TO authenticated
  USING (public.is_team(auth.uid()));


