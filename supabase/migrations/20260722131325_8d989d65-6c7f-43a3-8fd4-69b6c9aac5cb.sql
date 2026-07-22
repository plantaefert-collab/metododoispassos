-- Corrige handle_new_user que é a função SECURITY DEFINER restante no schema public
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Se o linter ainda reclamar de has_role (mesmo após DROP ou INVOKER), 
-- garantimos que ela não é mais SECURITY DEFINER.
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;