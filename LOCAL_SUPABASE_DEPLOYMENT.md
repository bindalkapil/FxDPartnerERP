# Local Supabase CLI Deployment Guide

This guide will help you set up and use the Supabase CLI locally to deploy migrations reliably.

## Prerequisites

- Node.js installed on your system
- Access to your Supabase project dashboard
- Terminal/Command Prompt access

## Step 1: Install Supabase CLI

Choose the method that works best for your operating system:

### macOS (Recommended: Homebrew)
```bash
brew install supabase/tap/supabase
```

### macOS/Linux (Alternative: Direct Download)
```bash
curl -fsSL https://supabase.com/install.sh | sh
```

### Windows (Scoop)
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Cross-Platform (npm)
```bash
npm install -g supabase
```

### Verify Installation
```bash
supabase --version
```

## Step 2: Get Your Supabase Credentials

You'll need these from your Supabase dashboard:

### 1. Access Token
- Go to [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
- Click "Generate new token"
- Copy the token (save it securely)

### 2. Project Reference ID
- Go to your project dashboard
- Copy the project ID from the URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`
- Example: `rsdblnraeopboalemjjo`

### 3. Database Password
- Your database password (set when creating the project)
- If forgotten, reset it in: Dashboard > Settings > Database

## Step 3: Quick Setup (Run Our Script)

We've created a setup script to automate the process:

```bash
# Make the script executable (macOS/Linux)
chmod +x scripts/setup-supabase-cli.sh

# Run the setup script
./scripts/setup-supabase-cli.sh
```

Or for Windows:
```cmd
scripts\setup-supabase-cli.bat
```

## Step 4: Manual Setup (Alternative)

If you prefer to set up manually:

### Login to Supabase
```bash
supabase login
```
Enter your access token when prompted.

### Link Your Project
```bash
supabase link --project-ref YOUR_PROJECT_ID
```
Replace `YOUR_PROJECT_ID` with your actual project ID.

### Verify Connection
```bash
supabase projects list
```

## Step 5: Deploy the Migration

### Option A: Use Our Deploy Script
```bash
./scripts/deploy-migration.sh
```

### Option B: Manual Deployment
```bash
# Check migration status
supabase migration list

# Test the migration (dry run)
supabase db push --dry-run

# Deploy the migration
supabase db push

# Verify deployment
supabase migration list
```

## Step 6: Verify the Deployment

Run our verification script:
```bash
./scripts/verify-migration.sh
```

Or manually check:
```bash
# Connect to your database and run
supabase db shell
```

Then in the SQL shell:
```sql
-- Check if new columns exist
\d purchase_records

-- Check status values
SELECT DISTINCT status FROM purchase_records;

-- Exit
\q
```

## NPM Scripts (Convenient Commands)

We've added these to your package.json:

```bash
# Setup Supabase CLI
npm run supabase:setup

# Deploy migrations
npm run supabase:deploy

# Verify deployment
npm run supabase:verify

# Check migration status
npm run supabase:status
```

## Troubleshooting

### Common Issues

1. **"Command not found: supabase"**
   - Restart your terminal after installation
   - Check if the CLI is in your PATH

2. **"Authentication failed"**
   - Verify your access token is correct
   - Generate a new token if needed

3. **"Project not found"**
   - Double-check your project ID
   - Ensure you have access to the project

4. **"Permission denied"**
   - Ensure your access token has the right permissions
   - Try generating a new token with "All projects" scope

### Getting Help

- Check `supabase --help` for command options
- Visit [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- Run our verification script to diagnose issues

## Future Migrations

For future migrations:

1. Create new migration files in `supabase/migrations/`
2. Run `./scripts/deploy-migration.sh`
3. Verify with `./scripts/verify-migration.sh`

## Benefits of This Approach

✅ **Reliable**: No CI/CD dependencies
✅ **Fast**: Immediate feedback
✅ **Debuggable**: Clear error messages
✅ **Flexible**: Easy to test and rollback
✅ **Secure**: Credentials stored locally

## Security Notes

- Never commit your access token to version control
- Store credentials securely on your local machine
- Regenerate tokens periodically for security
