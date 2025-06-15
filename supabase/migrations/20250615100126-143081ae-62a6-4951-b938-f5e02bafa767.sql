
-- 1. Add a username_changes column to profiles (default 0 for new, set to 0 during backfill)
ALTER TABLE public.profiles ADD COLUMN username_changes INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill any missing profiles for users already in auth.users
INSERT INTO public.profiles (id, username, name, created_at, updated_at, username_changes)
SELECT
  u.id,
  'user_' || substring(u.id::text, 1, 8) as username,
  NULL as name,
  now(),
  now(),
  0
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 3. Ensure username is unique (already in table, re-adding for safety)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles(username);

-- 4. Update RLS policies to allow users to update their own username_changes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

