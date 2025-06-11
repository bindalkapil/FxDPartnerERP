/*
  # Update Sales Order Status Logic

  1. Changes
    - Update existing sales orders to use new status values
    - Replace old status constraint with new one
    - New statuses: completed, dispatch_pending, dispatched, cancelled

  2. Status Migration
    - draft/confirmed/processing → dispatch_pending
    - delivered → dispatched
    - cancelled remains cancelled
*/

-- First, update existing data to match new status values
UPDATE sales_orders 
SET status = CASE 
  WHEN status IN ('draft', 'confirmed', 'processing') THEN 'dispatch_pending'
  WHEN status = 'delivered' THEN 'dispatched'
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'completed'
END;

-- Drop the existing status check constraint
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;

-- Add the new status check constraint with updated values
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check 
  CHECK (status = ANY (ARRAY['completed'::text, 'dispatch_pending'::text, 'dispatched'::text, 'cancelled'::text]));