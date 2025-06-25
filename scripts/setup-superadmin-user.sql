-- SuperAdmin User Setup Script
-- Run this in Supabase SQL Editor after creating the auth user
-- 
-- INSTRUCTIONS:
-- 1. First create the user in Supabase Auth Dashboard
-- 2. Copy the User ID from the dashboard
-- 3. Replace 'YOUR_USER_ID_HERE' below with the actual UUID
-- 4. Run this script in SQL Editor

-- ⚠️  REPLACE THIS WITH THE ACTUAL USER ID FROM SUPABASE AUTH DASHBOARD ⚠️
-- Example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
\set superadmin_user_id 'YOUR_USER_ID_HERE'

-- Setup SuperAdmin User
DO $$
DECLARE
    superadmin_user_id UUID := :'superadmin_user_id'; -- This will use the variable above
    system_org_id UUID;
    user_exists BOOLEAN := FALSE;
    org_access_exists BOOLEAN := FALSE;
BEGIN
    -- Validate that a real UUID was provided
    IF superadmin_user_id = '00000000-0000-0000-0000-000000000000'::UUID OR 
       superadmin_user_id::TEXT = 'YOUR_USER_ID_HERE' THEN
        RAISE EXCEPTION 'Please replace YOUR_USER_ID_HERE with the actual User ID from Supabase Auth Dashboard';
    END IF;

    -- Get the system organization ID
    SELECT id INTO system_org_id 
    FROM public.organizations 
    WHERE slug = 'system-admin' 
    LIMIT 1;
    
    IF system_org_id IS NULL THEN
        RAISE EXCEPTION 'System organization not found. Please run the migration first.';
    END IF;
    
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = superadmin_user_id) INTO user_exists;
    
    -- Insert or update the user in public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role_id,
        status,
        created_at,
        updated_at
    )
    VALUES (
        superadmin_user_id,
        'superadmin@fruitshop.com',
        'Super Administrator',
        'admin',
        'active',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role_id = EXCLUDED.role_id,
        status = EXCLUDED.status,
        updated_at = NOW();

    -- Check if organization access already exists
    SELECT EXISTS(
        SELECT 1 FROM public.user_organizations 
        WHERE user_id = superadmin_user_id AND organization_id = system_org_id
    ) INTO org_access_exists;

    -- Grant superadmin access to system organization
    INSERT INTO public.user_organizations (
        id,
        user_id,
        organization_id,
        role,
        status,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        superadmin_user_id,
        system_org_id,
        'superadmin',
        'active',
        NOW(),
        NOW()
    ) ON CONFLICT (user_id, organization_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW();
    
    -- Success messages
    IF user_exists THEN
        RAISE NOTICE '✅ Updated existing user record for SuperAdmin';
    ELSE
        RAISE NOTICE '✅ Created new user record for SuperAdmin';
    END IF;
    
    IF org_access_exists THEN
        RAISE NOTICE '✅ Updated SuperAdmin organization access';
    ELSE
        RAISE NOTICE '✅ Granted SuperAdmin access to System Administration organization';
    END IF;
    
    RAISE NOTICE '🎉 SuperAdmin user setup completed successfully!';
    RAISE NOTICE '📧 Email: superadmin@fruitshop.com';
    RAISE NOTICE '🆔 User ID: %', superadmin_user_id;
    RAISE NOTICE '🏢 Organization: System Administration';
    RAISE NOTICE '🔑 Role: superadmin';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 You can now login at /superadmin/login';
    
END $$;

-- Verification queries
SELECT 
    '=== SuperAdmin User Verification ===' as status,
    u.id,
    u.email,
    u.full_name,
    u.role_id,
    u.status
FROM public.users u 
WHERE u.email = 'superadmin@fruitshop.com';

SELECT 
    '=== SuperAdmin Organization Access ===' as status,
    uo.role,
    uo.status,
    o.name as organization_name,
    o.slug as organization_slug
FROM public.user_organizations uo
JOIN public.organizations o ON uo.organization_id = o.id
JOIN public.users u ON uo.user_id = u.id
