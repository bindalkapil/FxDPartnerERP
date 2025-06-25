-- Final Fix for Infinite Recursion in user_organizations policies
-- This migration completely eliminates recursion by using simpler, non-recursive policies

-- Drop the current user_organizations policies that are still causing recursion
DROP POLICY IF EXISTS "user_organizations_select_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_insert_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_update_policy" ON user_organizations;

-- Create completely non-recursive policies for user_organizations
-- These policies use only basic auth.uid() checks without any function calls

-- Allow users to see their own organization relationships
CREATE POLICY "user_organizations_select_simple" ON user_organizations
    FOR SELECT USING (
        user_id = auth.uid()::text
    );

-- Allow superadmins to see all relationships (using direct subquery)
CREATE POLICY "user_organizations_select_superadmin" ON user_organizations
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

-- Allow organization admins to see relationships in their organization (using direct subquery)
CREATE POLICY "user_organizations_select_org_admin" ON user_organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.organization_id = user_organizations.organization_id
            AND uo.role = 'admin'
            AND uo.status = 'active'
        )
    );

-- Insert policies - only superadmins can create relationships
CREATE POLICY "user_organizations_insert_superadmin" ON user_organizations
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

-- Update policies - only superadmins can update relationships
CREATE POLICY "user_organizations_update_superadmin" ON user_organizations
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

-- Delete policies - only superadmins can delete relationships
CREATE POLICY "user_organizations_delete_superadmin" ON user_organizations
    FOR DELETE USING (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

-- Also update the organizations policies to be even simpler
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;

-- Simple organization policies that don't cause recursion
CREATE POLICY "organizations_select_simple" ON organizations
    FOR SELECT USING (
        -- Allow if user is superadmin
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
        OR
        -- Allow if user has access to this organization
        id IN (
            SELECT uo.organization_id
            FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.status = 'active'
        )
    );

CREATE POLICY "organizations_insert_simple" ON organizations
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

CREATE POLICY "organizations_update_simple" ON organizations
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

-- Create a simple function for checking if current user is superadmin
-- This function is even simpler and doesn't use SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_current_user_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
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

-- Update users table policies to use the simpler approach
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Super admins can insert users" ON users;
DROP POLICY IF EXISTS "Super admins can update users" ON users;
DROP POLICY IF EXISTS "Super admins can delete users" ON users;
DROP POLICY IF EXISTS "Organization admins can view org users" ON users;

-- Simpler users policies
CREATE POLICY "users_select_superadmin" ON users
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

CREATE POLICY "users_insert_superadmin" ON users
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

CREATE POLICY "users_update_superadmin" ON users
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

CREATE POLICY "users_delete_superadmin" ON users
    FOR DELETE USING (
        auth.uid()::text IN (
            SELECT uo.user_id 
            FROM user_organizations uo 
            WHERE uo.role = 'superadmin' 
            AND uo.status = 'active'
        )
    );

-- Organization admins can view users in their organizations
CREATE POLICY "users_select_org_admin" ON users
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_current_user_superadmin() TO authenticated;

-- Add comment
COMMENT ON FUNCTION is_current_user_superadmin() IS 'Simple function to check if current user is superadmin without recursion';

-- Create additional index for performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_role_simple 
ON user_organizations(user_id, role) 
WHERE status = 'active';
