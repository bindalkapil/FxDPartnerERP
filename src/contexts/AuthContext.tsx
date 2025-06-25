import React, { createContext, useContext, useState, useEffect } from 'react';
import { setCurrentOrganization } from '../lib/organization-context';
import { supabase } from '../lib/supabase';
import { fetchUserOrganizations, fetchUserProfile, Organization } from '../lib/organization-api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  currentOrganization?: Organization;
  organizations: Organization[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signUp: async () => {},
  logout: async () => {},
  switchOrganization: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Check localStorage first for faster loading
        const storedAuth = localStorage.getItem('auth');
        const storedUser = localStorage.getItem('user');
        
        if (storedAuth === 'true' && storedUser && mounted) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('✅ Restored user from localStorage:', parsedUser.email);
            setUser(parsedUser);
            
            if (parsedUser.currentOrganization) {
              setCurrentOrganization(parsedUser.currentOrganization.id);
            }
          } catch (error) {
            console.error('Error parsing stored user:', error);
            clearAuthState();
          }
        }

        // Check for existing session (but don't block on it)
        try {
          const { data: { session }, error } = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session check timeout')), 3000)
            )
          ]) as any;
          
          if (error) {
            console.warn('Session check error (continuing anyway):', error);
          } else if (session?.user && mounted && !user) {
            console.log('📝 Found active session, will load profile in background');
            // Load profile in background without blocking
            loadUserProfile(session.user.id).catch(err => {
              console.warn('Background profile load failed:', err);
            });
          }
        } catch (error) {
          console.warn('Session check timeout (continuing anyway):', error);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthState();
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization completed');
          setLoading(false);
        }
      }
    };

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔄 Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await loadUserProfile(session.user.id);
        } catch (error) {
          console.error('Failed to load profile after sign in:', error);
          // Create minimal profile as fallback, but try to get real organizations first
          try {
            console.log('🔄 Creating fallback profile, attempting to get real organizations...');
            
            // Try to get real organizations for the user
            let organizations: Organization[] = [{
              id: '00000000-0000-0000-0000-000000000000',
              name: 'Default Organization',
              slug: 'default',
              role: 'admin'
            }];

            try {
              // Use the robust organization API
              const realOrganizations = await fetchUserOrganizations(session.user.id);
              if (realOrganizations.length > 0) {
                organizations = realOrganizations;
                console.log('✅ Found real organizations for fallback profile:', organizations.length);
              }
            } catch (orgError) {
              console.warn('Could not fetch organizations for fallback profile:', orgError);
            }

            const minimalUser: User = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email || 'User',
              email: session.user.email || '',
              role: 'admin',
              organizations: organizations,
              currentOrganization: organizations[0]
            };
            
            setUser(minimalUser);
            localStorage.setItem('auth', 'true');
            localStorage.setItem('user', JSON.stringify(minimalUser));
            console.log('✅ Created fallback minimal profile with', organizations.length, 'organizations');
          } catch (fallbackError) {
            console.error('Failed to create fallback profile:', fallbackError);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        clearAuthState();
        setLoading(false);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
  };

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Loading user profile for:', userId);
      
      // Try to fetch user profile with shorter timeout and better error handling
      const profilePromise = supabase
        .from('users')
        .select('id, email, full_name, role_id, status')
        .eq('id', userId)
        .single(); // Remove status filter to avoid RLS issues

      const { data: userProfile, error: profileError } = await Promise.race([
        profilePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        )
      ]) as any;

      if (profileError) {
        console.warn('Profile fetch error:', profileError);
        // Create a minimal user profile from auth data if database query fails
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          console.log('📝 Creating minimal profile from auth data');
          const minimalUser: User = {
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email || 'User',
            email: authUser.email || '',
            role: 'admin', // Default role
            organizations: [{
              id: '00000000-0000-0000-0000-000000000000',
              name: 'Default Organization',
              slug: 'default',
              role: 'admin'
            }],
            currentOrganization: {
              id: '00000000-0000-0000-0000-000000000000',
              name: 'Default Organization',
              slug: 'default',
              role: 'admin'
            }
          };
          
          setUser(minimalUser);
          localStorage.setItem('auth', 'true');
          localStorage.setItem('user', JSON.stringify(minimalUser));
          console.log('✅ Minimal user profile created');
          return;
        }
        throw new Error('User profile not found and no auth data available');
      }

      console.log('✅ User profile loaded:', userProfile.email);

      // Try to fetch user's organizations using the robust API
      try {
        let organizations: Organization[] = [];
        
        try {
          // Use the robust organization API
          organizations = await fetchUserOrganizations(userId);
          if (organizations.length === 0) {
            console.warn('No organizations found, using default');
            organizations = [{
              id: '00000000-0000-0000-0000-000000000000',
              name: 'Default Organization',
              slug: 'default',
              role: 'admin'
            }];
          }
        } catch (orgError) {
          console.warn('Organizations fetch error, using default:', orgError);
          organizations = [{
            id: '00000000-0000-0000-0000-000000000000',
            name: 'Default Organization',
            slug: 'default',
            role: 'admin'
          }];
        }

        const authenticatedUser: User = {
          id: userProfile.id,
          name: userProfile.full_name || userProfile.email,
          email: userProfile.email,
          role: userProfile.role_id || 'admin',
          organizations: organizations,
          currentOrganization: organizations[0] // Default to first organization
        };
        
        setUser(authenticatedUser);
        localStorage.setItem('auth', 'true');
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        
        // Set the current organization in the API
        if (authenticatedUser.currentOrganization) {
          try {
            await setCurrentOrganization(authenticatedUser.currentOrganization.id);
          } catch (orgError) {
            console.warn('Failed to set organization context:', orgError);
          }
        }

        console.log('✅ User profile setup completed');

        // Update last login timestamp (fire and forget)
        setTimeout(async () => {
          try {
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', userId);
          } catch (error) {
            console.warn('Last login update failed:', error);
          }
        }, 1000);

      } catch (orgError) {
        console.warn('Organization loading failed, continuing with minimal profile:', orgError);
        // Continue with basic profile even if organizations fail
        const basicUser: User = {
          id: userProfile.id,
          name: userProfile.full_name || userProfile.email,
          email: userProfile.email,
          role: userProfile.role_id || 'admin',
          organizations: [{
            id: '00000000-0000-0000-0000-000000000000',
            name: 'Default Organization',
            slug: 'default',
            role: 'admin'
          }],
          currentOrganization: {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'Default Organization',
            slug: 'default',
            role: 'admin'
          }
        };
        
        setUser(basicUser);
        localStorage.setItem('auth', 'true');
        localStorage.setItem('user', JSON.stringify(basicUser));
        console.log('✅ Basic user profile created');
      }

    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Clear any existing state
      clearAuthState();
      
      // Authenticate with Supabase with timeout
      const authPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      const { data: authData, error: authError } = await Promise.race([
        authPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout')), 15000)
        )
      ]) as any;

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Authentication failed - no user returned');
      }

      // Load user profile
      await loadUserProfile(authData.user.id);

    } catch (error: any) {
      console.error('Login error:', error);
      clearAuthState();
      throw new Error(error.message || 'Login failed');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Sign up with Supabase with timeout
      const signUpPromise = supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      const { data: authData, error: authError } = await Promise.race([
        signUpPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign up timeout')), 15000)
        )
      ]) as any;

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Sign up failed - no user returned');
      }

      // Don't auto-login after signup, let user sign in manually
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Sign up failed');
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
    }
  };

  const switchOrganization = async (organizationId: string) => {
    if (!user) return;
    
    try {
      // Find the organization in user's organizations
      const targetOrganization = user.organizations.find(org => org.id === organizationId);
      
      if (targetOrganization) {
        const updatedUser = {
          ...user,
          currentOrganization: targetOrganization
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Set the current organization in the API
        setCurrentOrganization(targetOrganization.id);
      }
    } catch (error) {
      console.error('Organization switch error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        signUp,
        logout, 
        switchOrganization,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
