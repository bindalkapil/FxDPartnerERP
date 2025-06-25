import { supabase } from './supabase';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

/**
 * Create a timeout promise helper
 */
function createTimeoutPromise<T>(ms: number, errorMessage: string): Promise<T> {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
}

/**
 * Fetch user's organizations with optimized approach and better error handling
 */
export async function fetchUserOrganizations(userId: string): Promise<Organization[]> {
  console.log('🔄 Fetching organizations for user:', userId);
  
  try {
    // Use a more direct approach with reasonable timeout
    const { data: userOrganizations, error } = await Promise.race([
      supabase
        .from('user_organizations')
        .select(`
          role,
          status,
          organization_id,
          organizations!inner (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(50),
      createTimeoutPromise(10000, 'Organizations fetch timeout')
    ]) as any;

    if (error) {
      console.warn('Organizations query error:', error);
      
      // If it's a timeout or performance issue, try a simpler approach
      if (error.message?.includes('timeout') || error.code === 'PGRST301') {
        return await fetchOrganizationsSimple(userId);
      }
      
      throw error;
    }

    if (!userOrganizations || userOrganizations.length === 0) {
      console.warn('No organizations found for user');
      return [];
    }

    const organizations: Organization[] = userOrganizations.map((uo: any) => ({
      id: uo.organizations.id,
      name: uo.organizations.name,
      slug: uo.organizations.slug,
      role: uo.role
    }));

    console.log('✅ Successfully fetched', organizations.length, 'organizations');
    return organizations;

  } catch (error) {
    console.warn('Primary organization fetch failed:', error);
    
    // Try simplified approach as fallback
    return await fetchOrganizationsSimple(userId);
  }
}

/**
 * Simplified organization fetch with minimal RLS complexity
 */
async function fetchOrganizationsSimple(userId: string): Promise<Organization[]> {
  console.log('🔄 Trying simplified organization fetch...');
  
  try {
    // First get user organizations without joins
    const { data: userOrgData, error: userOrgError } = await Promise.race([
      supabase
        .from('user_organizations')
        .select('organization_id, role')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(20),
      createTimeoutPromise(8000, 'Simple user orgs fetch timeout')
    ]) as any;

    if (userOrgError || !userOrgData || userOrgData.length === 0) {
      console.warn('No user organizations found in simple fetch');
      return [];
    }

    // Then get organization details separately
    const orgIds = userOrgData.map((uo: any) => uo.organization_id);
    
    const { data: orgData, error: orgError } = await Promise.race([
      supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', orgIds)
        .eq('status', 'active')
        .limit(20),
      createTimeoutPromise(8000, 'Organizations details fetch timeout')
    ]) as any;

    if (orgError || !orgData) {
      console.warn('Failed to fetch organization details');
      return [];
    }

    // Combine the data
    const organizations: Organization[] = userOrgData.map((uo: any) => {
      const org = orgData.find((o: any) => o.id === uo.organization_id);
      return org ? {
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: uo.role
      } : null;
    }).filter(Boolean);

    console.log('✅ Simple fetch successful:', organizations.length, 'organizations');
    return organizations;

  } catch (error) {
    console.warn('Simple organization fetch failed:', error);
    
    // Final fallback - return empty array to allow app to continue
    console.warn('❌ All organization fetch attempts failed, returning empty array');
    return [];
  }
}

/**
 * Get basic auth user info as immediate fallback
 */
async function getAuthUserFallback() {
  try {
    const { data: { user }, error: authError } = await Promise.race([
      supabase.auth.getUser(),
      createTimeoutPromise(5000, 'Auth user fetch timeout')
    ]) as any;
    
    if (authError || !user) {
      throw new Error('Failed to get auth user');
    }
    
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role_id: 'viewer',
      status: 'active'
    };
  } catch (error) {
    console.error('Auth user fallback failed:', error);
    throw error;
  }
}

/**
 * Fetch user profile with optimized approach and better error handling
 */
export async function fetchUserProfile(userId: string) {
  console.log('🔄 Fetching user profile for:', userId);
  
  try {
    // Try to fetch the full user profile with a reasonable timeout
    const { data: userProfile, error: profileError } = await Promise.race([
      supabase
        .from('users')
        .select('id, email, full_name, role_id, status')
        .eq('id', userId)
        .single(),
      createTimeoutPromise(30000, 'Profile fetch timeout') // Reduced from 60s to 30s
    ]) as any;

    if (profileError) {
      console.warn('Profile fetch error:', profileError);
      
      // Immediately try auth user fallback
      const fallbackProfile = await getAuthUserFallback();
      console.log('✅ Using fallback profile from auth user');
      
      // Try to fetch organizations but don't let it block the response
      const organizations = await fetchOrganizationsWithTimeout(userId, 8000);
      
      return {
        profile: fallbackProfile,
        organizations
      };
    }

    console.log('✅ User profile fetched:', userProfile.email);

    // Fetch organizations with timeout handling
    const organizations = await fetchOrganizationsWithTimeout(userId, 15000);

    return {
      profile: userProfile,
      organizations
    };

  } catch (error) {
    console.error('User profile fetch failed:', error);
    
    // Final fallback - try to get minimal info from auth
    try {
      const fallbackProfile = await getAuthUserFallback();
      console.log('✅ Using minimal fallback profile');
      
      return {
        profile: fallbackProfile,
        organizations: []
      };
    } catch (fallbackError) {
      console.error('All profile fetch attempts failed:', fallbackError);
      throw new Error('Unable to load user profile. Please try refreshing the page.');
    }
  }
}

/**
 * Fetch organizations with timeout and graceful failure
 */
async function fetchOrganizationsWithTimeout(userId: string, timeoutMs: number): Promise<Organization[]> {
  try {
    return await Promise.race([
      fetchUserOrganizations(userId),
      new Promise<Organization[]>((resolve) => 
        setTimeout(() => {
          console.warn(`Organizations fetch timed out after ${timeoutMs}ms, returning empty array`);
          resolve([]);
        }, timeoutMs)
      )
    ]);
  } catch (orgError) {
    console.warn('Organization fetch failed, continuing with empty organizations:', orgError);
    return [];
  }
}

/**
 * Check if user has superadmin access with timeout
 */
export async function checkSuperAdminAccess(userId: string): Promise<boolean> {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'superadmin')
        .eq('status', 'active')
        .limit(1),
      createTimeoutPromise(5000, 'Superadmin check timeout')
    ]) as any;

    if (error) {
      console.warn('Superadmin check error:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.warn('Superadmin check failed:', error);
    return false;
  }
}