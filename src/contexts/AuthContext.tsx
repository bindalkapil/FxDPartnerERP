import React, { createContext, useContext, useState, useEffect } from 'react';
import { setCurrentOrganization } from '../lib/api';
import { supabase } from '../lib/supabase';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

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

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real app, you would verify the token with your backend
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Set the current organization in the API
          if (parsedUser.currentOrganization) {
            setCurrentOrganization(parsedUser.currentOrganization.id);
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      // Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, role_id, status')
        .eq('id', authData.user.id)
        .eq('status', 'active')
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found or inactive');
      }

      // Fetch user's organizations
      const { data: userOrganizations, error: orgError } = await supabase
        .from('user_organizations')
        .select(`
          role,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', authData.user.id)
        .eq('status', 'active');

      if (orgError) {
        console.error('Error fetching user organizations:', orgError);
        throw new Error('Failed to load user organizations');
      }

      // Transform organizations data
      const organizations: Organization[] = userOrganizations?.map(uo => ({
        id: uo.organizations.id,
        name: uo.organizations.name,
        slug: uo.organizations.slug,
        role: uo.role
      })) || [];

      if (organizations.length === 0) {
        throw new Error('User has no access to any organizations');
      }

      const authenticatedUser: User = {
        id: userProfile.id,
        name: userProfile.full_name,
        email: userProfile.email,
        role: userProfile.role_id,
        organizations: organizations,
        currentOrganization: organizations[0] // Default to first organization
      };
      
      setUser(authenticatedUser);
      localStorage.setItem('auth', 'true');
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      
      // Set the current organization in the API
      if (authenticatedUser.currentOrganization) {
        setCurrentOrganization(authenticatedUser.currentOrganization.id);
      }

      // Update last login timestamp
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Sign up failed');
      }

      // The user profile will be created automatically by the trigger
      // Just return success - user will need to sign in after signup
      
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
    }
  };

  const switchOrganization = async (organizationId: string) => {
    if (!user) return;
    
    setLoading(true);
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
        
        // In a real app, you would make an API call to switch organization context
        // and potentially refresh data for the new organization
      }
    } catch (error) {
      console.error('Organization switch error:', error);
      throw error;
    } finally {
      setLoading(false);
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
