# Supabase Deployment Troubleshooting Guide

This guide helps resolve common issues with the GitHub Actions deployment of Supabase migrations.

## Current Issue Analysis

The deployment is failing during the GitHub Actions workflow. Based on the logs, the issue appears to be in one of the earlier steps before the final notification.

## Required GitHub Secrets

Ensure these secrets are properly configured in your GitHub repository (Settings > Secrets and variables > Actions):

### 1. SUPABASE_ACCESS_TOKEN
- **How to get**: Go to [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
- **Create**: Click "Generate new token"
- **Scope**: Select "All projects" or specific project access
- **Copy**: The token and add it to GitHub secrets

### 2. SUPABASE_PROJECT_ID
- **How to get**: From your Supabase project dashboard URL
- **Format**: Usually looks like `rsdblnraeopboalemjjo`
- **Location**: In the URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`

### 3. SUPABASE_DB_PASSWORD
- **What it is**: The database password you set when creating the project
- **If forgotten**: You can reset it in Supabase Dashboard > Settings > Database

## Deployment Options

We've created two workflow files for different scenarios:

### Option 1: Automatic Deployment (supabase-deploy.yml)
- Triggers on pushes to main branch when migrations change
- More complex with detailed debugging

### Option 2: Manual Deployment (supabase-deploy-simple.yml)
- Manual trigger only (workflow_dispatch)
- Simpler, more reliable approach
- Recommended for troubleshooting

## Step-by-Step Troubleshooting

### Step 1: Verify Secrets
1. Go to GitHub repository > Settings > Secrets and variables > Actions
2. Verify all three secrets exist and have correct values
3. Test by running the "Deploy Supabase Migrations (Simple)" workflow manually

### Step 2: Check Migration File
The migration file should be valid SQL. You can test it locally:

```sql
-- Test the migration syntax
\i supabase/migrations/20250616060000_add_purchase_record_closure_stages.sql
```

### Step 3: Manual Workflow Trigger
1. Go to GitHub repository > Actions tab
2. Select "Deploy Supabase Migrations (Simple)" workflow
3. Click "Run workflow" button
4. Monitor the detailed logs for specific error messages

### Step 4: Local Testing (Optional)
If you have Supabase CLI installed locally:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Test the migration
supabase db push --dry-run

# Apply the migration
supabase db push
```

## Common Issues and Solutions

### Issue 1: "toml: incomplete number"
- **Cause**: Malformed supabase/config.toml file
- **Solution**: Ensure project_id is quoted: `project_id = "your-project-id"`

### Issue 2: "Authentication failed"
- **Cause**: Invalid or expired SUPABASE_ACCESS_TOKEN
- **Solution**: Generate a new token and update the GitHub secret

### Issue 3: "Project not found"
- **Cause**: Incorrect SUPABASE_PROJECT_ID
- **Solution**: Verify the project ID from your Supabase dashboard URL

### Issue 4: "Permission denied"
- **Cause**: Access token doesn't have sufficient permissions
- **Solution**: Ensure the token has "All projects" scope or specific project access

### Issue 5: "Migration already applied"
- **Cause**: Migration was already run manually or in previous deployment
- **Solution**: This is usually not an error - Supabase skips already applied migrations

## Migration File Validation

The current migration does the following:
1. Adds `closure_date` and `closure_notes` columns
2. Updates existing 'completed' records to 'partial_closure'
3. Updates the status constraint to include new closure stages
4. Creates an index for closure tracking

## Next Steps

1. **Immediate**: Run the simple workflow manually to get detailed error logs
2. **Verify**: All GitHub secrets are correctly configured
3. **Test**: Use the simple workflow first, then switch to automatic if needed
4. **Monitor**: Check the detailed logs for specific error messages

## Support

If issues persist:
1. Check the GitHub Actions logs for specific error messages
2. Verify your Supabase project is accessible and active
3. Test the migration locally if possible
4. Consider running migrations manually through Supabase dashboard as a fallback

## Files Created for Troubleshooting

- `.github/workflows/supabase-deploy.yml` - Enhanced automatic deployment
- `.github/workflows/supabase-deploy-simple.yml` - Manual deployment for testing
- `scripts/test-migration.sql` - SQL script to verify migration results
- `DEPLOYMENT_TROUBLESHOOTING.md` - This troubleshooting guide
