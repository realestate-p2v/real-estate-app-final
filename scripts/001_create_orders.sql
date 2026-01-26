-- Create orders table for real estate video orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  
  -- Customer info
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Photos (stored as JSONB array)
  photos JSONB DEFAULT '[]'::jsonb,
  photo_count INTEGER DEFAULT 0,
  
  -- Music selection
  music_selection TEXT,
  custom_audio_filename TEXT,
  custom_audio_url TEXT,
  
  -- Branding info (stored as JSONB)
  branding JSONB DEFAULT '{"type": "unbranded"}'::jsonb,
  
  -- Voiceover
  voiceover BOOLEAN DEFAULT FALSE,
  voiceover_script TEXT,
  
  -- Extras
  include_edited_photos BOOLEAN DEFAULT FALSE,
  special_instructions TEXT,
  
  -- Pricing
  base_price DECIMAL(10,2) DEFAULT 0,
  branding_fee DECIMAL(10,2) DEFAULT 0,
  voiceover_fee DECIMAL(10,2) DEFAULT 0,
  edited_photos_fee DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  
  -- Payment status
  payment_status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on order_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);

-- Create index on customer_email for lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Create index on payment_status
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (no auth required for this app)
-- Since this is a public order form, we allow inserts and reads
CREATE POLICY "Allow public insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON orders FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
