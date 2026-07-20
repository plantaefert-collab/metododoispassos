-- Migration: Adicionar campos de cadastro detalhado da planta
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plant_registered_at timestamptz,
ADD COLUMN IF NOT EXISTS plant_species text,
ADD COLUMN IF NOT EXISTS plant_unknown_species boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS plant_location text,
ADD COLUMN IF NOT EXISTS plant_pot text,
ADD COLUMN IF NOT EXISTS plant_substrate text,
ADD COLUMN IF NOT EXISTS plant_difficulty text;

-- Garantir que as permissões e RLS continuam corretas
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
