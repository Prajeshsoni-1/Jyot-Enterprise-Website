DROP POLICY IF EXISTS "public reads media" ON public.cms_media;
CREATE POLICY "team reads media" ON public.cms_media FOR SELECT TO authenticated
  USING (public.is_team(auth.uid()));
REVOKE SELECT ON public.cms_media FROM anon;