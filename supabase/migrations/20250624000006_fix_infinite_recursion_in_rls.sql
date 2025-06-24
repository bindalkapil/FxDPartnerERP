-- Fix Infinite Recursion in RLS Policies
-- This migration fixes the circular dependency issue in the RLS policies

-- First, drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update users" ON public.users;
DROP POLICY IF EXISTS "Super admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Organization admins can view users in their context" ON public.users;

-- Create a simpler, non-recursive function to check if user is super admin
-- This function uses a direct query without relying on RLS policies
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_id = auth.uid()::text 
    AND role = 'superadmin' 
    AND status = 'active'
  );
$$;

-- Create a function to check if user is organization admin for a specific org
CREATE OR REPLACE FUNCTION is_org_admin_for(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_id = auth.uid()::text 
    AND organization_id = org_id
    AND role = 'admin' 
    AND status = 'active'
  );
$$;

-- Now create the corrected RLS policies using the helper functions
-- These policies avoid recursion by using direct SQL functions

-- Super admins can view all users
CREATE POLICY "Super admins can view all users" ON public.users
    FOR SELECT USING (is_super_admin());

-- Super admins can insert users
CREATE POLICY "Super admins can insert users" ON public.users
    FOR INSERT WITH CHECK (is_super_admin());

-- Super admins can update users
CREATE POLICY "Super admins can update users" ON public.users
    FOR UPDATE USING (is_super_admin());

-- Super admins can delete users
CREATE POLICY "Super admins can delete users" ON public.users
    FOR DELETE USING (is_super_admin());

-- Organization admins can view users who belong to their organizations
CREATE POLICY "Organization admins can view org users" ON public.users
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

-- Also need to fix the user_organizations policies to avoid recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "user_organizations_select_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_insert_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_update_policy" ON user_organizations;

-- Create simpler policies for user_organizations
CREATE POLICY "user_organizations_select_policy" ON user_organizations
    FOR SELECT USING (
        user_id = auth.uid()::text  -- Users can see their own relationships
        OR is_super_admin()         -- Super admins can see all relationships
    );

CREATE POLICY "user_organizations_insert_policy" ON user_organizations
    FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "user_organizations_update_policy" ON user_organizations
    FOR UPDATE USING (is_super_admin());

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin_for(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION is_super_admin() IS 'Returns true if the current user has superadmin role in any organization';
COMMENT ON FUNCTION is_org_admin_for(UUID) IS 'Returns true if the current user is an admin for the specified organization';

-- Create index to optimize the helper function queries
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_role_status_optimized 
ON user_organizations(user_id, role, status) 
WHERE status = 'active';
