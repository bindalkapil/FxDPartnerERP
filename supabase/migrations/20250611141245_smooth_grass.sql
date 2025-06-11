/*
  # Update Sales Order Status Values

  1. Changes
    - Update sales order status values to new simplified system
    - Counter orders: 'completed' status
    - Outstation orders: 'dispatch_pending' -> 'dispatched' workflow
    - Remove old complex status workflow

  2. Status Mapping
    - 'draft', 'confirmed', 'processing' -> 'dispatch_pending'
    - 'delivered' -> 'dispatched' 
    - 'cancelled' -> 'cancelled'
    - All others -> 'completed'

  3. Security
    - Maintains existing RLS policies
*/

-- First, let's see what statuses currently exist and update them step by step
DO $$
BEGIN
  -- Update statuses in a transaction to ensure consistency
  
  -- Map old statuses to new ones
  UPDATE sales_orders 
  SET status = 'dispatch_pending'
  WHERE status IN ('draft', 'confirmed', 'processing');
  
  UPDATE sales_orders 
  SET status = 'dispatched'
  WHERE status = 'delivered';
  
  -- Keep cancelled as is
  UPDATE sales_orders 
  SET status = 'cancelled'
  WHERE status = 'cancelled';
  
  -- Set any remaining statuses to completed
  UPDATE sales_orders 
  SET status = 'completed'
  WHERE status NOT IN ('dispatch_pending', 'dispatched', 'cancelled');
  
END $$;

-- Now drop the old constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sales_orders_status_check' 
    AND table_name = 'sales_orders'
  ) THEN
    ALTER TABLE sales_orders DROP CONSTRAINT sales_orders_status_check;
  END IF;
END $$;

-- Add the new constraint
ALTER TABLE sales_orders 
ADD CONSTRAINT sales_orders_status_check 
CHECK (status = ANY (ARRAY['completed'::text, 'dispatch_pending'::text, 'dispatched'::text, 'cancelled'::text]));