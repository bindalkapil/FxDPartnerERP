/*
  # Create current_inventory table and initialize with vehicle arrival data

  1. New Tables
    - `current_inventory`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `sku_id` (uuid, foreign key to skus)
      - `product_name` (text)
      - `sku_code` (text)
      - `category` (text)
      - `unit_type` (text, box or loose)
      - `available_quantity` (numeric, default 0)
      - `total_weight` (numeric, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_updated_at` (timestamptz)

  2. Security
    - Enable RLS on `current_inventory` table
    - Add policies for public access (select, insert, update)

  3. Data Initialization
    - Populate table with aggregated data from vehicle arrivals
    - Use proper grouping to avoid duplicate constraint violations
*/

-- Create current_inventory table
CREATE TABLE IF NOT EXISTS current_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  sku_id uuid NOT NULL REFERENCES skus(id),
  product_name text NOT NULL,
  sku_code text NOT NULL,
  category text NOT NULL,
  unit_type text NOT NULL CHECK (unit_type = ANY (ARRAY['box'::text, 'loose'::text])),
  available_quantity numeric DEFAULT 0 CHECK (available_quantity >= 0),
  total_weight numeric DEFAULT 0 CHECK (total_weight >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, sku_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS current_inventory_product_id_idx ON current_inventory(product_id);
CREATE INDEX IF NOT EXISTS current_inventory_sku_id_idx ON current_inventory(sku_id);
CREATE INDEX IF NOT EXISTS current_inventory_product_name_idx ON current_inventory(product_name);
CREATE INDEX IF NOT EXISTS current_inventory_category_idx ON current_inventory(category);

-- Enable RLS
ALTER TABLE current_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'current_inventory' 
    AND policyname = 'current_inventory_allow_public_select'
  ) THEN
    CREATE POLICY "current_inventory_allow_public_select"
      ON current_inventory
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'current_inventory' 
    AND policyname = 'current_inventory_allow_public_insert'
  ) THEN
    CREATE POLICY "current_inventory_allow_public_insert"
      ON current_inventory
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'current_inventory' 
    AND policyname = 'current_inventory_allow_public_update'
  ) THEN
    CREATE POLICY "current_inventory_allow_public_update"
      ON current_inventory
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_current_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS update_current_inventory_updated_at ON current_inventory;
CREATE TRIGGER update_current_inventory_updated_at
  BEFORE UPDATE ON current_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_current_inventory_updated_at();

-- Initialize current_inventory with data from existing vehicle arrivals
-- First, clear any existing data to avoid conflicts
DELETE FROM current_inventory;

-- Insert aggregated inventory data with proper grouping to avoid duplicates
INSERT INTO current_inventory (
  product_id,
  sku_id,
  product_name,
  sku_code,
  category,
  unit_type,
  available_quantity,
  total_weight,
  last_updated_at
)
SELECT DISTINCT ON (product_id, sku_id)
  product_id,
  sku_id,
  product_name,
  sku_code,
  category,
  unit_type,
  total_available_quantity,
  total_weight_sum,
  last_updated_at
FROM (
  SELECT 
    vai.product_id,
    vai.sku_id,
    p.name as product_name,
    s.code as sku_code,
    p.category,
    vai.unit_type,
    COALESCE(SUM(COALESCE(vai.final_quantity, vai.quantity)), 0) as total_available_quantity,
    COALESCE(SUM(COALESCE(vai.final_total_weight, vai.total_weight)), 0) as total_weight_sum,
    MAX(va.arrival_time) as last_updated_at
  FROM vehicle_arrival_items vai
  JOIN vehicle_arrivals va ON vai.vehicle_arrival_id = va.id
  JOIN products p ON vai.product_id = p.id
  JOIN skus s ON vai.sku_id = s.id
  WHERE va.status IN ('completed', 'po-created')
  GROUP BY vai.product_id, vai.sku_id, p.name, s.code, p.category, vai.unit_type
) aggregated_data
ORDER BY product_id, sku_id, last_updated_at DESC;