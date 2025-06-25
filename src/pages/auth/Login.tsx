import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Lock, Mail, Package, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return; // Prevent double submission
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
        toast.success('Account created successfully! Please sign in.');
        setIsSignUp(false);
        setPassword(''); // Clear password for security
      } else {
        await login(email.trim(), password);
        toast.success('Logged in successfully');
        // Navigation will be handled by the useEffect above
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      const errorMessage = error.message || (isSignUp ? 'Failed to create account' : 'Invalid credentials');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    if (isLoading) return; // Prevent mode change during loading
    setIsSignUp(!isSignUp);
    setPassword(''); // Clear password when switching modes
  };

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          <span className="text-green-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome to FxD Partner ERP</h1>
            <p className="text-gray-600 mt-2">{isSignUp ? 'Create your account' : 'Sign in to your account'}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={6}
                />
              </div>
            </div>
            
            {!isSignUp && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:cursor-not-allowed"
                    disabled={isLoading}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <a href="#" className="font-medium text-green-600 hover:text-green-500">
                    Forgot password?
                  </a>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign in'
              )}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              disabled={isLoading}
              className="text-sm text-green-600 hover:text-green-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 mb-3">
              Only registered users can access the system. Please contact your system administrator to get your account created.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-left">
              <p className="text-amber-800 font-medium mb-2">For Testing:</p>
              <div className="text-amber-700 text-xs space-y-1">
                <p>You can create a test account by signing up with any email address.</p>
                <p>New accounts will be created with 'viewer' role by default.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} FxD Partner ERP. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
