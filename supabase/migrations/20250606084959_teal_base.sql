/*
  # Update Vehicle Arrival Status System

  1. Changes
    - Update status check constraint to use new simplified statuses
    - Modify existing records to use new status values
    - Add migration for existing data

  2. New Status Values
    - pending: includes in-transit, arrived, unloading
    - completed: unloaded
    - po-created: PO creation is done
    - cancelled: can be from pending or completed
*/

-- First, update existing records to new status values
UPDATE vehicle_arrivals 
SET status = CASE 
  WHEN status IN ('in-transit', 'arrived', 'unloading') THEN 'pending'
  WHEN status = 'unloaded' THEN 'completed'
  WHEN status = 'po-created' THEN 'po-created'
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'pending'
END;

-- Drop the old constraint
ALTER TABLE vehicle_arrivals 
DROP CONSTRAINT IF EXISTS vehicle_arrivals_status_check;

-- Add the new constraint with simplified statuses
ALTER TABLE vehicle_arrivals 
ADD CONSTRAINT vehicle_arrivals_status_check 
CHECK (status IN ('pending', 'completed', 'po-created', 'cancelled'));