/*
  # Create suppliers table

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `address` (text, optional)
      - `city` (text, optional)
      - `state` (text, optional)
      - `pincode` (text, optional)
      - `gst_number` (text, optional)
      - `contact_person` (text, optional)
      - `payment_terms` (integer, default 30)
      - `is_active` (boolean, default true)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for public access (matching existing pattern)
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  gst_number text,
  contact_person text,
  payment_terms integer DEFAULT 30,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE suppliers ADD CONSTRAINT suppliers_payment_terms_check 
  CHECK (payment_terms >= 0);

-- Create indexes
CREATE INDEX IF NOT EXISTS suppliers_name_idx ON suppliers(name);
CREATE INDEX IF NOT EXISTS suppliers_email_idx ON suppliers(email);
CREATE INDEX IF NOT EXISTS suppliers_phone_idx ON suppliers(phone);
CREATE INDEX IF NOT EXISTS suppliers_is_active_idx ON suppliers(is_active);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "suppliers_allow_public_select" ON suppliers
  FOR SELECT TO public USING (true);

CREATE POLICY "suppliers_allow_public_insert" ON suppliers
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "suppliers_allow_public_update" ON suppliers
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "suppliers_allow_public_delete" ON suppliers
  FOR DELETE TO public USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at 
  BEFORE UPDATE ON suppliers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
