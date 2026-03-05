-- =============================================================
-- PROSPECT DRAWER FEATURE - Database Setup
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. CREATE PROSPECT_NOTES TABLE
-- Note: prospect_id uses BIGINT to match the existing prospects.id column type
CREATE TABLE IF NOT EXISTS prospect_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id BIGINT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'conversation' CHECK (note_type IN ('conversation', 'observation', 'ai_generated', 'channel_move', 'system')),
  channel_at_time INTEGER, -- Store which channel they were in when note was created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE PROSPECT_INTEL TABLE
-- Note: prospect_id uses BIGINT to match the existing prospects.id column type
CREATE TABLE IF NOT EXISTS prospect_intel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id BIGINT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  where_found TEXT,
  bio_notes TEXT,
  content_themes TEXT,
  pain_signals TEXT,
  fit_score INTEGER CHECK (fit_score >= 1 AND fit_score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. UPDATE PROSPECTS TABLE - Add new columns if they don't exist
ALTER TABLE prospects 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'archived')),
  ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_prospect_notes_prospect_id ON prospect_notes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_notes_user_id ON prospect_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_notes_type ON prospect_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_prospect_intel_prospect_id ON prospect_intel(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);

-- 5. ROW LEVEL SECURITY FOR PROSPECT_NOTES
ALTER TABLE prospect_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prospect notes" ON prospect_notes;
CREATE POLICY "Users can view own prospect notes" ON prospect_notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prospect notes" ON prospect_notes;
CREATE POLICY "Users can insert own prospect notes" ON prospect_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prospect notes" ON prospect_notes;
CREATE POLICY "Users can update own prospect notes" ON prospect_notes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prospect notes" ON prospect_notes;
CREATE POLICY "Users can delete own prospect notes" ON prospect_notes
  FOR DELETE USING (auth.uid() = user_id);

-- 6. ROW LEVEL SECURITY FOR PROSPECT_INTEL
ALTER TABLE prospect_intel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prospect intel" ON prospect_intel;
CREATE POLICY "Users can view own prospect intel" ON prospect_intel
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prospect intel" ON prospect_intel;
CREATE POLICY "Users can insert own prospect intel" ON prospect_intel
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prospect intel" ON prospect_intel;
CREATE POLICY "Users can update own prospect intel" ON prospect_intel
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prospect intel" ON prospect_intel;
CREATE POLICY "Users can delete own prospect intel" ON prospect_intel
  FOR DELETE USING (auth.uid() = user_id);

-- 7. FUNCTION TO AUTO-UPDATE updated_at ON PROSPECT_INTEL
CREATE OR REPLACE FUNCTION update_prospect_intel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prospect_intel_updated_at ON prospect_intel;
CREATE TRIGGER trigger_update_prospect_intel_updated_at
  BEFORE UPDATE ON prospect_intel
  FOR EACH ROW
  EXECUTE FUNCTION update_prospect_intel_updated_at();

-- 8. FUNCTION TO LOG CHANNEL MOVES AUTOMATICALLY
-- This will be called from the application when moving channels
-- Note: p_prospect_id uses BIGINT to match the existing prospects.id column type
CREATE OR REPLACE FUNCTION log_channel_move(
  p_prospect_id BIGINT,
  p_user_id UUID,
  p_from_channel INTEGER,
  p_to_channel INTEGER
) RETURNS UUID AS $$
DECLARE
  v_note_id UUID;
BEGIN
  INSERT INTO prospect_notes (prospect_id, user_id, note_text, note_type, channel_at_time)
  VALUES (
    p_prospect_id,
    p_user_id,
    'Moved from CH' || p_from_channel || ' to CH' || p_to_channel,
    'channel_move',
    p_to_channel
  )
  RETURNING id INTO v_note_id;
  
  RETURN v_note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_channel_move(BIGINT, UUID, INTEGER, INTEGER) TO authenticated;

SELECT 'Prospect drawer tables and policies created successfully!' as status;
