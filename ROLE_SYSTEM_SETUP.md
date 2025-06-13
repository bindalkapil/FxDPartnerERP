# Role System Setup Guide

This guide will help you fix the 404 error when fetching roles and set up the complete user management system.

## Problem Summary

You're experiencing a 404 error because:
1. The `roles` table doesn't exist in your Supabase database
2. The user management system migration hasn't been applied
3. Your app is trying to fetch from non-existent database tables

## Solution Steps

### Step 1: Apply the Database Migration

You have two options to apply the migration:

#### Option A: Using Supabase Dashboard (Recommended)

1. **Open your Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/rsdblnraeopboalemjjo
   - Navigate to **SQL Editor** in the left sidebar

2. **Copy the Migration Script**
   - Open the file: `scripts/migration-for-dashboard.sql`
   - Copy the entire contents

3. **Execute the Migration**
   - Paste the script into the SQL Editor
   - Click **Run** to execute
   - Wait for completion (should show "Success" message)

4. **Verify the Migration**
   - Run this verification query in the SQL Editor:
   ```sql
   SELECT 'Roles created:' as status, count(*) as count FROM public.roles;
   SELECT * FROM public.roles ORDER BY id;
   ```
   - You should see 4 roles: viewer, staff, manager, admin

#### Option B: Using Supabase CLI (If Docker is running)

1. **Start Docker** (if not already running)
2. **Apply Migration**
   ```bash
   supabase db push
   ```

### Step 2: Create Admin User (Optional)

If you want to test with an admin user:

1. **Sign up through your app first** (create any user account)
2. **Run the admin setup script**:
   - Copy contents of `scripts/create-demo-admin.sql`
   - Paste and run in Supabase Dashboard SQL Editor
   - This will promote your first user to admin role

### Step 3: Test the Role System

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Check the browser console**:
   - The 404 error should be gone
   - Roles should load successfully
   - You should see role data in the network tab

3. **Test authentication**:
   - Log in with your user account
   - Check if role-based permissions work
   - Verify user details are loaded correctly

## What the Migration Creates

### Tables
- **`roles`**: Stores role definitions and permissions
- **`users`**: Extends Supabase auth with role assignments
- **`user_details`**: View combining user and role information

### Roles Created
- **Viewer**: Read-only access to dashboard and inventory
- **Staff**: Basic operations (vehicle arrival, purchases, sales)
- **Manager**: Department management (partners, dispatch, payments)
- **Admin**: Full system access (user management, settings)

### Security Features
- **Row Level Security (RLS)**: Protects data access
- **Permission System**: Granular permission checking
- **Auto User Creation**: New signups automatically get viewer role

## Troubleshooting

### If you still get 404 errors:

1. **Check Environment Variables**:
   ```bash
   # Verify your .env file has:
   VITE_SUPABASE_URL=https://rsdblnraeopboalemjjo.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Verify Tables Exist**:
   - Go to Supabase Dashboard > Table Editor
   - Check if `roles` and `users` tables are visible

3. **Check RLS Policies**:
   - Go to Supabase Dashboard > Authentication > Policies
   - Ensure policies are created for `roles` and `users` tables

4. **Test Direct API Access**:
   ```javascript
   // Test in browser console
   const { data, error } = await supabase.from('roles').select('*');
   console.log('Roles:', data, 'Error:', error);
   ```

### If migration fails:

1. **Check for existing tables**:
   - Some tables might already exist
   - The migration uses `CREATE TABLE IF NOT EXISTS` to handle this

2. **Run statements individually**:
   - Copy smaller sections of the migration
   - Run them one by one to identify issues

3. **Check permissions**:
   - Ensure your Supabase project has proper permissions
   - You might need service role key for some operations

## Files Created

- `scripts/migration-for-dashboard.sql`: Complete migration for copy-paste
- `scripts/create-demo-admin.sql`: Admin user setup
- `scripts/apply-user-management-migration.js`: Programmatic migration (alternative)
- `supabase/config.toml`: Fixed Supabase CLI configuration

## Next Steps

After successful migration:

1. **Test all role-based features**
2. **Create additional users with different roles**
3. **Verify permission system works correctly**
4. **Update your app's role checking logic if needed**

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify the migration completed successfully
3. Test with a fresh user signup
4. Check Supabase Dashboard logs for any errors

The role system should now work correctly and the 404 errors should be resolved!
