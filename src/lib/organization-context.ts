// Organization Context Management
import { supabase } from './supabase';

let currentOrganizationId: string | null = null;
let organizationContextSet = false;

export function setCurrentOrganization(organizationId: string | null): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      currentOrganizationId = organizationId;
      console.log('Setting organization context to:', organizationId);
      
      if (organizationId) {
        // Set the organization context in the database session for RLS
        try {
          const { data: user } = await supabase.auth.getUser();
          if (!user.user?.id) {
            reject(new Error('User not authenticated'));
            return;
          }

          const { data, error } = await supabase
            .from('user_organizations')
            .select('organization_id')
            .eq('organization_id', organizationId)
            .eq('user_id', user.user.id)
            .eq('status', 'active');

          if (error) {
            console.error('Organization context validation failed:', error);
            reject(new Error(`Invalid organization or access denied: ${error.message}`));
            return;
          }

          // Check if user has access to the organization
          if (!data || data.length === 0) {
            console.error('User does not have access to organization:', organizationId);
            reject(new Error('Access denied. You do not have permission to access this organization.'));
            return;
          }

        } catch (contextError) {
          console.error('Failed to set organization context:', contextError);
          reject(new Error(`Failed to set organization context: ${contextError}`));
          return;
        }

        organizationContextSet = true;
        console.log('Organization context set successfully');
      } else {
        organizationContextSet = false;
      }
      
      resolve();
    } catch (error) {
      console.error('Error setting organization context:', error);
      reject(error);
    }
  });
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
      .eq('status', 'active');

    if (error) {
      console.error('Error validating organization access:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error validating organization access:', error);
    return false;
  }
}

// Enhanced error handling for API calls
export function handleOrganizationError(error: any): Error {
  if (error?.code === '42501') {
    return new Error('Access denied. Please check your organization permissions.');
  }
  
  if (error?.code === 'PGRST301') {
    return new Error('Organization context required. Please select an organization.');
  }
  
  if (error?.message?.includes('organization')) {
    return new Error('Organization access error. Please try switching organizations or contact support.');
  }
  
  return error;
}