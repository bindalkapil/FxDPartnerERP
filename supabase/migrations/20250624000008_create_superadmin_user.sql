-- Create SuperAdmin User and System Organization
-- This migration creates a real superadmin user in the database to replace the localStorage-based authentication

-- First, create a system organization for superadmin operations
INSERT INTO public.organizations (id, name, slug, status, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'System Administration',
    'system-admin',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Create the superadmin user in auth.users (this would typically be done through Supabase Auth)
-- Note: In production, you would create this user through the Supabase dashboard or auth API
-- This is a placeholder to show the expected user structure

-- Note: The superadmin user and organization access will be created manually
-- through the Supabase Auth Dashboard and then through the application UI
-- This migration only sets up the infrastructure (organization and policies)

-- Create additional RLS policies to ensure superadmin can access everything
-- Policy for organizations table
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;
CREATE POLICY "Super admins can manage all organizations" ON public.organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Policy for user_organizations table
DROP POLICY IF EXISTS "Super admins can manage all user organizations" ON public.user_organizations;
CREATE POLICY "Super admins can manage all user organizations" ON public.user_organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.organizations IS 'Organizations table with superadmin access policies';
COMMENT ON TABLE public.user_organizations IS 'User organization relationships with superadmin management policies';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_user_organizations_superadmin ON public.user_organizations(user_id, role) WHERE role = 'superadmin';

-- Instructions for manual setup:
-- 1. Create the superadmin user through Supabase Auth Dashboard or API:
--    - Email: superadmin@fruitshop.com
--    - Password: (set a secure password)
--    - User ID should match: 00000000-0000-0000-0000-000000000001
-- 2. The user will then be able to log in through the regular login flow
-- 3. The RLS policies will recognize them as a superadmin and grant full access

COMMENT ON COLUMN public.users.id IS 'User ID - for superadmin, should match the auth.users.id created through Supabase Auth';
