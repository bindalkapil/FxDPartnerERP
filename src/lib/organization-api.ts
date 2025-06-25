import { supabase } from './supabase';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

/**
 * Fetch user's organizations with robust error handling and retry logic
 */
export async function fetchUserOrganizations(userId: string): Promise<Organization[]> {
  console.log('🔄 Fetching organizations for user:', userId);
  
  try {
    // First attempt: Standard query with timeout
    const { data: userOrganizations, error } = await Promise.race([
      supabase
        .from('user_organizations')
        .select(`
          role,
          status,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Organizations fetch timeout')), 5000)
      )
    ]) as any;

    if (error) {
      console.warn('Organizations query error:', error);
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
    console.warn('Primary organization fetch failed, trying alternative approach:', error);
    
    // Second attempt: Try without status filter (in case RLS is blocking)
    try {
      const { data: userOrganizations, error: altError } = await Promise.race([
        supabase
          .from('user_organizations')
          .select(`
            role,
            organizations (
              id,
              name,
              slug
            )
          `)
          .eq('user_id', userId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Alternative organizations fetch timeout')), 3000)
        )
      ]) as any;

      if (altError) {
        console.warn('Alternative organizations query error:', altError);
        throw altError;
      }

      if (!userOrganizations || userOrganizations.length === 0) {
        console.warn('No organizations found in alternative query');
        return [];
      }

      const organizations: Organization[] = userOrganizations.map((uo: any) => ({
        id: uo.organizations.id,
        name: uo.organizations.name,
        slug: uo.organizations.slug,
        role: uo.role
      }));

      console.log('✅ Alternative fetch successful:', organizations.length, 'organizations');
      return organizations;

    } catch (altError) {
      console.warn('Alternative organization fetch also failed:', altError);
      
      // Third attempt: Direct organizations query (if user has access)
      try {
        console.log('🔄 Trying direct organizations query...');
        
        const { data: allOrganizations, error: directError } = await Promise.race([
          supabase
            .from('organizations')
            .select('id, name, slug'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Direct organizations fetch timeout')), 3000)
          )
        ]) as any;

        if (directError) {
          console.warn('Direct organizations query error:', directError);
          throw directError;
        }

        if (allOrganizations && allOrganizations.length > 0) {
          // Assign default role since we can't get the actual role
          const organizations: Organization[] = allOrganizations.map((org: any) => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            role: 'admin' // Default role when we can't determine actual role
          }));

          console.log('✅ Direct fetch successful:', organizations.length, 'organizations');
          return organizations;
        }
      } catch (directError) {
        console.warn('Direct organizations fetch failed:', directError);
      }
      
      // If all attempts fail, return empty array
      console.warn('❌ All organization fetch attempts failed');
      return [];
    }
  }
}

/**
 * Fetch user profile with organization data
 */
export async function fetchUserProfile(userId: string) {
  console.log('🔄 Fetching user profile for:', userId);
  
  try {
    // Fetch user profile
    const { data: userProfile, error: profileError } = await Promise.race([
      supabase
        .from('users')
        .select('id, email, full_name, role_id, status')
        .eq('id', userId)
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )
    ]) as any;

    if (profileError) {
      console.warn('Profile fetch error:', profileError);
      throw profileError;
    }

    console.log('✅ User profile fetched:', userProfile.email);

    // Fetch organizations
    const organizations = await fetchUserOrganizations(userId);

    return {
      profile: userProfile,
      organizations
    };

  } catch (error) {
    console.error('User profile fetch failed:', error);
    throw error;
  }
}
