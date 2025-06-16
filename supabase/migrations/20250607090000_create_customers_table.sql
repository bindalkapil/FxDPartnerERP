/*
  # Create customers table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `address` (text, optional)
      - `city` (text, optional)
      - `state` (text, optional)
      - `pincode` (text, optional)
      - `gst_number` (text, optional)
      - `credit_limit` (numeric, default 0)
      - `payment_terms` (integer, default 30)
      - `is_active` (boolean, default true)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for public access (matching existing pattern)
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  gst_number text,
  credit_limit numeric DEFAULT 0,
  payment_terms integer DEFAULT 30,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE customers ADD CONSTRAINT customers_credit_limit_check 
  CHECK (credit_limit >= 0);

ALTER TABLE customers ADD CONSTRAINT customers_payment_terms_check 
  CHECK (payment_terms >= 0);

-- Create indexes
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(name);
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers(phone);
CREATE INDEX IF NOT EXISTS customers_is_active_idx ON customers(is_active);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "customers_allow_public_select" ON customers
  FOR SELECT TO public USING (true);

CREATE POLICY "customers_allow_public_insert" ON customers
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "customers_allow_public_update" ON customers
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "customers_allow_public_delete" ON customers
  FOR DELETE TO public USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
