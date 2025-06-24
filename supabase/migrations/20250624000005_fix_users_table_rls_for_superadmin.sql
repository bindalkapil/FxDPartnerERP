-- Fix Users Table RLS Policies for Super Admin Access
-- This migration adds RLS policies to allow super admins to view and manage all users

-- Add policy for super admins to view all users
CREATE POLICY "Super admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Add policy for super admins to insert users
CREATE POLICY "Super admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Add policy for super admins to update users
CREATE POLICY "Super admins can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Add policy for super admins to delete users (if needed)
CREATE POLICY "Super admins can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Also allow organization admins to view users within their organization context
-- This provides more granular access for organization-level user management
CREATE POLICY "Organization admins can view users in their context" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo1
            WHERE uo1.user_id = auth.uid()::text
            AND uo1.role = 'admin'
            AND uo1.status = 'active'
            AND EXISTS (
                SELECT 1 FROM user_organizations uo2
                WHERE uo2.user_id = users.id::text
                AND uo2.organization_id = uo1.organization_id
                AND uo2.status = 'active'
            )
        )
    );

-- Add comments for documentation
COMMENT ON POLICY "Super admins can view all users" ON public.users IS 'Allows users with superadmin role in user_organizations to view all users in the system';
COMMENT ON POLICY "Super admins can insert users" ON public.users IS 'Allows users with superadmin role to create new users';
COMMENT ON POLICY "Super admins can update users" ON public.users IS 'Allows users with superadmin role to update any user';
COMMENT ON POLICY "Super admins can delete users" ON public.users IS 'Allows users with superadmin role to delete users';
COMMENT ON POLICY "Organization admins can view users in their context" ON public.users IS 'Allows organization admins to view users within their organization';

-- Create an index to optimize the policy checks
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_role_status ON user_organizations(user_id, role, status);
