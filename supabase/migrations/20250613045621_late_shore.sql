/*
  # Create and populate current_inventory table

  1. New Tables
    - `current_inventory`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `sku_id` (uuid, foreign key to skus)
      - `product_name` (text)
      - `sku_code` (text)
      - `category` (text)
      - `unit_type` (text, 'box' or 'loose')
      - `available_quantity` (numeric, >= 0)
      - `total_weight` (numeric, >= 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_updated_at` (timestamptz)

  2. Security
    - Enable RLS on `current_inventory` table
    - Add policies for public access (select, insert, update)

  3. Data Population
    - Populate from completed vehicle arrivals
    - Handle duplicates properly using DISTINCT and ROW_NUMBER()
    - Use final quantities where available, fallback to original quantities
*/

-- Create current_inventory table if it doesn't exist
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
  last_updated_at timestamptz DEFAULT now()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'current_inventory_product_id_sku_id_key'
  ) THEN
    ALTER TABLE current_inventory ADD CONSTRAINT current_inventory_product_id_sku_id_key UNIQUE(product_id, sku_id);
  END IF;
END $$;

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

-- Populate current_inventory with data from existing vehicle arrivals
-- Use a more robust approach to avoid duplicates
DO $$
DECLARE
  rec RECORD;
  existing_count INTEGER;
BEGIN
  -- Check if table already has data
  SELECT COUNT(*) INTO existing_count FROM current_inventory;
  
  IF existing_count > 0 THEN
    RAISE NOTICE 'current_inventory table already has data (% rows), skipping population', existing_count;
    RETURN;
  END IF;

  RAISE NOTICE 'Populating current_inventory table from vehicle arrivals...';

  -- Insert aggregated data using a cursor approach to handle each unique combination
  FOR rec IN (
    WITH aggregated_data AS (
      SELECT DISTINCT
        vai.product_id,
        vai.sku_id,
        p.name as product_name,
        s.code as sku_code,
        COALESCE(p.category, 'Uncategorized') as category,
        vai.unit_type,
        SUM(COALESCE(vai.final_quantity, vai.quantity)) OVER (
          PARTITION BY vai.product_id, vai.sku_id
        ) as total_available_quantity,
        SUM(COALESCE(vai.final_total_weight, vai.total_weight)) OVER (
          PARTITION BY vai.product_id, vai.sku_id
        ) as total_weight_sum,
        MAX(va.arrival_time) OVER (
          PARTITION BY vai.product_id, vai.sku_id
        ) as last_updated_at,
        ROW_NUMBER() OVER (
          PARTITION BY vai.product_id, vai.sku_id 
          ORDER BY va.arrival_time DESC
        ) as rn
      FROM vehicle_arrival_items vai
      JOIN vehicle_arrivals va ON vai.vehicle_arrival_id = va.id
      JOIN products p ON vai.product_id = p.id
      JOIN skus s ON vai.sku_id = s.id
      WHERE va.status IN ('completed', 'po-created')
        AND vai.product_id IS NOT NULL 
        AND vai.sku_id IS NOT NULL
    )
    SELECT 
      product_id,
      sku_id,
      product_name,
      sku_code,
      category,
      unit_type,
      total_available_quantity,
      total_weight_sum,
      last_updated_at
    FROM aggregated_data
    WHERE rn = 1
  ) LOOP
    BEGIN
      -- Insert each record individually to avoid batch conflicts
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
      ) VALUES (
        rec.product_id,
        rec.sku_id,
        rec.product_name,
        rec.sku_code,
        rec.category,
        rec.unit_type,
        COALESCE(rec.total_available_quantity, 0),
        COALESCE(rec.total_weight_sum, 0),
        rec.last_updated_at
      );
      
      RAISE NOTICE 'Inserted inventory for product: %, SKU: %', rec.product_name, rec.sku_code;
      
    EXCEPTION 
      WHEN unique_violation THEN
        -- If somehow there's still a duplicate, update the existing record
        UPDATE current_inventory SET
          product_name = rec.product_name,
          sku_code = rec.sku_code,
          category = rec.category,
          unit_type = rec.unit_type,
          available_quantity = COALESCE(rec.total_available_quantity, 0),
          total_weight = COALESCE(rec.total_weight_sum, 0),
          last_updated_at = rec.last_updated_at,
          updated_at = now()
        WHERE product_id = rec.product_id AND sku_id = rec.sku_id;
        
        RAISE NOTICE 'Updated existing inventory for product: %, SKU: %', rec.product_name, rec.sku_code;
        
      WHEN OTHERS THEN
        RAISE NOTICE 'Error processing product: %, SKU: % - %', rec.product_name, rec.sku_code, SQLERRM;
    END;
  END LOOP;

  -- Get final count
  SELECT COUNT(*) INTO existing_count FROM current_inventory;
  RAISE NOTICE 'Successfully populated current_inventory table with % records', existing_count;

END $$;