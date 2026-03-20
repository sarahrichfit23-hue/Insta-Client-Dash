-- ─────────────────────────────────────────────────────────────
-- ICE Dashboard Rebuild — Migration to Status System
-- Run this in: Supabase → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- Add new columns to prospects table
ALTER TABLE public.prospects 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'cold',
ADD COLUMN IF NOT EXISTS last_touched_at timestamptz DEFAULT now();

-- Migrate existing channel data to status
-- CH1 (New Arrivals) → cold
-- CH2 (Warm Conversations) → warm  
-- CH3 (Cold Activation) → cold
-- CH4 (Warm-Up Engagement) → cold
-- CH5 (Conversion Touches) → hot
UPDATE public.prospects SET status = 
  CASE 
    WHEN channel = 1 THEN 'cold'
    WHEN channel = 2 THEN 'warm'
    WHEN channel = 3 THEN 'cold'
    WHEN channel = 4 THEN 'cold'
    WHEN channel = 5 THEN 'hot'
    ELSE 'cold'
  END
WHERE status IS NULL OR status = 'cold';

-- Set last_touched_at from most recent touch
UPDATE public.prospects p SET last_touched_at = (
  SELECT MAX(t.created_at) 
  FROM public.touches t 
  WHERE t.prospect_id = p.id
)
WHERE EXISTS (
  SELECT 1 FROM public.touches t WHERE t.prospect_id = p.id
);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_prospects_status ON public.prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_last_touched ON public.prospects(last_touched_at);

-- Verify migration
SELECT status, COUNT(*) as count FROM public.prospects GROUP BY status;
