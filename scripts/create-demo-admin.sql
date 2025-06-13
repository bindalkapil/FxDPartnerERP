-- Create Demo Admin User
-- Run this AFTER applying the main migration
-- This creates a demo admin user for testing the role system

-- First, let's create a demo user in the auth.users table
-- Note: In a real scenario, users would sign up through your app
-- This is just for testing purposes

-- Insert demo user into auth.users (if it doesn't exist)
-- You'll need to replace this with actual user creation through Supabase Auth
-- For now, we'll just ensure the roles system works with existing users

-- Check if we have any authenticated users and assign admin role to the first one
-- (This is a temporary solution for testing)

DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user from auth.users (if any exist)
    SELECT id INTO first_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        -- Insert or update user in our users table with admin role
        INSERT INTO public.users (id, email, full_name, role_id, status)
        SELECT 
            first_user_id,
            email,
            COALESCE(raw_user_meta_data->>'full_name', email, 'Demo User'),
            'admin',
            'active'
        FROM auth.users 
        WHERE id = first_user_id
        ON CONFLICT (id) DO UPDATE SET
            role_id = 'admin',
            status = 'active',
            updated_at = NOW();
            
        RAISE NOTICE 'Updated user % to admin role', first_user_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users table. Please sign up through your application first.';
    END IF;
END $$;

-- Alternative: Create a specific demo user entry
-- (This won't work without a corresponding auth.users entry)
-- But it shows the structure for when you do have authenticated users

-- Verification query
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role_id,
    r.name as role_name,
    u.status
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.role_id = 'admin';
