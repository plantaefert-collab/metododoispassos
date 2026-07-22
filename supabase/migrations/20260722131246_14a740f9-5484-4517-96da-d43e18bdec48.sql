DO $$ 
BEGIN
  -- Identifica o OID da função has_role
  -- Revoga EXECUTE de todos para limpar o estado
  EXECUTE 'REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon, authenticated';
  
  -- Garante EXECUTE apenas para service_role
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role';
END $$;