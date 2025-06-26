/*
  # Update payments table for proof attachments and remove credit mode

  1. Changes
    - Add `proof_attachment_url` column for storing file URLs
    - Add `proof_attachment_name` column for storing original file names
    - Update payment mode constraint to remove 'credit'
    - Update existing records with 'credit' mode to 'cash'

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns for proof attachments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS proof_attachment_url text,
ADD COLUMN IF NOT EXISTS proof_attachment_name text;

-- Update existing records that have 'credit' mode to 'cash'
UPDATE payments SET mode = 'cash' WHERE mode = 'credit';

-- Drop the existing mode constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_mode_check;

-- Add updated mode constraint without 'credit'
ALTER TABLE payments ADD CONSTRAINT payments_mode_check 
  CHECK (mode IN ('cash', 'bank_transfer', 'upi', 'cheque'));

-- Add index for proof attachment URL for better performance
CREATE INDEX IF NOT EXISTS payments_proof_attachment_url_idx ON payments(proof_attachment_url);
