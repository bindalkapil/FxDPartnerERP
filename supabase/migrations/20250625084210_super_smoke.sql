/*
  # Fix Suppliers RLS Policies with Simple SQL

  This migration fixes the suppliers table RLS policies to allow proper insert operations
  without relying on potentially missing functions.
*/

-- Drop existing suppliers policies
DROP POLICY IF EXISTS "suppliers_insert_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_select_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update_policy" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete_policy" ON suppliers;

-- Create simple insert policy for suppliers
CREATE POLICY "suppliers_insert_policy" ON suppliers
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        -- Allow if organization_id is NULL (for backward compatibility)
        organization_id IS NULL
        OR
        -- Allow if user has access to the organization (direct check)
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.organization_id = suppliers.organization_id
            AND uo.status = 'active'
        )
        OR
        -- Allow if user is superadmin
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Create simple select policy for suppliers
CREATE POLICY "suppliers_select_policy" ON suppliers
    FOR SELECT 
    TO authenticated
    USING (
        -- Allow if organization_id is NULL (for backward compatibility)
        organization_id IS NULL
        OR
        -- Allow if user has access to the organization
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.organization_id = suppliers.organization_id
            AND uo.status = 'active'
        )
        OR
        -- Allow if user is superadmin
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Create simple update policy for suppliers
CREATE POLICY "suppliers_update_policy" ON suppliers
    FOR UPDATE 
    TO authenticated
    USING (
        organization_id IS NULL
        OR
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.organization_id = suppliers.organization_id
            AND uo.status = 'active'
        )
        OR
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Create simple delete policy for suppliers
CREATE POLICY "suppliers_delete_policy" ON suppliers
    FOR DELETE 
    TO authenticated
    USING (
        organization_id IS NULL
        OR
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.organization_id = suppliers.organization_id
            AND uo.status = 'active'
        )
        OR
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );

-- Ensure RLS is enabled on suppliers table
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON POLICY "suppliers_insert_policy" ON suppliers IS 'Allows authenticated users to insert suppliers with organization access or superadmin privileges';
COMMENT ON POLICY "suppliers_select_policy" ON suppliers IS 'Allows authenticated users to select suppliers with organization access or superadmin privileges';
COMMENT ON POLICY "suppliers_update_policy" ON suppliers IS 'Allows authenticated users to update suppliers with organization access or superadmin privileges';
COMMENT ON POLICY "suppliers_delete_policy" ON suppliers IS 'Allows authenticated users to delete suppliers with organization access or superadmin privileges';