-- Add language preference column to user_profiles table
-- Supported languages: en (English), es (Spanish), ko (Korean), zh-TW (Traditional Chinese)

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en'
CHECK (preferred_language IN ('en', 'es', 'ko', 'zh-TW'));

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.preferred_language IS 'User preferred language for UI and AI responses. Supported: en, es, ko, zh-TW';
