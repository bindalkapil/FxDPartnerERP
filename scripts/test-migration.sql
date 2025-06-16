-- Test script to verify the migration can be applied
-- This helps debug issues before running in GitHub Actions

-- Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'purchase_records'
);

-- Check current status values
SELECT DISTINCT status FROM purchase_records;

-- Check if new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_records'
AND column_name IN ('closure_date', 'closure_notes');

-- Check constraint
SELECT conname, consrc
FROM pg_constraint
WHERE conname = 'purchase_records_status_check';
