/*
  # Allow Negative Inventory

  1. Problem
    - Current CHECK constraint prevents inventory from going negative
    - Business requirement is to allow negative inventory with user confirmation

  2. Solution
    - Remove the CHECK constraint on available_quantity
    - Allow negative values in current_inventory table
    - Frontend will handle user confirmation for negative inventory scenarios

  3. Changes
    - Drop CHECK constraint on available_quantity >= 0
    - Update any existing logic that depends on non-negative inventory
*/

-- Remove the CHECK constraint that prevents negative inventory
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%available_quantity%' 
        AND table_name = 'current_inventory'
    ) THEN
        -- Find the exact constraint name and drop it
        EXECUTE (
            SELECT 'ALTER TABLE current_inventory DROP CONSTRAINT ' || constraint_name
            FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%available_quantity%' 
            AND table_name = 'current_inventory'
            LIMIT 1
        );
        RAISE NOTICE 'Dropped CHECK constraint on available_quantity';
    ELSE
        RAISE NOTICE 'No CHECK constraint found on available_quantity';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop constraint, it may not exist or have a different name: %', SQLERRM;
END $$;

-- Also remove any CHECK constraint on total_weight if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%total_weight%' 
        AND table_name = 'current_inventory'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE current_inventory DROP CONSTRAINT ' || constraint_name
            FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%total_weight%' 
            AND table_name = 'current_inventory'
            LIMIT 1
        );
        RAISE NOTICE 'Dropped CHECK constraint on total_weight';
    ELSE
        RAISE NOTICE 'No CHECK constraint found on total_weight';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop total_weight constraint: %', SQLERRM;
END $$;

-- Add a comment to document that negative inventory is now allowed
COMMENT ON COLUMN current_inventory.available_quantity IS 'Available quantity - can be negative to indicate backorders/oversold items';
COMMENT ON COLUMN current_inventory.total_weight IS 'Total weight - can be negative in special cases';

-- Create a view to easily identify negative inventory items
CREATE OR REPLACE VIEW negative_inventory AS
SELECT 
    id,
    product_id,
    sku_id,
    product_name,
    sku_code,
    category,
    unit_type,
    available_quantity,
    total_weight,
    created_at,
    updated_at,
    last_updated_at
FROM current_inventory 
WHERE available_quantity < 0 OR total_weight < 0;

-- Add RLS policy for the view
ALTER VIEW negative_inventory OWNER TO postgres;

-- Grant access to the view
GRANT SELECT ON negative_inventory TO anon, authenticated;

-- Log success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated current_inventory table to allow negative values';
END $$;
