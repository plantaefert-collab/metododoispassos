-- O linter ainda detecta permissão para PUBLIC (anon) em alguma das funções SD
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon;
