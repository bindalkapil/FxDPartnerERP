# HTTP 406/409 Error Solution for Supabase Organization-Based RLS

## Problem Summary

The HTTP 406 (Not Acceptable) and 409 (Conflict) errors were occurring in your Supabase-powered ERP application due to:

1. **406 Not Acceptable**: RLS policies blocking data access because organization context wasn't properly set in the database session
2. **409 Conflict**: Conflicting RLS policies or attempts to create duplicate data without proper organization context

## Root Cause Analysis

The main issue was that the frontend application was not properly setting the organization context in the database session that RLS policies depend on. The RLS policies were looking for `current_setting('app.current_organization_id', true)` but this session variable was never being set.

## Solution Implementation

### 1. Database Functions (✅ Deployed)

Created new database functions in migration `20250624000007_add_session_organization_function.sql`:

```sql
-- Function to set organization context in database session
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

-- Enhanced function to get current organization with better fallback
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
```

### 2. Enhanced Frontend Organization Context (✅ Created)

Created `src/lib/organization-context-fix.ts` with improved organization context management:

**Key Features:**
- Proper database session setting via RPC calls
- Automatic context recovery from localStorage
- Enhanced error handling for 406/409 errors
- Wrapper function for API calls with automatic retry
- Comprehensive validation and fallback mechanisms

**Main Functions:**
```typescript
// Set organization context with database session
export async function setCurrentOrganization(organizationId: string | null): Promise<void>

// Wrapper for API calls with automatic context handling
export async function withOrganizationContext<T>(apiCall: () => Promise<T>): Promise<T>

// Enhanced error handling
export function handleOrganizationError(error: any): Error

// Auto-initialization on app load
export async function initializeOrganizationContext(): Promise<void>
```

### 3. Updated API Layer (✅ Updated)

Modified `src/lib/api.ts` to use the new organization context:

```typescript
// Import the enhanced context functions
import { 
  setCurrentOrganization as setOrgContext, 
  getCurrentOrganization as getCurrentOrgContext,
  ensureOrganizationContext,
  handleOrganizationError,
  withOrganizationContext
} from './organization-context-fix';

// Wrap API calls with organization context
export async function getProducts() {
  return withOrganizationContext(async () => {
    let query = supabase
      .from('products')
      .select(`*, skus(*)`)
      .order('created_at', { ascending: false });
    
    query = addOrganizationFilter(query);
    const { data, error } = await query;
    
    if (error) throw handleOrganizationError(error);
    return data;
  });
}
```

## Implementation Steps

### Step 1: Deploy Database Migration
```bash
npx supabase db push
```

### Step 2: Update Frontend Code

Replace imports in your components from:
```typescript
import { setCurrentOrganization, getCurrentOrganization } from './lib/organization-context';
```

To:
```typescript
import { setCurrentOrganization, getCurrentOrganization } from './lib/organization-context-fix';
```

### Step 3: Initialize Organization Context

Add to your main App component:
```typescript
import { initializeOrganizationContext } from './lib/organization-context-fix';

useEffect(() => {
  initializeOrganizationContext();
}, []);
```

### Step 4: Update Organization Switcher

In your organization switcher component:
```typescript
import { setCurrentOrganization, withOrganizationContext } from './lib/organization-context-fix';

const switchOrganization = async (orgId: string) => {
  try {
    await setCurrentOrganization(orgId);
    // Update local state
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Refresh data or navigate
    window.location.reload();
  } catch (error) {
    console.error('Organization switch failed:', error);
    alert('Failed to switch organization. Please try again.');
  }
};
```

## Error Resolution

### Before Fix:
- **406 Not Acceptable**: `GET /rest/v1/products?select=*&name=eq.Washington+Apple 406`
- **409 Conflict**: `POST /rest/v1/products?select=* 409`

### After Fix:
- Organization context properly set in database session
- RLS policies can access `current_setting('app.current_organization_id')`
- API calls work correctly with organization filtering
- Automatic retry mechanism for context issues

## Testing

Use the test script to verify the fix:
```bash
node scripts/test-organization-context-fix.js
```

The test will:
1. Authenticate a user
2. Set organization context
3. Test various API endpoints
4. Verify organization context is working
5. Confirm 406/409 errors are resolved

## Key Benefits

1. **Proper Session Management**: Database session variables are correctly set
2. **Automatic Recovery**: Context is automatically recovered from localStorage
3. **Enhanced Error Handling**: Specific error messages for organization issues
4. **Retry Mechanism**: Automatic retry for context-related failures
5. **Validation**: Proper validation of organization access
6. **Fallback Logic**: Multiple fallback mechanisms for robustness

## Monitoring

Add these checks to monitor organization context health:

```typescript
// Health check function
export const healthCheck = async () => {
  const checks = {
    auth: false,
    organization: false,
    database: false,
    apis: {}
  };
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    checks.auth = !!user;
    
    checks.organization = isOrganizationContextSet();
    
    const { error } = await supabase.from('organizations').select('id').limit(1);
    checks.database = !error;
    
    // Test key APIs
    const apis = ['products', 'customers', 'suppliers'];
    for (const api of apis) {
      try {
        await supabase.from(api).select('id').limit(1);
        checks.apis[api] = true;
      } catch {
        checks.apis[api] = false;
      }
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
  
  return checks;
};
```

## Prevention

To prevent similar issues in the future:

1. **Always use `withOrganizationContext()` wrapper** for new API functions
2. **Initialize organization context** on app load
3. **Handle organization switching** properly with session updates
4. **Monitor API errors** for organization-related issues
5. **Test with multiple organizations** to ensure proper isolation

## Conclusion

This solution addresses the root cause of the 406/409 errors by properly implementing organization context in the database session. The RLS policies can now correctly access the organization context, and the frontend has robust error handling and recovery mechanisms.

The fix is backward compatible and includes comprehensive error handling to ensure a smooth user experience even when organization context issues occur.
