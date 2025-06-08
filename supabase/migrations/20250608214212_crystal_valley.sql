/*
  # Create payments table for financial transactions

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `type` (text, check constraint for 'received', 'made', 'expense')
      - `amount` (numeric, must be positive)
      - `payment_date` (timestamp with time zone)
      - `party_id` (uuid, nullable for expenses)
      - `party_type` (text, 'customer' or 'supplier', nullable for expenses)
      - `party_name` (text, denormalized for performance)
      - `reference_id` (uuid, nullable)
      - `reference_type` (text, 'sales_order' or 'purchase_record', nullable)
      - `reference_number` (text, denormalized for performance)
      - `mode` (text, payment method)
      - `status` (text, transaction status)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `payments` table
    - Add policies for public access (CRUD operations)

  3. Triggers
    - Add trigger to update `updated_at` column automatically
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  amount numeric NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  party_id uuid,
  party_type text,
  party_name text,
  reference_id uuid,
  reference_type text,
  reference_number text,
  mode text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'completed',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE payments ADD CONSTRAINT payments_type_check 
  CHECK (type IN ('received', 'made', 'expense'));

ALTER TABLE payments ADD CONSTRAINT payments_amount_check 
  CHECK (amount > 0);

ALTER TABLE payments ADD CONSTRAINT payments_party_type_check 
  CHECK (party_type IN ('customer', 'supplier') OR party_type IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_reference_type_check 
  CHECK (reference_type IN ('sales_order', 'purchase_record') OR reference_type IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_mode_check 
  CHECK (mode IN ('cash', 'bank_transfer', 'upi', 'credit', 'cheque'));

ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('completed', 'pending', 'failed', 'cancelled'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS payments_type_idx ON payments(type);
CREATE INDEX IF NOT EXISTS payments_payment_date_idx ON payments(payment_date);
CREATE INDEX IF NOT EXISTS payments_party_id_idx ON payments(party_id);
CREATE INDEX IF NOT EXISTS payments_reference_id_idx ON payments(reference_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "payments_allow_public_select" ON payments
  FOR SELECT TO public USING (true);

CREATE POLICY "payments_allow_public_insert" ON payments
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "payments_allow_public_update" ON payments
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "payments_allow_public_delete" ON payments
  FOR DELETE TO public USING (true);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();