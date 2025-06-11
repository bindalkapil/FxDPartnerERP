/*
  # Fix Sales Order Status Logic

  This migration corrects the status assignment for existing sales orders:
  - Counter orders (no delivery_date): should be 'completed'
  - Outstation orders (with delivery_date): should be 'dispatch_pending' or 'dispatched'
*/

-- Update existing sales orders with correct status based on delivery_date
UPDATE sales_orders 
SET status = CASE 
  -- Counter orders (no delivery date) should be completed
  WHEN delivery_date IS NULL THEN 'completed'
  -- Outstation orders with delivery date should be dispatch_pending (unless already dispatched)
  WHEN delivery_date IS NOT NULL AND status != 'dispatched' THEN 'dispatch_pending'
  -- Keep dispatched and cancelled as they are
  ELSE status
END
WHERE status IN ('completed', 'dispatch_pending', 'dispatched', 'cancelled');