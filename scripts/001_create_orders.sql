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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
