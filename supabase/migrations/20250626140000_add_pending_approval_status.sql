-- Add pending_approval status to sales_orders status check constraint
-- This enables the credit-based order approval workflow

-- Drop the existing status check constraint
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;

-- Add the new status check constraint with pending_approval included
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check
  CHECK (status = ANY (ARRAY['completed'::text, 'dispatch_pending'::text, 'dispatched'::text, 'cancelled'::text, 'pending_approval'::text, 'rejected'::text]));
