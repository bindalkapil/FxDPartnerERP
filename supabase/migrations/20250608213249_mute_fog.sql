/*
  # Add dispatch columns to sales_orders table

  1. New Columns
    - `vehicle_number` (text, nullable) - Vehicle number for dispatch
    - `driver_name` (text, nullable) - Driver name for dispatch  
    - `driver_contact` (text, nullable) - Driver contact information

  2. Changes
    - Add three new columns to support dispatch functionality
    - All columns are nullable since they're only filled when order is dispatched
    - No default values needed as these are set during dispatch process

  3. Notes
    - These columns support the dispatch workflow in the MarkAsShippedModal
    - Columns are added safely with IF NOT EXISTS checks
*/

-- Add vehicle_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_orders' AND column_name = 'vehicle_number'
  ) THEN
    ALTER TABLE sales_orders ADD COLUMN vehicle_number text;
  END IF;
END $$;

-- Add driver_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_orders' AND column_name = 'driver_name'
  ) THEN
    ALTER TABLE sales_orders ADD COLUMN driver_name text;
  END IF;
END $$;

-- Add driver_contact column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_orders' AND column_name = 'driver_contact'
  ) THEN
    ALTER TABLE sales_orders ADD COLUMN driver_contact text;
  END IF;
END $$;