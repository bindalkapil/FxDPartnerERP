# Supabase Deployment Setup

This document explains how to set up and use the automated Supabase migration deployment system that replaces the manual bolt.new workflow.

## Overview

The project now uses GitHub Actions to automatically deploy Supabase migrations when changes are pushed to the main branch. This eliminates the need for manual migration deployment through bolt.new.

## Setup Instructions

### 1. Install Supabase CLI Locally

First, install the Supabase CLI on your local machine:

```bash
# macOS
brew install supabase/tap/supabase

# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux/WSL
curl -fsSL https://supabase.com/install.sh | sh
```

### 2. Configure Your Supabase Project

1. Update the `supabase/config.toml` file:
   ```toml
   project_id = "your-actual-project-id"
   ```

2. Link your local project to your Supabase project:
   ```bash
   supabase login
   supabase link --project-ref your-project-id
   ```

### 3. Set Up GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, and add these secrets:

- **SUPABASE_ACCESS_TOKEN**: Your Supabase access token
  - Get this from: https://supabase.com/dashboard/account/tokens
  
- **SUPABASE_PROJECT_ID**: Your Supabase project ID
  - Found in your Supabase project dashboard URL
  
- **SUPABASE_DB_PASSWORD**: Your database password
  - The password you set when creating your Supabase project

### 4. Verify Setup

Test the setup by creating a test migration:

```bash
# Create a test migration
supabase migration new test_setup

# Add some SQL to the migration file
echo "-- Test migration" > supabase/migrations/$(ls supabase/migrations/ | tail -1)

# Commit and push
git add .
git commit -m "Test: Add test migration"
git push origin main
```

Check the GitHub Actions tab to see if the deployment runs successfully.

## How It Works

### Automatic Deployment

The GitHub Actions workflow (`/.github/workflows/supabase-deploy.yml`) automatically triggers when:

1. Code is pushed to the `main` branch
2. Changes are made to files in the `supabase/migrations/` directory
3. Manual trigger via GitHub Actions UI (workflow_dispatch)

### Deployment Process

1. **Checkout**: Gets the latest code
2. **Setup**: Installs Supabase CLI
3. **Link**: Connects to your Supabase project
4. **Check**: Verifies pending migrations
5. **Deploy**: Applies migrations using `supabase db push`
6. **Verify**: Confirms successful deployment

## Local Development

### Available Scripts

The following npm scripts are now available for local Supabase development:

```bash
# Start local Supabase (requires Docker)
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Check status of local Supabase
npm run supabase:status

# Reset local database
npm run supabase:reset

# Check differences between local and remote
npm run supabase:diff

# Push local migrations to remote
npm run supabase:push

# Pull remote schema to local
npm run supabase:pull

# Generate TypeScript types
npm run supabase:generate-types
```

### Creating New Migrations

1. Create a new migration:
   ```bash
   supabase migration new your_migration_name
   ```

2. Edit the generated SQL file in `supabase/migrations/`

3. Test locally (optional):
   ```bash
   npm run supabase:start
   npm run supabase:reset  # Apply all migrations
   ```

4. Commit and push:
   ```bash
   git add .
   git commit -m "Add: your migration description"
   git push origin main
   ```

The migration will be automatically deployed to production!

## Migration Best Practices

### 1. Always Test Locally First

```bash
# Start local environment
npm run supabase:start

# Reset to apply all migrations
npm run supabase:reset

# Test your application
npm run dev
```

### 2. Use Descriptive Migration Names

```bash
# Good
supabase migration new add_user_preferences_table
supabase migration new update_products_add_sku_column

# Bad
supabase migration new fix_stuff
supabase migration new update
```

### 3. Make Migrations Reversible

Always consider how to undo your changes:

```sql
-- Good: Can be reversed by dropping the column
ALTER TABLE products ADD COLUMN sku VARCHAR(50);

-- Be careful: Dropping columns loses data
ALTER TABLE products DROP COLUMN old_field;
```

### 4. Use Transactions for Complex Changes

```sql
BEGIN;

-- Multiple related changes
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
UPDATE users SET email_verified = TRUE WHERE created_at < '2024-01-01';
CREATE INDEX idx_users_email_verified ON users(email_verified);

COMMIT;
```

## Troubleshooting

### Common Issues

1. **Migration fails in CI/CD**
   - Check the GitHub Actions logs
   - Verify your secrets are set correctly
   - Test the migration locally first

2. **Permission denied errors**
   - Ensure your SUPABASE_ACCESS_TOKEN has the correct permissions
   - Check that your project ID is correct

3. **Migration conflicts**
   - Pull the latest changes: `git pull origin main`
   - Check for conflicting migrations: `npm run supabase:diff`

### Getting Help

1. Check the GitHub Actions logs for detailed error messages
2. Test migrations locally before pushing
3. Use `supabase status` to check your local setup
4. Verify your environment variables and secrets

## Migration from bolt.new

### What Changed

- ✅ **Before**: Manual migration deployment through bolt.new interface
- ✅ **After**: Automatic deployment via GitHub Actions
- ✅ **Benefits**: Version control, automation, team collaboration, rollback capability

### Migration Checklist

- [x] Supabase CLI installed locally
- [x] GitHub secrets configured
- [x] Local project linked to Supabase
- [x] Test migration created and deployed
- [x] Team members informed of new workflow

## Security Notes

- Never commit your `.env` file or any secrets to the repository
- Use GitHub secrets for all sensitive information
- Regularly rotate your Supabase access tokens
- Monitor the GitHub Actions logs for any suspicious activity

## Support

For issues with this setup:
1. Check the troubleshooting section above
2. Review the GitHub Actions workflow logs
3. Test locally using the provided npm scripts
4. Consult the [Supabase CLI documentation](https://supabase.com/docs/reference/cli)
