# Organization-Based Data Security Implementation

This document explains the multi-tenant security implementation that ensures one organization's data cannot be accessed by another organization.

## 🔒 Security Overview

The application implements **Row Level Security (RLS)** at the database level to ensure complete data isolation between organizations. This is a defense-in-depth approach that provides security even if application-level checks fail.

## 🏗️ Architecture

### Database Level Security

1. **Row Level Security (RLS) Policies**: Every table has policies that filter data based on the user's organization access
2. **Organization Context**: Users' organization context is stored in the database session
3. **Access Control Functions**: Helper functions determine if a user can access specific organization data

### Application Level Security

1. **Organization Context Management**: The API layer manages the current organization context
2. **Automatic Filtering**: All queries are automatically filtered by organization
3. **Session Management**: User sessions maintain organization context

## 📊 Database Schema

### Core Tables

- `organizations`: Stores organization information
- `user_organizations`: Junction table linking users to organizations with roles
- All business tables have `organization_id` foreign key

### Security Functions

```sql
-- Get current user's organization from session or default
get_current_user_organization_id() -> UUID

-- Check if user has access to specific organization
user_has_organization_access(org_id UUID) -> BOOLEAN

-- Set organization context in session
set_config(setting_name text, setting_value text, is_local boolean) -> text
```

## 🛡️ RLS Policies

Each business table has four types of policies:

1. **SELECT**: Users can only see data from organizations they have access to
2. **INSERT**: Users can only create data in organizations they have access to
3. **UPDATE**: Users can only modify data in organizations they have access to
4. **DELETE**: Users can only delete data in organizations they have access to

### Example Policy (Customers Table)

```sql
-- Users can only select customers from their accessible organizations
CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT USING (user_has_organization_access(organization_id));
```

## 🔧 Implementation Details

### 1. Migration Applied

The security migration (`20250624000004_implement_organization_security.sql`) includes:

- Drops all permissive policies (`USING (true)`)
- Creates organization-aware policies
- Adds security helper functions
- Sets up proper indexes for performance

### 2. API Layer Integration

The API layer (`src/lib/api.ts`) automatically:

- Sets organization context when users switch organizations
- Filters all queries by organization
- Adds organization_id to all insert operations

```typescript
export function setCurrentOrganization(organizationId: string | null) {
  currentOrganizationId = organizationId;
  
  // Set the organization context in the database session for RLS
  if (organizationId) {
    supabase.rpc('set_config', {
      setting_name: 'app.current_organization_id',
      setting_value: organizationId,
      is_local: true
    });
  }
}
```

### 3. Authentication Integration

The AuthContext (`src/contexts/AuthContext.tsx`) handles:

- Loading user's organizations on login
- Setting default organization context
- Managing organization switching

## 🚀 Deployment

### 1. Deploy the Security Migration

```bash
# Make the script executable
chmod +x scripts/deploy-security-migration.sh

# Deploy the migration
./scripts/deploy-security-migration.sh
```

### 2. Test Organization Isolation

```bash
# Install dependencies if needed
npm install @supabase/supabase-js dotenv

# Make the test script executable
chmod +x scripts/test-organization-isolation.js

# Run the isolation tests
node scripts/test-organization-isolation.js
```

## 🧪 Testing

The test script (`scripts/test-organization-isolation.js`) verifies:

1. **Organization Isolation**: Users can only see their organization's data
2. **Cross-Organization Access Prevention**: Users cannot access other organizations' data
3. **Superadmin Access**: Superadmins can access all organizations
4. **Data Integrity**: No data leakage between organizations

### Test Results

✅ **Expected Results:**
- Users see only their organization's data
- Cross-organization queries return empty results or errors
- Superadmins can see data from all organizations
- No security violations detected

❌ **Security Violations:**
- Users seeing data from other organizations
- Successful cross-organization data access
- Unauthorized data modifications

## 👥 User Roles and Access

### Role Hierarchy

1. **Superadmin**: Access to all organizations and data
2. **Admin**: Access to their assigned organizations, can manage users within those orgs
3. **User**: Access only to their assigned organizations

### Organization Assignment

Users must be assigned to organizations via the `user_organizations` table:

```sql
INSERT INTO user_organizations (user_id, organization_id, role, status)
VALUES ('user-uuid', 'org-uuid', 'user', 'active');
```

## 🔄 Organization Switching

### Frontend Implementation

```typescript
// Switch to a different organization
await switchOrganization(organizationId);

// This automatically:
// 1. Updates user context
// 2. Sets database session context
// 3. Refreshes data for new organization
```

### Backend Process

1. Validates user has access to target organization
2. Updates session organization context
3. All subsequent queries use new organization context

## 📋 Security Checklist

### ✅ Implemented

- [x] Row Level Security on all business tables
- [x] Organization-aware RLS policies
- [x] Helper functions for access control
- [x] API layer organization filtering
- [x] Session-based organization context
- [x] Comprehensive test suite
- [x] Superadmin override capabilities

### 🔍 Verification Steps

1. **Deploy Migration**: Apply the security migration
2. **Run Tests**: Execute the isolation test script
3. **Manual Testing**: Test with different user accounts
4. **Monitor Logs**: Check for any security violations
5. **Performance Testing**: Ensure RLS doesn't impact performance significantly

## ⚠️ Important Notes

### Data Migration Requirements

- All existing data must have `organization_id` set
- Users must be assigned to organizations
- Default organization created for existing data

### Performance Considerations

- RLS policies add WHERE clauses to all queries
- Indexes on `organization_id` columns improve performance
- Monitor query performance after deployment

### Maintenance

- Regularly audit user-organization assignments
- Monitor for any RLS policy bypasses
- Keep security functions updated
- Test isolation after any schema changes

## 🚨 Security Warnings

1. **Service Role Key**: Never expose the service role key in client-side code
2. **RLS Bypass**: Service role can bypass RLS - use carefully
3. **Session Context**: Always set organization context after authentication
4. **Data Validation**: Validate organization access in application logic as well

## 📞 Troubleshooting

### Common Issues

1. **Users Can't See Data**: Check organization assignment in `user_organizations`
2. **RLS Errors**: Verify organization context is set in session
3. **Performance Issues**: Check indexes on `organization_id` columns
4. **Cross-Organization Access**: Verify RLS policies are active

### Debug Queries

```sql
-- Check user's organizations
SELECT * FROM user_organizations WHERE user_id = 'user-uuid';

-- Check current session context
SELECT current_setting('app.current_organization_id', true);

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE rowsecurity = true;
```

## 🔮 Future Enhancements

1. **Audit Logging**: Log all cross-organization access attempts
2. **Dynamic Policies**: More granular access control based on data sensitivity
3. **API Rate Limiting**: Per-organization rate limiting
4. **Data Encryption**: Encrypt sensitive data at rest
5. **Compliance**: GDPR/SOC2 compliance features

---

**Security is a shared responsibility. This implementation provides strong database-level isolation, but application-level security practices must also be maintained.**
