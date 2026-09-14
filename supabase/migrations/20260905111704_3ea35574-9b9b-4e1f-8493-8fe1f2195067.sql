CREATE POLICY "team reads site media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'site-media' AND public.is_team(auth.uid()));

CREATE POLICY "editors upload site media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-media'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
    AND lower(right(name, 5)) IN ('.jpeg','.webp')
      OR (
        bucket_id = 'site-media'
        AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
        AND lower(right(name, 4)) IN ('.jpg','.png','.svg','.gif')
      )
  );

CREATE POLICY "editors update site media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (bucket_id = 'site-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

CREATE POLICY "editors delete site media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));