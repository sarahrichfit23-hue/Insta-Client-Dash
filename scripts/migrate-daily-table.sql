-- Migration: Add new columns for Daily Page editable table
-- Run this in your Supabase SQL Editor

-- Add new columns to prospects table if they don't exist
DO $$ 
BEGIN
  -- Platform column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'platform') THEN
    ALTER TABLE prospects ADD COLUMN platform text DEFAULT 'Instagram';
  END IF;
  
  -- Signal tag column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'signal_tag') THEN
    ALTER TABLE prospects ADD COLUMN signal_tag text DEFAULT 'None';
  END IF;
  
  -- Next action column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'next_action') THEN
    ALTER TABLE prospects ADD COLUMN next_action text;
  END IF;
  
  -- Call booked column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'call_booked') THEN
    ALTER TABLE prospects ADD COLUMN call_booked text DEFAULT 'No';
  END IF;
  
  -- Added date column (for display purposes, separate from created_at)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'added_date') THEN
    ALTER TABLE prospects ADD COLUMN added_date date DEFAULT CURRENT_DATE;
  END IF;

  -- Last touched timestamp if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'last_touched_at') THEN
    ALTER TABLE prospects ADD COLUMN last_touched_at timestamptz;
  END IF;
  
  -- Status column if not exists (should exist but just in case)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'status') THEN
    ALTER TABLE prospects ADD COLUMN status text DEFAULT 'cold';
  END IF;
END $$;

-- Update existing rows to have added_date from created_at
UPDATE prospects 
SET added_date = DATE(created_at) 
WHERE added_date IS NULL AND created_at IS NOT NULL;

-- Update existing rows to have last_touched_at from last touch
UPDATE prospects p
SET last_touched_at = (
  SELECT MAX(touch_date) 
  FROM touches t 
  WHERE t.prospect_id = p.id
)
WHERE p.last_touched_at IS NULL;

SELECT 'Migration complete! New columns added: platform, signal_tag, next_action, call_booked, added_date' as result;
