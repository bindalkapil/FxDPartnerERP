// Enhanced Organization Context Management with proper session handling
import { supabase } from './supabase';

let currentOrganizationId: string | null = null;
let organizationContextSet = false;

// Function to set organization context in database session
async function setDatabaseSessionOrganization(organizationId: string | null): Promise<void> {
  if (organizationId) {
    // Set the session variable that RLS policies use
    try {
      const { error } = await (supabase as any).rpc('set_session_organization', {
        org_id: organizationId
      });
      
      if (error) {
        console.error('Failed to set database session organization:', error);
      } else {
        console.log('Database session organization set successfully');
      }
    } catch (rpcError) {
      console.error('RPC call failed:', rpcError);
      // Fallback: try using raw SQL
      try {
        await supabase.from('organizations').select('1').limit(0); // Just to establish connection
        // The RLS function will handle the fallback logic
      } catch (fallbackError) {
        console.error('Fallback session setting also failed:', fallbackError);
      }
    }
  }
}

export async function setCurrentOrganization(organizationId: string | null): Promise<void> {
  try {
    console.log('Setting organization context to:', organizationId);
    
    if (organizationId) {
      // First validate user has access to this organization
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) {
        throw new Error('User not authenticated');
      }

      // Check if user has access to this organization
      const { data: userOrg, error: accessError } = await supabase
        .from('user_organizations')
        .select('organization_id, role, status')
        .eq('organization_id', organizationId)
        .eq('user_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (accessError && accessError.code !== 'PGRST116') {
        console.error('Organization access validation failed:', accessError);
        throw new Error(`Access validation failed: ${accessError.message}`);
      }

      if (!userOrg) {
        throw new Error('Access denied to this organization');
      }

      // Set the database session organization
      await setDatabaseSessionOrganization(organizationId);
    }

    // Update local state
    currentOrganizationId = organizationId;
    organizationContextSet = organizationId !== null;
    
    console.log('Organization context set successfully:', {
      organizationId,
      contextSet: organizationContextSet
    });
    
  } catch (error) {
    console.error('Error setting organization context:', error);
    // Reset local state on error
    currentOrganizationId = null;
    organizationContextSet = false;
    throw error;
  }
}

export function getCurrentOrganization(): string | null {
  return currentOrganizationId;
}

export function isOrganizationContextSet(): boolean {
  return organizationContextSet && currentOrganizationId !== null;
}

// Helper function to ensure organization context is set before API calls
export async function ensureOrganizationContext(): Promise<void> {
  if (!isOrganizationContextSet()) {
    // Try to recover from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.currentOrganization?.id) {
          console.log('Attempting to recover organization context from localStorage');
          await setCurrentOrganization(user.currentOrganization.id);
          return;
        }
      } catch (error) {
        console.error('Failed to recover organization context:', error);
      }
    }
    
    throw new Error('Organization context not set. Please select an organization first.');
  }
}

// Helper function to validate organization access
export async function validateOrganizationAccess(organizationId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error validating organization access:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error validating organization access:', error);
    return false;
  }
}

// Enhanced error handling for API calls
export function handleOrganizationError(error: any): Error {
  console.error('Organization error details:', error);
  
  if (error?.code === '42501') {
    return new Error('Access denied. Please check your organization permissions.');
  }
  
  if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
    return new Error('Authentication required. Please log in again.');
  }
  
  if (error?.code === '406' || error?.message?.includes('Not Acceptable')) {
    return new Error('Organization context required. Please select an organization and try again.');
  }
  
  if (error?.code === '409' || error?.message?.includes('Conflict')) {
    return new Error('Data conflict detected. This may be due to duplicate entries or permission issues.');
  }
  
  if (error?.message?.includes('organization')) {
    return new Error('Organization access error. Please try switching organizations or contact support.');
  }
  
  return error instanceof Error ? error : new Error(String(error));
}

// Wrapper function for API calls with automatic organization context handling
export async function withOrganizationContext<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    // Ensure organization context is set
    await ensureOrganizationContext();
    
    // Make the API call
    return await apiCall();
  } catch (error) {
    // Handle organization-specific errors
    const handledError = handleOrganizationError(error);
    
    // If it's an organization context error, try to refresh context
    if ((error as any)?.code === 'PGRST301' || (error as any)?.message?.includes('organization') || (error as any)?.code === '406') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.currentOrganization) {
        try {
          console.log('Attempting to refresh organization context');
          await setCurrentOrganization(user.currentOrganization.id);
          // Retry the API call once
          return await apiCall();
        } catch (retryError) {
          console.error('Failed to retry after context refresh:', retryError);
        }
      }
    }
    
    throw handledError;
  }
}

// Function to clear organization context (for logout)
export function clearOrganizationContext(): void {
  currentOrganizationId = null;
  organizationContextSet = false;
  console.log('Organization context cleared');
}

// Function to get user's available organizations
export async function getUserAvailableOrganizations() {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_organizations')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', user.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    throw error;
  }
}

// Function to auto-set organization context on app load
export async function initializeOrganizationContext(): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('User not authenticated, skipping organization context initialization');
      return;
    }

    // Try to get organization from localStorage first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.currentOrganization?.id) {
          console.log('Initializing organization context from localStorage');
          await setCurrentOrganization(userData.currentOrganization.id);
          return;
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
      }
    }

    // If no stored organization, get user's first available organization
    const userOrgs = await getUserAvailableOrganizations();
    if (userOrgs && userOrgs.length > 0) {
      console.log('Setting default organization context');
      await setCurrentOrganization(userOrgs[0].organization_id);
    } else {
      console.warn('User has no available organizations');
    }
  } catch (error) {
    console.error('Failed to initialize organization context:', error);
  }
}
