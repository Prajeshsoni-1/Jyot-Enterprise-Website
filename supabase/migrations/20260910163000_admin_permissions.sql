-- =============================================================================
-- JYOT ENTERPRISE — GRANULAR PERMISSION & ROLE MANAGEMENT MIGRATION
-- =============================================================================

-- 1. Attempt adding 'owner' to app_role enum if supported
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

-- 2. Create user_permissions table for persistent granular permission overrides
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

-- 3. Grants & RLS
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

-- 4. Fast helper function for permission checking in RLS
CREATE OR REPLACE FUNCTION public.check_user_permission(_user_id uuid, _module text, _action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- If user is admin/owner, full access
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN true
    -- Explicitly granted override
    WHEN EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND module = _module AND action = _action AND granted = true) THEN true
    -- Explicitly revoked override
    WHEN EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND module = _module AND action = _action AND granted = false) THEN false
    ELSE false
  END;
$$;
