# HTTP 406/409 Error Resolution Guide

## Overview
This guide addresses the HTTP 406 (Not Acceptable) and 409 (Conflict) errors occurring in your Supabase-powered ERP application after implementing organization-based Row Level Security (RLS).

## Root Causes

### 406 Not Acceptable Error
- **Primary Cause**: RLS policies blocking data access due to missing or invalid organization context
- **Secondary Cause**: User authentication state not properly synchronized with organization context
- **Tertiary Cause**: Database session variables not being set correctly

### 409 Conflict Error
- **Primary Cause**: Conflicting RLS policies or circular dependencies
- **Secondary Cause**: Organization ID validation failures during data insertion
- **Tertiary Cause**: Infinite recursion in RLS policy functions

## Immediate Solutions

### 1. Organization Context Validation
```typescript
// Check if organization context is properly set
import { getCurrentOrganization, isOrganizationContextSet } from './lib/organization-context';

// Before making any API calls:
if (!isOrganizationContextSet()) {
  console.error('Organization context not set');
  // Redirect user to organization selection or login
}
```

### 2. Enhanced Error Handling
```typescript
// Wrap API calls with proper error handling
import { handleOrganizationError } from './lib/organization-context';

try {
  const data = await getProducts();
} catch (error) {
  const handledError = handleOrganizationError(error);
  console.error('API Error:', handledError.message);
  // Show user-friendly error message
}
```

### 3. Debug Organization Context
```typescript
// Add this to your main component to debug organization context
useEffect(() => {
  const debugOrgContext = () => {
    console.log('Current Organization:', getCurrentOrganization());
    console.log('Context Set:', isOrganizationContextSet());
  };
  
  debugOrgContext();
  // Run every 5 seconds to monitor context
  const interval = setInterval(debugOrgContext, 5000);
  return () => clearInterval(interval);
}, []);
```

## Step-by-Step Resolution

### Step 1: Verify Database Connection
```sql
-- Run this query in Supabase SQL Editor to check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

### Step 2: Check User Authentication
```typescript
// Add to your login component
const checkUserAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current User:', user);
  
  if (user) {
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', user.id);
    console.log('User Organizations:', userOrgs);
  }
};
```

### Step 3: Validate Organization Access
```typescript
// Add this function to test organization access
const testOrganizationAccess = async (orgId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .single();
    
    if (error) {
      console.error('Organization access test failed:', error);
      return false;
    }
    
    console.log('Organization access confirmed:', data);
    return true;
  } catch (error) {
    console.error('Organization access test error:', error);
    return false;
  }
};
```

### Step 4: Test API Endpoints
```typescript
// Create a test function to verify API endpoints
const testAPIEndpoints = async () => {
  const endpoints = [
    { name: 'Products', fn: () => getProducts() },
    { name: 'Customers', fn: () => getCustomers() },
    { name: 'Suppliers', fn: () => getSuppliers() },
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const data = await endpoint.fn();
      console.log(`✅ ${endpoint.name}: ${data?.length || 0} records`);
    } catch (error) {
      console.error(`❌ ${endpoint.name}:`, error);
    }
  }
};
```

## Database Fixes

### Fix 1: Update RLS Helper Functions
```sql
-- Create a more robust organization context function
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
    EXCEPTION WHEN OTHERS THEN
        org_id := NULL;
    END;
    
    -- If no session org, get user's first active organization
    IF org_id IS NULL THEN
        SELECT uo.organization_id INTO org_id
        FROM user_organizations uo
        WHERE uo.user_id = user_id_text
        AND uo.status = 'active'
        ORDER BY uo.created_at ASC
        LIMIT 1;
    END IF;
    
    RETURN org_id;
END;
$$;
```

### Fix 2: Simplify RLS Policies
```sql
-- Example: Simplified products policy
DROP POLICY IF EXISTS "products_select_policy" ON products;
CREATE POLICY "products_select_policy" ON products
    FOR SELECT USING (
        organization_id IS NULL -- Global products
        OR organization_id = get_current_user_organization_id()
        OR EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.user_id = auth.uid()::text
            AND uo.role = 'superadmin'
            AND uo.status = 'active'
        )
    );
