-- Add minimal app columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS life_stage TEXT;

-- Make encrypted_username and encrypted_email nullable (frontend upserts don't provide these)
ALTER TABLE public.profiles ALTER COLUMN encrypted_username DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN encrypted_email DROP NOT NULL;

-- RLS: users can read/update their own profile (id = auth.uid())
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS: users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
