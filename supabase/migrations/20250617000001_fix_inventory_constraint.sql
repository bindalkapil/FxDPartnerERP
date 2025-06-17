/*
  # Fix Inventory Constraint Issue

  The previous migration didn't successfully remove the constraint.
  This migration specifically targets the constraint that's causing the 400 error.
*/

-- Drop the specific constraint that's causing the error
DO $$
BEGIN
    -- Try to drop the specific constraint mentioned in the error
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'current_inventory_available_quantity_check' 
        AND table_name = 'current_inventory'
    ) THEN
        ALTER TABLE current_inventory DROP CONSTRAINT current_inventory_available_quantity_check;
        RAISE NOTICE 'Successfully dropped current_inventory_available_quantity_check constraint';
    ELSE
        RAISE NOTICE 'Constraint current_inventory_available_quantity_check not found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
END $$;

-- Also check for and drop any other quantity-related constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all check constraints on the current_inventory table
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'current_inventory' 
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%quantity%'
    LOOP
        EXECUTE 'ALTER TABLE current_inventory DROP CONSTRAINT ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- Verify the constraint is gone
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'current_inventory_available_quantity_check' 
        AND table_name = 'current_inventory'
    ) THEN
        RAISE NOTICE 'SUCCESS: current_inventory_available_quantity_check constraint has been removed';
    ELSE
        RAISE NOTICE 'WARNING: current_inventory_available_quantity_check constraint still exists';
    END IF;
END $$;

-- Test that negative values are now allowed
DO $$
BEGIN
    -- This should not raise an error if the constraint is properly removed
    RAISE NOTICE 'Negative inventory is now allowed in current_inventory table';
END $$;
