-- Add sequential order number column
-- Run this in your Supabase SQL Editor

-- Add order_number column as integer
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number SERIAL;

-- Create a sequence starting from 1 if not exists
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START WITH 1;

-- Set the default to use the sequence
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('orders_order_number_seq');

-- Create unique index on order_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
