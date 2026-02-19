-- Fix infinite recursion in profiles RLS policies
-- The issue: a policy on "profiles" queries "profiles" itself, causing an infinite loop.

-- Step 1: Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
DROP POLICY IF EXISTS "Enable write access for users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Step 2: Create a security definer function to check admin status
-- This function bypasses RLS, breaking the recursion cycle
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = check_user_id AND role = 'admin'
  );
$$;

-- Step 3: Recreate policies without recursion
-- Allow all authenticated users to read their OWN profile (no recursion - just matches on auth.uid())
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to view ALL profiles (uses the security definer function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Allow inserts for authenticated users (for initial profile creation)
CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
