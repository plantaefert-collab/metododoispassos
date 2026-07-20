ALTER TABLE public.protocol_progress
ADD COLUMN IF NOT EXISTS diagnosis_answers JSONB DEFAULT '{}'::jsonb NOT NULL,
ADD COLUMN IF NOT EXISTS diagnosis_status TEXT DEFAULT 'none' NOT NULL CHECK (diagnosis_status IN ('none', 'fresh', 'outdated')),
ADD COLUMN IF NOT EXISTS answers_version INTEGER DEFAULT 0 NOT NULL CHECK (answers_version >= 0);