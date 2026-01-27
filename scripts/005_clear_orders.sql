-- Clear all orders from the database
-- Run this in your Supabase SQL Editor to delete all existing orders

DELETE FROM orders;

-- Reset any sequences if needed (optional)
-- This ensures order IDs start fresh
