/*
  # Fix Duplicate SKU Codes and Strengthen Constraints

  1. Problem
    - Multiple products are sharing the same SKU code (e.g., 'Premium')
    - This causes incorrect product selection in the sales interface
    - The UNIQUE constraint on skus.code should prevent this but seems to be bypassed

  2. Solution
    - Identify and fix duplicate SKU codes
    - Add a composite unique constraint to ensure SKU codes are unique per product
    - Add better data validation
    - Create a function to generate unique SKU codes

  3. Data Cleanup
    - Find duplicate SKU codes
    - Rename duplicates to make them unique
    - Maintain data integrity during the process
*/

-- First, let's identify and log duplicate SKU codes
DO $$
DECLARE
    duplicate_record RECORD;
    counter INTEGER;
BEGIN
    RAISE NOTICE 'Starting duplicate SKU code cleanup...';
    
    -- Log all duplicate SKU codes
    FOR duplicate_record IN 
        SELECT code, COUNT(*) as count
        FROM skus 
        GROUP BY code 
        HAVING COUNT(*) > 1
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Found % SKUs with code: %', duplicate_record.count, duplicate_record.code;
    END LOOP;
END $$;

-- Create a function to generate unique SKU codes
CREATE OR REPLACE FUNCTION generate_unique_sku_code(base_code text, product_name text)
RETURNS text AS $$
DECLARE
    new_code text;
    counter integer := 1;
    product_prefix text;
BEGIN
    -- Create a product prefix from the first 3 characters of product name
    product_prefix := UPPER(LEFT(REGEXP_REPLACE(product_name, '[^A-Za-z]', '', 'g'), 3));
    
    -- Start with the base code
    new_code := base_code;
    
    -- If the base code already exists, append product prefix and counter
    WHILE EXISTS (SELECT 1 FROM skus WHERE code = new_code) LOOP
        new_code := base_code || '_' || product_prefix || '_' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Fix duplicate SKU codes by making them unique
DO $$
DECLARE
    sku_record RECORD;
    product_record RECORD;
    new_sku_code text;
    is_first boolean;
BEGIN
    RAISE NOTICE 'Fixing duplicate SKU codes...';
    
    -- For each duplicate SKU code, keep the first one and rename the others
    FOR sku_record IN 
        SELECT code
        FROM skus 
        GROUP BY code 
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Processing duplicate SKU code: %', sku_record.code;
        is_first := true;
        
        -- Process each SKU with this duplicate code
        FOR product_record IN 
            SELECT s.id, s.code, s.product_id, p.name as product_name
            FROM skus s
            JOIN products p ON s.product_id = p.id
            WHERE s.code = sku_record.code
            ORDER BY s.created_at ASC  -- Keep the oldest one unchanged
        LOOP
            IF is_first THEN
                -- Keep the first (oldest) SKU code unchanged
                RAISE NOTICE 'Keeping original SKU code % for product %', product_record.code, product_record.product_name;
                is_first := false;
            ELSE
                -- Generate a new unique code for subsequent duplicates
                new_sku_code := generate_unique_sku_code(product_record.code, product_record.product_name);
                
                RAISE NOTICE 'Changing SKU code from % to % for product %', 
                    product_record.code, new_sku_code, product_record.product_name;
                
                -- Update the SKU code
                UPDATE skus 
                SET code = new_sku_code, updated_at = now()
                WHERE id = product_record.id;
                
                -- Update current_inventory table if it exists
                UPDATE current_inventory 
                SET sku_code = new_sku_code, updated_at = now()
                WHERE sku_id = product_record.id;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Duplicate SKU code cleanup completed.';
END $$;

-- Verify that we have no more duplicates
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT code
        FROM skus 
        GROUP BY code 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Still have % duplicate SKU codes after cleanup!', duplicate_count;
    ELSE
        RAISE NOTICE 'SUCCESS: No duplicate SKU codes found after cleanup.';
    END IF;
END $$;

-- Add additional constraints to prevent future duplicates
-- Note: The UNIQUE constraint on code should already exist, but let's ensure it's there
DO $$
BEGIN
    -- Check if unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'skus_code_key' 
        AND table_name = 'skus'
    ) THEN
        ALTER TABLE skus ADD CONSTRAINT skus_code_key UNIQUE (code);
        RAISE NOTICE 'Added UNIQUE constraint on skus.code';
    ELSE
        RAISE NOTICE 'UNIQUE constraint on skus.code already exists';
    END IF;
END $$;

-- Create a trigger to prevent duplicate SKU codes from being inserted
CREATE OR REPLACE FUNCTION prevent_duplicate_sku_codes()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the SKU code already exists
    IF EXISTS (SELECT 1 FROM skus WHERE code = NEW.code AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
        RAISE EXCEPTION 'SKU code "%" already exists. SKU codes must be unique across all products.', NEW.code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
DROP TRIGGER IF EXISTS prevent_duplicate_sku_codes_trigger ON skus;
CREATE TRIGGER prevent_duplicate_sku_codes_trigger
    BEFORE INSERT OR UPDATE ON skus
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_sku_codes();

-- Add a comment to document the constraint
COMMENT ON COLUMN skus.code IS 'SKU code must be unique across all products. Use generate_unique_sku_code() function to create unique codes.';

-- Create an index to improve performance of SKU code lookups
CREATE INDEX IF NOT EXISTS skus_code_idx ON skus(code);

-- Log final statistics
DO $$
DECLARE
    total_skus INTEGER;
    unique_codes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_skus FROM skus;
    SELECT COUNT(DISTINCT code) INTO unique_codes FROM skus;
    
    RAISE NOTICE 'Final statistics: % total SKUs, % unique codes', total_skus, unique_codes;
    
    IF total_skus != unique_codes THEN
        RAISE EXCEPTION 'Data integrity check failed: % SKUs but only % unique codes', total_skus, unique_codes;
    END IF;
END $$;
