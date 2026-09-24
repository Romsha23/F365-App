-- Remove columns that shouldn't be in profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS unique_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
