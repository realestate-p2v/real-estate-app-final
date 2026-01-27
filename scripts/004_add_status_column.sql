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

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public inserts" ON orders;
DROP POLICY IF EXISTS "Allow public select" ON orders;
DROP POLICY IF EXISTS "Allow public update" ON orders;
DROP POLICY IF EXISTS "Allow public delete" ON orders;

-- Create policy to allow public inserts (for order creation)
CREATE POLICY "Allow public inserts" ON orders
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow public select (for viewing orders)
CREATE POLICY "Allow public select" ON orders
  FOR SELECT
  USING (true);

-- Create policy to allow public update (for status updates from admin)
CREATE POLICY "Allow public update" ON orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
