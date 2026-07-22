-- Remove SECURITY DEFINER de handle_new_user se possível, ou restringe EXECUTE totalmente
-- triggers normalmente rodam como o dono, então revogar EXECUTE de public/anon/authenticated é o correto.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Se o linter ainda persistir, tentaremos trocar para INVOKER (mas cuidado com permissões em triggers)
-- ALTER FUNCTION public.handle_new_user() SECURITY INVOKER; 
-- ^ Isso pode quebrar o trigger se ele precisar criar perfis para novos usuários (tabela profiles).
-- Manteremos SECURITY DEFINER mas com permissões restritas.