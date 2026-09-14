-- =============================================================================
-- FIX PUBLIC LEADS & STORAGE RLS POLICIES
-- =============================================================================
-- Run this in your Supabase Project -> SQL Editor -> New Query -> Run
-- This allows visitors/applicants to submit enquiries and career applications.
-- =============================================================================

-- 1. Grant INSERT permission to anon & authenticated on public.leads
GRANT INSERT ON public.leads TO anon, authenticated;

-- 2. Drop any conflicting insert policies and create open insert policy for leads
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Visitors can submit leads" ON public.leads;

CREATE POLICY "Public can insert leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. Ensure Storage Bucket exists for file uploads (resumes & consultation attachments)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-uploads', 'lead-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Allow public visitors to upload resumes/documents to lead-uploads
DROP POLICY IF EXISTS "Visitors can upload enquiry documents to known folders" ON storage.objects;
DROP POLICY IF EXISTS "Visitors can upload enquiry documents" ON storage.objects;

CREATE POLICY "Visitors can upload enquiry documents to known folders"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'lead-uploads'
  AND array_length(storage.foldername(name), 1) = 1
  AND (storage.foldername(name))[1] IN (
    'financial','it','legal','engineering','careers','consultations','customer','team','general'
  )
);
