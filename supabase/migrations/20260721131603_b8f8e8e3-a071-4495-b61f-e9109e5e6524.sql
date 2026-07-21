CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, plant_name, onboarded)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    'Minha Orquídea',
    false
  )
  ON CONFLICT (id) DO NOTHING;

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
    NEW.id,
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

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

INSERT INTO public.profiles (id, full_name, plant_name, onboarded)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  'Minha Orquídea',
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

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
SELECT
  u.id,
  1,
  '{}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb,
  NULL,
  'none',
  0
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.protocol_progress pp WHERE pp.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;