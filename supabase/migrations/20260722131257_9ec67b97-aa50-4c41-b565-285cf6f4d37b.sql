-- Cria uma nova versão da função em um schema interno
CREATE SCHEMA IF NOT EXISTS internal;

CREATE OR REPLACE FUNCTION internal.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Remove a função antiga do schema public
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Nota: Políticas de RLS que usavam public.has_role precisarão ser atualizadas 
-- para usar internal.has_role se existirem. 
-- Baseado no arquivo de tipos, a função está listada em public.Functions.