DROP POLICY IF EXISTS "Anyone can upload enquiry documents" ON storage.objects;

CREATE POLICY "Visitors can upload enquiry documents to known folders"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'lead-uploads'
  AND array_length(storage.foldername(name), 1) = 1
  AND (storage.foldername(name))[1] IN (
    'financial','it','legal','engineering','careers','consultations','customer','team','general'
  )
  AND name ~ '^[a-z0-9-]+/[0-9]{10,}-[a-z0-9]{4,10}-[A-Za-z0-9._-]{1,140}$'
  AND lower(storage.extension(name)) IN (
    'pdf','doc','docx','xls','xlsx','csv','txt','png','jpg','jpeg','webp','zip','dwg','dxf','ppt','pptx'
  )
);

CREATE POLICY "Team can read enquiry documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lead-uploads' AND public.is_team(auth.uid()));