-- Migration: 20260914150000_financial_showcase_and_lenders.sql
-- Description: Create cms_lenders table for CMS-managed financial institution partnerships

CREATE TABLE IF NOT EXISTS public.cms_lenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Bank',
  logo_url text,
  alt_text text,
  website_url text,
  supported_loans text[] DEFAULT '{}',
  display_text text,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cms_lenders ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS cms_lenders_sort_idx ON public.cms_lenders (sort_order ASC, name ASC);
CREATE INDEX IF NOT EXISTS cms_lenders_active_idx ON public.cms_lenders (is_active, is_featured);

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cms_lenders' AND policyname = 'Public can view active lenders'
  ) THEN
    CREATE POLICY "Public can view active lenders"
      ON public.cms_lenders
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cms_lenders' AND policyname = 'Authenticated staff can manage lenders'
  ) THEN
    CREATE POLICY "Authenticated staff can manage lenders"
      ON public.cms_lenders
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
