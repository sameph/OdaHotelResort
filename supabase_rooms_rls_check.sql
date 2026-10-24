-- Run this in the Supabase SQL editor to verify RLS policies on the rooms table.
-- If the delete policy is missing, run the FIX section below.

-- 1. Check if RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'rooms';

-- 2. List all policies on the rooms table
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'rooms';

-- ============================================================
-- FIX: If "Authenticated users manage rooms" policy is missing,
-- or if DELETE is not covered, run the following:
-- ============================================================

-- Drop and recreate (safe – uses IF NOT EXISTS / OR REPLACE pattern)
DO $$
BEGIN
  -- Ensure RLS is enabled
  ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

  -- Drop old policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Anyone can view available room types" ON public.rooms;
  DROP POLICY IF EXISTS "Authenticated users manage rooms" ON public.rooms;

  -- Recreate correct policies
  CREATE POLICY "Anyone can view available room types"
    ON public.rooms FOR SELECT USING (true);

  CREATE POLICY "Authenticated users manage rooms"
    ON public.rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

  RAISE NOTICE 'RLS policies for rooms table recreated successfully.';
END $$;

