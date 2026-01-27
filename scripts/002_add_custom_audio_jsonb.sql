-- Migration: Add custom_audio JSONB column if it doesn't exist
-- This replaces the separate custom_audio_filename and custom_audio_url columns

-- Add the new JSONB column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'custom_audio'
    ) THEN
        ALTER TABLE orders ADD COLUMN custom_audio JSONB DEFAULT NULL;
    END IF;
END $$;

-- Migrate existing data if the old columns exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'custom_audio_url'
    ) THEN
        UPDATE orders 
        SET custom_audio = jsonb_build_object(
            'url', custom_audio_url,
            'filename', custom_audio_filename
        )
        WHERE custom_audio_url IS NOT NULL;
        
        -- Drop old columns
        ALTER TABLE orders DROP COLUMN IF EXISTS custom_audio_url;
        ALTER TABLE orders DROP COLUMN IF EXISTS custom_audio_filename;
    END IF;
END $$;
