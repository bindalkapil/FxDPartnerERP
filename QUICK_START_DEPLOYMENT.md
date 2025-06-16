# 🚀 Quick Start: Deploy Purchase Record Closure Migration

This guide will help you deploy the purchase record closure migration using the Local Supabase CLI approach.

## Prerequisites

- You have a Supabase project
- You have access to your Supabase dashboard
- Node.js is installed on your system

## Step 1: Install Supabase CLI

Choose the method for your operating system:

### macOS (Recommended)
```bash
brew install supabase/tap/supabase
```

### Windows
```bash
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm
npm install -g supabase
```

### Linux/WSL
```bash
curl -fsSL https://supabase.com/install.sh | sh
```

### Cross-Platform (npm)
```bash
npm install -g supabase
```

## Step 2: Get Your Credentials

You'll need these from your Supabase dashboard:

1. **Access Token**: Go to https://supabase.com/dashboard/account/tokens
2. **Project ID**: From your project URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`
3. **Database Password**: Your database password (can be reset if forgotten)

## Step 3: Run Setup (One-Time)

### Option A: Using npm scripts (Recommended)
```bash
npm run supabase:setup
```

### Option B: Using scripts directly

**macOS/Linux:**
```bash
./scripts/setup-supabase-cli.sh
```

**Windows:**
```cmd
scripts\setup-supabase-cli.bat
```

## Step 4: Deploy the Migration

### Option A: Using npm scripts (Recommended)
```bash
npm run supabase:deploy
```

### Option B: Using scripts directly

**macOS/Linux:**
```bash
./scripts/deploy-migration.sh
```

**Windows:**
```cmd
scripts\deploy-migration.bat
```

## Step 5: Verify Deployment

### Option A: Using npm scripts
```bash
npm run supabase:verify
```

### Option B: Using scripts directly

**macOS/Linux:**
```bash
./scripts/verify-migration.sh
```

## Step 6: Test Your Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Purchase Records section

3. Try creating a new purchase record and test the closure options

4. Test the closure management modal on existing records

## Available Commands

After setup, you can use these convenient npm commands:

```bash
# Setup Supabase CLI (one-time)
npm run supabase:setup

# Deploy migrations
npm run supabase:deploy

# Verify deployment
npm run supabase:verify

# Check migration status
npm run supabase:migration-list

# Check Supabase status
npm run supabase:status
```

## Manual Commands

If you prefer using Supabase CLI directly:

```bash
# Check authentication
supabase projects list

# List migrations
supabase migration list

# Deploy migrations (with dry-run first)
supabase db push --dry-run
supabase db push

# Connect to database shell
supabase db shell
```

## Troubleshooting

### Common Issues

1. **"Command not found: supabase"**
   - Restart your terminal after installation
   - Verify installation: `supabase --version`

2. **Authentication failed**
   - Check your access token
   - Generate a new token if needed

3. **Project not found**
   - Verify your project ID
   - Ensure you have access to the project

4. **Migration already applied**
   - This is normal - Supabase skips already applied migrations
   - Check with: `npm run supabase:migration-list`

### Getting Help

- Run `supabase --help` for command options
- Check the detailed guides:
  - `LOCAL_SUPABASE_DEPLOYMENT.md` - Complete setup guide
  - `DEPLOYMENT_TROUBLESHOOTING.md` - Troubleshooting guide

## What This Migration Does

✅ Adds `closure_date` and `closure_notes` columns to purchase_records
✅ Updates status constraint to support `partial_closure` and `full_closure`
✅ Migrates existing `completed` records to `partial_closure`
✅ Creates index for efficient closure date queries
✅ Enables the two-stage closure system in your application

## Next Steps

After successful deployment:

1. **Test the UI**: Create purchase records with different closure statuses
2. **Verify Functionality**: Test the closure management modal
3. **Check Data**: Ensure existing records were migrated correctly
4. **Monitor**: Watch for any issues in your application logs

## Success! 🎉

Your purchase record closure system is now deployed and ready to use!

The system provides:
- **Partial Closure**: Editable records treated as completed for finance
- **Full Closure**: Read-only records that cannot be modified
- **Creation-time choice**: Select closure status when creating records
- **Management interface**: Change closure status through the UI
