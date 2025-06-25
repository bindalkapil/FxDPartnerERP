-- Create SuperAdmin Auth User
-- This migration creates the superadmin user directly in auth.users table

-- Insert the superadmin user into auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '48f7d506-fea1-4823-b859-340a3e78fc20'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'superadmin@fruitshop.com',
    crypt('superadmin123', gen_salt('bf')), -- Password: superadmin123
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Super Administrator"}',
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- Insert into auth.identities (only if not exists)
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) 
SELECT 
    '48f7d506-fea1-4823-b859-340a3e78fc20',
    '48f7d506-fea1-4823-b859-340a3e78fc20'::uuid,
    '{"sub": "48f7d506-fea1-4823-b859-340a3e78fc20", "email": "superadmin@fruitshop.com", "email_verified": true, "phone_verified": false}',
    'email',
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities 
    WHERE user_id = '48f7d506-fea1-4823-b859-340a3e78fc20'::uuid 
    AND provider = 'email'
);

-- Now run the custom setup script logic
DO $$
DECLARE
    superadmin_user_id UUID := '48f7d506-fea1-4823-b859-340a3e78fc20';
    system_org_id UUID;
    user_exists BOOLEAN := FALSE;
    org_access_exists BOOLEAN := FALSE;
BEGIN
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
        WHERE user_id = superadmin_user_id::text AND organization_id = system_org_id
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
        superadmin_user_id::text,
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
    RAISE NOTICE '🔑 Password: superadmin123';
    RAISE NOTICE '🆔 User ID: %', superadmin_user_id;
    RAISE NOTICE '🏢 Organization: System Administration';
    RAISE NOTICE '🔑 Role: superadmin';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 You can now login at /superadmin/login';
    
END $$;

-- Add comment for documentation
COMMENT ON TABLE auth.users IS 'Auth users table with superadmin user created';
