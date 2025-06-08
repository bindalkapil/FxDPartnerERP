/*
  # Add delivery_location_confirmed column to sales_orders table

  1. Changes
    - Add `delivery_location_confirmed` column to `sales_orders` table
    - Column type: boolean, nullable
    - Default value: null

  2. Purpose
    - This column is used to track whether the delivery location has been confirmed during the shipping process
    - Required for the Mark as Shipped functionality in the dispatch management system
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_orders' AND column_name = 'delivery_location_confirmed'
  ) THEN
    ALTER TABLE sales_orders ADD COLUMN delivery_location_confirmed BOOLEAN;
  END IF;
END $$;