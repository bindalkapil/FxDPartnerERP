import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
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
        // Check for existing Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Create user object from session
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: 'admin' // Default role for demo
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Check localStorage for demo user
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // Create a demo session for Supabase
            await createDemoSession(userData.email);
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

  // Create a demo session for Supabase
  const createDemoSession = async (email: string) => {
    try {
      // For demo purposes, we'll use the service role key to bypass authentication
      // In production, you would use proper Supabase authentication
      console.log('Creating demo session for:', email);
    } catch (error) {
      console.error('Error creating demo session:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock users for testing
      const mockUsers = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@fruitshop.com',
          role: 'admin',
        },
        {
          id: '2',
          name: 'Manager User',
          email: 'manager@fruitshop.com',
          role: 'manager',
        },
        {
          id: '3',
          name: 'Staff User',
          email: 'staff@fruitshop.com',
          role: 'staff',
        },
        {
          id: '4',
          name: 'Demo User',
          email: 'demo@fruitshop.com',
          role: 'admin',
        }
      ];

      // Check credentials (password is 'password' for all users)
      const user = mockUsers.find(u => u.email === email);
      if (user && password === 'password') {
        setUser(user);
        localStorage.setItem('auth', 'true');
        localStorage.setItem('user', JSON.stringify(user));
        
        // Create demo session
        await createDemoSession(user.email);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
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
    }
    setUser(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
