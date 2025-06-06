/*
  # Set up vehicle arrivals and related tables

  1. New Tables
    - vehicle_arrivals
      - Basic arrival info (vehicle number, supplier, driver details)
      - Status tracking
      - Timestamps
    - vehicle_arrival_items
      - Products and quantities received
      - Weight tracking
    - vehicle_arrival_attachments
      - Document/image attachments
      - File metadata

  2. Security
    - Enable RLS on all tables
    - Public access policies for CRUD operations
*/

-- Create vehicle_arrivals table
CREATE TABLE vehicle_arrivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text,
  supplier text NOT NULL,
  driver_name text,
  driver_contact text,
  arrival_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'in-transit'
    CHECK (status IN ('in-transit', 'arrived', 'unloading', 'unloaded', 'po-created', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicle_arrival_items table
CREATE TABLE vehicle_arrival_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_arrival_id uuid NOT NULL REFERENCES vehicle_arrivals(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  sku_id uuid NOT NULL REFERENCES skus(id),
  unit_type text NOT NULL CHECK (unit_type IN ('box', 'loose')),
  unit_weight numeric CHECK (
    (unit_type = 'box' AND unit_weight > 0) OR 
    (unit_type = 'loose' AND unit_weight IS NULL)
  ),
  quantity numeric NOT NULL CHECK (quantity > 0),
  total_weight numeric NOT NULL CHECK (total_weight > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicle_arrival_attachments table
CREATE TABLE vehicle_arrival_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_arrival_id uuid NOT NULL REFERENCES vehicle_arrivals(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vehicle_arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_arrival_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_arrival_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle_arrivals
CREATE POLICY "vehicle_arrivals_allow_public_select"
ON vehicle_arrivals
FOR SELECT TO public
USING (true);

CREATE POLICY "vehicle_arrivals_allow_public_insert"
ON vehicle_arrivals
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "vehicle_arrivals_allow_public_update"
ON vehicle_arrivals
FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- Create policies for vehicle_arrival_items
CREATE POLICY "vehicle_arrival_items_allow_public_select"
ON vehicle_arrival_items
FOR SELECT TO public
USING (true);

CREATE POLICY "vehicle_arrival_items_allow_public_insert"
ON vehicle_arrival_items
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "vehicle_arrival_items_allow_public_update"
ON vehicle_arrival_items
FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- Create policies for vehicle_arrival_attachments
CREATE POLICY "vehicle_arrival_attachments_allow_public_select"
ON vehicle_arrival_attachments
FOR SELECT TO public
USING (true);

CREATE POLICY "vehicle_arrival_attachments_allow_public_insert"
ON vehicle_arrival_attachments
FOR INSERT TO public
WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_vehicle_arrivals_updated_at
  BEFORE UPDATE ON vehicle_arrivals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_arrival_items_updated_at
  BEFORE UPDATE ON vehicle_arrival_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX vehicle_arrivals_supplier_idx ON vehicle_arrivals(supplier);
CREATE INDEX vehicle_arrivals_status_idx ON vehicle_arrivals(status);
CREATE INDEX vehicle_arrival_items_product_id_idx ON vehicle_arrival_items(product_id);
CREATE INDEX vehicle_arrival_items_sku_id_idx ON vehicle_arrival_items(sku_id);