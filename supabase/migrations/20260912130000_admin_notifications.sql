-- ==============================================================================
-- Migration: 20260912130000_admin_notifications.sql
-- Description: Real-time Admin Notification System for Jyot Enterprise Suite
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('booking', 'job_application', 'enquiry', 'request')),
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient
  ON public.admin_notifications (recipient_user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type
  ON public.admin_notifications (type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_entity
  ON public.admin_notifications (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created
  ON public.admin_notifications (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- 1. SELECT policy: Team members can read their own notifications or broadcasts
DROP POLICY IF EXISTS "team_can_select_notifications" ON public.admin_notifications;
CREATE POLICY "team_can_select_notifications" ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR (
      recipient_user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
      )
    )
  );

-- 2. UPDATE policy: Team members can update (mark as read) their notifications
DROP POLICY IF EXISTS "team_can_update_notifications" ON public.admin_notifications;
CREATE POLICY "team_can_update_notifications" ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
    OR (
      recipient_user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    recipient_user_id = auth.uid()
    OR recipient_user_id IS NULL
  );

-- 3. DELETE policy: Team members can delete their own notifications
DROP POLICY IF EXISTS "team_can_delete_notifications" ON public.admin_notifications;
CREATE POLICY "team_can_delete_notifications" ON public.admin_notifications
  FOR DELETE
  TO authenticated
  USING (
    recipient_user_id = auth.uid()
  );

-- 4. INSERT policy: Service role and authenticated team members can insert
DROP POLICY IF EXISTS "team_can_insert_notifications" ON public.admin_notifications;
CREATE POLICY "team_can_insert_notifications" ON public.admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
    )
  );

-- Enable Supabase Realtime for admin_notifications
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
