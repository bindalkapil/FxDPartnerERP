import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// For demo purposes, use service role key to bypass RLS since we disabled it
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZGJsbnJhZW9wYm9hbGVtampvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MTg0NiwiZXhwIjoyMDY0NzY3ODQ2fQ.d6qfFcwIg8lq5YCEP2Rt0sIOZBFNfWaTVxNnW5z1-wY';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables:', {
    url: import.meta.env.VITE_SUPABASE_URL ? 'present' : 'missing',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
  });
  
  // During build time, use placeholder values to prevent build failure
  if (typeof window === 'undefined') {
    console.warn('Using placeholder Supabase credentials for build. Set repository secrets for production.');
  } else {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public'
  }
});

// Test the connection only if we have real credentials
if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // Connection test will be performed when the app actually uses Supabase
  console.log('Supabase client initialized with environment credentials');
} else {
  console.warn('Supabase client initialized with placeholder credentials');
}
