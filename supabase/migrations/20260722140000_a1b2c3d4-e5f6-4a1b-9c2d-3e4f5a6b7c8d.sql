-- Storage para as fotos das orquídeas.
-- Bucket público de leitura (as fotos não são sensíveis); escrita restrita à
-- pasta do próprio usuário (prefixo do caminho = auth.uid()).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plant-photos',
  'plant-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/webp', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública (coerente com bucket público)
DROP POLICY IF EXISTS "plant-photos leitura publica" ON storage.objects;
CREATE POLICY "plant-photos leitura publica"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-photos');

-- Upload apenas na própria pasta
DROP POLICY IF EXISTS "plant-photos upload proprio" ON storage.objects;
CREATE POLICY "plant-photos upload proprio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'plant-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Atualização apenas na própria pasta
DROP POLICY IF EXISTS "plant-photos update proprio" ON storage.objects;
CREATE POLICY "plant-photos update proprio"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'plant-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Remoção apenas na própria pasta
DROP POLICY IF EXISTS "plant-photos delete proprio" ON storage.objects;
CREATE POLICY "plant-photos delete proprio"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'plant-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
