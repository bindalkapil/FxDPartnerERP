import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type UserDetails = Database['public']['Tables']['user_details']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];

interface RoleContextType {
  userDetails: UserDetails | null;
  roles: Role[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleId: string) => boolean;
  hasMinRole: (minRoleId: string) => boolean;
  refreshUserDetails: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
  userDetails: null,
  roles: [],
  loading: true,
  hasPermission: () => false,
  hasRole: () => false,
  hasMinRole: () => false,
  refreshUserDetails: async () => {},
});

export const useRole = () => useContext(RoleContext);

// Role hierarchy for comparison
const ROLE_HIERARCHY = {
  viewer: 1,
  staff: 2,
  manager: 3,
  admin: 4,
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = async () => {
    if (!user?.id) {
      setUserDetails(null);
      setLoading(false);
      return;
    }

    try {
      // For demo user, create mock user details
      if (user.id === '1' && user.email === 'demo@fruitshop.com') {
        const mockUserDetails: UserDetails = {
          id: '1',
          email: 'demo@fruitshop.com',
          full_name: 'Demo Admin User',
          role_id: 'admin',
          role_name: 'Admin',
          role_description: 'Full system access including user management and settings',
          permissions: ["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write", "partners:read", "partners:write", "dispatch:read", "dispatch:write", "payments:read", "payments:write", "settings:read", "settings:write", "users:read", "users:write"],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
        setUserDetails(mockUserDetails);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user details:', error);
        setUserDetails(null);
      } else {
        setUserDetails(data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUserDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching roles:', error);
        // Fallback to mock roles for demo
        const mockRoles: Role[] = [
          {
            id: 'viewer',
            name: 'Viewer',
            description: 'Read-only access to dashboard and inventory',
            permissions: ["dashboard:read", "inventory:read"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'staff',
            name: 'Staff',
            description: 'Basic operations including vehicle arrival, purchases, and sales',
            permissions: ["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'manager',
            name: 'Manager',
            description: 'Department management including partners, dispatch, and payments',
            permissions: ["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write", "partners:read", "partners:write", "dispatch:read", "dispatch:write", "payments:read", "payments:write"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'admin',
            name: 'Admin',
            description: 'Full system access including user management and settings',
            permissions: ["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write", "partners:read", "partners:write", "dispatch:read", "dispatch:write", "payments:read", "payments:write", "settings:read", "settings:write", "users:read", "users:write"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setRoles(mockRoles);
      } else {
        setRoles(data || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserDetails();
      fetchRoles();
    } else {
      setUserDetails(null);
      setRoles([]);
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  const hasPermission = (permission: string): boolean => {
    if (!userDetails || !userDetails.permissions) return false;
    
    const permissions = userDetails.permissions as string[];
    return permissions.includes(permission);
  };

  const hasRole = (roleId: string): boolean => {
    return userDetails?.role_id === roleId;
  };

  const hasMinRole = (minRoleId: string): boolean => {
    if (!userDetails) return false;
    
    const userRoleLevel = ROLE_HIERARCHY[userDetails.role_id as keyof typeof ROLE_HIERARCHY] || 0;
    const minRoleLevel = ROLE_HIERARCHY[minRoleId as keyof typeof ROLE_HIERARCHY] || 0;
    
    return userRoleLevel >= minRoleLevel;
  };

  const refreshUserDetails = async () => {
    setLoading(true);
    await fetchUserDetails();
  };

  return (
    <RoleContext.Provider
      value={{
        userDetails,
        roles,
        loading,
        hasPermission,
        hasRole,
        hasMinRole,
        refreshUserDetails,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};
