ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
