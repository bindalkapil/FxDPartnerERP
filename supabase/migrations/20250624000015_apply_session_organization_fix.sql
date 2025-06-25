
-- Fix the set_session_organization function to use the correct function name
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

