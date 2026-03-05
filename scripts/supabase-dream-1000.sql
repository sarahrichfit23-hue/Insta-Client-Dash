-- =============================================================
-- DREAM 1,000 CLIENTS FEATURE - Database Setup
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. UPDATE PROSPECTS TABLE - Add Dream 1,000 specific columns
ALTER TABLE prospects 
  ADD COLUMN IF NOT EXISTS signal_tag TEXT CHECK (signal_tag IN ('raised_hand', 'active_struggle', 'solution_shopper', 'none') OR signal_tag IS NULL),
  ADD COLUMN IF NOT EXISTS date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'uncontacted' CHECK (pipeline_status IN ('uncontacted', 'in_pipeline', 'won', 'archived'));

-- 2. UPDATE existing records to have date_added set to created_at if it exists
UPDATE prospects 
SET date_added = COALESCE(created_at, NOW()),
    last_updated = COALESCE(created_at, NOW())
WHERE date_added IS NULL;

-- 3. For existing prospects that are in channels 1-5, set them as in_pipeline
UPDATE prospects 
SET pipeline_status = 'in_pipeline'
WHERE channel IS NOT NULL AND channel BETWEEN 1 AND 5 AND (pipeline_status IS NULL OR pipeline_status = 'uncontacted');

-- 4. Sync with existing status column
UPDATE prospects 
SET pipeline_status = 'won'
WHERE status = 'won' AND pipeline_status != 'won';

UPDATE prospects 
SET pipeline_status = 'archived'
WHERE status = 'archived' AND pipeline_status != 'archived';

-- 5. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_prospects_signal_tag ON prospects(signal_tag);
CREATE INDEX IF NOT EXISTS idx_prospects_pipeline_status ON prospects(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_prospects_date_added ON prospects(date_added);
CREATE INDEX IF NOT EXISTS idx_prospects_last_updated ON prospects(last_updated);

-- 6. FUNCTION TO AUTO-UPDATE last_updated ON PROSPECTS
CREATE OR REPLACE FUNCTION update_prospect_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prospect_last_updated ON prospects;
CREATE TRIGGER trigger_update_prospect_last_updated
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_prospect_last_updated();

-- 7. FUNCTION TO SET date_added ON INSERT
CREATE OR REPLACE FUNCTION set_prospect_date_added()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_added IS NULL THEN
    NEW.date_added = NOW();
  END IF;
  IF NEW.last_updated IS NULL THEN
    NEW.last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_prospect_date_added ON prospects;
CREATE TRIGGER trigger_set_prospect_date_added
  BEFORE INSERT ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION set_prospect_date_added();

SELECT 'Dream 1,000 columns and triggers created successfully!' as status;
