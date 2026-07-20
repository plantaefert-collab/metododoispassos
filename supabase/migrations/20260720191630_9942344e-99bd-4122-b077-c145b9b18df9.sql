-- 1. Restringir execução da função apenas ao postgres/service_role
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 2. Backfill forçado para garantir que não há perfis/progresso órfãos antes da migração do código
DO $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id, raw_user_meta_data FROM auth.users LOOP
        -- Perfil
        INSERT INTO public.profiles (id, full_name, plant_name, onboarded)
        VALUES (
          user_rec.id,
          COALESCE(user_rec.raw_user_meta_data->>'full_name', user_rec.raw_user_meta_data->>'name', 'Usuário'),
          'Minha Orquídea',
          false
        )
        ON CONFLICT (id) DO NOTHING;

        -- Progresso
        INSERT INTO public.protocol_progress (user_id)
        VALUES (user_rec.id)
        ON CONFLICT (user_id) DO NOTHING;
    END LOOP;
END;
$$;
