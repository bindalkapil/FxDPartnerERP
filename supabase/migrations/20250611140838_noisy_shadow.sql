/*
  # Update Sales Order Status Logic

  1. Schema Changes
    - Update sales_orders status constraint to only allow: completed, dispatch_pending, dispatched, cancelled
    - Remove old status values that are no longer needed

  2. Status Logic
    - Counter Orders: Created as 'completed'
    - Outstation Orders: Created as 'dispatch_pending', then 'dispatched' when marked dispatched
    - Orders can be 'cancelled' at any time
*/

-- Drop the existing status check constraint
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;

-- Add the new status check constraint with updated values
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check 
  CHECK (status = ANY (ARRAY['completed'::text, 'dispatch_pending'::text, 'dispatched'::text, 'cancelled'::text]));

-- Update any existing orders with old statuses to new ones
UPDATE sales_orders 
SET status = CASE 
  WHEN status IN ('draft', 'confirmed', 'processing') THEN 'dispatch_pending'
  WHEN status = 'delivered' THEN 'dispatched'
  ELSE status
END
WHERE status NOT IN ('completed', 'dispatch_pending', 'dispatched', 'cancelled');