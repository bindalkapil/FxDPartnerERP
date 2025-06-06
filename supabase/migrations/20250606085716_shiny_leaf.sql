/*
  # Update Vehicle Arrival Status Values

  1. Changes
    - Simplify vehicle arrival status values to: pending, completed, po-created, cancelled
    - Update existing records to use new status values
    - Replace old constraint with new one

  2. Status Mapping
    - 'in-transit', 'arrived', 'unloading' → 'pending'
    - 'unloaded' → 'completed'
    - 'po-created' → 'po-created' (unchanged)
    - 'cancelled' → 'cancelled' (unchanged)
*/

-- First, let's create a temporary column to store the new status values
ALTER TABLE vehicle_arrivals ADD COLUMN new_status text;

-- Update the temporary column with the new status values
UPDATE vehicle_arrivals 
SET new_status = CASE 
  WHEN status = 'in-transit' THEN 'pending'
  WHEN status = 'arrived' THEN 'pending'
  WHEN status = 'unloading' THEN 'pending'
  WHEN status = 'unloaded' THEN 'completed'
  WHEN status = 'po-created' THEN 'po-created'
  WHEN status = 'cancelled' THEN 'cancelled'
  WHEN status IS NULL THEN 'pending'
  ELSE 'pending'  -- Default fallback for any unexpected values
END;

-- Drop the old constraint
ALTER TABLE vehicle_arrivals 
DROP CONSTRAINT IF EXISTS vehicle_arrivals_status_check;

-- Copy the new status values to the original column
UPDATE vehicle_arrivals 
SET status = new_status;

-- Drop the temporary column
ALTER TABLE vehicle_arrivals DROP COLUMN new_status;

-- Add the new constraint with simplified statuses
ALTER TABLE vehicle_arrivals 
ADD CONSTRAINT vehicle_arrivals_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'po-created'::text, 'cancelled'::text]));