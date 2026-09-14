ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (status = ANY (ARRAY['new'::text,'assigned'::text,'contacted'::text,'qualified'::text,'follow_up'::text,'proposal'::text,'won'::text,'lost'::text,'archived'::text]));
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON public.leads (assigned_to);
CREATE INDEX IF NOT EXISTS leads_follow_up_at_idx ON public.leads (follow_up_at);