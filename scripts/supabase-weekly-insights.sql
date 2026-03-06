-- =====================================================
-- WEEKLY INSIGHTS TABLE FOR PERFORMANCE HISTORY
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. CREATE WEEKLY_INSIGHTS TABLE
CREATE TABLE IF NOT EXISTS weekly_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  insight_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One insight per user per week
  UNIQUE(user_id, week_start_date)
);

-- 2. CREATE INDEX FOR FASTER LOOKUPS
CREATE INDEX IF NOT EXISTS idx_weekly_insights_user_week ON weekly_insights(user_id, week_start_date DESC);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own insights
CREATE POLICY "Users can view own weekly insights"
  ON weekly_insights
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own insights
CREATE POLICY "Users can insert own weekly insights"
  ON weekly_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own insights
CREATE POLICY "Users can update own weekly insights"
  ON weekly_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. GRANT PERMISSIONS
GRANT ALL ON weekly_insights TO authenticated;
GRANT ALL ON weekly_insights TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- SELECT * FROM weekly_insights ORDER BY created_at DESC LIMIT 10;
