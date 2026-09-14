-- =============================================================================
-- FIX TASKS & DOCUMENTS TABLES SCHEMA & PERMISSIONS
-- =============================================================================
-- Run this in your Supabase Project -> SQL Editor -> New Query -> Run
-- Project: https://supabase.com/dashboard/project/xmveofqeunsqzyxhakyj
-- =============================================================================

-- 1. INTERNAL TASKS TABLE ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  assigned_to uuid,
  due_at timestamptz,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_status_check CHECK (status IN ('open','completed','cancelled')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('High','Medium','Low'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team can read tasks" ON public.tasks;
CREATE POLICY "Team can read tasks" ON public.tasks
  FOR SELECT TO authenticated USING (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Team can create tasks" ON public.tasks;
CREATE POLICY "Team can create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Team can update tasks" ON public.tasks;
CREATE POLICY "Team can update tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Team can delete tasks" ON public.tasks;
CREATE POLICY "Team can delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (public.is_team(auth.uid()));

CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status);
CREATE INDEX IF NOT EXISTS tasks_due_idx ON public.tasks (due_at);
CREATE INDEX IF NOT EXISTS tasks_lead_idx ON public.tasks (lead_id);
CREATE INDEX IF NOT EXISTS tasks_customer_idx ON public.tasks (customer_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_idx ON public.tasks (assigned_to);

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. DOCUMENT REVIEWS TABLE --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  path text NOT NULL UNIQUE,
  name text NOT NULL,
  mime_type text,
  size_bytes bigint DEFAULT 0,
  uploaded_by uuid,
  uploaded_by_label text,
  status text NOT NULL DEFAULT 'uploaded',
  rejection_reason text,
  replaces_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documents_status_check CHECK (status IN ('uploaded','under_review','approved','rejected')),
  CONSTRAINT documents_subject_check CHECK (lead_id IS NOT NULL OR customer_id IS NOT NULL)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team can read documents" ON public.documents;
CREATE POLICY "Team can read documents" ON public.documents
  FOR SELECT TO authenticated USING (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Team can create documents" ON public.documents;
CREATE POLICY "Team can create documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Team can update documents" ON public.documents;
CREATE POLICY "Team can update documents" ON public.documents
  FOR UPDATE TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));

DROP POLICY IF EXISTS "Team can delete documents" ON public.documents;
CREATE POLICY "Team can delete documents" ON public.documents
  FOR DELETE TO authenticated USING (public.is_team(auth.uid()));

CREATE INDEX IF NOT EXISTS documents_status_idx ON public.documents (status);
CREATE INDEX IF NOT EXISTS documents_lead_idx ON public.documents (lead_id);
CREATE INDEX IF NOT EXISTS documents_customer_idx ON public.documents (customer_id);

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
