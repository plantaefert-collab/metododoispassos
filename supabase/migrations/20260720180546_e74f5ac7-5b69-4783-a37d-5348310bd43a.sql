-- Refinar permissões para as funções SECURITY DEFINER para satisfazer o linter
-- O linter reclama se authenticated tiver permissão de EXECUTE em SECURITY DEFINER se não for estritamente necessário via API direta.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO service_role;
