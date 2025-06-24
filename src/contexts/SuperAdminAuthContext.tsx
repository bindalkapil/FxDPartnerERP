import React, { createContext, useContext, useState, useEffect } from 'react';

interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin';
}

interface SuperAdminAuthContextType {
  user: SuperAdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useSuperAdminAuth = () => useContext(SuperAdminAuthContext);

export const SuperAdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if superadmin is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('superadmin_user');
        const storedAuth = localStorage.getItem('superadmin_auth');
        
        if (storedUser && storedAuth === 'true') {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('SuperAdmin authentication error:', error);
        localStorage.removeItem('superadmin_auth');
        localStorage.removeItem('superadmin_user');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // SuperAdmin login - separate from regular user login
      // In a real app, you would make an API call to your backend
      if (email === 'superadmin@fruitshop.com' && password === 'superadmin123') {
        const superAdminUser: SuperAdminUser = {
          id: 'superadmin-1',
          name: 'Super Administrator',
          email: 'superadmin@fruitshop.com',
          role: 'superadmin'
        };
        
        setUser(superAdminUser);
        localStorage.setItem('superadmin_auth', 'true');
        localStorage.setItem('superadmin_user', JSON.stringify(superAdminUser));
      } else {
        throw new Error('Invalid superadmin credentials');
      }
    } catch (error) {
      console.error('SuperAdmin login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('superadmin_auth');
    localStorage.removeItem('superadmin_user');
  };

  return (
    <SuperAdminAuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </SuperAdminAuthContext.Provider>
  );
};
