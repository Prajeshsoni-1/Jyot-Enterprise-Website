-- =============================================================================
-- JYOT ENTERPRISE — COMPLETE ADMIN NOTIFICATION SYSTEM MIGRATION
-- =============================================================================
-- Project: https://supabase.com/dashboard/project/xmveofqeunsqzyxhakyj/sql/new
-- Instructions: Run this entire SQL script in your Supabase SQL Editor.
-- =============================================================================

-- 1. CREATE ADMIN NOTIFICATIONS TABLE -----------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('booking', 'job_application', 'enquiry', 'new_enquiry', 'request')),
  title text NOT NULL,
  message text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('booking', 'job_application', 'lead')),
  entity_id text,
  entity_reference text,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Ensure full replica identity so updates and deletes broadcast complete row states
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;

-- 2. CREATE INDEXES FOR FAST QUERYING -----------------------------------------
CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient
  ON public.admin_notifications (recipient_user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type
  ON public.admin_notifications (type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_entity
  ON public.admin_notifications (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created
  ON public.admin_notifications (created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) ------------------------------------------
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.admin_notifications TO service_role;
GRANT SELECT, UPDATE, INSERT, DELETE ON public.admin_notifications TO authenticated;

-- Policy A: SELECT - Authenticated team members can read their assigned notifications or broadcast notifications
DROP POLICY IF EXISTS "team_can_select_notifications" ON public.admin_notifications;
CREATE POLICY "team_can_select_notifications" ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR (
      recipient_user_id IS NULL
      AND (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
        )
        OR public.is_team(auth.uid())
      )
    )
  );

-- Policy B: UPDATE - Team members can mark notifications as read
DROP POLICY IF EXISTS "team_can_update_notifications" ON public.admin_notifications;
CREATE POLICY "team_can_update_notifications" ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR (
      recipient_user_id IS NULL
      AND (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
        )
        OR public.is_team(auth.uid())
      )
    )
  )
  WITH CHECK (
    recipient_user_id = auth.uid()
    OR recipient_user_id IS NULL
  );

-- Policy C: DELETE - Team members can delete their notifications
DROP POLICY IF EXISTS "team_can_delete_notifications" ON public.admin_notifications;
CREATE POLICY "team_can_delete_notifications" ON public.admin_notifications
  FOR DELETE
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR (
      recipient_user_id IS NULL
      AND (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
        )
        OR public.is_team(auth.uid())
      )
    )
  );

-- Policy D: INSERT - Service role or authenticated team members can insert
DROP POLICY IF EXISTS "team_can_insert_notifications" ON public.admin_notifications;
CREATE POLICY "team_can_insert_notifications" ON public.admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
    )
    OR public.is_team(auth.uid())
  );

-- 4. ENABLE REALTIME PUBLICATION ----------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'admin_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 5. AUTOMATIC DATABASE TRIGGERS FOR LEADS (ENQUIRIES & APPLICATIONS) ---------
CREATE OR REPLACE FUNCTION public.trg_notify_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title text;
  v_message text;
  v_type text;
  v_entity_type text := 'lead';
  v_service text;
BEGIN
  IF NEW.source = 'careers' THEN
    v_type := 'job_application';
    v_entity_type := 'job_application';
    v_title := 'New Job Application';
    v_message := COALESCE(NEW.name, 'Candidate') || ' applied for ' || COALESCE(NEW.service, 'Open Role') || '.';
  ELSE
    v_type := 'enquiry';
    v_title := 'New Enquiry';
    v_service := COALESCE(NEW.service, CASE WHEN NEW.division IS NOT NULL THEN upper(NEW.division) || ' Services' ELSE 'General Enquiry' END);
    v_message := 'A new enquiry has been received from ' || COALESCE(NEW.name, 'a prospective client') || ' for ' || v_service || '.';
  END IF;

  -- Insert broadcast notification for all team members (recipient_user_id IS NULL)
  -- Deduplicate within 1 minute
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_notifications
    WHERE entity_type = v_entity_type
      AND (entity_id = NEW.id::text OR entity_reference = NEW.reference)
      AND created_at > now() - interval '1 minute'
  ) THEN
    INSERT INTO public.admin_notifications (
      recipient_user_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      entity_reference,
      data,
      is_read,
      created_at
    ) VALUES (
      NULL,
      v_type,
      v_title,
      v_message,
      v_entity_type,
      NEW.id::text,
      NEW.reference,
      jsonb_build_object(
        'name', NEW.name,
        'email', NEW.email,
        'phone', NEW.phone,
        'company', NEW.company,
        'division', NEW.division,
        'service', NEW.service,
        'reference', NEW.reference
      ),
      false,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_insert_notification ON public.leads;
CREATE TRIGGER trg_lead_insert_notification
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_new_lead();

-- 6. AUTOMATIC DATABASE TRIGGER FOR CONSULTANT BOOKINGS -----------------------
CREATE OR REPLACE FUNCTION public.trg_notify_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title text := 'New Consultant Booking';
  v_message text;
BEGIN
  v_message := COALESCE(NEW.name, 'Client') || ' booked a ' || COALESCE(NEW.meeting_type, 'consultation') || ' session (' || COALESCE(NEW.reference, '') || ').';

  IF NOT EXISTS (
    SELECT 1 FROM public.admin_notifications
    WHERE entity_type = 'booking'
      AND (entity_id = NEW.id::text OR entity_reference = NEW.reference)
      AND created_at > now() - interval '1 minute'
  ) THEN
    INSERT INTO public.admin_notifications (
      recipient_user_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      entity_reference,
      data,
      is_read,
      created_at
    ) VALUES (
      NULL,
      'booking',
      v_title,
      v_message,
      'booking',
      NEW.id::text,
      NEW.reference,
      jsonb_build_object(
        'name', NEW.name,
        'email', NEW.email,
        'phone', NEW.phone,
        'division', NEW.division,
        'slot_at', NEW.slot_at,
        'meeting_type', NEW.meeting_type,
        'reference', NEW.reference
      ),
      false,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_insert_notification ON public.bookings;
CREATE TRIGGER trg_booking_insert_notification
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_new_booking();

-- 7. ENSURE PUBLIC LEADS RLS ALLOWS VISITOR SUBMISSIONS -----------------------
GRANT INSERT ON public.leads TO anon, authenticated;

DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Visitors can submit leads" ON public.leads;

CREATE POLICY "Public can insert leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
