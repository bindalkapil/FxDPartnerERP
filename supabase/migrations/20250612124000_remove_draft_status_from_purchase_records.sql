/*
  # Remove 'draft' status from purchase records

  1. Changes
    - Update status check constraint to only allow 'completed' and 'cancelled' statuses
    - Update any existing 'draft' records to 'completed' status
*/

-- First, update any existing 'draft' records to 'completed'
UPDATE purchase_records 
SET status = 'completed'
WHERE status = 'draft';

-- Drop the old constraint
ALTER TABLE purchase_records 
DROP CONSTRAINT IF EXISTS purchase_records_status_check;

-- Add the new constraint without 'draft' status
ALTER TABLE purchase_records 
ADD CONSTRAINT purchase_records_status_check 
CHECK (status IN ('completed', 'cancelled'));

-- Update the default status to 'completed'
ALTER TABLE purchase_records 
ALTER COLUMN status SET DEFAULT 'completed';
