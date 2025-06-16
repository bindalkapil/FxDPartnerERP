#!/bin/bash

# Supabase CLI Setup Script
# This script helps you set up the Supabase CLI and link your project

set -e  # Exit on any error

echo "🚀 Supabase CLI Setup Script"
echo "=============================="

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

# Check if Supabase CLI is installed
print_status "Checking if Supabase CLI is installed..."
if command -v supabase &> /dev/null; then
    print_success "Supabase CLI is already installed: $(supabase --version)"
else
    print_warning "Supabase CLI not found. Please install it first:"
    echo ""
    echo "macOS (Homebrew):"
    echo "  brew install supabase/tap/supabase"
    echo ""
    echo "macOS/Linux (Direct):"
    echo "  curl -fsSL https://supabase.com/install.sh | sh"
    echo ""
    echo "Cross-platform (npm):"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

# Check if already logged in
print_status "Checking authentication status..."
if supabase projects list &> /dev/null; then
    print_success "Already authenticated with Supabase"
else
    print_status "Not authenticated. Please login to Supabase..."
    echo ""
    echo "You'll need your access token from:"
    echo "https://supabase.com/dashboard/account/tokens"
    echo ""
    read -p "Press Enter when you have your access token ready..."
    
    supabase login
    
    if [ $? -eq 0 ]; then
        print_success "Successfully authenticated with Supabase"
    else
        print_error "Authentication failed. Please check your access token."
        exit 1
    fi
fi

# Check if project is already linked
print_status "Checking if project is linked..."
if [ -f ".supabase/config.toml" ]; then
    print_success "Project appears to be already linked"
    
    # Verify the link works
    if supabase status &> /dev/null; then
        print_success "Project link is working correctly"
    else
        print_warning "Project link exists but may not be working. Re-linking..."
        rm -rf .supabase
    fi
fi

# Link project if not already linked
if [ ! -f ".supabase/config.toml" ]; then
    print_status "Linking to your Supabase project..."
    echo ""
    echo "You'll need your project reference ID from your Supabase dashboard URL:"
    echo "https://supabase.com/dashboard/project/[PROJECT_ID]"
    echo ""
    echo "Example: rsdblnraeopboalemjjo"
    echo ""
    
    read -p "Enter your project reference ID: " PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "Project ID cannot be empty"
        exit 1
    fi
    
    print_status "Linking to project: $PROJECT_ID"
    supabase link --project-ref "$PROJECT_ID"
    
    if [ $? -eq 0 ]; then
        print_success "Successfully linked to project: $PROJECT_ID"
    else
        print_error "Failed to link project. Please check your project ID."
        exit 1
    fi
fi

# Verify everything is working
print_status "Verifying setup..."

# Check if we can list projects
if supabase projects list &> /dev/null; then
    print_success "✅ Authentication working"
else
    print_error "❌ Authentication not working"
    exit 1
fi

# Check if we can list migrations
if supabase migration list &> /dev/null; then
    print_success "✅ Project link working"
    print_status "Current migrations:"
    supabase migration list
else
    print_error "❌ Project link not working"
    exit 1
fi

echo ""
print_success "🎉 Supabase CLI setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/deploy-migration.sh"
echo "2. Or manually: supabase db push"
echo ""
echo "Available commands:"
echo "  supabase migration list    - List all migrations"
echo "  supabase db push          - Deploy migrations"
echo "  supabase db push --dry-run - Test migrations without applying"
echo "  supabase status           - Check project status"
echo ""
