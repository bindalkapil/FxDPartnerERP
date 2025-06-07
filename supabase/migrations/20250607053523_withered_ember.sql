/*
  # Create Purchase Records System

  1. New Tables
    - `purchase_records`
      - Complete purchase record information
      - Links to vehicle arrivals
      - Pricing model and financial data
    - `purchase_record_items`
      - Individual items with pricing
      - Commission and cost details
    - `purchase_record_costs`
      - Additional costs breakdown

  2. Security
    - Enable RLS on all tables
    - Public access policies for CRUD operations
*/

-- Create purchase_records table
CREATE TABLE IF NOT EXISTS purchase_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_arrival_id uuid REFERENCES vehicle_arrivals(id) ON DELETE CASCADE,
  record_number text NOT NULL UNIQUE,
  supplier text NOT NULL,
  record_date timestamptz NOT NULL,
  arrival_timestamp timestamptz NOT NULL,
  pricing_model text NOT NULL CHECK (pricing_model IN ('commission', 'fixed')),
  default_commission numeric DEFAULT 8,
  payment_terms integer DEFAULT 30,
  items_subtotal numeric NOT NULL DEFAULT 0,
  additional_costs_total numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_record_items table
CREATE TABLE IF NOT EXISTS purchase_record_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_record_id uuid NOT NULL REFERENCES purchase_records(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  sku_id uuid NOT NULL REFERENCES skus(id),
  product_name text NOT NULL,
  sku_code text NOT NULL,
  category text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_type text NOT NULL CHECK (unit_type IN ('box', 'loose')),
  total_weight numeric NOT NULL CHECK (total_weight > 0),
  market_price numeric,
  commission numeric,
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total numeric NOT NULL CHECK (total >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_record_costs table
CREATE TABLE IF NOT EXISTS purchase_record_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_record_id uuid NOT NULL REFERENCES purchase_records(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  type text NOT NULL CHECK (type IN ('fixed', 'percentage', 'per_box')),
  calculated_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE purchase_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_record_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_record_costs ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase_records
CREATE POLICY "purchase_records_allow_public_select"
ON purchase_records
FOR SELECT TO public
USING (true);

CREATE POLICY "purchase_records_allow_public_insert"
ON purchase_records
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "purchase_records_allow_public_update"
ON purchase_records
FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- Create policies for purchase_record_items
CREATE POLICY "purchase_record_items_allow_public_select"
ON purchase_record_items
FOR SELECT TO public
USING (true);

CREATE POLICY "purchase_record_items_allow_public_insert"
ON purchase_record_items
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "purchase_record_items_allow_public_update"
ON purchase_record_items
FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- Create policies for purchase_record_costs
CREATE POLICY "purchase_record_costs_allow_public_select"
ON purchase_record_costs
FOR SELECT TO public
USING (true);

CREATE POLICY "purchase_record_costs_allow_public_insert"
ON purchase_record_costs
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "purchase_record_costs_allow_public_update"
ON purchase_record_costs
FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_purchase_records_updated_at
  BEFORE UPDATE ON purchase_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_record_items_updated_at
  BEFORE UPDATE ON purchase_record_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX purchase_records_vehicle_arrival_id_idx ON purchase_records(vehicle_arrival_id);
CREATE INDEX purchase_records_supplier_idx ON purchase_records(supplier);
CREATE INDEX purchase_records_status_idx ON purchase_records(status);
CREATE INDEX purchase_record_items_purchase_record_id_idx ON purchase_record_items(purchase_record_id);
CREATE INDEX purchase_record_items_product_id_idx ON purchase_record_items(product_id);
CREATE INDEX purchase_record_items_sku_id_idx ON purchase_record_items(sku_id);
CREATE INDEX purchase_record_costs_purchase_record_id_idx ON purchase_record_costs(purchase_record_id);