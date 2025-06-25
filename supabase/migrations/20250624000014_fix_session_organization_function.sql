-- Fix the set_session_organization function to use the correct function name
-- The user_has_organization_access function was renamed to user_has_organization_access_direct

-- Drop the existing function first
DROP FUNCTION IF EXISTS set_session_organization(UUID);

-- Recreate the function with the correct function name
CREATE OR REPLACE FUNCTION set_session_organization(org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate that the user has access to this organization
    IF NOT user_has_organization_access_direct(org_id) THEN
        RAISE EXCEPTION 'Access denied to organization %', org_id;
    END IF;
    
    -- Set the session variable for RLS policies
    PERFORM set_config('app.current_organization_id', org_id::text, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_session_organization(UUID) TO authenticated;

-- Also update the get_current_user_organization_id function to use the correct function name
CREATE OR REPLACE FUNCTION get_current_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    org_id UUID;
    user_id_text TEXT;
BEGIN
    -- Get the current user ID
    user_id_text := auth.uid()::text;
    
    IF user_id_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Try to get organization_id from session first
    BEGIN
        SELECT current_setting('app.current_organization_id', true)::UUID INTO org_id;
        
        -- Validate that the user still has access to this organization
        IF org_id IS NOT NULL AND user_has_organization_access_direct(org_id) THEN
            RETURN org_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        org_id := NULL;
    END;
    
    -- If no valid session org, get user's first active organization
    SELECT uo.organization_id INTO org_id
    FROM user_organizations uo
    WHERE uo.user_id = user_id_text
    AND uo.status = 'active'
    ORDER BY uo.created_at ASC
    LIMIT 1;
    
    RETURN org_id;
END;
$$;

-- Add a function to get user's available organizations that bypasses RLS issues
CREATE OR REPLACE FUNCTION get_user_available_organizations(target_user_id TEXT)
RETURNS TABLE (
    user_org_id UUID,
    user_id TEXT,
    organization_id UUID,
    role TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    org_name TEXT,
    org_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow users to query their own organizations or superadmins to query any
    IF target_user_id != auth.uid()::text AND NOT is_super_admin_direct() THEN
        RAISE EXCEPTION 'Access denied: can only query your own organizations';
    END IF;
    
    RETURN QUERY
    SELECT 
        uo.id as user_org_id,
        uo.user_id,
        uo.organization_id,
        uo.role,
        uo.status,
        uo.created_at,
        uo.updated_at,
        o.name as org_name,
        o.created_at as org_created_at
    FROM user_organizations uo
    JOIN organizations o ON o.id = uo.organization_id
    WHERE uo.user_id = target_user_id
    AND uo.status = 'active'
    ORDER BY uo.created_at ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_available_organizations(TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION set_session_organization(UUID) IS 'Sets the current organization context in the database session for RLS policies - updated to use user_has_organization_access_direct';
COMMENT ON FUNCTION get_user_available_organizations(TEXT) IS 'Returns available organizations for a user, bypassing RLS issues';