```

## Frontend Fixes

### Fix 1: Enhanced Organization Switcher
```typescript
// Update your organization switcher component
const switchOrganization = async (orgId: string) => {
  try {
    setLoading(true);
    
    // Validate access first
    const hasAccess = await validateOrganizationAccess(orgId);
    if (!hasAccess) {
      throw new Error('Access denied to this organization');
    }
    
    // Set organization context
    await setCurrentOrganization(orgId);
    
    // Update user state
    const updatedUser = {
      ...user,
      currentOrganization: user.organizations.find(org => org.id === orgId)
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Refresh page data
    window.location.reload();
    
  } catch (error) {
    console.error('Organization switch failed:', error);
    alert('Failed to switch organization. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Fix 2: API Call Wrapper
```typescript
// Create a wrapper for all API calls
const withOrganizationContext = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    // Ensure organization context is set
    await ensureOrganizationContext();
    
    // Make the API call
    return await apiCall();
  } catch (error) {
    // Handle organization-specific errors
    const handledError = handleOrganizationError(error);
    
    // If it's an organization context error, try to refresh context
    if (error?.code === 'PGRST301' || error?.message?.includes('organization')) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.currentOrganization) {
        await setCurrentOrganization(user.currentOrganization.id);
        // Retry the API call once
        return await apiCall();
      }
    }
    
    throw handledError;
  }
};

// Usage example:
const loadProducts = async () => {
  try {
    const products = await withOrganizationContext(() => getProducts());
    setProducts(products);
  } catch (error) {
    console.error('Failed to load products:', error);
    setError(error.message);
  }
};
```

## Testing and Verification

### 1. Browser Console Tests
```javascript
// Run these in browser console to test
// Test 1: Check current organization
console.log('Current Org:', getCurrentOrganization());

// Test 2: Test API call
getProducts().then(console.log).catch(console.error);

// Test 3: Check user session
supabase.auth.getUser().then(console.log);
```

### 2. Network Tab Analysis
- Open browser DevTools → Network tab
- Look for failed requests to Supabase
- Check request headers for organization context
- Verify response status codes and error messages

### 3. Supabase Dashboard Monitoring
- Go to Supabase Dashboard → Logs
- Filter by error level
- Look for RLS policy violations
- Check for authentication failures

## Prevention Strategies

### 1. Organization Context Middleware
```typescript
// Create middleware to ensure organization context
export const withOrgContext = (handler: Function) => {
  return async (...args: any[]) => {
    if (!isOrganizationContextSet()) {
      throw new Error('Organization context required');
    }
    return handler(...args);
  };
};

// Apply to all API functions
export const getProducts = withOrgContext(async () => {
  // ... existing implementation
});
```

### 2. Automatic Context Recovery
```typescript
// Add to your app's root component
useEffect(() => {
  const recoverOrganizationContext = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.currentOrganization && !isOrganizationContextSet()) {
      try {
        await setCurrentOrganization(user.currentOrganization.id);
        console.log('Organization context recovered');
      } catch (error) {
        console.error('Failed to recover organization context:', error);
      }
    }
  };
  
  recoverOrganizationContext();
}, []);
```

### 3. Error Boundary for Organization Errors
```typescript
class OrganizationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    if (error.message.includes('organization') || error.code === 'PGRST301') {
      return { hasError: true, error };
    }
    return null;
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Organization Access Error</h2>
          <p>Please select an organization or contact support.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Monitoring and Alerts

### 1. Error Tracking
```typescript
// Add to your error tracking service
const trackOrganizationError = (error: any, context: any) => {
  if (error?.code === '406' || error?.code === '409' || 
      error?.message?.includes('organization')) {
    // Send to error tracking service
    console.error('Organization Error:', {
      error: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
      user: getCurrentUser(),
      organization: getCurrentOrganization()
    });
  }
};
```

### 2. Health Check Endpoint
```typescript
// Create a health check function
export const healthCheck = async () => {
  const checks = {
    auth: false,
    organization: false,
    database: false,
    apis: {}
  };
  
  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    checks.auth = !!user;
    
    // Check organization context
    checks.organization = isOrganizationContextSet();
    
    // Check database connection
    const { error } = await supabase.from('organizations').select('id').limit(1);
    checks.database = !error;
    
    // Check key APIs
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

This comprehensive guide should help you identify and resolve the HTTP 406/409 errors in your application. Start with the immediate solutions and work through the step-by-step resolution process.
