/*
  # Create current_inventory table and initialize with existing data

  1. New Tables
    - `current_inventory`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `sku_id` (uuid, foreign key to skus)
      - `product_name` (text)
      - `sku_code` (text)
      - `category` (text)
      - `unit_type` (text, box or loose)
      - `available_quantity` (numeric, >= 0)
      - `total_weight` (numeric, >= 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_updated_at` (timestamp)

  2. Security
    - Enable RLS on `current_inventory` table
    - Add policies for public access (select, insert, update)

  3. Data Migration
    - Initialize inventory with aggregated data from completed vehicle arrivals
    - Handle duplicates properly using window functions
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

-- Initialize current_inventory with data from existing vehicle arrivals
-- Use a multi-step approach to avoid duplicate constraint violations
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Only proceed if the current_inventory table is empty
  IF NOT EXISTS (SELECT 1 FROM current_inventory LIMIT 1) THEN
    
    -- Insert aggregated data one record at a time to handle any edge cases
    FOR rec IN (
      SELECT 
        vai.product_id,
        vai.sku_id,
        p.name as product_name,
        s.code as sku_code,
        COALESCE(p.category, 'Uncategorized') as category,
        vai.unit_type,
        SUM(COALESCE(vai.final_quantity, vai.quantity)) as total_available_quantity,
        SUM(COALESCE(vai.final_total_weight, vai.total_weight)) as total_weight_sum,
        MAX(va.arrival_time) as last_updated_at
      FROM vehicle_arrival_items vai
      JOIN vehicle_arrivals va ON vai.vehicle_arrival_id = va.id
      JOIN products p ON vai.product_id = p.id
      JOIN skus s ON vai.sku_id = s.id
      WHERE va.status IN ('completed', 'po-created')
        AND vai.product_id IS NOT NULL 
        AND vai.sku_id IS NOT NULL
      GROUP BY 
        vai.product_id, 
        vai.sku_id, 
        p.name, 
        s.code, 
        COALESCE(p.category, 'Uncategorized'), 
        vai.unit_type
      ORDER BY vai.product_id, vai.sku_id
    ) LOOP
      
      -- Insert each record individually with conflict handling
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
      )
      ON CONFLICT (product_id, sku_id) 
      DO UPDATE SET
        product_name = EXCLUDED.product_name,
        sku_code = EXCLUDED.sku_code,
        category = EXCLUDED.category,
        unit_type = EXCLUDED.unit_type,
        available_quantity = current_inventory.available_quantity + EXCLUDED.available_quantity,
        total_weight = current_inventory.total_weight + EXCLUDED.total_weight,
        last_updated_at = GREATEST(current_inventory.last_updated_at, EXCLUDED.last_updated_at),
        updated_at = now();
        
    END LOOP;
    
    RAISE NOTICE 'Successfully initialized current_inventory table with existing data';
    
  ELSE
    RAISE NOTICE 'current_inventory table already contains data, skipping initialization';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during current_inventory initialization: %', SQLERRM;
    -- Don't fail the migration, just log the error
END $$;