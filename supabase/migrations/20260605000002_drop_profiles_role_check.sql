-- Drop the hardcoded role check constraint from the profiles table
-- to allow dynamic roles from the roles table.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    RAISE NOTICE 'Dropped profiles_role_check constraint';
  END IF;
END $$;
