/*
  # Update Vehicle Arrival Status System

  1. Schema Changes
    - Update vehicle_arrivals status constraint to use simplified statuses
    - Migrate existing data to new status values
    
  2. Status Changes
    - 'in-transit', 'arrived', 'unloading' → 'pending'
    - 'unloaded' → 'completed'
    - 'po-created' → 'po-created' (unchanged)
    - 'cancelled' → 'cancelled' (unchanged)
    
  3. Data Migration
    - Update all existing records to use new status values
    - Ensure data integrity during migration
*/

-- Start transaction to ensure atomicity
BEGIN;

-- Temporarily disable constraint checking
SET CONSTRAINTS ALL DEFERRED;

-- First, let's see what statuses currently exist and update them
-- Update existing records to new status values in a safe way
UPDATE vehicle_arrivals 
SET status = CASE 
  WHEN status = 'in-transit' THEN 'pending'
  WHEN status = 'arrived' THEN 'pending'
  WHEN status = 'unloading' THEN 'pending'
  WHEN status = 'unloaded' THEN 'completed'
  WHEN status = 'po-created' THEN 'po-created'
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'pending'  -- Default fallback for any unexpected values
END
WHERE status IS NOT NULL;

-- Handle any NULL status values
UPDATE vehicle_arrivals 
SET status = 'pending' 
WHERE status IS NULL;

-- Now drop the old constraint
ALTER TABLE vehicle_arrivals 
DROP CONSTRAINT IF EXISTS vehicle_arrivals_status_check;

-- Add the new constraint with simplified statuses
ALTER TABLE vehicle_arrivals 
ADD CONSTRAINT vehicle_arrivals_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'po-created'::text, 'cancelled'::text]));

-- Verify all records comply with new constraint
DO $$
BEGIN
  -- Check if any records violate the new constraint
  IF EXISTS (
    SELECT 1 FROM vehicle_arrivals 
    WHERE status NOT IN ('pending', 'completed', 'po-created', 'cancelled')
  ) THEN
    RAISE EXCEPTION 'Some records still have invalid status values after migration';
  END IF;
END $$;

-- Re-enable constraint checking
SET CONSTRAINTS ALL IMMEDIATE;

-- Commit the transaction
COMMIT;