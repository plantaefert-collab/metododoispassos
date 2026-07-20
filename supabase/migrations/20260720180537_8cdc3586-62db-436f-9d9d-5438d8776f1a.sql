-- 1. Corrigir permissões das funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO service_role;

-- 2. Garantir search_path em todas as funções
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 3. Adicionar política para user_roles (evitar o erro RLS Enabled No Policy)
CREATE POLICY "Admins podem ver todos os papéis" 
ON public.user_roles FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem ver seu próprio papel" 
ON public.user_roles FOR SELECT TO authenticated 
USING (auth.uid() = user_id);
