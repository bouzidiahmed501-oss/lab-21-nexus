CREATE POLICY "No direct legacy password access"
ON public.legacy_password_md5
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

REVOKE ALL ON FUNCTION public.convert_devis_to_bc(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_devis_to_bc(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_client_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_client_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.next_numero(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_numero(text) TO authenticated, service_role;