REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_team(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_team(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.log_lead_change() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM anon;