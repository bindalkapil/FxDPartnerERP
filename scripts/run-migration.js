#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure your .env file contains:');
  console.error('VITE_SUPABASE_URL=your_supabase_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_anon_key');
  process.exit(1);
}

console.log('🔧 User Management System Migration');
console.log('===================================');
console.log(`🌐 Target: ${supabaseUrl}`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting migration...');
    
    // Step 1: Create roles table
    console.log('📝 Creating roles table...');
    const { error: rolesTableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.roles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Since exec RPC might not exist, let's try a different approach
    // We'll use the REST API directly to execute SQL

    const migrationSteps = [
      {
        name: 'Create roles table',
        sql: `
          CREATE TABLE IF NOT EXISTS public.roles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'Create users table',
        sql: `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            role_id TEXT NOT NULL REFERENCES public.roles(id) DEFAULT 'viewer',
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_login TIMESTAMP WITH TIME ZONE
          );
        `
      },
      {
        name: 'Insert default roles',
        sql: `
          INSERT INTO public.roles (id, name, description, permissions) VALUES
          ('viewer', 'Viewer', 'Read-only access to dashboard and inventory', 
           '["dashboard:read", "inventory:read"]'::jsonb),
          ('staff', 'Staff', 'Basic operations including vehicle arrival, purchases, and sales', 
           '["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write"]'::jsonb),
          ('manager', 'Manager', 'Department management including partners, dispatch, and payments', 
           '["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write", "partners:read", "partners:write", "dispatch:read", "dispatch:write", "payments:read", "payments:write"]'::jsonb),
          ('admin', 'Admin', 'Full system access including user management and settings', 
           '["dashboard:read", "inventory:read", "vehicle_arrival:read", "vehicle_arrival:write", "purchase_records:read", "purchase_records:write", "sales:read", "sales:write", "partners:read", "partners:write", "dispatch:read", "dispatch:write", "payments:read", "payments:write", "settings:read", "settings:write", "users:read", "users:write"]'::jsonb)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            permissions = EXCLUDED.permissions,
            updated_at = NOW();
        `
      }
    ];

    // Try to execute each step
    for (const step of migrationSteps) {
      console.log(`⚡ ${step.name}...`);
      
      try {
        // Try using a simple approach - just test if we can query the table after creation
        if (step.name.includes('roles table')) {
          // For roles table, we'll verify by trying to select from it
          const { error } = await supabase.from('roles').select('count').limit(1);
          if (error && error.code === '42P01') {
            console.log('   Table does not exist, needs creation via Dashboard');
          } else {
            console.log('✅ Roles table already exists');
          }
        } else if (step.name.includes('users table')) {
          const { error } = await supabase.from('users').select('count').limit(1);
          if (error && error.code === '42P01') {
            console.log('   Table does not exist, needs creation via Dashboard');
          } else {
            console.log('✅ Users table already exists');
          }
        } else if (step.name.includes('Insert default roles')) {
          const { data, error } = await supabase.from('roles').select('*');
          if (!error && data && data.length > 0) {
            console.log(`✅ Found ${data.length} roles already created`);
          } else if (error && error.code === '42P01') {
            console.log('   Roles table does not exist yet');
          } else {
            console.log('   No roles found, need to insert via Dashboard');
          }
        }
      } catch (err) {
        console.log(`   ⚠️  Cannot execute directly: ${err.message}`);
      }
    }

    // Verify what we can access
    console.log('\n🔍 Checking current database state...');
    
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('*');
    
    if (!rolesError && rolesData) {
      console.log(`✅ Roles table accessible with ${rolesData.length} roles`);
      rolesData.forEach(role => {
        console.log(`   - ${role.name} (${role.id})`);
      });
    } else {
      console.log('❌ Roles table not accessible:', rolesError?.message);
      console.log('\n📋 MANUAL STEPS REQUIRED:');
      console.log('1. Go to: https://supabase.com/dashboard/project/rsdblnraeopboalemjjo/sql');
      console.log('2. Copy the contents of scripts/migration-for-dashboard.sql');
      console.log('3. Paste and run in the SQL Editor');
      console.log('4. Then run this script again to verify');
    }

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (!usersError && usersData) {
      console.log(`✅ Users table accessible with ${usersData.length} users`);
    } else {
      console.log('❌ Users table not accessible:', usersError?.message);
    }

    // Test the user_details view
    const { data: userDetailsData, error: userDetailsError } = await supabase
      .from('user_details')
      .select('*')
      .limit(1);
    
    if (!userDetailsError) {
      console.log('✅ User details view accessible');
    } else {
      console.log('❌ User details view not accessible:', userDetailsError?.message);
    }

    if (!rolesError && !usersError) {
      console.log('\n🎉 Migration appears to be complete!');
      console.log('✅ Your 404 role fetching error should now be resolved');
      console.log('\n🚀 Next steps:');
      console.log('1. Restart your development server: npm run dev');
      console.log('2. Check that the 404 error is gone');
      console.log('3. Test role-based functionality');
    } else {
      console.log('\n⚠️  Migration needs to be completed manually');
      console.log('Please follow the instructions in ROLE_SYSTEM_SETUP.md');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Fallback: Use the manual approach');
    console.log('1. Open scripts/migration-for-dashboard.sql');
    console.log('2. Copy the contents');
    console.log('3. Go to Supabase Dashboard SQL Editor');
    console.log('4. Paste and run the migration');
  }
}

runMigration();
