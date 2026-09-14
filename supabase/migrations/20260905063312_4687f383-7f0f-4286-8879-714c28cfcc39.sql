-- 1. Customers -------------------------------------------------------------
CREATE TABLE public.customers (
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can read customers" ON public.customers
  FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "Team can create customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team can update customers" ON public.customers
  FOR UPDATE TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));

CREATE UNIQUE INDEX customers_email_unique ON public.customers (lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE INDEX customers_created_at_idx ON public.customers (created_at DESC);
CREATE INDEX customers_status_idx ON public.customers (status);
CREATE INDEX customers_name_idx ON public.customers (lower(name));

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link existing leads to a customer (lead is always preserved)
ALTER TABLE public.leads ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
CREATE INDEX leads_customer_id_idx ON public.leads (customer_id);

-- 2. Follow-ups -------------------------------------------------------------
CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  assigned_to uuid,
  due_at timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follow_ups_status_check CHECK (status IN ('pending','completed','cancelled')),
  CONSTRAINT follow_ups_subject_check CHECK (lead_id IS NOT NULL OR customer_id IS NOT NULL)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can read follow ups" ON public.follow_ups
  FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "Team can create follow ups" ON public.follow_ups
  FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team can update follow ups" ON public.follow_ups
  FOR UPDATE TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));

CREATE INDEX follow_ups_due_idx ON public.follow_ups (due_at);
CREATE INDEX follow_ups_status_idx ON public.follow_ups (status);
CREATE INDEX follow_ups_lead_idx ON public.follow_ups (lead_id);
CREATE INDEX follow_ups_customer_idx ON public.follow_ups (customer_id);
CREATE INDEX follow_ups_assigned_idx ON public.follow_ups (assigned_to);

CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Internal tasks ---------------------------------------------------------
CREATE TABLE public.tasks (
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

CREATE POLICY "Team can read tasks" ON public.tasks
  FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "Team can create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team can update tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));

CREATE INDEX tasks_status_idx ON public.tasks (status);
CREATE INDEX tasks_due_idx ON public.tasks (due_at);
CREATE INDEX tasks_lead_idx ON public.tasks (lead_id);
CREATE INDEX tasks_customer_idx ON public.tasks (customer_id);
CREATE INDEX tasks_assigned_idx ON public.tasks (assigned_to);

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Document review workflow (extends existing private lead-uploads bucket) --
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  path text NOT NULL UNIQUE,
  name text NOT NULL,
  mime_type text,
  size_bytes bigint,
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

CREATE POLICY "Team can read documents" ON public.documents
  FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "Team can create documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()));
CREATE POLICY "Team can update documents" ON public.documents
  FOR UPDATE TO authenticated USING (public.is_team(auth.uid())) WITH CHECK (public.is_team(auth.uid()));

CREATE INDEX documents_status_idx ON public.documents (status);
CREATE INDEX documents_lead_idx ON public.documents (lead_id);
CREATE INDEX documents_customer_idx ON public.documents (customer_id);

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Extend the EXISTING activity/history system (no second system) ---------
ALTER TABLE public.lead_activity ALTER COLUMN lead_id DROP NOT NULL;
ALTER TABLE public.lead_activity ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE;
CREATE INDEX lead_activity_customer_idx ON public.lead_activity (customer_id);

CREATE POLICY "Team can write activity" ON public.lead_activity
  FOR INSERT TO authenticated WITH CHECK (public.is_team(auth.uid()) AND actor_id = auth.uid());