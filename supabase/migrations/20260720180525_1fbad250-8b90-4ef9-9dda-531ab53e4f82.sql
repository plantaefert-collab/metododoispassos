-- 1. Enum para papéis de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Tabela de Perfis (Profiles)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    plant_name TEXT DEFAULT 'Minha Orquídea',
    onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil" 
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. Tabela de Progresso do Protocolo (Protocol Progress)
CREATE TABLE public.protocol_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_day INTEGER DEFAULT 1 NOT NULL,
    completed_tasks JSONB DEFAULT '[]'::jsonb NOT NULL,
    applications JSONB DEFAULT '[]'::jsonb NOT NULL,
    photos JSONB DEFAULT '[]'::jsonb NOT NULL,
    diagnosis_result JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocol_progress TO authenticated;
GRANT ALL ON public.protocol_progress TO service_role;

ALTER TABLE public.protocol_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio progresso" 
ON public.protocol_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar seu próprio progresso" 
ON public.protocol_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Tabela de Papéis de Usuário (User Roles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Função de verificação de papel (Security Definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_protocol_updated BEFORE UPDATE ON public.protocol_progress
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
