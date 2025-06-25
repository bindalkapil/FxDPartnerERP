-- Fix SuperAdmin Auth User Creation
-- This migration properly creates the superadmin user using Supabase's auth functions

-- First, let's clean up any existing user
DELETE FROM auth.identities WHERE user_id = '48f7d506-fea1-4823-b859-340a3e78fc20'::uuid;
DELETE FROM auth.users WHERE id = '48f7d506-fea1-4823-b859-340a3e78fc20'::uuid;
DELETE FROM public.user_organizations WHERE user_id = '48f7d506-fea1-4823-b859-340a3e78fc20'::text;
DELETE FROM public.users WHERE id = '48f7d506-fea1-4823-b859-340a3e78fc20'::uuid;

-- Create the superadmin user with proper password hashing
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
    '$2b$10$2dNU3kTMVcy/58SrKrou4OEyovBERC6qwKUWmo1j2UzcRWJG5cb8q', -- Pre-hashed password for 'superadmin123'
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
);

-- Insert into auth.identities
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '48f7d506-fea1-4823-b859-340a3e78fc20',
    '48f7d506-fea1-4823-b859-340a3e78fc20'::uuid,
    '{"sub": "48f7d506-fea1-4823-b859-340a3e78fc20", "email": "superadmin@fruitshop.com", "email_verified": true, "phone_verified": false}',
    'email',
    NULL,
    NOW(),
    NOW()
);

-- Now create the user in public schema
DO $$
DECLARE
    superadmin_user_id UUID := '48f7d506-fea1-4823-b859-340a3e78fc20';
    system_org_id UUID;
BEGIN
    -- Get the system organization ID
    SELECT id INTO system_org_id 
    FROM public.organizations 
    WHERE slug = 'system-admin' 
    LIMIT 1;
    
    IF system_org_id IS NULL THEN
        RAISE EXCEPTION 'System organization not found. Please run the organization migration first.';
    END IF;
    
    -- Insert the user in public.users
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
    );

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
    );
    
    RAISE NOTICE '🎉 SuperAdmin user created successfully!';
    RAISE NOTICE '📧 Email: superadmin@fruitshop.com';
    RAISE NOTICE '🔑 Password: superadmin123';
    RAISE NOTICE '🆔 User ID: %', superadmin_user_id;
    RAISE NOTICE '🏢 Organization: System Administration';
    RAISE NOTICE '🔑 Role: superadmin';
    
END $$;
