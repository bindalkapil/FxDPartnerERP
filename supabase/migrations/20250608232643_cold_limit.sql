/*
  # Add supplier_id to purchase_records table

  1. Changes
    - Add supplier_id column to purchase_records table
    - Add foreign key constraint to suppliers table
    - Add index for better performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add supplier_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_records' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE purchase_records ADD COLUMN supplier_id uuid;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'purchase_records_supplier_id_fkey'
  ) THEN
    ALTER TABLE purchase_records 
    ADD CONSTRAINT purchase_records_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS purchase_records_supplier_id_idx ON purchase_records(supplier_id);