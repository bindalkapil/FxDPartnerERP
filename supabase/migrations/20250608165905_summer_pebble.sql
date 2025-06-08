/*
  # Add delivery addresses column to customers table

  1. Schema Changes
    - Add `delivery_addresses` column to `customers` table as JSONB array
    - This will store multiple delivery addresses for each customer

  2. Data Structure
    - Each delivery address will be stored as JSON object with fields:
      - label: string (e.g., "Home", "Office", "Warehouse")
      - address: string (full address)
      - is_default: boolean (whether this is the default delivery address)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'delivery_addresses'
  ) THEN
    ALTER TABLE customers ADD COLUMN delivery_addresses JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;