/*
  # Add product and SKU details

  1. Changes
    - Add category field to products table
    - Add unit_type and unit_weight fields to skus table
    - Add description field to products table
    - Add status field to both tables

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN category text NOT NULL DEFAULT 'Uncategorized',
ADD COLUMN description text,
ADD COLUMN status text NOT NULL DEFAULT 'active' 
  CHECK (status IN ('active', 'inactive'));

-- Add new columns to skus table
ALTER TABLE skus
ADD COLUMN unit_type text NOT NULL DEFAULT 'box'
  CHECK (unit_type IN ('box', 'loose')),
ADD COLUMN unit_weight numeric CHECK (
  (unit_type = 'box' AND unit_weight > 0) OR 
  (unit_type = 'loose' AND unit_weight IS NULL)
),
ADD COLUMN status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive'));

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS skus_status_idx ON skus(status);