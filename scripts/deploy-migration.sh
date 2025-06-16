#!/bin/bash

# Supabase Migration Deployment Script
# This script deploys migrations to your Supabase project

set -e  # Exit on any error

echo "🚀 Supabase Migration Deployment"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found. Please run ./scripts/setup-supabase-cli.sh first"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    print_error "Project not linked. Please run ./scripts/setup-supabase-cli.sh first"
    exit 1
fi

# Verify authentication
print_status "Verifying authentication..."
if ! supabase projects list &> /dev/null; then
    print_error "Not authenticated. Please run: supabase login"
    exit 1
fi
print_success "✅ Authentication verified"

# Check current migration status
print_status "Checking current migration status..."
echo ""
supabase migration list
echo ""

# Check for pending migrations
print_status "Checking for pending migrations..."
PENDING_MIGRATIONS=$(supabase migration list | grep -c "Not applied" || true)

if [ "$PENDING_MIGRATIONS" -eq 0 ]; then
    print_warning "No pending migrations found. All migrations appear to be applied."
    echo ""
    read -p "Do you want to continue anyway? (y/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
else
    print_status "Found $PENDING_MIGRATIONS pending migration(s)"
fi

# Ask for confirmation
echo ""
print_warning "⚠️  This will apply migrations to your production database!"
echo ""
read -p "Are you sure you want to continue? (y/N): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_status "Deployment cancelled."
    exit 0
fi

# Dry run first
print_status "Running dry-run to check for issues..."
echo ""

if supabase db push --dry-run; then
    print_success "✅ Dry-run completed successfully"
else
    print_error "❌ Dry-run failed. Please check the errors above."
    exit 1
fi

echo ""
print_status "Dry-run passed. Proceeding with actual deployment..."
echo ""

# Deploy migrations
print_status "Deploying migrations..."
echo ""

if supabase db push; then
    print_success "🎉 Migrations deployed successfully!"
else
    print_error "❌ Migration deployment failed. Please check the errors above."
    exit 1
fi

echo ""
print_status "Verifying deployment..."
echo ""

# Show final migration status
supabase migration list

echo ""
print_success "✅ Deployment verification completed"

# Run our verification script if it exists
if [ -f "scripts/verify-migration.sh" ]; then
    echo ""
    print_status "Running additional verification checks..."
    ./scripts/verify-migration.sh
fi

echo ""
print_success "🎉 Migration deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test your application to ensure everything works"
echo "2. Check the Supabase dashboard for any issues"
echo "3. Monitor your application logs"
echo ""
