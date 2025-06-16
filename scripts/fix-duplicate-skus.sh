#!/bin/bash

# Fix Duplicate SKU Codes Script
# This script applies the database migration to fix duplicate SKU codes

set -e

echo "🔧 Starting duplicate SKU code fix..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ supabase/config.toml not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Current migration status:"
supabase migration list

echo ""
echo "🚀 Applying duplicate SKU fix migration..."

# Apply the migration
if supabase db push; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "🔍 Verifying the fix..."

# Run a query to check for any remaining duplicates
echo "Checking for duplicate SKU codes..."
supabase db query "
SELECT 
    code, 
    COUNT(*) as count,
    STRING_AGG(p.name, ', ') as products
FROM skus s
JOIN products p ON s.product_id = p.id
GROUP BY code 
HAVING COUNT(*) > 1
ORDER BY count DESC;
" || echo "No duplicate SKU codes found! ✅"

echo ""
echo "📊 SKU Statistics:"
supabase db query "
SELECT 
    COUNT(*) as total_skus,
    COUNT(DISTINCT code) as unique_codes,
    COUNT(*) - COUNT(DISTINCT code) as duplicates
FROM skus;
"

echo ""
echo "🎉 Duplicate SKU fix completed!"
echo ""
echo "Next steps:"
echo "1. Test the product search functionality in the application"
echo "2. Verify that 'Banana Robusta' now appears correctly when selected"
echo "3. Monitor the application logs for any remaining duplicate SKU warnings"
