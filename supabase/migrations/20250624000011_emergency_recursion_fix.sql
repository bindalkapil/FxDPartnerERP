-- Emergency Fix for Persistent Infinite Recursion
-- This migration temporarily disables RLS on user_organizations to break the recursion cycle
-- and implements a completely different approach

-- First, temporarily disable RLS on user_organizations to stop the recursion
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on user_organizations
DROP POLICY IF EXISTS "user_organizations_select_simple" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_select_superadmin" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_select_org_admin" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_insert_superadmin" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_update_superadmin" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_delete_superadmin" ON user_organizations;

-- Create a view that handles the security logic at the application level
-- This view will be used instead of direct table access
CREATE OR REPLACE VIEW user_organizations_secure AS
SELECT 
    uo.*
FROM user_organizations uo
WHERE 
    -- Users can see their own relationships
    uo.user_id = auth.uid()::text
    OR
    -- Superadmins can see all relationships
    auth.uid()::text IN (
        SELECT sa.user_id 
        FROM user_organizations sa 
        WHERE sa.role = 'superadmin' 
        AND sa.status = 'active'
    );

-- Grant access to the view
GRANT SELECT ON user_organizations_secure TO authenticated;

-- Create a simple function to check superadmin status without RLS
CREATE OR REPLACE FUNCTION check_is_superadmin(check_user_id TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_organizations 
    WHERE user_id = COALESCE(check_user_id, auth.uid()::text)
    AND role = 'superadmin' 
    AND status = 'active'
  );
$$;

-- Create a function to get user organizations without RLS issues
CREATE OR REPLACE FUNCTION get_user_organizations(target_user_id TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    organization_id UUID,
    role TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uo.id,
    uo.user_id,
    uo.organization_id,
    uo.role,
    uo.status,
    uo.created_at,
    uo.updated_at
  FROM user_organizations uo
  WHERE 
    uo.user_id = COALESCE(target_user_id, auth.uid()::text)
    AND uo.status = 'active'
    AND (
      -- User can see their own relationships
      uo.user_id = auth.uid()::text
      OR
      -- Superadmins can see all relationships
      check_is_superadmin()
    )
  ORDER BY uo.created_at DESC;
$$;

-- Create a function to get organizations for a user
CREATE OR REPLACE FUNCTION get_user_available_organizations(target_user_id TEXT DEFAULT NULL)
RETURNS TABLE (
    user_org_id UUID,
    user_id TEXT,
    organization_id UUID,
    role TEXT,
    status TEXT,
    org_name TEXT,
    org_created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uo.id as user_org_id,
    uo.user_id,
    uo.organization_id,
    uo.role,
    uo.status,
    o.name as org_name,
    o.created_at as org_created_at
  FROM user_organizations uo
  JOIN organizations o ON uo.organization_id = o.id
  WHERE 
    uo.user_id = COALESCE(target_user_id, auth.uid()::text)
    AND uo.status = 'active'
    AND (
      -- User can see their own relationships
      uo.user_id = auth.uid()::text
      OR
      -- Superadmins can see all relationships
      check_is_superadmin()
    )
  ORDER BY uo.created_at DESC;
$$;

-- Update organizations policies to use the new function
DROP POLICY IF EXISTS "organizations_select_simple" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_simple" ON organizations;
DROP POLICY IF EXISTS "organizations_update_simple" ON organizations;

CREATE POLICY "organizations_select_simple" ON organizations
    FOR SELECT USING (
        check_is_superadmin()
        OR
        id IN (
            SELECT organization_id 
            FROM get_user_organizations()
        )
    );

CREATE POLICY "organizations_insert_simple" ON organizations
    FOR INSERT WITH CHECK (check_is_superadmin());

CREATE POLICY "organizations_update_simple" ON organizations
    FOR UPDATE USING (check_is_superadmin());

-- Update users policies to use the new function
DROP POLICY IF EXISTS "users_select_superadmin" ON users;
DROP POLICY IF EXISTS "users_insert_superadmin" ON users;
DROP POLICY IF EXISTS "users_update_superadmin" ON users;
DROP POLICY IF EXISTS "users_delete_superadmin" ON users;
DROP POLICY IF EXISTS "users_select_org_admin" ON users;

CREATE POLICY "users_select_superadmin" ON users
    FOR SELECT USING (check_is_superadmin());

CREATE POLICY "users_insert_superadmin" ON users
    FOR INSERT WITH CHECK (check_is_superadmin());

CREATE POLICY "users_update_superadmin" ON users
    FOR UPDATE USING (check_is_superadmin());

CREATE POLICY "users_delete_superadmin" ON users
    FOR DELETE USING (check_is_superadmin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_is_superadmin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organizations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_available_organizations(TEXT) TO authenticated;

-- Add comments
COMMENT ON FUNCTION check_is_superadmin(TEXT) IS 'Check if user is superadmin without RLS recursion';
COMMENT ON FUNCTION get_user_organizations(TEXT) IS 'Get user organizations without RLS issues';
COMMENT ON FUNCTION get_user_available_organizations(TEXT) IS 'Get user organizations with org details without RLS issues';
COMMENT ON VIEW user_organizations_secure IS 'Secure view for user_organizations without RLS recursion';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_emergency_lookup 
ON user_organizations(user_id, status, role) 
WHERE status = 'active';
