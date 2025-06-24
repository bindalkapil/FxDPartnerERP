#!/bin/bash

# Deploy Users RLS Fix Migration
# This script applies the migration to fix user visibility in super admin

echo "🚀 Deploying Users RLS Fix Migration..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    exit 1
fi

# Apply the migration
echo "📦 Applying migration: 20250624000005_fix_users_table_rls_for_superadmin.sql"
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    
    echo "🔍 Verifying the migration..."
    
    # Check if the new policies were created
    supabase db diff --schema public --use-migra
    
    echo "📋 New RLS policies added to users table:"
    echo "  - Super admins can view all users"
    echo "  - Super admins can insert users"
    echo "  - Super admins can update users"
    echo "  - Super admins can delete users"
    echo "  - Organization admins can view users in their context"
    
    echo ""
    echo "🎯 Expected Result:"
    echo "  - Super admin user management page should now show all users"
    echo "  - Users with 'superadmin' role in user_organizations can access all users"
    echo "  - Organization admins can see users within their organization"
    echo "  - Existing role-based policies remain intact for backward compatibility"
    
    echo ""
    echo "🧪 To test the fix:"
    echo "  1. Login as a super admin user"
    echo "  2. Navigate to Super Admin > User Management"
    echo "  3. Verify that all users are now visible in the table"
    
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "✨ Users RLS fix deployment completed!"
