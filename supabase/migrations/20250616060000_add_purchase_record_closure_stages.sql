/*
  # Add Two-Stage Closure System for Purchase Records

  1. Changes
    - Update status check constraint to include 'partial_closure' and 'full_closure' statuses
    - Update existing 'completed' records to 'partial_closure' status
    - Add closure_date and closure_notes fields for tracking closure information
*/

-- Add new columns for closure tracking
ALTER TABLE purchase_records 
ADD COLUMN closure_date timestamptz,
ADD COLUMN closure_notes text;

-- Update any existing 'completed' records to 'partial_closure'
UPDATE purchase_records 
SET status = 'partial_closure'
WHERE status = 'completed';

-- Drop the old constraint
ALTER TABLE purchase_records 
DROP CONSTRAINT IF EXISTS purchase_records_status_check;

-- Add the new constraint with closure stages
ALTER TABLE purchase_records 
ADD CONSTRAINT purchase_records_status_check 
CHECK (status IN ('partial_closure', 'full_closure', 'cancelled'));

-- Update the default status to 'partial_closure'
ALTER TABLE purchase_records 
ALTER COLUMN status SET DEFAULT 'partial_closure';

-- Create index for closure tracking
CREATE INDEX purchase_records_closure_date_idx ON purchase_records(closure_date);
