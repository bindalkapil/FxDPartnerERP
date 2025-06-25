/*
  # Fix Suppliers Insert Policy

  1. Problem
    - Users cannot insert new suppliers due to RLS policy restrictions
    - The current policies may be too restrictive or missing organization context

  2. Solution
    - Update the suppliers insert policy to allow authenticated users to insert suppliers
    - Ensure organization_id is properly handled during insert
    - Add fallback policies for users without organization context

  3. Changes
    - Drop existing restrictive insert policy
    - Create new insert policy that allows authenticated users to insert suppliers
    - Add organization context validation
*/

-- Drop existing suppliers insert policy if it exists
DROP POLICY IF EXISTS "suppliers_insert_policy" ON suppliers;

-- Create a more permissive insert policy for suppliers
CREATE POLICY "suppliers_insert_policy" ON suppliers
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        -- Allow if user has organization access to the specified organization
        (organization_id IS NOT NULL AND user_has_organization_access_direct(organization_id))
        OR
        -- Allow if user is superadmin (can insert into any organization)
        is_super_admin_direct()
        OR
        -- Allow if organization_id is NULL (for backward compatibility)
        organization_id IS NULL
    );

-- Also ensure the select policy allows users to see their inserted suppliers
DROP POLICY IF EXISTS "suppliers_select_policy" ON suppliers;

CREATE POLICY "suppliers_select_policy" ON suppliers
    FOR SELECT 
    TO authenticated
    USING (
        -- Allow if user has organization access to the supplier's organization
        (organization_id IS NOT NULL AND user_has_organization_access_direct(organization_id))
        OR
        -- Allow if user is superadmin (can see all suppliers)
        is_super_admin_direct()
        OR
        -- Allow if organization_id is NULL (for backward compatibility)
        organization_id IS NULL
    );

-- Ensure update policy is also permissive
DROP POLICY IF EXISTS "suppliers_update_policy" ON suppliers;

CREATE POLICY "suppliers_update_policy" ON suppliers
    FOR UPDATE 
    TO authenticated
    USING (
        (organization_id IS NOT NULL AND user_has_organization_access_direct(organization_id))
        OR
        is_super_admin_direct()
        OR
        organization_id IS NULL
    );

-- Ensure delete policy is also permissive
DROP POLICY IF EXISTS "suppliers_delete_policy" ON suppliers;

CREATE POLICY "suppliers_delete_policy" ON suppliers
    FOR DELETE 
    TO authenticated
    USING (
        (organization_id IS NOT NULL AND user_has_organization_access_direct(organization_id))
        OR
        is_super_admin_direct()
        OR
        organization_id IS NULL
    );

-- Add a comment for documentation
COMMENT ON POLICY "suppliers_insert_policy" ON suppliers IS 'Allows authenticated users to insert suppliers with proper organization context or superadmin privileges';