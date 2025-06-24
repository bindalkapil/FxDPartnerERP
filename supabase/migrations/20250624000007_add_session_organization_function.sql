-- Add function to set organization context in database session
-- This function will be called from the frontend to set the organization context for RLS

CREATE OR REPLACE FUNCTION set_session_organization(org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate that the user has access to this organization
    IF NOT user_has_organization_access(org_id) THEN
        RAISE EXCEPTION 'Access denied to organization %', org_id;
    END IF;
    
    -- Set the session variable for RLS policies
    PERFORM set_config('app.current_organization_id', org_id::text, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_session_organization(UUID) TO authenticated;

-- Update the get_current_user_organization_id function to be more robust
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
        IF org_id IS NOT NULL AND user_has_organization_access(org_id) THEN
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

-- Add a function to clear session organization
CREATE OR REPLACE FUNCTION clear_session_organization()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('app.current_organization_id', '', false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION clear_session_organization() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION set_session_organization(UUID) IS 'Sets the current organization context in the database session for RLS policies';
COMMENT ON FUNCTION clear_session_organization() IS 'Clears the current organization context from the database session';
