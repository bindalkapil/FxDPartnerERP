/*
  # Update Sales Order Status Values

  1. Changes
    - Drop existing status constraint
    - Update all existing status values to new schema
    - Add new status constraint with updated values

  2. Status Mapping
    - 'draft', 'confirmed', 'processing' → 'dispatch_pending'
    - 'delivered' → 'dispatched'
    - 'cancelled' → 'cancelled' (unchanged)
    - All others → 'completed'

  3. New Status Values
    - 'completed': For counter orders
    - 'dispatch_pending': For outstation orders awaiting dispatch
    - 'dispatched': For outstation orders that have been dispatched
    - 'cancelled': For cancelled orders
*/

-- Step 1: Drop the existing constraint first to allow updates
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;

-- Step 2: Update all status values to match new schema
UPDATE sales_orders 
SET status = CASE 
  WHEN status IN ('draft', 'confirmed', 'processing') THEN 'dispatch_pending'
  WHEN status = 'delivered' THEN 'dispatched'
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'completed'
END;

-- Step 3: Add the new constraint with updated allowed values
ALTER TABLE sales_orders 
ADD CONSTRAINT sales_orders_status_check 
CHECK (status = ANY (ARRAY['completed'::text, 'dispatch_pending'::text, 'dispatched'::text, 'cancelled'::text]));