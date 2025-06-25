/*
  # Fix user_organizations table data with proper UUIDs

  1. Data Correction
    - Update `user_organizations` table to use actual user UUIDs instead of email addresses
    - Match email addresses in `user_id` column with corresponding UUIDs from `auth.users`
    - Ensure proper foreign key relationships for RLS to work correctly

  2. Security
    - Maintains existing RLS policies
    - Ensures proper user access validation

  3. Changes
    - Updates all email-based user_id entries to use proper UUIDs
    - Adds validation to prevent future email-based entries
*/

-- Update user_organizations table to use proper UUIDs instead of email addresses
-- This fixes the core issue where email addresses were stored instead of UUIDs

DO $$
DECLARE
    user_record RECORD;
    org_record RECORD;
BEGIN
    -- First, let's see what we're working with
    RAISE NOTICE 'Starting user_organizations data fix...';
    
    -- Update each user_organizations record that has an email in user_id
    FOR org_record IN 
        SELECT DISTINCT user_id, organization_id, role, status, created_at, updated_at
        FROM user_organizations 
        WHERE user_id ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'  -- Email pattern
    LOOP
        -- Find the corresponding UUID for this email
        SELECT id INTO user_record
        FROM auth.users 
        WHERE email = org_record.user_id;
        
        IF FOUND THEN
            RAISE NOTICE 'Updating user_organizations: % -> %', org_record.user_id, user_record.id;
            
            -- Delete the old record with email
            DELETE FROM user_organizations 
            WHERE user_id = org_record.user_id 
            AND organization_id = org_record.organization_id;
            
            -- Insert the corrected record with UUID
            INSERT INTO user_organizations (user_id, organization_id, role, status, created_at, updated_at)
            VALUES (
                user_record.id,
                org_record.organization_id,
                org_record.role,
                org_record.status,
                org_record.created_at,
                org_record.updated_at
            )
            ON CONFLICT (user_id, organization_id) DO UPDATE SET
                role = EXCLUDED.role,
                status = EXCLUDED.status,
                updated_at = EXCLUDED.updated_at;
        ELSE
            RAISE WARNING 'No auth.users record found for email: %', org_record.user_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'User organizations data fix completed.';
END $$;

-- Add a constraint to prevent future email-based entries
-- This ensures user_id must be a valid UUID format
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_organizations_user_id_uuid_check' 
        AND table_name = 'user_organizations'
    ) THEN
        ALTER TABLE user_organizations 
        ADD CONSTRAINT user_organizations_user_id_uuid_check 
        CHECK (user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
        
        RAISE NOTICE 'Added UUID format constraint to user_organizations.user_id';
    END IF;
END $$;

-- Verify the fix by showing current user_organizations data
DO $$
DECLARE
    total_records INTEGER;
    email_records INTEGER;
    uuid_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM user_organizations;
    
    SELECT COUNT(*) INTO email_records 
    FROM user_organizations 
    WHERE user_id ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    
    SELECT COUNT(*) INTO uuid_records 
    FROM user_organizations 
    WHERE user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    RAISE NOTICE 'User organizations verification:';
    RAISE NOTICE '  Total records: %', total_records;
    RAISE NOTICE '  Email-based records: %', email_records;
    RAISE NOTICE '  UUID-based records: %', uuid_records;
    
    IF email_records > 0 THEN
        RAISE WARNING 'Still have % email-based records that need manual attention', email_records;
    ELSE
        RAISE NOTICE 'All user_organizations records now use proper UUIDs!';
    END IF;
END $$;