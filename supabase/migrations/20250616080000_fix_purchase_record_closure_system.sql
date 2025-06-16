/*
  # Fix Purchase Record Closure System

  This migration fixes the conflict between the closure stages migration and remote schema migration.
  It properly implements the two-stage closure system for purchase records.

  1. Changes
    - Re-add closure_date and closure_notes columns (removed by remote schema)
    - Update status check constraint to include 'partial_closure' and 'full_closure' statuses
    - Update existing 'completed' records to 'partial_closure' status
    - Set default status to 'partial_closure'
*/

-- Add closure tracking columns back (they were removed by remote schema migration)
ALTER TABLE purchase_records 
ADD COLUMN IF NOT EXISTS closure_date timestamptz,
ADD COLUMN IF NOT EXISTS closure_notes text;

-- Drop the current constraint that only allows 'completed' and 'cancelled'
ALTER TABLE purchase_records 
DROP CONSTRAINT IF EXISTS purchase_records_status_check;

-- Add the new constraint with closure stages
ALTER TABLE purchase_records 
ADD CONSTRAINT purchase_records_status_check 
CHECK (status IN ('partial_closure', 'full_closure', 'cancelled', 'completed'));

-- Update any existing 'completed' records to 'partial_closure'
UPDATE purchase_records 
SET status = 'partial_closure'
WHERE status = 'completed';

-- Update the constraint to remove 'completed' now that we've migrated the data
ALTER TABLE purchase_records 
DROP CONSTRAINT purchase_records_status_check;

ALTER TABLE purchase_records 
ADD CONSTRAINT purchase_records_status_check 
CHECK (status IN ('partial_closure', 'full_closure', 'cancelled'));

-- Update the default status to 'partial_closure'
ALTER TABLE purchase_records 
ALTER COLUMN status SET DEFAULT 'partial_closure';

-- Create index for closure tracking
CREATE INDEX IF NOT EXISTS purchase_records_closure_date_idx ON purchase_records(closure_date);

-- Update any records that might have invalid statuses
UPDATE purchase_records 
SET status = 'partial_closure'
WHERE status NOT IN ('partial_closure', 'full_closure', 'cancelled');
