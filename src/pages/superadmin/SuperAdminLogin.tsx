import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { setCurrentOrganization } from '../../lib/organization-context';

const SuperAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Check if user is already logged in and is a superadmin
  useEffect(() => {
    let mounted = true;

    const checkSuperAdminStatus = async () => {
      if (authLoading) return; // Wait for auth to finish loading

      try {
        if (user) {
          const { data: userOrgs } = await supabase
            .from('user_organizations')
            .select('role, status')
            .eq('user_id', user.id)
            .eq('role', 'superadmin')
            .eq('status', 'active');

          if (mounted && userOrgs && userOrgs.length > 0) {
            navigate('/superadmin', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking superadmin status:', error);
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkSuperAdminStatus();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent double submission
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Sign in with Supabase Auth with timeout
      const authPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      const { data, error } = await Promise.race([
        authPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout')), 15000)
        )
      ]) as any;

      if (error) throw error;

      if (!data.user) {
        throw new Error('Authentication failed - no user returned');
      }

      // Check if the user has superadmin role with timeout
      const orgsPromise = supabase
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
        .eq('user_id', data.user.id)
        .eq('role', 'superadmin')
        .eq('status', 'active');

      const { data: userOrgs, error: orgError } = await Promise.race([
        orgsPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Organization check timeout')), 10000)
        )
      ]) as any;

      if (orgError) throw orgError;

      if (!userOrgs || userOrgs.length === 0) {
        // User exists but doesn't have superadmin role
        await supabase.auth.signOut();
        throw new Error('Access denied. SuperAdmin privileges required.');
      }

      // Fetch user profile with timeout
      const profilePromise = supabase
        .from('users')
        .select('id, email, full_name, role_id, status')
        .eq('id', data.user.id)
        .single();

      const { data: userProfile, error: profileError } = await Promise.race([
        profilePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        )
      ]) as any;

      if (profileError || !userProfile) {
        throw new Error('User profile not found');
      }

      // Create user object for AuthContext
      const authenticatedUser = {
        id: userProfile.id,
        name: userProfile.full_name || userProfile.email,
        email: userProfile.email,
        role: userProfile.role_id,
        organizations: userOrgs.map((uo: any) => ({
          id: uo.organizations.id,
          name: uo.organizations.name,
          slug: uo.organizations.slug,
          role: uo.role
        })),
        currentOrganization: userOrgs[0] ? {
          id: userOrgs[0].organizations.id,
          name: userOrgs[0].organizations.name,
          slug: userOrgs[0].organizations.slug,
          role: userOrgs[0].role
        } : undefined
      };

      // Update localStorage to maintain auth state
      localStorage.setItem('auth', 'true');
      localStorage.setItem('user', JSON.stringify(authenticatedUser));

      // Set organization context if available
      if (authenticatedUser.currentOrganization) {
        setCurrentOrganization(authenticatedUser.currentOrganization.id);
      }

      toast.success('SuperAdmin login successful');
      
      // Navigate to superadmin dashboard
      navigate('/superadmin', { replace: true });

    } catch (error: any) {
      console.error('SuperAdmin login error:', error);
      const errorMessage = error.message || 'Invalid credentials';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth state
  if (authLoading || checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-red-600" />
          <span className="text-red-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-600">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            SuperAdmin Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            System-wide administration portal
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Enter superadmin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Enter superadmin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Sign in as SuperAdmin
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Demo Credentials
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Email: superadmin@fruitshop.com</p>
                    <p>Password: superadmin123</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/"
              className="text-sm text-red-600 hover:text-red-500 transition-colors duration-200"
            >
              ← Back to regular login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
