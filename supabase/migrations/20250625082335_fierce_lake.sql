-- Update user_organizations table to use proper UUIDs instead of email addresses
-- This fixes the core issue where email addresses were stored instead of UUIDs

DO $$
DECLARE
    user_record RECORD;
    org_record RECORD;
    auth_user_id UUID;
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
        SELECT id INTO auth_user_id
        FROM auth.users 
        WHERE email = org_record.user_id;
        
        IF FOUND THEN
            RAISE NOTICE 'Updating user_organizations: % -> %', org_record.user_id, auth_user_id;
            
            -- Delete the old record with email
            DELETE FROM user_organizations 
            WHERE user_id = org_record.user_id 
            AND organization_id = org_record.organization_id;
            
            -- Insert the corrected record with UUID
            INSERT INTO user_organizations (user_id, organization_id, role, status, created_at, updated_at)
            VALUES (
                auth_user_id::text,
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
            -- Delete orphaned records that don't have corresponding auth users
            DELETE FROM user_organizations 
            WHERE user_id = org_record.user_id 
            AND organization_id = org_record.organization_id;
            RAISE NOTICE 'Deleted orphaned record for email: %', org_record.user_id;
        END IF;
    END LOOP;
    
    -- Clean up any remaining invalid user_id entries that don't match UUID pattern
    DELETE FROM user_organizations 
    WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND user_id !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    
    RAISE NOTICE 'User organizations data fix completed.';
END $$;

-- Now add the constraint after cleaning up the data
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_organizations_user_id_uuid_check' 
        AND table_name = 'user_organizations'
    ) THEN
        -- Verify all data is clean before adding constraint
        IF EXISTS (
            SELECT 1 FROM user_organizations 
            WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        ) THEN
            RAISE WARNING 'Cannot add UUID constraint - some records still have invalid user_id format';
            
            -- Show the problematic records
            FOR user_record IN 
                SELECT user_id, organization_id, role 
                FROM user_organizations 
                WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                LIMIT 5
            LOOP
                RAISE WARNING 'Invalid user_id found: % (org: %, role: %)', 
                    user_record.user_id, user_record.organization_id, user_record.role;
            END LOOP;
        ELSE
            ALTER TABLE user_organizations 
            ADD CONSTRAINT user_organizations_user_id_uuid_check 
            CHECK (user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
            
            RAISE NOTICE 'Added UUID format constraint to user_organizations.user_id';
        END IF;
    ELSE
        RAISE NOTICE 'UUID constraint already exists on user_organizations.user_id';
    END IF;
END $$;

-- Verify the fix by showing current user_organizations data
DO $$
DECLARE
    total_records INTEGER;
    email_records INTEGER;
    uuid_records INTEGER;
    invalid_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_records FROM user_organizations;
    
    SELECT COUNT(*) INTO email_records 
    FROM user_organizations 
    WHERE user_id ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    
    SELECT COUNT(*) INTO uuid_records 
    FROM user_organizations 
    WHERE user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    SELECT COUNT(*) INTO invalid_records 
    FROM user_organizations 
    WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND user_id !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    
    RAISE NOTICE 'User organizations verification:';
    RAISE NOTICE '  Total records: %', total_records;
    RAISE NOTICE '  Email-based records: %', email_records;
    RAISE NOTICE '  UUID-based records: %', uuid_records;
    RAISE NOTICE '  Invalid records: %', invalid_records;
    
    IF email_records > 0 THEN
        RAISE WARNING 'Still have % email-based records that need manual attention', email_records;
    ELSIF invalid_records > 0 THEN
        RAISE WARNING 'Still have % invalid records that need manual attention', invalid_records;
    ELSE
        RAISE NOTICE 'All user_organizations records now use proper UUIDs!';
    END IF;
END $$;

-- Show sample of current data for verification
DO $$
DECLARE
    sample_record RECORD;
    sample_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Sample user_organizations records:';
    FOR sample_record IN 
        SELECT user_id, organization_id, role, status
        FROM user_organizations 
        ORDER BY created_at DESC
        LIMIT 3
    LOOP
        sample_count := sample_count + 1;
        RAISE NOTICE '  Record %: user_id=%, org_id=%, role=%', 
            sample_count, sample_record.user_id, sample_record.organization_id, sample_record.role;
    END LOOP;
    
    IF sample_count = 0 THEN
        RAISE NOTICE '  No records found in user_organizations table';
    END IF;
END $$;