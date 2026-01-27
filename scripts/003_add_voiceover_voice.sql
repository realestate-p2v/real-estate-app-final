-- Migration: Add voiceover_voice column to orders table
-- This stores the selected voice for voiceover (e.g., "male-1", "female-2")

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS voiceover_voice TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.voiceover_voice IS 'Selected voice for voiceover narration (e.g., male-1, male-2, female-1, female-2)';
