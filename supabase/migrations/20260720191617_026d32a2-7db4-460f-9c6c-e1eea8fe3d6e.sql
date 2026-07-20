-- 1. Alterar o default de completed_tasks para objeto se necessário
ALTER TABLE public.protocol_progress 
ALTER COLUMN completed_tasks SET DEFAULT '{}'::jsonb;

-- 2. Garantir que a tabela profiles existe e tem a estrutura mínima
-- (Assumindo que já existe conforme conversas anteriores, mas garantindo campos)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plant_name TEXT DEFAULT 'Minha Orquídea';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;

-- 3. Função para gerenciar novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, full_name, plant_name, onboarded)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'Minha Orquídea',
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- Criar progresso inicial
  INSERT INTO public.protocol_progress (
    user_id, 
    current_day, 
    completed_tasks, 
    applications, 
    photos, 
    diagnosis_answers, 
    diagnosis_result, 
    diagnosis_status, 
    answers_version
  )
  VALUES (
    new.id,
    1,
    '{}'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    NULL,
    'none',
    0
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- 4. Trigger de criação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill para usuários órfãos (idempotente)
DO $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id, raw_user_meta_data FROM auth.users LOOP
        -- Tenta inserir perfil se não existir
        INSERT INTO public.profiles (id, full_name, plant_name, onboarded)
        VALUES (
          user_rec.id,
          COALESCE(user_rec.raw_user_meta_data->>'full_name', user_rec.raw_user_meta_data->>'name'),
          'Minha Orquídea',
          false
        )
        ON CONFLICT (id) DO NOTHING;

        -- Tenta inserir progresso se não existir
        INSERT INTO public.protocol_progress (user_id)
        VALUES (user_rec.id)
        ON CONFLICT (user_id) DO NOTHING;
    END LOOP;
END;
$$;

-- 6. Garantir grants
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.protocol_progress TO authenticated;
GRANT ALL ON public.protocol_progress TO service_role;
