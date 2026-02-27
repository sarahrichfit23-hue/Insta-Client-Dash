-- =====================================================
-- COACH PROFILES TABLE FOR ONBOARDING WIZARD
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. CREATE THE COACH_PROFILES TABLE
CREATE TABLE IF NOT EXISTS coach_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Step 1: Niche
  niche_who TEXT,
  niche_problem TEXT,
  niche_result TEXT,
  
  -- Step 2: Lead Magnet
  lead_magnet_name TEXT,
  lead_magnet_description TEXT,
  lead_magnet_delivery TEXT, -- 'dm' | 'link_in_bio' | 'email_optin' | 'none'
  
  -- Step 3: Core Offer
  offer_name TEXT,
  offer_description TEXT,
  offer_price TEXT,
  offer_sales_method TEXT, -- 'discovery_call' | 'direct_dm' | 'application' | 'sales_page'
  
  -- Step 4: Story
  coach_story TEXT,
  coach_result_example TEXT,
  
  -- Wizard completion flag
  wizard_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one profile per user
  UNIQUE(user_id)
);

-- 2. CREATE INDEX FOR FASTER LOOKUPS
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_wizard_completed ON coach_profiles(wizard_completed);

-- 3. CREATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_coach_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS coach_profiles_updated_at ON coach_profiles;
CREATE TRIGGER coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_profiles_updated_at();

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own coach profile"
  ON coach_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own coach profile"
  ON coach_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own coach profile"
  ON coach_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own coach profile"
  ON coach_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. GRANT PERMISSIONS
GRANT ALL ON coach_profiles TO authenticated;
GRANT ALL ON coach_profiles TO service_role;

-- =====================================================
-- VERIFICATION: Run these to check setup
-- =====================================================
-- SELECT * FROM coach_profiles LIMIT 5;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'coach_profiles';
