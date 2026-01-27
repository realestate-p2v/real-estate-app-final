-- Add status column to orders table for tracking order progress
-- Run this in your Supabase SQL Editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'New';

-- Add voiceover_voice column if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS voiceover_voice text;

-- Update any existing orders to have 'New' status
UPDATE orders SET status = 'New' WHERE status IS NULL;

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
