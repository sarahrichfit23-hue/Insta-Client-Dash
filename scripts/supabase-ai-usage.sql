-- =====================================================
-- AI USAGE TRACKING FOR INSTA CLIENT ENGINE
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. ADD AI USAGE COLUMNS TO COACH_PROFILES TABLE
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS ai_calls_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_calls_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS ai_calls_reset_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS ai_warning_shown_today BOOLEAN DEFAULT FALSE;

-- 2. CREATE AI_SCRIPT_LOG TABLE
CREATE TABLE IF NOT EXISTS ai_script_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Prospect info (optional - may not have prospect yet during AddForm generation)
  prospect_name TEXT,
  prospect_handle TEXT,
  
  -- Generation context
  channel INTEGER,
  generation_type TEXT NOT NULL, -- 'first_touch' | 'ai_suggestion'
  
  -- The actual output
  generated_output TEXT NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE INDEX FOR FASTER LOOKUPS
CREATE INDEX IF NOT EXISTS idx_ai_script_log_user_id ON ai_script_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_script_log_created_at ON ai_script_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_script_log_user_today ON ai_script_log(user_id, created_at);

-- 4. ROW LEVEL SECURITY (RLS) FOR AI_SCRIPT_LOG
ALTER TABLE ai_script_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own scripts
CREATE POLICY "Users can view own ai scripts"
  ON ai_script_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own scripts
CREATE POLICY "Users can insert own ai scripts"
  ON ai_script_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. GRANT PERMISSIONS
GRANT ALL ON ai_script_log TO authenticated;
GRANT ALL ON ai_script_log TO service_role;

-- =====================================================
-- HELPER FUNCTION: Check and reset daily AI usage
-- This runs on each API call to handle midnight reset
-- =====================================================
CREATE OR REPLACE FUNCTION check_and_reset_ai_usage(p_user_id UUID)
RETURNS TABLE (
  calls_today INTEGER,
  calls_limit INTEGER,
  can_call BOOLEAN,
  warning_shown BOOLEAN
) AS $$
DECLARE
  v_reset_date DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get current reset date
  SELECT ai_calls_reset_date INTO v_reset_date
  FROM coach_profiles
  WHERE user_id = p_user_id;
  
  -- If reset date is before today, reset the counter
  IF v_reset_date IS NULL OR v_reset_date < v_today THEN
    UPDATE coach_profiles
    SET ai_calls_today = 0,
        ai_calls_reset_date = v_today,
        ai_warning_shown_today = FALSE
    WHERE user_id = p_user_id;
  END IF;
  
  -- Return current usage info
  RETURN QUERY
  SELECT 
    cp.ai_calls_today,
    cp.ai_calls_limit,
    (cp.ai_calls_today < cp.ai_calls_limit) AS can_call,
    cp.ai_warning_shown_today
  FROM coach_profiles cp
  WHERE cp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Increment AI usage after successful call
-- =====================================================
CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID)
RETURNS TABLE (
  new_count INTEGER,
  limit_val INTEGER,
  show_warning BOOLEAN
) AS $$
DECLARE
  v_new_count INTEGER;
  v_limit INTEGER;
  v_warning_threshold INTEGER;
  v_warning_shown BOOLEAN;
BEGIN
  -- Increment the counter
  UPDATE coach_profiles
  SET ai_calls_today = ai_calls_today + 1
  WHERE user_id = p_user_id
  RETURNING ai_calls_today, ai_calls_limit, ai_warning_shown_today
  INTO v_new_count, v_limit, v_warning_shown;
  
  -- Calculate warning threshold (75%)
  v_warning_threshold := CEIL(v_limit * 0.75);
  
  -- Check if we should show warning (just crossed 75% and haven't shown it yet)
  IF v_new_count >= v_warning_threshold AND NOT v_warning_shown THEN
    UPDATE coach_profiles
    SET ai_warning_shown_today = TRUE
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT v_new_count, v_limit, TRUE;
  ELSE
    RETURN QUERY SELECT v_new_count, v_limit, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- SELECT * FROM coach_profiles LIMIT 5;
-- SELECT * FROM ai_script_log ORDER BY created_at DESC LIMIT 10;
